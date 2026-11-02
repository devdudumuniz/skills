"""Horas trabalhadas, derivadas SÓ de registros reais (nada declarado).

Total = união, sem dupla contagem, de:
 (1) sessões registradas: ``session start`` → ``handoff``;
 (2) janelas das tarefas: início → conclusão/bloqueio/reabertura;
 (3) sessões reconstruídas de carimbos de tempo reais: eventos, commits do git e data de modificação dos arquivos,
     agrupados com pausas de até ``session_gap_minutes``.
Em (1) e (2) contam só os trechos com atividade: pausas sem NENHUM registro por mais de ``idle_cutoff_minutes``
são descontadas — tarefa ou sessão esquecida aberta não acumula horas.
Limite: tempo sem nenhum registro (só conversa/pesquisa) não é contado.
"""
from __future__ import annotations

import bisect
import json
import os
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .common import fmt_hours, parse_ts

SKIP_DIRS = {".git", "node_modules", "dist", "build", "__pycache__", ".venv", "venv", ".next", "target", ".idea", ".vscode",
             ".pytest_cache", ".mypy_cache", "coverage", "engine", "reports"}
MAX_FILES = 40000

METHOD = ("Horas trabalhadas = união, sem dupla contagem, de: (1) sessões registradas (início de sessão → passagem de bastão); "
          "(2) janelas de execução das tarefas (início → conclusão/bloqueio); (3) sessões de atividade reconstruídas dos "
          "carimbos de tempo reais do projeto (eventos, commits e arquivos gravados), agrupados com pausas de até {gap} min. "
          "Em (1) e (2) contam só os trechos com atividade registrada: pausas sem registro por mais de {idle} min são "
          "descontadas, então tarefa ou sessão esquecida aberta não acumula horas. A parte (3) é reconstruída e não "
          "inclui trabalho sem nenhuma gravação.")
PHASE_METHOD = ("Tempo em execução das tarefas da fase segundo o histórico (início registrado até a conclusão ou o "
                "bloqueio), só nos trechos com atividade registrada, sem contar em dobro tarefas simultâneas.")


def union_seconds(intervals: list[tuple[datetime, datetime]]) -> int:
    total, cs, ce = 0.0, None, None
    for s, e in sorted(intervals):
        if ce is None or s > ce:
            if ce is not None:
                total += (ce - cs).total_seconds()
            cs, ce = s, e
        elif e > ce:
            ce = e
    if ce is not None:
        total += (ce - cs).total_seconds()
    return int(total)


def clusters(ts: list[datetime], gap: timedelta) -> list[tuple[datetime, datetime]]:
    out: list[tuple[datetime, datetime]] = []
    for t in ts:
        if out and t - out[-1][1] <= gap:
            out[-1] = (out[-1][0], max(out[-1][1], t))
        else:
            out.append((t, t))
    return [c for c in out if c[1] > c[0]]


def merge(iv: list[tuple[datetime, datetime]]) -> list[tuple[datetime, datetime]]:
    out: list[tuple[datetime, datetime]] = []
    for s, e in sorted(iv):
        if out and s <= out[-1][1]:
            out[-1] = (out[-1][0], max(out[-1][1], e))
        else:
            out.append((s, e))
    return out


def task_intervals(t: dict, until: datetime) -> list[tuple[datetime, datetime, bool]]:
    out, open_at = [], None
    for h in t["history"]:
        ts = parse_ts(h["ts"])
        if ts is None:
            continue
        if h["type"] == "TASK_STARTED" and open_at is None:
            open_at = ts
        elif h["type"] in ("TASK_COMPLETED", "TASK_BLOCKED", "TASK_REOPENED") and open_at is not None:
            out.append((open_at, max(ts, open_at), False))
            open_at = None
    if open_at is not None:
        out.append((open_at, max(until, open_at), True))
    return out


def git_timestamps(root: Path) -> list[datetime]:
    if not (root / ".git").exists():
        return []
    try:
        p = subprocess.run(["git", "-C", str(root), "log", "--pretty=%ct", "-n", "5000"], capture_output=True, text=True, encoding="utf-8", errors="replace",
                           timeout=20)
    except (OSError, subprocess.TimeoutExpired):
        return []
    if p.returncode != 0:
        return []
    out = []
    for line in p.stdout.split():
        try:
            out.append(datetime.fromtimestamp(int(line), timezone.utc))
        except ValueError:
            continue
    return out


def file_timestamps(root: Path, dirs: list[str] | None) -> list[datetime]:
    out, n = [], 0
    bases = [root] if dirs is None else [root / d for d in dirs]   # None = projeto inteiro; [] = nenhuma pasta
    for base in bases:
        if not base.is_dir():
            continue
        for dirpath, dnames, fnames in os.walk(base):
            dnames[:] = [d for d in dnames if d not in SKIP_DIRS]
            if Path(dirpath).resolve() == (root / "status").resolve():  # eventos já entram à parte
                dnames[:] = []
                continue
            for f in fnames:
                n += 1
                if n > MAX_FILES:
                    return out
                try:
                    out.append(datetime.fromtimestamp(os.stat(os.path.join(dirpath, f)).st_mtime, timezone.utc))
                except OSError:
                    continue
    return out


def activity_timestamps(ws, evs: list[dict], hcfg: dict, since: datetime | None) -> list[datetime]:
    out = [d for d in (parse_ts(e["ts"]) for e in evs) if d]
    reg = ws.reports_dir / "registry.jsonl"
    if reg.is_file():
        try:
            for line in reg.read_text(encoding="utf-8").splitlines():
                if line.strip():
                    d = parse_ts(json.loads(line).get("ts"))
                    if d:
                        out.append(d)
        except (OSError, ValueError):
            pass
    if hcfg.get("git", True):
        out += git_timestamps(ws.root)
    out += file_timestamps(ws.root, hcfg.get("file_evidence"))
    return sorted(d for d in out if since is None or d >= since)


def explicit_sessions(evs: list[dict], until: datetime, gap: timedelta, activity: list[datetime]):
    """SESSION_STARTED → próximo HANDOFF_RECORDED. Sessão aberta conta até agora só com atividade recente."""
    out, open_at = [], None
    for e in evs:
        ts = parse_ts(e["ts"])
        if ts is None:
            continue
        if e["type"] == "SESSION_STARTED":
            if open_at is not None:
                out.append((open_at, ts, False))
            open_at = ts
        elif e["type"] == "HANDOFF_RECORDED" and open_at is not None:
            out.append((open_at, max(ts, open_at), False))
            open_at = None
    if open_at is not None:
        last = max([a for a in activity if a >= open_at] or [open_at])
        active = until - last <= gap
        out.append((open_at, until if active else last, active))
    return out


def trim(s: datetime, e: datetime, activity: list[datetime], idle: timedelta, gap: timedelta, running: bool,
         until: datetime) -> list[tuple[datetime, datetime]]:
    lo, hi = bisect.bisect_left(activity, s), bisect.bisect_right(activity, e)
    pts = [s] + activity[lo:hi]
    if not running:
        pts.append(e)
    elif until - max(pts) <= gap:
        pts.append(until)
    return clusters(sorted(pts), idle)


def compute(ws, tasks: list[dict], evs: list[dict], phase_of: dict[str, str], hcfg: dict, as_of: datetime | None = None) -> dict:
    until = as_of or datetime.now(timezone.utc)
    gap = timedelta(minutes=int(hcfg.get("session_gap_minutes") or 30))
    idle = timedelta(minutes=int(hcfg.get("idle_cutoff_minutes") or 180))
    windows = {t["id"]: task_intervals(t, until) for t in tasks}
    starts = [s for iv in windows.values() for s, _, _ in iv]
    first = min(starts + [d for d in (parse_ts(e["ts"]) for e in evs) if d] or [until])
    activity = activity_timestamps(ws, evs, hcfg, first - timedelta(hours=12))
    per_task, all_iv, per_phase = {}, [], {}
    for t in tasks:
        iv = windows[t["id"]]
        if not iv:
            continue
        pairs = [c for s, e, r in iv for c in trim(s, e, activity, idle, gap, r, until)]
        secs = union_seconds(pairs)
        per_task[t["id"]] = {"seconds": secs, "label": fmt_hours(secs), "running": any(e == until for _, e in pairs)}
        all_iv += pairs
        per_phase.setdefault(phase_of.get(t["id"], "phase.other"), []).extend(pairs)
    sessions = explicit_sessions(evs, until, gap, activity)
    session_iv = [c for s, e, r in sessions for c in trim(s, e, activity, idle, gap, r, until)]
    registered_iv = all_iv + session_iv
    merged = merge(registered_iv + clusters(activity, gap))
    total = sum(int((e - s).total_seconds()) for s, e in merged)
    registered = union_seconds(registered_iv)
    reg_merged = merge(registered_iv)
    blocks = [{"start": s.isoformat(timespec="seconds"), "end": e.isoformat(timespec="seconds"),
               "seconds": int((e - s).total_seconds()), "label": fmt_hours(int((e - s).total_seconds())),
               "source": "registrada" if any(a < e and s < b for a, b in reg_merged) else "reconstruída"} for s, e in merged]
    tasks_total = union_seconds(all_iv)
    return {"total_seconds": total, "total_label": fmt_hours(total), "running": bool(activity and until - activity[-1] <= gap),
            "registered_seconds": registered, "registered_label": fmt_hours(registered),
            "reconstructed_seconds": total - registered, "reconstructed_label": fmt_hours(total - registered),
            "tasks_seconds": tasks_total, "tasks_label": fmt_hours(tasks_total), "sessions": blocks,
            "explicit_sessions": len(sessions), "gap_minutes": int(gap.total_seconds() // 60),
            "idle_cutoff_minutes": int(idle.total_seconds() // 60), "as_of": until.isoformat(timespec="seconds"),
            "method": METHOD.format(gap=int(gap.total_seconds() // 60), idle=int(idle.total_seconds() // 60)),
            "per_phase": {k: {"seconds": union_seconds(v), "label": fmt_hours(union_seconds(v))} for k, v in per_phase.items()},
            "per_task": per_task}
