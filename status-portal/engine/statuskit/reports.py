"""Relatórios por fase (PDF) e consolidado — pipeline determinístico:

    visão do CLIENTE (sanitizada) → report JSON → PDF (reportlab, opcional) → registro encadeado em status/reports/registry.jsonl

* o texto vem dos dados; seção sem evidência sai "Não registrado"/"Não aplicável" (nunca inferida);
* versionado por ``source_hash`` (hash do corpo sem metadados): fonte igual → reaproveita a versão; diferente → versão+1;
  versões antigas nunca são sobrescritas;
* o PDF é opcional: sem reportlab o JSON é gerado e o painel mostra "PDF indisponível".
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path

from . import hours as H
from . import projection as P
from . import store as S
from .common import canonical_json, fmt_day, now, sha256_bytes

NA, NR = "Não aplicável", "Não registrado"
ENGINE_ACTOR = {"type": "engine", "id": "engine:status-report", "name": "status-report"}
BODY_EXCLUDE = ("generated_at", "version", "source_hash", "generated_from_historical_evidence")
GATE_STATUS = {"PASS": "Aprovado", "FAIL": "Reprovado", "PENDING": "Pendente", "NOT_RECORDED": "Não registrado"}
REQUIRED = ("report_id", "report_kind", "version", "title", "project", "period", "objective", "executive_summary",
            "tasks_completed", "executors", "gates", "final_status", "source_hash", "generated_at")


def registry(ws: S.Workspace) -> S.EventStore:
    return S.EventStore(ws.reports_dir / "registry.jsonl")


def registered(ws: S.Workspace) -> list[dict]:
    return [e["data"] | {"registered_at": e["ts"], "actor": e["actor"]["id"]}
            for e in registry(ws).read() if e["type"] == "REPORT_ARTIFACT_REGISTERED"]


def list_reports(ws: S.Workspace) -> list[dict]:
    latest: dict[str, dict] = {}
    counts: dict[str, int] = {}
    for r in registered(ws):
        counts[r["report_id"]] = counts.get(r["report_id"], 0) + 1
        if r["report_id"] not in latest or r["version"] > latest[r["report_id"]]["version"]:
            latest[r["report_id"]] = r
    out = []
    for rid, r in latest.items():
        out.append({"report_id": rid, "kind": r["report_kind"], "phase_id": r["phase_id"], "title": r["title"], "version": r["version"],
                    "versions": counts[rid], "generated_at": r["generated_at"], "period": r.get("period") or {},
                    "audience": r.get("audience", "client"), "generated_from_historical_evidence": bool(r.get("generated_from_historical_evidence")),
                    "has_pdf": bool(r.get("pdf")), "artifact_id": r["artifact_id"], "source_hash": r["source_hash"],
                    "json_path": r["json"]["path"], "pdf_path": (r.get("pdf") or {}).get("path"),
                    "pdf_sha256": (r.get("pdf") or {}).get("sha256"), "tasks": r.get("tasks") or [], "actor": r.get("actor")})
    order = {"phase": 0, "consolidated": 1}
    return sorted(out, key=lambda x: (order.get(x["kind"], 9), x["period"].get("completed_at") or "", x["report_id"]))


def get(ws: S.Workspace, report_id: str) -> dict | None:
    return next((r for r in list_reports(ws) if r["report_id"] == report_id), None)


def report_cards(reports: list[dict], include_admin: bool) -> list[dict]:
    """Entradas no formato do cliente: só URLs da API (sem caminhos nem hashes)."""
    return [{k: r[k] for k in ("report_id", "kind", "phase_id", "title", "version", "generated_at", "period",
                               "generated_from_historical_evidence", "has_pdf", "audience")}
            | {"json_url": f"api/project/reports/{r['report_id']}",
               "pdf_url": f"api/project/reports/{r['report_id']}/pdf" if r["has_pdf"] else None}
            for r in reports if include_admin or r.get("audience", "client") == "client"]


# ------------------------------------------------------------------ corpo dos relatórios
def _gate_runs(p: P.Projection, task_ids: set[str]) -> list[dict]:
    windows = []
    for tid in task_ids:
        h = p.by_id[tid]["history"] if tid in p.by_id else []
        s = next((x["seq"] for x in h if x["type"] == "TASK_STARTED"), None)
        e = next((x["seq"] for x in reversed(h) if x["type"] == "TASK_COMPLETED"), None)
        if s is not None:
            windows.append((s, e if e is not None else 10 ** 9))
    out = []
    for e in p.events:
        if e["type"] != "GATES_RECORDED" or not any(a < e["seq"] < b for a, b in windows):
            continue
        gates = (e.get("data") or {}).get("gates") or {}
        out.append({"ts": e["ts"], "result": "Aprovadas" if all(s == "PASS" for s in gates.values()) else
                    f"Com pendências ({sum(s != 'PASS' for s in gates.values())} de {len(gates)})",
                    "gates": [{"label": p.gate_label(g), "status": GATE_STATUS.get(s, s)} for g, s in sorted(gates.items())]})
    return out


def phase_report(p: P.Projection, cv: dict, phase_id: str, registry_started_at: str | None) -> dict:
    ph = next(x for x in cv["phases"] if x["phase_id"] == phase_id)
    tasks = [t for t in cv["tasks"] if t["phase_id"] == phase_id]
    done = [t for t in tasks if t["status"] == "DONE"]
    tids = {t["id"] for t in tasks}
    start, end = ph["started_at"], ph["completed_at"]
    runs = _gate_runs(p, tids)
    problems, corrections, failing = [], [], {}
    for r in runs:
        for g in r["gates"]:
            if g["status"] != GATE_STATUS["PASS"]:
                problems.append(f"Verificação '{g['label']}' reprovada em {fmt_day(r['ts'])} ({r['ts'][11:16]} UTC).")
                failing[g["label"]] = r["ts"]
            elif g["label"] in failing:
                corrections.append(f"Verificação '{g['label']}' aprovada em {fmt_day(r['ts'])} ({r['ts'][11:16]} UTC), após correção.")
                failing.pop(g["label"])
    for e in p.events:
        if e.get("task_id") in tids and e["type"] == "TASK_BLOCKED":
            problems.append(f"Tarefa {e['task_id']} aguardou liberação em {fmt_day(e['ts'])}.")
        if e.get("task_id") in tids and e["type"] == "TASK_UNBLOCKED":
            corrections.append(f"Tarefa {e['task_id']} liberada em {fmt_day(e['ts'])}.")
    gates_final: dict[str, str] = {}
    for t in done:
        for g in t["gates"]:
            gates_final[g["label"]] = GATE_STATUS.get(g["status"], g["status"])
    ev: dict[str, int] = {}
    for t in done:
        for e in t["evidence"]:
            ev[e["label"]] = ev.get(e["label"], 0) + e["count"]
    acts = [{"ts": x["ts"], "action": x["action"], "executor": x["executor"], "result": x["result"],
             "task": f"{x['task_id']} — {x['task_title']}" if x.get("task_id") else None}
            for x in sorted(cv["timeline"], key=lambda x: x["ts"])
            if x.get("task_id") in tids and x["action"] in ("Tarefa iniciada", "Tarefa concluída", "Tarefa aguardando", "Tarefa liberada", "Tarefa reaberta")]
    order = [x["phase_id"] for x in cv["phases"]]
    nxt = next((x for x in cv["phases"] if x["phase_id"] == (order[order.index(phase_id) + 1] if order.index(phase_id) + 1 < len(order) else None)), None)
    executors = sorted({t["executor"] for t in done})
    summary = (f"A fase \"{ph['title']}\" " + (f"foi concluída em {fmt_day(end)}" if ph["status"] == "COMPLETED" else f"está {ph['status_label'].lower()}")
               + f", com {len(done)} de {len(tasks)} tarefa(s) concluída(s)" + (f" por {', '.join(executors)}" if executors else "") + ". "
               + (f"{len(runs)} rodada(s) de verificações de qualidade registradas no período." if runs else "Nenhuma rodada de verificações registrada no período."))
    project = cv["project"]
    hp = ph.get("worked") or {}
    return {
        "report_id": f"report.{phase_id}", "report_kind": "phase", "version": 0, "phase_id": phase_id, "title": ph["title"],
        "project": {"title": project.get("title") or NR, "office": project.get("office") or NR,
                    "heading": (p.cfg.get("project") or {}).get("report_heading") or "Relatório de Evolução do Projeto"},
        "period": {"started_at": start, "completed_at": end}, "objective": ph.get("objective") or NR, "executive_summary": summary,
        "tasks_completed": [{"id": t["id"], "title": t["title"], "completed_at": t["completed_at"], "executor": t["executor"], "result": t["result"]} for t in done],
        "executors": executors, "activities": acts,
        "results": [f"Marco entregue — {m['title']}: {m['description']}" for m in cv["milestones"] if m["phase_id"] == phase_id and m["delivered"]]
        + [f"{t['title']}: {t['result']}" for t in done if t["result"]],
        "findings": [{"title": f["title"], "situation": f["situation"]} for f in cv["findings"] if set(f["tasks"]) & tids],
        "artifacts": [{"label": k, "count": v} for k, v in sorted(ev.items())], "tests": [{k: r[k] for k in ("ts", "result", "gates")} for r in runs],
        "gates": [{"label": k, "status": v} for k, v in sorted(gates_final.items())], "problems_found": problems, "corrections": corrections,
        "decisions": [], "remaining_items": [f"{t['id']} — {t['title']} ({t['status_label']})" for t in tasks if t["status"] != "DONE"],
        "final_status": ph["status_label"], "next_phase": {"phase_id": nxt["phase_id"], "title": nxt["title"]} if nxt else None,
        "evidence_refs": [{"label": k, "count": v} for k, v in sorted(ev.items())],
        "worked_hours": {"label": hp.get("label") or NR, "seconds": hp.get("seconds") or 0, "method": H.PHASE_METHOD},
        "generated_at": "", "source_hash": "0" * 64,
        "generated_from_historical_evidence": bool(end and (registry_started_at is None or end < registry_started_at)),
    }


def consolidated_report(p: P.Projection, cv: dict) -> dict:
    m = cv["metrics"]
    sections = []
    for ph in cv["phases"]:
        ts = [t for t in cv["tasks"] if t["phase_id"] == ph["phase_id"]]
        sections.append({"phase_id": ph["phase_id"], "title": ph["title"], "status": ph["status_label"], "progress": ph["progress"],
                         "period": {"started_at": ph["started_at"], "completed_at": ph["completed_at"]},
                         "tasks": [f"{t['id']} — {t['title']} ({t['status_label']})" for t in ts]})
    starts = [ph["started_at"] for ph in cv["phases"] if ph["started_at"]]
    ends = [ph["completed_at"] for ph in cv["phases"] if ph["completed_at"]]
    ev: dict[str, int] = {}
    for t in cv["tasks"]:
        for e in t["evidence"]:
            ev[e["label"]] = ev.get(e["label"], 0) + e["count"]
    nx = cv["next"]["task"]
    project = cv["project"]
    return {
        "report_id": "report.consolidated", "report_kind": "consolidated", "version": 0, "phase_id": None,
        "title": "Relatório consolidado do projeto",
        "project": {"title": project.get("title") or NR, "office": project.get("office") or NR,
                    "heading": (p.cfg.get("project") or {}).get("report_heading") or "Relatório de Evolução do Projeto"},
        "period": {"started_at": min(starts) if starts else None, "completed_at": max(ends) if ends else None},
        "objective": cv["summary"].get("objective") or NR,
        "executive_summary": (f"Projeto {cv['status_label'].lower()}: {m['tasks_done']} de {m['tasks_total']} tarefas concluídas "
                              f"({m['progress']}%), {m['phases_completed']} de {m['phases_total']} fases concluídas. "
                              f"Fase atual: {(cv['current_phase'] or {}).get('title') or NR}."),
        "tasks_completed": [{"id": t["id"], "title": t["title"], "completed_at": t["completed_at"], "executor": t["executor"], "result": t["result"]}
                            for t in cv["tasks"] if t["status"] == "DONE"],
        "executors": sorted({t["executor"] for t in cv["tasks"] if t["status"] == "DONE"}), "activities": [],
        "results": [f"{x['title']} — entregue em {fmt_day(x['delivered_at'])}" for x in cv["milestones"] if x["delivered"]],
        "findings": [{"title": f["title"], "situation": f["situation"]} for f in cv["findings"]],
        "artifacts": [{"label": k, "count": v} for k, v in sorted(ev.items())], "tests": [],
        "gates": [{"label": q["label"], "status": q["status_label"]} for q in cv["quality"]], "problems_found": [], "corrections": [],
        "decisions": [], "remaining_items": [f"{t['id']} — {t['title']} ({t['status_label']})" for t in cv["waiting"]],
        "final_status": cv["status_label"], "next_phase": {"phase_id": nx["phase_id"], "title": f"{nx['id']} — {nx['title']}"} if nx else None,
        "evidence_refs": [{"label": k, "count": v} for k, v in sorted(ev.items())],
        "worked_hours": {"label": cv["hours"]["total_label"], "seconds": cv["hours"]["total_seconds"], "method": cv["hours"]["method"]},
        "sections": sections, "generated_at": "", "source_hash": "0" * 64, "generated_from_historical_evidence": False,
    }


def body_hash(rep: dict) -> str:
    return sha256_bytes(canonical_json({k: v for k, v in rep.items() if k not in BODY_EXCLUDE}).encode("utf-8"))


def validate(rep: dict) -> list[str]:
    """Checagem estrutural mínima (sem dependência de jsonschema)."""
    errs = [f"campo ausente: {k}" for k in REQUIRED if k not in rep]
    if rep.get("report_kind") not in ("phase", "consolidated"):
        errs.append("report_kind inválido")
    if not isinstance(rep.get("tasks_completed"), list):
        errs.append("tasks_completed deve ser lista")
    return errs


# ------------------------------------------------------------------ PDF (reportlab opcional, determinístico)
_PDF_MAP = str.maketrans({"→": "->", "←": "<-", "✓": "OK", "✔": "OK", "●": "*", "○": "o", "≥": ">=", "≤": "<=", " ": " ", "−": "-"})


def _p(text) -> str:
    from xml.sax.saxutils import escape
    s = str(text if text not in (None, "") else NR).translate(_PDF_MAP)
    return escape(s.encode("cp1252", "replace").decode("cp1252"))


def pdf_available() -> bool:
    try:
        import reportlab  # noqa: F401
        return True
    except ImportError:
        return False


def render_pdf(rep: dict) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    ink, muted, accent, line = colors.HexColor("#1d2433"), colors.HexColor("#5d6677"), colors.HexColor("#2457c5"), colors.HexColor("#dfe3ea")
    ss = getSampleStyleSheet()
    base = ParagraphStyle("base", parent=ss["Normal"], fontName="Helvetica", fontSize=9.5, leading=13, textColor=ink, alignment=TA_LEFT)
    small = ParagraphStyle("small", parent=base, fontSize=8, leading=10.5, textColor=muted)
    h1 = ParagraphStyle("h1", parent=base, fontName="Helvetica-Bold", fontSize=20, leading=24, spaceAfter=6)
    h2 = ParagraphStyle("h2", parent=base, fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=accent, spaceBefore=10, spaceAfter=4)
    ck = ParagraphStyle("ck", parent=small, fontSize=9)
    cv_ = ParagraphStyle("cv", parent=base, fontName="Helvetica-Bold", fontSize=11, leading=14)
    period = rep["period"]
    per = f"{fmt_day(period.get('started_at'))} a {fmt_day(period.get('completed_at'))}" if period.get("started_at") else NR
    date, proj = fmt_day(rep["generated_at"]), rep["project"]

    def hf(canv, doc):
        canv.saveState()
        canv.setFont("Helvetica", 7.5)
        canv.setFillColor(muted)
        canv.drawString(18 * mm, A4[1] - 12 * mm, _p(f"{proj['heading']} · {proj['office']}").replace("&amp;", "&"))
        canv.drawRightString(A4[0] - 18 * mm, A4[1] - 12 * mm, _p(rep["title"]).replace("&amp;", "&"))
        canv.setStrokeColor(line)
        canv.line(18 * mm, A4[1] - 14 * mm, A4[0] - 18 * mm, A4[1] - 14 * mm)
        canv.drawString(18 * mm, 10 * mm, _p(f"{rep['report_id']} · versão {rep['version']} · gerado em {date}").replace("&amp;", "&"))
        canv.drawRightString(A4[0] - 18 * mm, 10 * mm, f"Página {doc.page}")
        canv.restoreState()

    story = [Spacer(1, 40 * mm), Paragraph(_p(proj["heading"]), ParagraphStyle("kick", parent=small, fontSize=10, textColor=accent)),
             Spacer(1, 3 * mm), Paragraph(_p(rep["title"]), h1), Paragraph(_p(f"{proj['title']} — {proj['office']}"), base), Spacer(1, 14 * mm)]
    cover = [[Paragraph("Fase" if rep["report_kind"] == "phase" else "Escopo", ck), Paragraph(_p(rep["title"]), cv_)],
             [Paragraph("Período", ck), Paragraph(_p(per), cv_)], [Paragraph("Situação ao final", ck), Paragraph(_p(rep["final_status"]), cv_)],
             [Paragraph("Horas trabalhadas", ck), Paragraph(_p((rep.get("worked_hours") or {}).get("label")), cv_)],
             [Paragraph("Data do relatório", ck), Paragraph(_p(date), cv_)], [Paragraph("Versão", ck), Paragraph(_p(rep["version"]), cv_)]]
    t = Table(cover, colWidths=[45 * mm, 120 * mm])
    t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.4, line), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story += [t, Spacer(1, 10 * mm)]
    if rep["generated_from_historical_evidence"]:
        story.append(Paragraph("Relatório reconstruído a partir das evidências registradas (fase concluída antes da geração automática de relatórios).", small))
    story += [Paragraph("Conteúdo gerado exclusivamente a partir do planejamento, do histórico de eventos e das evidências do projeto. "
                        "Seções sem registro aparecem como \"Não registrado\".", small), PageBreak()]

    def section(title, rows):
        story.append(Paragraph(_p(title), h2))
        if not rows:
            story.append(Paragraph(NR, small))
        for r in rows:
            story.append(Paragraph("• " + _p(r), base))

    def table(title, head, rows, widths):
        story.append(Paragraph(_p(title), h2))
        if not rows:
            story.append(Paragraph(NR, small))
            return
        data = [[Paragraph(f"<b>{_p(h)}</b>", small) for h in head]] + [[Paragraph(_p(c), small) for c in r] for r in rows]
        tb = Table(data, colWidths=[w * mm for w in widths], repeatRows=1)
        tb.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.3, line), ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eceef2")),
                                ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
        story.append(tb)

    story += [Paragraph("Objetivo", h2), Paragraph(_p(rep["objective"]), base), Paragraph("Resumo executivo", h2),
              Paragraph(_p(rep["executive_summary"]), base)]
    if rep.get("worked_hours"):
        story.append(Paragraph(_p(f"Horas trabalhadas: {rep['worked_hours']['label']}. {rep['worked_hours']['method']}"), small))
    if rep["report_kind"] == "consolidated":
        table("Fases", ["Fase", "Situação", "Progresso", "Período"],
              [[s["title"], s["status"], f"{s['progress']}%",
                (f"{fmt_day(s['period']['started_at'])} a {fmt_day(s['period']['completed_at'])}" if s["period"]["completed_at"]
                 else f"desde {fmt_day(s['period']['started_at'])} (em andamento)") if s["period"]["started_at"] else NR]
               for s in rep.get("sections") or []], [70, 30, 22, 52])
    table("O que foi realizado", ["Tarefa", "Concluída em", "Executor"],
          [[f"{x['id']} — {x['title']}", fmt_day(x["completed_at"]), x["executor"]] for x in rep["tasks_completed"]], [105, 30, 39])
    if rep["activities"]:
        table("Atividades registradas", ["Data", "Ação", "Tarefa", "Executor"],
              [[f"{fmt_day(a['ts'])} {a['ts'][11:16]}", a["action"], a.get("task") or "—", a["executor"]] for a in rep["activities"]], [28, 34, 78, 34])
    section("Principais resultados", rep["results"])
    table("Achados", ["Achado", "Situação"], [[f["title"], f["situation"]] for f in rep["findings"]], [125, 49])
    section("Problemas encontrados", rep["problems_found"] or ([NA] if rep["report_kind"] == "consolidated" else []))
    section("Correções aplicadas", rep["corrections"] or ([NA] if not rep["problems_found"] else []))
    if rep["report_kind"] == "phase":
        table("Testes realizados (verificações de qualidade)", ["Data", "Resultado", "Verificações"],
              [[f"{fmt_day(r['ts'])} {r['ts'][11:16]}", r["result"], ", ".join(f"{g['label']}: {g['status']}" for g in r["gates"])] for r in rep["tests"]], [30, 38, 106])
    table("Resultado das verificações", ["Verificação", "Resultado"], [[g["label"], g["status"]] for g in rep["gates"]], [120, 54])
    table("Artefatos produzidos", ["Tipo", "Quantidade"], [[a["label"], a["count"]] for a in rep["artifacts"]], [140, 34])
    section("Decisões registradas", rep["decisions"])
    story.append(KeepTogether([Paragraph("Situação ao final", h2), Paragraph(_p(rep["final_status"]), base)]))
    section("Itens remanescentes", rep["remaining_items"] or [NA])
    story += [Paragraph("Próximos passos", h2), Paragraph(_p(f"Próxima fase: {rep['next_phase']['title']}" if rep["next_phase"] else NR), base)]
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
                            title=f"{proj['heading']} — {rep['title']}", author=proj["office"], subject=rep["report_id"],
                            creator="statuskit", producer="statuskit", invariant=1)
    doc.build(story, onFirstPage=hf, onLaterPages=hf)
    return buf.getvalue()


# ------------------------------------------------------------------ geração e registro
def _write(path: Path, data: bytes) -> None:
    if path.exists():
        raise FileExistsError(f"versões nunca são sobrescritas: {path.name}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def _register(ws: S.Workspace, rep: dict, actor: dict, audience: str, tasks: list[str]) -> dict:
    rid, ver = rep["report_id"], rep["version"]
    d = ws.reports_dir / rid / f"v{ver:03d}"
    jb = (json.dumps(rep, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")
    _write(d / "report.json", jb)
    pdf, reason = None, None
    if pdf_available():
        pb = render_pdf(rep)
        _write(d / "report.pdf", pb)
        pdf = {"path": ws.rel(d / "report.pdf"), "sha256": sha256_bytes(pb), "bytes": len(pb), "media_type": "application/pdf"}
    else:
        reason = "dependência reportlab ausente (python -m pip install reportlab)"
    rec = {"artifact_id": "artifact." + hashlib.sha256(f"{rid}|{ver}|{rep['source_hash']}".encode()).hexdigest()[:32],
           "report_id": rid, "report_kind": rep["report_kind"], "version": ver, "phase_id": rep["phase_id"], "title": rep["title"],
           "source_hash": rep["source_hash"], "generated_at": rep["generated_at"], "audience": audience,
           "json": {"path": ws.rel(d / "report.json"), "sha256": sha256_bytes(jb), "bytes": len(jb), "media_type": "application/json"},
           "pdf": pdf, "tasks": tasks, "period": rep["period"], "generated_from_historical_evidence": rep["generated_from_historical_evidence"]}
    if reason:
        rec["pdf_unavailable_reason"] = reason
    registry(ws).append("REPORT_ARTIFACT_REGISTERED", actor, rec)
    return rec


def generate(ws: S.Workspace, scope: str = "phases", actor: dict | None = None) -> list[dict]:
    """scope: phases (um por fase CONCLUÍDA) | consolidated | all. Devolve CREATED/REUSED por relatório."""
    if scope not in ("phases", "consolidated", "all"):
        raise S.StatusError("scope deve ser phases|consolidated|all")
    actor = actor or ENGINE_ACTOR
    p = P.Projection(ws)
    cv = p.client_view(p.admin_view())
    reg = registry(ws).read()
    started = reg[0]["ts"] if reg else None
    jobs = []
    if scope in ("phases", "all"):
        for ph in cv["phases"]:
            if ph["status"] == "COMPLETED":
                jobs.append((phase_report(p, cv, ph["phase_id"], started), "client", list(ph["tasks"])))
    if scope in ("consolidated", "all"):
        jobs.append((consolidated_report(p, cv), "admin", [t["id"] for t in cv["tasks"] if t["status"] == "DONE"]))
    out = []
    for rep, audience, tasks in jobs:
        rep = p.san.scan(p.san.sanitize_tree(rep), "", [])
        rep["source_hash"] = body_hash(rep)
        prev = get(ws, rep["report_id"])
        if prev and prev["source_hash"] == rep["source_hash"]:
            out.append({"report_id": rep["report_id"], "version": prev["version"], "status": "REUSED"})
            continue
        rep["version"] = (prev["version"] + 1) if prev else 1
        rep["generated_at"] = now()
        errs = validate(rep)
        if errs:
            raise S.StatusError(f"{rep['report_id']}: relatório inválido: {errs[:3]}")
        rec = _register(ws, rep, actor, audience, tasks)
        out.append({"report_id": rep["report_id"], "version": rep["version"], "status": "CREATED", "pdf": bool(rec["pdf"])})
    return out


def load_report_json(ws: S.Workspace, report_id: str) -> dict | None:
    r = get(ws, report_id)
    if not r:
        return None
    p = (ws.root / r["json_path"]).resolve()
    if not p.is_relative_to(ws.reports_dir.resolve()) or not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def pdf_bytes(ws: S.Workspace, report_id: str) -> tuple[bytes, str] | None:
    r = get(ws, report_id)
    if not r or not r["pdf_path"]:
        return None
    p = (ws.root / r["pdf_path"]).resolve()
    if not p.is_relative_to(ws.reports_dir.resolve()) or not p.is_file():
        return None
    data = p.read_bytes()
    if sha256_bytes(data) != r["pdf_sha256"]:
        return None
    return data, f"{r['report_id'].replace('.', '-')}-v{r['version']:03d}.pdf"


def verify(ws: S.Workspace) -> list[str]:
    problems = list(registry(ws).verify())
    for r in registered(ws):
        for f in (r.get("json"), r.get("pdf")):
            if not f:
                continue
            p = ws.root / f["path"]
            if not p.is_file():
                problems.append(f"{r['report_id']} v{r['version']}: arquivo ausente {f['path']}")
            elif sha256_bytes(p.read_bytes()) != f["sha256"]:
                problems.append(f"{r['report_id']} v{r['version']}: hash não confere {f['path']}")
    return problems
