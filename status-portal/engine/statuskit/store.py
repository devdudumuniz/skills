"""Camada de trabalho: backlog (o PLANO) + eventos encadeados (o que ACONTECEU) + regras de transição.

* ``status/backlog.yaml``  — definição das tarefas (humano edita; nunca contém estado);
* ``status/events.jsonl``  — histórico append-only com cadeia SHA-256: quem iniciou, bloqueou, concluiu e com que
  evidência. O ESTADO de cada tarefa é derivado daqui, nunca editado à mão;
* ``status/portal.yaml``   — metadados do projeto, verificações (gates) permitidas, textos executivos;
* ``status/phases.yaml``   — agrupa tarefas em fases e marcos (só agrupamento, sem estado).

Regras garantidas pelo código (não por convenção):
* só TODO pode ser iniciada, com dependências concluídas e sem bloqueio externo;
* concluir exige evidência e PASS das verificações da tarefa REGISTRADO DEPOIS do início;
* tarefa que exige aprovação humana só um humano conclui;
* verificações são uma lista fixa de comandos em portal.yaml — texto de tarefa nunca vira comando.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

from .common import (StatusError, atomic_write_text, canonical_json, dump_yaml, load_yaml, now, sha256_bytes)

STATUSES = ("TODO", "IN_PROGRESS", "BLOCKED", "DONE")
PRIORITIES = ("P0", "P1", "P2", "P3")
EXECUTORS = ("agent", "human", "any")
ACTOR_TYPES = ("human", "agent", "engine", "service", "system")
GENESIS = "0" * 64
EVENT_TYPES = {"TASK_STARTED", "TASK_BLOCKED", "TASK_UNBLOCKED", "TASK_REOPENED", "TASK_COMPLETED", "GATES_RECORDED",
               "HANDOFF_RECORDED", "SESSION_STARTED", "REPORT_ARTIFACT_REGISTERED"}
FORBIDDEN_KEYS = {"chain_of_thought", "reasoning", "thoughts", "scratchpad", "thinking", "cot"}
TASK_ID_RE = re.compile(r"^[A-Z][A-Z0-9]*-\d{1,6}$")
TASK_KEYS = {"id", "title", "priority", "kind", "executor", "goal", "steps", "acceptance", "depends_on", "blocked_by",
             "requires_human_approval", "approval_reason", "gates", "refs", "context"}

DEFAULT_CONFIG = {
    "project": {"title": "Projeto", "office": "", "report_heading": "Relatório de Evolução do Projeto"},
    "task_id_prefix": "T",
    "summary": {"objective": "", "modernizing": ""},
    "actors": {}, "actor_types": {"human": "Equipe (humano)", "agent": "Agente de IA", "engine": "Automação",
                                  "service": "Automação", "system": "Automação"},
    "orchestrator": {"label": "Automação", "event_types": ["GATES_RECORDED", "HANDOFF_RECORDED", "REPORT_REGISTERED",
                                                         "PHASE_COMPLETED", "MILESTONE_DELIVERED"],
                     "actor_types": ["engine", "service", "system"]},
    "hours": {"session_gap_minutes": 30, "idle_cutoff_minutes": 180, "git": True, "file_evidence": None},
    "gates": {}, "quality_groups": [], "redact": [], "pii": "br", "areas": [], "domains": [], "processes": [], "comparative": [],
    "labels": {}, "findings": [],
}


# ------------------------------------------------------------------ workspace
class Workspace:
    def __init__(self, root: Path | str):
        self.root = Path(root).resolve()
        self.data = self.root / "status"

    @classmethod
    def locate(cls, start: Path | str | None = None) -> "Workspace":
        env = os.environ.get("STATUS_ROOT")
        if env:
            return cls(env)
        here = Path(start or Path.cwd()).resolve()
        for cand in [here, *here.parents]:
            if (cand / "status" / "portal.yaml").is_file():
                return cls(cand)
        raise StatusError("Projeto sem status/portal.yaml. Rode o instalador do kit ou defina STATUS_ROOT.")

    # caminhos
    @property
    def backlog_path(self) -> Path: return self.data / "backlog.yaml"
    @property
    def phases_path(self) -> Path: return self.data / "phases.yaml"
    @property
    def portal_path(self) -> Path: return self.data / "portal.yaml"
    @property
    def comparison_path(self) -> Path: return self.data / "comparison.yaml"
    @property
    def events_path(self) -> Path: return self.data / "events.jsonl"
    @property
    def reports_dir(self) -> Path: return self.data / "reports"
    @property
    def handoffs_dir(self) -> Path: return self.data / "handoffs"
    @property
    def gates_path(self) -> Path: return self.data / "last-gates.json"

    def rel(self, p: Path | str) -> str:
        try:
            return Path(p).resolve().relative_to(self.root).as_posix()
        except ValueError:
            return str(p)

    def config(self) -> dict:
        cfg = load_yaml(self.portal_path)
        out = json.loads(json.dumps(DEFAULT_CONFIG))
        for k, v in cfg.items():
            if isinstance(v, dict) and isinstance(out.get(k), dict):
                out[k].update(v)
            else:
                out[k] = v
        return out


# ------------------------------------------------------------------ eventos (cadeia SHA-256)
def _keys(obj) -> set:
    out = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            out.add(str(k).lower())
            out |= _keys(v)
    elif isinstance(obj, list):
        for v in obj:
            out |= _keys(v)
    return out


def _hash(event: dict) -> str:
    return sha256_bytes(canonical_json({k: v for k, v in event.items() if k != "hash"}).encode("utf-8"))


class EventStore:
    def __init__(self, path: Path | str):
        self.path = Path(path)

    def read(self) -> list[dict]:
        if not self.path.is_file():
            return []
        out = []
        with open(self.path, "r", encoding="utf-8") as fh:
            for n, line in enumerate(fh, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(json.loads(line))
                except json.JSONDecodeError as exc:
                    raise StatusError(f"{self.path.name}:{n}: JSON inválido ({exc})") from exc
        return out

    def append(self, type_: str, actor: dict, data: dict | None = None, **refs) -> dict:
        if type_ not in EVENT_TYPES:
            raise StatusError(f"tipo de evento desconhecido: {type_}")
        data = data or {}
        if FORBIDDEN_KEYS & (_keys(data) | _keys(refs)):
            raise StatusError("evento não pode conter raciocínio livre")
        if not isinstance(actor, dict) or actor.get("type") not in ACTOR_TYPES:
            raise StatusError(f"ator inválido (tipos: {', '.join(ACTOR_TYPES)})")
        evs = self.read()
        prev = evs[-1] if evs else None
        ev = {"seq": (prev["seq"] + 1) if prev else 1, "ts": now(), "type": type_, "actor": actor,
              **{k: v for k, v in refs.items() if v is not None}, "data": data,
              "prev_hash": prev["hash"] if prev else GENESIS}
        ev["hash"] = _hash(ev)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.path, "a", encoding="utf-8", newline="\n") as fh:
            fh.write(canonical_json(ev) + "\n")
            fh.flush()
            os.fsync(fh.fileno())
        return ev

    def verify(self) -> list[str]:
        problems, prev_hash, seq = [], GENESIS, 1
        for ev in self.read():
            if ev.get("seq") != seq:
                problems.append(f"seq {ev.get('seq')} esperado {seq}")
            if ev.get("prev_hash") != prev_hash:
                problems.append(f"seq {ev.get('seq')}: prev_hash quebrado")
            if _hash(ev) != ev.get("hash"):
                problems.append(f"seq {ev.get('seq')}: hash não confere (evento alterado)")
            prev_hash, seq = ev.get("hash"), seq + 1
        return problems


def parse_actor(spec: str | None) -> dict:
    spec = spec or os.environ.get("STATUS_ACTOR") or f"human:{os.environ.get('USERNAME') or os.environ.get('USER') or 'operador'}"
    kind, _, name = spec.partition(":")
    if kind not in ACTOR_TYPES or not name:
        raise StatusError(f"--actor deve ser <tipo>:<id> com tipo em {', '.join(ACTOR_TYPES)} (recebido: {spec!r})")
    return {"type": kind, "id": spec, "name": name}


# ------------------------------------------------------------------ backlog e estado
def load_backlog(ws: Workspace) -> list[dict]:
    data = load_yaml(ws.backlog_path)
    return list(data.get("tasks") or [])


def events(ws: Workspace) -> list[dict]:
    return EventStore(ws.events_path).read()


def validate_backlog(ws: Workspace) -> list[dict]:
    errs: list[dict] = []
    cfg = ws.config()
    tasks = load_backlog(ws)
    ids = [t.get("id") for t in tasks]
    for t in tasks:
        tid = t.get("id")
        where = f"backlog.yaml#{tid}"
        if not isinstance(tid, str) or not TASK_ID_RE.match(tid):
            errs.append({"path": where, "message": "id deve ser PREFIXO-NNN (ex.: T-001)"})
        if ids.count(tid) > 1:
            errs.append({"path": where, "message": "id duplicado"})
        for k in ("title", "goal", "acceptance"):
            if not t.get(k):
                errs.append({"path": where, "message": f"campo obrigatório ausente: {k}"})
        for k in ("status", "started_at", "completed_at", "assignee", "progress"):
            if k in t:
                errs.append({"path": where, "message": f"estado não pode ser escrito no backlog ({k}); ele vem dos eventos"})
        for k in t:
            if k not in TASK_KEYS and k not in ("status", "started_at", "completed_at", "assignee", "progress"):
                errs.append({"path": where, "message": f"campo desconhecido: {k!r} — em YAML de uma linha ({{a: b, c: d}}) uma vírgula "
                                                       "dentro do texto corta o campo; coloque o texto entre aspas ou use o formato em bloco"})
        if t.get("priority", "P2") not in PRIORITIES:
            errs.append({"path": where, "message": f"prioridade inválida: {t.get('priority')}"})
        if t.get("executor", "any") not in EXECUTORS:
            errs.append({"path": where, "message": f"executor inválido: {t.get('executor')}"})
        for g in t.get("gates") or []:
            if g not in (cfg.get("gates") or {}):
                errs.append({"path": where, "message": f"verificação desconhecida (defina em portal.yaml → gates): {g}"})
        for d in t.get("depends_on") or []:
            if d not in ids:
                errs.append({"path": where, "message": f"dependência inexistente: {d}"})
    for p in EventStore(ws.events_path).verify():
        errs.append({"path": "events.jsonl", "message": p})
    return errs


def state(ws: Workspace) -> list[dict]:
    """Definições do backlog + estado derivado do histórico (o evento vence)."""
    tasks = {t["id"]: dict(t, status="TODO", priority=t.get("priority", "P2"), executor=t.get("executor", "any"),
                           history=[], order=i) for i, t in enumerate(load_backlog(ws))}
    for ev in events(ws):
        t = tasks.get(ev.get("task_id"))
        if t is None:
            continue
        d = ev.get("data") or {}
        kind = ev["type"]
        t["history"].append({"seq": ev["seq"], "ts": ev["ts"], "type": kind, "actor": ev["actor"]["id"],
                             **{k: d[k] for k in ("reason", "evidence", "note") if d.get(k)}})
        if kind == "TASK_STARTED":
            t["status"], t["assignee"], t["started_at"], t["started_seq"] = "IN_PROGRESS", ev["actor"]["id"], ev["ts"], ev["seq"]
        elif kind == "TASK_BLOCKED":
            t["status"], t["blocked_reason"] = "BLOCKED", d.get("reason")
        elif kind in ("TASK_UNBLOCKED", "TASK_REOPENED"):
            t["status"] = "TODO"
            t.pop("assignee", None)
        elif kind == "TASK_COMPLETED":
            t["status"], t["completed_at"], t["evidence"] = "DONE", ev["ts"], d.get("evidence") or []
    return sorted(tasks.values(), key=lambda x: x["order"])


def get(ws: Workspace, task_id: str) -> dict:
    t = next((x for x in state(ws) if x["id"] == task_id), None)
    if t is None:
        raise StatusError(f"tarefa inexistente: {task_id}")
    return t


def unmet_deps(t: dict, by_id: dict) -> list[str]:
    return [d for d in t.get("depends_on") or [] if by_id.get(d, {}).get("status") != "DONE"]


def actionable(ws: Workspace, actor_type: str = "agent") -> list[dict]:
    tasks = state(ws)
    by_id = {t["id"]: t for t in tasks}
    out = []
    for t in tasks:
        if t["status"] != "TODO" or t.get("blocked_by") or unmet_deps(t, by_id):
            continue
        if actor_type == "agent" and t["executor"] == "human":
            continue
        out.append(t)
    return sorted(out, key=lambda t: (PRIORITIES.index(t["priority"]), t["order"]))


def waiting_on_humans(ws: Workspace) -> list[dict]:
    by_id = {t["id"]: t for t in state(ws)}
    out = []
    for t in by_id.values():
        if t["status"] == "DONE":
            continue
        if t.get("blocked_by"):
            out.append({"task": t["id"], "title": t["title"], "why": list(t["blocked_by"])})
        elif t["executor"] == "human" and not unmet_deps(t, by_id):
            out.append({"task": t["id"], "title": t["title"], "why": ["executor: humano"]})
        elif t["status"] == "BLOCKED":
            out.append({"task": t["id"], "title": t["title"], "why": [t.get("blocked_reason") or "bloqueada"]})
    return out


def brief(t: dict) -> dict:
    return {"id": t["id"], "title": t["title"], "priority": t["priority"], "status": t["status"], "executor": t["executor"],
            "requires_human_approval": bool(t.get("requires_human_approval")), "goal": t["goal"],
            "steps": t.get("steps") or [], "acceptance": t.get("acceptance") or [], "gates": t.get("gates") or [],
            "depends_on": t.get("depends_on") or []}


def next_task(ws: Workspace, actor_type: str = "agent") -> dict:
    acts = actionable(ws, actor_type)
    return {"in_progress": [brief(t) | {"assignee": t.get("assignee")} for t in state(ws) if t["status"] == "IN_PROGRESS"],
            "next": brief(acts[0]) if acts else None,
            "queue": [{"id": t["id"], "priority": t["priority"], "title": t["title"]} for t in acts[1:6]],
            "waiting_on_humans": waiting_on_humans(ws)}


# ------------------------------------------------------------------ transições
def _append(ws: Workspace, type_: str, actor: dict, task_id: str | None, data: dict | None = None) -> dict:
    return EventStore(ws.events_path).append(type_, actor, data or {}, task_id=task_id)


def start(ws: Workspace, task_id: str, actor: dict) -> dict:
    t = get(ws, task_id)
    by_id = {x["id"]: x for x in state(ws)}
    if t["status"] != "TODO":
        raise StatusError(f"{task_id} está {t['status']} (só TODO pode ser iniciada)")
    if t.get("blocked_by"):
        raise StatusError(f"{task_id} tem bloqueio externo: {t['blocked_by']}")
    if unmet_deps(t, by_id):
        raise StatusError(f"{task_id} depende de {unmet_deps(t, by_id)}")
    if actor["type"] == "agent" and t["executor"] == "human":
        raise StatusError(f"{task_id} é executada por humano")
    _append(ws, "TASK_STARTED", actor, task_id)
    return brief(get(ws, task_id)) | {"assignee": actor["id"]}


def block(ws: Workspace, task_id: str, actor: dict, reason: str) -> dict:
    if not reason.strip():
        raise StatusError("informe --reason")
    if get(ws, task_id)["status"] == "DONE":
        raise StatusError(f"{task_id} já está DONE")
    _append(ws, "TASK_BLOCKED", actor, task_id, {"reason": reason.strip()})
    return {"id": task_id, "status": "BLOCKED", "reason": reason.strip()}


def unblock(ws: Workspace, task_id: str, actor: dict, note: str = "") -> dict:
    if get(ws, task_id)["status"] != "BLOCKED":
        raise StatusError(f"{task_id} não está BLOCKED")
    _append(ws, "TASK_UNBLOCKED", actor, task_id, {"note": note})
    return {"id": task_id, "status": "TODO"}


def reopen(ws: Workspace, task_id: str, actor: dict, reason: str) -> dict:
    if actor["type"] != "human":
        raise StatusError("reabrir tarefa concluída exige humano")
    if get(ws, task_id)["status"] != "DONE":
        raise StatusError(f"{task_id} não está DONE")
    _append(ws, "TASK_REOPENED", actor, task_id, {"reason": reason})
    return {"id": task_id, "status": "TODO"}


def gates_satisfied(ws: Workspace, t: dict) -> tuple[bool, str]:
    needed = t.get("gates") or []
    if not needed:
        return True, "sem verificações"
    runs = [e for e in events(ws) if e["type"] == "GATES_RECORDED" and e["seq"] > t.get("started_seq", 0)]
    if not runs:
        return False, "nenhuma rodada de verificações registrada depois do início da tarefa"
    res: dict[str, str] = {}
    for e in runs:
        res.update((e.get("data") or {}).get("gates") or {})
    bad = [g for g in needed if res.get(g) != "PASS"]
    return (not bad), ("faltando/FAIL: " + ", ".join(bad)) if bad else "ok"


def done(ws: Workspace, task_id: str, actor: dict, evidence: list[str], note: str = "",
         skip_gates_reason: str | None = None) -> dict:
    t = get(ws, task_id)
    if t["status"] != "IN_PROGRESS":
        raise StatusError(f"{task_id} está {t['status']} — inicie com `work start` antes de concluir")
    if t.get("requires_human_approval") and actor["type"] != "human":
        raise StatusError(f"{task_id} exige aprovação humana ({t.get('approval_reason') or 'ver backlog'})")
    evidence = [e.strip() for e in evidence if e and e.strip()]
    if not evidence:
        raise StatusError("conclusão exige --evidence (arquivo, relatório, commit, link ou execução)")
    ok, report = gates_satisfied(ws, t)
    if not ok:
        if skip_gates_reason and actor["type"] == "human":
            note = (note + " | verificações dispensadas por humano: " + skip_gates_reason).strip(" |")
        else:
            raise StatusError(f"verificações exigidas sem PASS depois do início ({report}) — rode `gates`")
    _append(ws, "TASK_COMPLETED", actor, task_id, {"evidence": evidence, "note": note})
    return {"id": task_id, "status": "DONE", "evidence": evidence}


def session_start(ws: Workspace, actor: dict) -> dict:
    ev = _append(ws, "SESSION_STARTED", actor, None, {})
    return {"session_started_at": ev["ts"], "actor": actor["id"], "close_with": "handoff"}


# ------------------------------------------------------------------ verificações (gates)
def run_gates(ws: Workspace, names: list[str], actor: dict) -> dict:
    cfg = (ws.config().get("gates") or {})
    if not names:
        names = list(cfg)
    unknown = [n for n in names if n not in cfg]
    if unknown:
        raise StatusError(f"verificações desconhecidas: {unknown} (definidas em portal.yaml: {list(cfg)})")
    results, started = {}, now()
    for n in names:
        spec = cfg[n]
        argv = spec.get("cmd")
        if not isinstance(argv, list) or not argv or not all(isinstance(a, str) for a in argv):
            raise StatusError(f"gate {n}: cmd deve ser uma lista de argumentos (sem shell)")
        argv = [sys.executable if a == "{python}" else a for a in argv]
        argv[0] = shutil.which(argv[0]) or argv[0]            # Windows: npm/pnpm são .cmd; continua sem shell
        cwd = (ws.root / (spec.get("cwd") or ".")).resolve()
        if not cwd.is_relative_to(ws.root):
            raise StatusError(f"gate {n}: cwd fora do projeto")
        t0 = time.monotonic()
        try:
            p = subprocess.run(argv, cwd=str(cwd), capture_output=True, text=True, encoding="utf-8", errors="replace",
                               timeout=int(spec.get("timeout") or 1800))
            rc, tail = p.returncode, ((p.stdout or "") + (p.stderr or ""))[-1500:]
        except (OSError, subprocess.TimeoutExpired) as exc:
            rc, tail = -1, type(exc).__name__
        res = {"status": "PASS" if rc == 0 else "FAIL", "exit_code": rc, "seconds": round(time.monotonic() - t0, 1),
               "label": spec.get("label") or n, "output_tail": tail}
        if spec.get("parse") and spec.get("metric"):
            m = re.search(spec["parse"], tail)
            if m:
                res["metric"] = {spec["metric"]: int(m.group(1))}
        results[n] = res
    rep = {"started_at": started, "finished_at": now(), "actor": actor["id"],
           "status": "PASS" if all(r["status"] == "PASS" for r in results.values()) else "FAIL", "results": results}
    prev = {}
    if ws.gates_path.is_file():
        try:
            prev = json.loads(ws.gates_path.read_text(encoding="utf-8")).get("results", {})
        except (OSError, ValueError):
            prev = {}
    merged = {**prev, **{k: dict(v, at=rep["finished_at"]) for k, v in results.items()}}  # rodada parcial não apaga as outras
    atomic_write_text(ws.gates_path, json.dumps({"latest": rep, "results": merged}, ensure_ascii=False, indent=2))
    _append(ws, "GATES_RECORDED", actor, None, {"status": rep["status"], "gates": {k: v["status"] for k, v in results.items()}})
    return rep


# ------------------------------------------------------------------ passagem de bastão
def handoff(ws: Workspace, actor: dict, summary: str, next_hint: str = "") -> dict:
    if not summary.strip():
        raise StatusError("informe --summary (o que foi feito, decidido e o que ficou pendente)")
    tasks = state(ws)
    counts = {s: sum(1 for t in tasks if t["status"] == s) for s in STATUSES}
    nxt = next_task(ws, "agent")["next"]
    ts = now()
    stamp = re.sub(r"[^0-9TZ]", "", ts.replace("+00:00", "Z"))[:16]
    who = re.sub(r"[^a-z0-9-]+", "-", actor["id"].lower()).strip("-")
    evs = events(ws)
    last_h = max((e["seq"] for e in evs if e["type"] == "HANDOFF_RECORDED"), default=0)
    moved = [e for e in evs if e["seq"] > last_h and e.get("task_id")]
    lines = [f"# Handoff {stamp} — {actor['id']}", "", "## Resumo", summary.strip(), "",
             "## Tarefas movimentadas nesta sessão"] + (
        [f"- {e['task_id']} {e['type']} por `{e['actor']['id']}` em {e['ts']}" for e in moved] or ["- nenhuma"])
    lines += ["", "## Estado", f"- tarefas: {counts}", "", "## Próxima ação",
              (f"- {nxt['id']} {nxt['title']} — `status work start {nxt['id']}`" if nxt else "- nenhuma tarefa acionável por agente")]
    waiting = waiting_on_humans(ws)
    lines += ["", "## Aguardando humanos"] + ([f"- {w['task']} {w['title']} — {'; '.join(map(str, w['why']))}" for w in waiting] or ["- nada"])
    if next_hint.strip():
        lines += ["", "## Nota para o próximo", next_hint.strip()]
    text = "\n".join(lines) + "\n"
    rel = ws.handoffs_dir / f"{stamp}-{who}.md"
    atomic_write_text(rel, text)
    atomic_write_text(ws.data / "HANDOFF.md", text)
    _append(ws, "HANDOFF_RECORDED", actor, None, {"note_path": ws.rel(rel), "tasks_touched": len(moved)})
    return {"handoff": ws.rel(rel), "latest": ws.rel(ws.data / "HANDOFF.md"), "tasks_touched": len(moved),
            "next": nxt["id"] if nxt else None}


def project_status(ws: Workspace) -> dict:
    tasks = state(ws)
    nxt = next_task(ws, "agent")
    cfg = ws.config()
    return {"project": cfg["project"].get("title"), "tasks": {s: sum(1 for t in tasks if t["status"] == s) for s in STATUSES},
            "in_progress": [{"id": t["id"], "title": t["title"], "assignee": t.get("assignee")} for t in tasks if t["status"] == "IN_PROGRESS"],
            "next": nxt["next"] and {"id": nxt["next"]["id"], "title": nxt["next"]["title"], "priority": nxt["next"]["priority"]},
            "waiting_on_humans": nxt["waiting_on_humans"], "events_chain_problems": EventStore(ws.events_path).verify()}
