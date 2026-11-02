"""Projeção do painel: transforma backlog + eventos + verificações em visões.

* ``Projection.admin_view()``  — tudo (ids, evidências por caminho, gates, referências);
* ``client_view``              — ClientProjectView: montado CAMPO A CAMPO (nunca cópia do admin), cada texto passa por
                                 ``Sanitizer.text`` e o DTO final por ``Sanitizer.scan`` (fail-closed).
Nada aqui guarda estado: tudo é derivado das fontes. Ver GUIA.md.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import threading
from datetime import datetime, timezone
from pathlib import Path

from . import hours as H
from . import store as S
from .common import fmt_day, fmt_hours, load_yaml, now, parse_ts
from .sanitize import SECURITY_TEXT, SECURITY_TITLE, Sanitizer

NOT_RECORDED = "não registrado"
PRIORITY_LABELS = {"P0": "Crítica", "P1": "Alta", "P2": "Média", "P3": "Baixa"}
LADDER = ["Identificada", "Em migração", "Implementada", "Testada", "Homologada"]
AUTOMATION_VALUES = ("SIM", "PARCIAL", "NÃO")
PHASE_STATUS_LABELS = {"COMPLETED": "Concluída", "IN_PROGRESS": "Em andamento", "WAITING": "Aguardando", "NOT_STARTED": "Planejada"}
TASK_VIEW_LABELS = {"DONE": "Concluída", "IN_PROGRESS": "Em execução", "NEXT": "Próxima", "PLANNED": "Planejada",
                    "WAITING": "Aguardando", "BLOCKED": "Bloqueada"}
TASK_TABS = {"DONE": "concluidas", "IN_PROGRESS": "em_execucao", "NEXT": "proximas", "PLANNED": "proximas",
             "WAITING": "bloqueadas", "BLOCKED": "bloqueadas"}
WAITING_LABELS = {"aprovacao": "Aguardando aprovação", "acesso": "Aguardando acesso ou credenciais",
                  "decisao": "Aguardando decisão", "arquivo": "Aguardando material do cliente",
                  "acao": "Aguardando ação da equipe", "dependencia": "Aguardando tarefas anteriores"}
EXECUTOR_PLAN = {"agent": "Agente de IA", "human": "Equipe (humano)", "any": "Equipe ou agente de IA"}
QUALITY_LABELS = {"PASS": "Aprovado", "WARNING": "Com ressalvas", "BLOCKED": "Bloqueado", "NOT_RECORDED": "Não registrado"}
GATE_STATUS = {"PASS": "Aprovado", "FAIL": "Reprovado", "PENDING": "Pendente", "NOT_RECORDED": "Não registrado"}
KIND_LABELS = {
    "error": {"DONE": "Corrigido", "IN_PROGRESS": "Em correção", "WAIT": "Aguardando decisão ou ação", "OPEN": "Em aberto", "NONE": "Sem tarefa vinculada"},
    "change": {"DONE": "Feito", "IN_PROGRESS": "Em andamento", "WAIT": "Aguardando decisão ou ação", "OPEN": "Em aberto", "NONE": "Sem tarefa vinculada"},
    "decision": {"DONE": "Decidido", "IN_PROGRESS": "Em análise", "WAIT": "Aguardando decisão humana", "OPEN": "Em aberto", "NONE": "Sem tarefa vinculada"},
    "finding": {"DONE": "Resolvido", "IN_PROGRESS": "Em tratamento", "WAIT": "Aguardando decisão ou ação", "OPEN": "Planejado", "NONE": "Recomendação registrada"},
}
CMP_TONE = {"DONE": "DONE", "IN_PROGRESS": "IN_PROGRESS", "WAIT": "WAITING", "OPEN": "PLANNED", "NONE": "WARNING"}


def fill(text: str, metrics: dict) -> str:
    def rep(m):
        v = metrics.get(m.group(1))
        return str(v) if v not in (None, "") else NOT_RECORDED
    return re.sub(r"\{(\w+)\}", rep, text or "")


class Projection:
    def __init__(self, ws: S.Workspace):
        self.ws = ws
        self.cfg = ws.config()
        self.tasks = S.state(ws)
        self.by_id = {t["id"]: t for t in self.tasks}
        self.events = S.events(ws)
        self.next = S.next_task(ws, "agent")
        self.waiting = {w["task"]: w for w in S.waiting_on_humans(ws)}
        self.phases_cfg = load_yaml(ws.phases_path)
        self.comparison_cfg = load_yaml(ws.comparison_path)
        self.san = Sanitizer(self.cfg)
        self._phase_of: dict[str, str] = {}
        for ph in self.phases_cfg.get("phases") or []:
            for tid in ph.get("tasks") or []:
                self._phase_of.setdefault(tid, ph["id"])
        self._hours = None

    # ------------------------------------------------------------ rótulos
    @property
    def orch_label(self) -> str:
        return (self.cfg.get("orchestrator") or {}).get("label") or "Automação"

    def actor_label(self, actor_id: str | None, event_type: str | None = None) -> str:
        orch = self.cfg.get("orchestrator") or {}
        if event_type and event_type in (orch.get("event_types") or []):
            return self.orch_label
        if not actor_id:
            return NOT_RECORDED
        labels = self.cfg.get("actors") or {}
        if actor_id in labels:
            return labels[actor_id]
        typ = actor_id.split(":", 1)[0]
        if typ in (orch.get("actor_types") or []):
            return self.orch_label
        return (self.cfg.get("actor_types") or {}).get(typ, "Equipe")

    def is_sensitive(self, t: dict) -> bool:
        return t.get("kind") in ((self.cfg.get("client") or {}).get("mask_kinds") or ["security"])

    def override(self, tid: str) -> dict:
        return (self.cfg.get("tasks") or {}).get(tid) or {}

    def client_task_title(self, t: dict) -> str:
        if self.is_sensitive(t):
            return SECURITY_TITLE
        return self.override(t["id"]).get("title") or self.san.text(t.get("title")) or t["id"]

    def client_task_goal(self, t: dict) -> str:
        if self.is_sensitive(t):
            return SECURITY_TEXT
        return self.override(t["id"]).get("goal") or self.san.text(t.get("goal"))

    # ------------------------------------------------------------ tarefas
    def waiting_code(self, t: dict) -> str | None:
        if t["status"] in ("DONE", "IN_PROGRESS"):
            return None
        unmet = S.unmet_deps(t, self.by_id)
        if t.get("blocked_by"):
            return "acesso" if re.search(r"credenc|acesso|conta|chave|token", " ".join(map(str, t["blocked_by"])).lower()) else "aprovacao"
        if t["status"] == "BLOCKED":
            return "acao"
        if t.get("executor") == "human" and not unmet:
            if t.get("kind") == "decision":
                return "decisao"
            if t.get("kind") == "input":
                return "arquivo"
            return "aprovacao" if t.get("requires_human_approval") else "acao"
        return None

    def view_status(self, t: dict) -> str:
        if t["status"] in ("DONE", "IN_PROGRESS", "BLOCKED"):
            return t["status"]
        if self.waiting_code(t):
            return "WAITING"
        return "PLANNED" if S.unmet_deps(t, self.by_id) else "NEXT"

    def gate_label(self, g: str) -> str:
        return ((self.cfg.get("gates") or {}).get(g) or {}).get("label") or g

    def task_gates(self, t: dict) -> list[dict]:
        needed = t.get("gates") or []
        lo = t.get("started_seq", 0)
        hi = next((h["seq"] for h in reversed(t["history"]) if h["type"] == "TASK_COMPLETED"), None)
        res: dict[str, tuple[str, str]] = {}
        for e in self.events:
            if e["type"] != "GATES_RECORDED" or e["seq"] <= lo or (hi is not None and e["seq"] > hi):
                continue
            for g, st in ((e.get("data") or {}).get("gates") or {}).items():
                res[g] = (st, e["ts"])
        out = []
        for g in needed:
            st, ts = res.get(g, ("PENDING" if t["status"] != "DONE" else "NOT_RECORDED", None))
            out.append({"gate": g, "label": self.gate_label(g), "status": st, "at": ts})
        return out

    @staticmethod
    def evidence_item(ev: str) -> dict:
        e = ev.strip().replace("\\", "/")
        low = e.lower()
        if re.fullmatch(r"[0-9a-f]{7,40}", e):
            kind, label = "commit", "Registro de versão (commit)"
        elif low.startswith(("http://", "https://")):
            kind, label = "link", "Link"
        elif re.search(r"(^|/)(tests?|spec|__tests__)/|(_test|\.test|\.spec)\.", low):
            kind, label = "test", "Teste automatizado"
        elif re.search(r"report|relat|evidence|evid", low):
            kind, label = "report", "Relatório / evidência"
        elif low.endswith((".md", ".rst", ".txt", ".pdf", ".docx")):
            kind, label = "doc", "Documento"
        else:
            kind, label = "code", "Entrega (código ou arquivo)"
        return {"kind": kind, "label": label, "ref": e}

    def task_view(self, t: dict) -> dict:
        vs = self.view_status(t)
        started = next((h for h in t["history"] if h["type"] == "TASK_STARTED"), None)
        completed = next((h for h in reversed(t["history"]) if h["type"] == "TASK_COMPLETED"), None)
        gates = self.task_gates(t)
        evidence = [self.evidence_item(e) for e in t.get("evidence") or []]
        wc = self.waiting_code(t)
        if vs == "PLANNED":
            wc = "dependencia"
        result = None
        if completed:
            ok = sum(1 for g in gates if g["status"] == "PASS")
            result = (f"Concluída com {len(evidence)} evidência(s)"
                      + (f"; verificações aprovadas: {ok} de {len(gates)}." if gates else "; sem verificações exigidas."))
        hw = (self._hours_data().get("per_task") or {}).get(t["id"])
        return {
            "id": t["id"], "title": t["title"], "goal": t.get("goal"), "kind": t.get("kind"), "priority": t["priority"],
            "priority_label": PRIORITY_LABELS.get(t["priority"], t["priority"]), "phase_id": self._phase_of.get(t["id"], "phase.other"),
            "status": t["status"], "view_status": vs,
            "view_label": WAITING_LABELS.get(wc, TASK_VIEW_LABELS[vs]) if vs in ("WAITING", "PLANNED") else TASK_VIEW_LABELS[vs],
            "tab": TASK_TABS[vs], "waiting_code": wc, "executor_plan": t.get("executor", "any"),
            "executor_label": self.actor_label((completed or started or {}).get("actor")) if (completed or started)
            else EXECUTOR_PLAN.get(t.get("executor", "any"), "Equipe"),
            "assignee": t.get("assignee"), "completed_by": (completed or {}).get("actor"),
            "started_at": (started or {}).get("ts"), "completed_at": (completed or {}).get("ts"),
            "gates": gates, "evidence": evidence, "result": result, "note": (completed or {}).get("note"),
            "depends_on": [{"id": d, "title": self.by_id[d]["title"] if d in self.by_id else d,
                            "status": self.by_id.get(d, {}).get("status", "TODO")} for d in t.get("depends_on") or []],
            "blocked_by": t.get("blocked_by") or [], "sensitive": self.is_sensitive(t), "history": t["history"], "worked": hw,
        }

    # ------------------------------------------------------------ fases e marcos
    def phase_defs(self) -> list[dict]:
        defs = [dict(p) for p in self.phases_cfg.get("phases") or []]
        listed = {tid for p in defs for tid in p.get("tasks") or []}
        other = [t["id"] for t in self.tasks if t["id"] not in listed]
        if other:
            defs.append({"id": "phase.other", "title": "Outras tarefas", "description": "Tarefas ainda não agrupadas em fase.",
                         "objective": NOT_RECORDED, "tasks": other, "derived": True})
        return defs

    def phases(self) -> list[dict]:
        hp = self._hours_data().get("per_phase") or {}
        out = []
        for i, p in enumerate(self.phase_defs(), 1):
            ts = [self.by_id[tid] for tid in p.get("tasks") or [] if tid in self.by_id]
            views = [self.view_status(t) for t in ts]
            done = sum(1 for v in views if v == "DONE")
            if ts and done == len(ts):
                status = "COMPLETED"
            elif "IN_PROGRESS" in views or done:
                status = "IN_PROGRESS"
            elif ts and all(v in ("WAITING", "BLOCKED") for v in views):
                status = "WAITING"
            else:
                status = "NOT_STARTED"
            starts = [h["ts"] for t in ts for h in t["history"] if h["type"] == "TASK_STARTED"]
            ends = [h["ts"] for t in ts for h in t["history"] if h["type"] == "TASK_COMPLETED"]
            out.append({"phase_id": p["id"], "order": i, "title": p["title"], "description": p.get("description"),
                        "objective": p.get("objective"), "tasks": [t["id"] for t in ts], "status": status,
                        "status_label": PHASE_STATUS_LABELS[status], "started_at": min(starts) if starts else None,
                        "completed_at": max(ends) if status == "COMPLETED" and ends else None, "tasks_total": len(ts),
                        "tasks_done": done, "progress": int(100 * done / len(ts)) if ts else 0, "derived": bool(p.get("derived")),
                        "worked": hp.get(p["id"]) or {"seconds": 0, "label": fmt_hours(0)}})
        return out

    def current_phase(self, phases: list[dict]) -> dict | None:
        by = {p["phase_id"]: p for p in phases}
        running = [t for t in self.tasks if t["status"] == "IN_PROGRESS"]
        if running:
            return by.get(self._phase_of.get(running[0]["id"], "phase.other"))
        nx = (self.next.get("next") or {}).get("id")
        if nx:
            return by.get(self._phase_of.get(nx, "phase.other"))
        return next((p for p in phases if p["status"] != "COMPLETED"), None)

    def milestones(self) -> list[dict]:
        out = []
        for m in self.phases_cfg.get("milestones") or []:
            ts = [self.by_id[t] for t in m.get("tasks") or [] if t in self.by_id]
            delivered = bool(ts) and all(t["status"] == "DONE" for t in ts)
            ends = [h["ts"] for t in ts for h in t["history"] if h["type"] == "TASK_COMPLETED"]
            ev = [self.evidence_item(e) for t in ts for e in t.get("evidence") or []]
            out.append({"milestone_id": m["id"], "title": m["title"], "description": m.get("description"), "phase_id": m.get("phase"),
                        "tasks": [t["id"] for t in ts], "delivered": delivered,
                        "delivered_at": max(ends) if delivered and ends else None, "evidence": ev})
        return out

    # ------------------------------------------------------------ qualidade
    def _gates_file(self) -> dict:
        p = self.ws.gates_path
        try:
            return json.loads(p.read_text(encoding="utf-8")) if p.is_file() else {}
        except (OSError, ValueError):
            return {}

    def latest_gates(self) -> dict[str, dict]:
        res: dict[str, dict] = {}
        for e in self.events:
            if e["type"] == "GATES_RECORDED":
                for g, st in ((e.get("data") or {}).get("gates") or {}).items():
                    res[g] = {"status": st, "at": e["ts"]}
        return res

    def metric(self, name: str):
        for r in (self._gates_file().get("results") or {}).values():
            if (r.get("metric") or {}).get(name) is not None:
                return r["metric"][name]
        return None

    def quality(self) -> list[dict]:
        latest = self.latest_gates()
        groups = self.cfg.get("quality_groups") or [{"id": g, "label": (spec or {}).get("label") or g, "gates": [g]}
                                                    for g, spec in (self.cfg.get("gates") or {}).items()]
        out = []
        for grp in groups:
            items = [{"gate": g, "label": self.gate_label(g), **latest.get(g, {"status": "NOT_RECORDED", "at": None})} for g in grp["gates"]]
            sts = [i["status"] for i in items]
            if "FAIL" in sts:
                status = "BLOCKED"
            elif all(s == "NOT_RECORDED" for s in sts):
                status = "NOT_RECORDED"
            elif "NOT_RECORDED" in sts:
                status = "WARNING"
            else:
                status = "PASS"
            ats = [i["at"] for i in items if i.get("at")]
            out.append({"id": grp["id"], "label": grp["label"], "status": status, "status_label": QUALITY_LABELS[status],
                        "at": max(ats) if ats else None, "items": items, "note": grp.get("note")})
        return out

    # ------------------------------------------------------------ derivação de itens ligados a tarefas
    def derive(self, kind: str, task_ids: list[str]) -> tuple[str, str, list[dict]]:
        ts = [self.by_id[i] for i in task_ids or [] if i in self.by_id]
        rows = [{"id": t["id"], "title": t["title"], "status": t["status"], "status_label": {
            "DONE": "Concluída", "IN_PROGRESS": "Em execução", "BLOCKED": "Aguardando", "TODO": "A fazer"}.get(t["status"], t["status"])}
            for t in ts]
        if not ts:
            code = "NONE"
        elif all(t["status"] == "DONE" for t in ts):
            code = "DONE"
        elif any(t["status"] == "IN_PROGRESS" for t in ts):
            code = "IN_PROGRESS"
        elif any(t["status"] == "BLOCKED" or (t["status"] == "TODO" and t.get("executor") == "human") for t in ts):
            code = "WAIT"
        else:
            code = "OPEN"
        return code, KIND_LABELS[kind][code], rows

    def findings(self) -> list[dict]:
        out = []
        for f in self.cfg.get("findings") or []:
            code, label, rows = self.derive("finding", f.get("tasks") or [])
            out.append({"finding_id": f["id"], "title": f["title"], "category": f.get("category"), "description": f.get("description"),
                        "impact": f.get("impact") or NOT_RECORDED, "action": f.get("action") or NOT_RECORDED,
                        "sensitive": bool(f.get("sensitive")), "situation": label, "status": code, "tasks": [r["id"] for r in rows]})
        return out

    # ------------------------------------------------------------ processos e capacidades (domains)
    def _all_done(self, ids: list[str]) -> bool:
        ts = [self.by_id[i] for i in ids if i in self.by_id]
        return bool(ts) and all(t["status"] == "DONE" for t in ts)

    def domain_cfgs(self) -> list[dict]:
        """`domains:` do portal.yaml; aceita o formato antigo `areas:` (what/tasks) como compatibilidade."""
        out = list(self.cfg.get("domains") or [])
        for a in self.cfg.get("areas") or []:
            out.append({"id": a["id"], "label": a["label"], "what_it_does": a.get("what"), "input": a.get("input"),
                        "output": a.get("output"), "priority": a.get("priority"), "migrated_by": a.get("tasks") or [],
                        "next_milestone": a.get("next_milestone")})
        return out

    def domains(self) -> list[dict]:
        """Régua de 5 níveis (Identificada → Homologada) DERIVADA das tarefas: construção, teste e homologação."""
        out = []
        for d in self.domain_cfgs():
            built = d.get("migrated_by") or []
            started = [i for i in built if self.by_id.get(i, {}).get("status") in ("IN_PROGRESS", "DONE")]
            automation = d.get("automation")
            if automation not in AUTOMATION_VALUES:
                automation = "SIM" if built and self._all_done(built) else "PARCIAL" if started else "NÃO"
            level = 0
            if started or automation == "PARCIAL":
                level = 1
            if automation == "SIM":
                level = 2
            if d.get("tested_by") and self._all_done(d["tested_by"]):
                level = max(level, 3)
            if d.get("homologated_by") and self._all_done(d["homologated_by"]):
                level = 4
            found = [{"label": f.get("label"), "skills": f.get("skills")} for f in d.get("skills") or []]
            related = sorted({*built, *(d.get("tested_by") or []), *(d.get("homologated_by") or [])})
            out.append({"domain_id": d["id"], "label": d["label"], "what_it_does": d.get("what_it_does"),
                        "input": d.get("input") or NOT_RECORDED, "output": d.get("output") or NOT_RECORDED,
                        "priority": d.get("priority"), "priority_label": PRIORITY_LABELS.get(d.get("priority") or "", "—"),
                        "automation": automation, "status": LADDER[level], "level": level,
                        "next_milestone": d.get("next_milestone") or NOT_RECORDED, "skills_found": found,
                        "skills_found_count": sum(len(f["skills"] or []) for f in found) or None,
                        "platform_components": [{"name": c.get("name"), "status": c.get("status") or "Identificada"}
                                                for c in d.get("components") or []], "related_tasks": related})
        return out

    def processes(self, domains: list[dict]) -> list[dict]:
        """Tabela executiva: `processes:` do portal.yaml ou, na falta dela, uma linha por domínio."""
        by_id = {d["domain_id"]: d for d in domains}
        rows = self.cfg.get("processes") or []
        out = []
        for r in rows:
            d = by_id.get(r.get("domain"))
            auto = r.get("automation") if r.get("automation") in AUTOMATION_VALUES else (d or {}).get("automation", "NÃO")
            level = (d or {}).get("level", {"SIM": 2, "PARCIAL": 1}.get(auto, 0))
            pr = r.get("priority") or (d or {}).get("priority")
            out.append({"process": r["process"], "domain_id": (d or {}).get("domain_id"),
                        "objective": r.get("objective") or (d or {}).get("what_it_does") or NOT_RECORDED,
                        "status": LADDER[level], "level": level, "automation": auto, "priority": pr,
                        "priority_label": PRIORITY_LABELS.get(pr or "", "—"),
                        "next_milestone": r.get("next_milestone") or (d or {}).get("next_milestone") or NOT_RECORDED})
        if not rows:
            for d in domains:
                out.append({"process": d["label"], "domain_id": d["domain_id"], "objective": d["what_it_does"] or NOT_RECORDED,
                            "status": d["status"], "level": d["level"], "automation": d["automation"], "priority": d["priority"],
                            "priority_label": d["priority_label"], "next_milestone": d["next_milestone"]})
        return out

    def comparative(self, metrics: dict) -> list[dict]:
        return [{"category": c.get("category"), "current": fill(c.get("current") or "", metrics), "new": fill(c.get("new") or "", metrics),
                 "source": c.get("source")} for c in self.cfg.get("comparative") or []]

    # ------------------------------------------------------------ comparativo antes × agora
    def comparison(self) -> dict:
        cfg = self.comparison_cfg
        def item(kind: str, x: dict) -> dict:
            code, label, rows = self.derive(kind, x.get("tasks") or [])
            return {"id": x["id"], "title": x.get("title") or x.get("name"), "status": code, "status_label": label, "tone": CMP_TONE[code],
                    "tasks": rows, "sensitive": bool(x.get("sensitive")), "what": x.get("what"), "why": x.get("why"),
                    "impact": x.get("impact"), "decision": x.get("decision"), "where": x.get("where"), "source": x.get("source")}
        errors = [item("error", x) for x in cfg.get("errors") or []]
        changes = [item("change", x) for x in cfg.get("changes") or []]
        decisions = [item("decision", x) for x in cfg.get("decisions") or []]
        flows = []
        for f in cfg.get("flows") or []:
            code, _, rows = self.derive("change", f.get("tasks") or [])
            flows.append({"id": f["id"], "name": f["name"], "before": f.get("before") or [], "now": f.get("now") or [],
                          "source": f.get("source"), "tasks": rows, "status": code})
        return {"flows": flows, "changes": changes, "decisions": decisions, "errors": errors,
                "counts": {"errors": len(errors), "errors_fixed": sum(e["status"] == "DONE" for e in errors),
                           "errors_no_task": sum(e["status"] == "NONE" for e in errors),
                           "errors_open": sum(e["status"] != "DONE" for e in errors),
                           "decisions_pending": sum(d["status"] == "WAIT" for d in decisions)}}

    def comparison_for_client(self, d: dict) -> dict:
        t = self.san.text
        def item(x: dict) -> dict:
            sens = x["sensitive"]
            label = x["status_label"]
            if sens:
                label = {"DONE": "Tratado", "NONE": "Aguardando registro de tratamento"}.get(x["status"], "Em tratamento")
            out = {"id": x["id"], "title": SECURITY_TITLE if sens else t(x["title"]), "status": x["status"], "status_label": label,
                   "tone": x["tone"], "tasks": [{"id": r["id"], "title": SECURITY_TITLE if sens else t(r["title"]),
                                                 "status_label": r["status_label"]} for r in x["tasks"]]}
            if sens:
                out.update({k: SECURITY_TEXT for k in ("what", "why", "impact", "decision")})
            else:
                out.update({k: t(x[k]) for k in ("what", "why", "impact", "decision") if x.get(k)})
            return out
        return {"flows": [{"id": f["id"], "name": t(f["name"]), "status": f["status"], "before": [t(s) for s in f["before"]],
                           "now": [t(s) for s in f["now"]],
                           "tasks": [{"id": r["id"], "status_label": r["status_label"]} for r in f["tasks"]]} for f in d["flows"]],
                "changes": [item(x) for x in d["changes"]], "decisions": [item(x) for x in d["decisions"]],
                "errors": [item(x) for x in d["errors"]], "counts": d["counts"]}

    # ------------------------------------------------------------ linha do tempo
    def timeline(self, phases: list[dict], milestones: list[dict], reports: list[dict]) -> list[dict]:
        out = []
        ph_title = {p["phase_id"]: p["title"] for p in phases}
        for e in self.events:
            t = self.by_id.get(e.get("task_id") or "")
            d = e.get("data") or {}
            base = {"ts": e["ts"], "seq": e["seq"], "actor": e["actor"]["id"], "executor": self.actor_label(e["actor"]["id"], e["type"]),
                    "task_id": t["id"] if t else None, "phase_id": self._phase_of.get(t["id"], "phase.other") if t else None, "type": e["type"]}
            if e["type"] == "TASK_STARTED" and t:
                out.append(base | {"action": "Tarefa iniciada", "result": "Em execução"})
            elif e["type"] == "TASK_COMPLETED" and t:
                out.append(base | {"action": "Tarefa concluída", "result": f"Concluída com {len(d.get('evidence') or [])} evidência(s)"})
            elif e["type"] == "TASK_BLOCKED" and t:
                out.append(base | {"action": "Tarefa aguardando", "result": "Aguardando", "reason": d.get("reason")})
            elif e["type"] == "TASK_UNBLOCKED" and t:
                out.append(base | {"action": "Tarefa liberada", "result": "Retomada"})
            elif e["type"] == "TASK_REOPENED" and t:
                out.append(base | {"action": "Tarefa reaberta", "result": "Reaberta para ajustes"})
            elif e["type"] == "GATES_RECORDED":
                gates = d.get("gates") or {}
                bad = [g for g, s in gates.items() if s != "PASS"]
                out.append(base | {"action": "Verificações de qualidade executadas",
                                   "result": "Aprovadas" if not bad else f"Com pendências ({len(bad)} de {len(gates)})"})
            elif e["type"] == "SESSION_STARTED":
                out.append(base | {"action": "Sessão de trabalho iniciada", "result": "Em andamento"})
            elif e["type"] == "HANDOFF_RECORDED":
                out.append(base | {"action": "Sessão de trabalho registrada", "result": "Passagem de bastão registrada"})
        for p in phases:
            if p["status"] == "COMPLETED" and p["completed_at"]:
                out.append({"ts": p["completed_at"], "seq": None, "actor": None, "executor": self.orch_label, "task_id": None,
                            "phase_id": p["phase_id"], "type": "PHASE_COMPLETED", "action": f"Fase concluída: {p['title']}",
                            "result": "Concluída", "derived": True})
        for m in milestones:
            if m["delivered"] and m["delivered_at"]:
                out.append({"ts": m["delivered_at"], "seq": None, "actor": None, "executor": self.orch_label, "task_id": None,
                            "phase_id": m["phase_id"], "type": "MILESTONE_DELIVERED", "action": f"Marco entregue: {m['title']}",
                            "result": "Entregue", "derived": True})
        for r in reports:
            out.append({"ts": r["generated_at"], "seq": None, "actor": r.get("actor"), "executor": self.orch_label, "task_id": None,
                        "phase_id": r.get("phase_id"), "type": "REPORT_REGISTERED", "action": f"Relatório publicado: {r['title']}",
                        "result": f"Versão {r['version']}"})
        for x in out:
            x["phase_title"] = ph_title.get(x.get("phase_id") or "", None)
        return sorted(out, key=lambda x: (x["ts"], x["seq"] or 10 ** 9), reverse=True)

    # ------------------------------------------------------------ horas e métricas
    def _hours_data(self) -> dict:
        if self._hours is None:
            self._hours = H.compute(self.ws, self.tasks, self.events, self._phase_of, self.cfg.get("hours") or {})
        return self._hours

    def reports(self) -> list[dict]:
        from . import reports as R
        return R.list_reports(self.ws)

    def metrics(self, phases: list[dict], domains: list[dict], processes: list[dict]) -> dict:
        counts = {s: 0 for s in TASK_VIEW_LABELS}
        for t in self.tasks:
            counts[self.view_status(t)] += 1
        h = self._hours_data()
        return {"tasks_total": len(self.tasks), "tasks_done": counts["DONE"], "tasks_in_progress": counts["IN_PROGRESS"],
                "tasks_next": counts["NEXT"] + counts["PLANNED"], "tasks_waiting": counts["WAITING"] + counts["BLOCKED"],
                "phases_total": len(phases), "phases_completed": sum(1 for p in phases if p["status"] == "COMPLETED"),
                "processes_count": len(processes), "processes_automated": sum(1 for r in processes if r["automation"] == "SIM"),
                "processes_partial": sum(1 for r in processes if r["automation"] == "PARCIAL"),
                "processes_in_migration": sum(1 for d in domains if d["status"] == "Em migração"),
                "plugins_count": None, "plugin_skills_count": None, "tests_count": self.metric("tests"),
                "hours_worked": h["total_label"], "hours_worked_seconds": h["total_seconds"],
                "progress": int(100 * counts["DONE"] / len(self.tasks)) if self.tasks else 0}

    # ------------------------------------------------------------ visões
    def admin_view(self) -> dict:
        phases = self.phases()
        milestones = self.milestones()
        reports = self.reports()
        domains = self.domains()
        processes = self.processes(domains)
        metrics = self.metrics(phases, domains, processes)
        cur = self.current_phase(phases)
        nx = self.next.get("next")
        last = self.events[-1]["ts"] if self.events else None
        ev = self.cfg.get("evolution") or {}
        evolution = {k: {"source": (ev.get(k) or {}).get("source"), "items": [fill(i, metrics) for i in (ev.get(k) or {}).get("items") or []]}
                     for k in ("existed", "identified", "preserved", "rebuilt", "improved")}
        waiting_n = sum(1 for t in self.tasks if self.view_status(t) in ("WAITING", "BLOCKED"))
        missing = [f"{p['title']} ({p['status_label'].lower()}, {p['tasks_done']} de {p['tasks_total']} tarefas)"
                   for p in phases if p["status"] != "COMPLETED" and not p["derived"]]
        if waiting_n:
            missing.append(f"{waiting_n} item(ns) aguardando o cliente ou a equipe")
        evolution["missing"] = {"source": "backlog + eventos", "items": missing}
        return {
            "view": "admin", "computed_at": now(), "last_update": last, "project": self.cfg.get("project") or {},
            "summary": {**(self.cfg.get("summary") or {}), "current_phase": cur["title"] if cur else None,
                        "next_milestones": [p["title"] for p in phases if p["status"] != "COMPLETED" and not p["derived"]][:3]},
            "status": "COMPLETED" if phases and all(p["status"] == "COMPLETED" for p in phases) else "IN_PROGRESS",
            "current_phase": cur, "metrics": metrics, "phases": phases, "milestones": milestones,
            "tasks": [self.task_view(t) for t in self.tasks],
            "next": {"task": self.task_view(self.by_id[nx["id"]]) if nx else None,
                     "in_progress": [self.task_view(self.by_id[t["id"]]) for t in self.next.get("in_progress") or []],
                     "queue": self.next.get("queue") or []},
            "waiting": [self.task_view(self.by_id[w]) for w in self.waiting if w in self.by_id],
            "quality": self.quality(), "domains": domains, "processes": processes, "comparative": self.comparative(metrics),
            "findings": self.findings(), "evolution": evolution, "labels": dict(self.cfg.get("labels") or {}),
            "comparison": self.comparison(), "timeline": self.timeline(phases, milestones, reports), "reports": reports,
            "hours": {k: v for k, v in self._hours_data().items() if k != "per_task"},
        }

    def client_task(self, tv: dict, titles: dict) -> dict:
        t = self.by_id[tv["id"]]
        ev: dict[str, int] = {}
        for e in tv["evidence"]:
            ev[e["label"]] = ev.get(e["label"], 0) + 1
        w = tv.get("worked")
        return {"id": tv["id"], "title": self.client_task_title(t), "goal": self.client_task_goal(t), "priority": tv["priority"],
                "priority_label": tv["priority_label"], "phase_id": tv["phase_id"], "phase_title": titles.get(tv["phase_id"]),
                "status": tv["view_status"], "status_label": tv["view_label"], "tab": tv["tab"], "waiting_code": tv["waiting_code"],
                "executor": tv["executor_label"], "worked": {"label": w["label"], "seconds": w["seconds"], "running": w["running"]} if w else None,
                "started_at": tv["started_at"], "completed_at": tv["completed_at"], "result": tv["result"],
                "gates": [{"label": g["label"], "status": g["status"], "at": g["at"]} for g in tv["gates"]],
                "evidence": [{"label": k, "count": v} for k, v in ev.items()],
                "depends_on": [{"id": d["id"], "title": self.client_task_title(self.by_id[d["id"]]) if d["id"] in self.by_id else d["id"],
                                "status": d["status"]} for d in tv["depends_on"]]}

    def client_view(self, a: dict | None = None) -> dict:
        a = a or self.admin_view()
        titles = {p["phase_id"]: p["title"] for p in a["phases"]}
        tasks = [self.client_task(tv, titles) for tv in a["tasks"]]
        by_task = {t["id"]: t for t in tasks}

        def ph(x):
            return {k: x[k] for k in ("phase_id", "order", "title", "description", "objective", "tasks", "status", "status_label",
                                      "started_at", "completed_at", "tasks_total", "tasks_done", "progress", "worked")} if x else None

        def tl(x):
            tid = x.get("task_id")
            return {"ts": x["ts"], "action": x["action"], "executor": x["executor"], "result": x["result"],
                    "phase_title": x.get("phase_title"), "task_id": tid, "task_title": by_task[tid]["title"] if tid else None}

        nxt = a["next"]["task"]
        findings = []
        for f in a["findings"]:
            if f["sensitive"]:
                findings.append({"finding_id": f["finding_id"], "title": SECURITY_TITLE, "category": "Segurança",
                                 "description": "Detalhes restritos à equipe técnica.", "impact": "Detalhes restritos à equipe técnica.",
                                 "action": "Em tratamento pela equipe técnica.", "situation": f["situation"], "status": f["status"], "tasks": f["tasks"]})
            else:
                findings.append({k: f[k] for k in ("finding_id", "title", "category", "description", "impact", "action", "situation", "status", "tasks")})
        from . import reports as R
        view = {
            "view": "client", "computed_at": a["computed_at"], "last_update": a["last_update"],
            "project": {"title": a["project"].get("title"), "office": a["project"].get("office")},
            "status": a["status"], "status_label": "Concluído" if a["status"] == "COMPLETED" else "Em andamento",
            "current_phase": ph(a["current_phase"]), "metrics": dict(a["metrics"]),
            "summary": {k: a["summary"].get(k) for k in ("objective", "modernizing", "current_phase", "next_milestones")},
            "phases": [ph(x) for x in a["phases"]],
            "milestones": [{k: m[k] for k in ("milestone_id", "title", "description", "phase_id", "tasks", "delivered", "delivered_at")}
                           | {"evidence": sorted({e["label"] for e in m["evidence"]})} for m in a["milestones"]],
            "tasks": tasks,
            "next": {"task": by_task[nxt["id"]] if nxt else None,
                     "why": ([f"Prioridade {nxt['priority_label'].lower()}"] + (["Tarefas anteriores concluídas"] if nxt["depends_on"] else ["Sem dependências pendentes"])) if nxt else [],
                     "in_progress": [by_task[t["id"]] for t in a["next"]["in_progress"]]},
            "waiting": [by_task[t["id"]] for t in a["waiting"]],
            "quality": [{k: q[k] for k in ("id", "label", "status", "status_label", "at", "note")} for q in a["quality"]],
            "domains": [{k: d[k] for k in ("domain_id", "label", "what_it_does", "input", "output", "priority", "priority_label",
                                           "automation", "status", "level", "next_milestone", "skills_found_count", "skills_found",
                                           "platform_components")} for d in a["domains"]],
            "processes": [{k: x[k] for k in ("process", "domain_id", "objective", "status", "level", "automation", "priority",
                                             "priority_label", "next_milestone")} for x in a["processes"]],
            "comparative": [{k: c[k] for k in ("category", "current", "new")} for c in a["comparative"]],
            "labels": a["labels"],
            "findings": findings,
            "evolution": {k: {"items": v["items"]} for k, v in a["evolution"].items()},
            "comparison": self.comparison_for_client(a["comparison"]),
            "timeline": [tl(x) for x in a["timeline"]], "reports": R.report_cards(a["reports"], include_admin=False),
            "hours": {k: a["hours"][k] for k in ("total_seconds", "total_label", "running", "as_of", "method", "registered_seconds",
                                                  "registered_label", "reconstructed_seconds", "reconstructed_label", "tasks_seconds",
                                                  "tasks_label", "sessions", "gap_minutes")}
            | {"per_phase": {k: v["label"] for k, v in a["hours"]["per_phase"].items()}},
        }
        view = self.san.sanitize_tree(view)
        hits: list = []
        view = self.san.scan(view, "", hits)
        view["sanitization"] = {"omitted_fields": len(hits)}
        return view


# ------------------------------------------------------------------ cache (stale-while-revalidate)
_cache: dict[str, tuple[str, dict, dict]] = {}
_lock = threading.Lock()
_refreshing: set[str] = set()


def fingerprint(ws: S.Workspace) -> str:
    files = [ws.backlog_path, ws.events_path, ws.phases_path, ws.portal_path, ws.comparison_path, ws.gates_path, ws.reports_dir / "registry.jsonl"]
    parts = []
    for f in files:
        try:
            st = os.stat(f)
            parts.append(f"{f.name}|{st.st_size}|{st.st_mtime_ns}")
        except OSError:
            parts.append(f"{f.name}|-")
    parts.append(f"minute:{int(datetime.now(timezone.utc).timestamp() // 60)}")  # horas de tarefas abertas seguem contando
    return hashlib.sha256("\n".join(parts).encode()).hexdigest()


def _compute(ws: S.Workspace) -> tuple[dict, dict]:
    p = Projection(ws)
    admin = p.admin_view()
    return admin, p.client_view(admin)


def _refresh(ws, key, fp):
    try:
        admin, client = _compute(ws)
        with _lock:
            _cache[key] = (fp, admin, client)
    finally:
        with _lock:
            _refreshing.discard(key)


def views(ws: S.Workspace, wait: bool = False) -> tuple[dict, dict]:
    """(admin, client). Recalcula só quando as fontes mudam; stale-while-revalidate (o visitante nunca espera a varredura
    de horas, exceto na 1ª carga). ``wait=True`` força o cálculo síncrono (CLI, relatórios, export)."""
    fp = fingerprint(ws)
    key = str(ws.root)
    with _lock:
        hit = _cache.get(key)
        if hit and hit[0] == fp:
            return hit[1], hit[2]
        if hit and not wait:
            if key not in _refreshing:
                _refreshing.add(key)
                threading.Thread(target=_refresh, args=(ws, key, fp), daemon=True, name="status-refresh").start()
            return hit[1], hit[2]
    admin, client = _compute(ws)
    with _lock:
        _cache[key] = (fp, admin, client)
    return admin, client


def minutes_since(ts: str | None) -> int | None:
    d = parse_ts(ts)
    return int((datetime.now(timezone.utc) - d).total_seconds() // 60) if d else None


# ------------------------------------------------------------------ rotas da API (somente leitura)
def _page(items: list, query: dict, default: int = 50) -> dict:
    def num(k, d):
        try:
            return max(0, min(500, int((query.get(k) or [d])[0])))
        except (TypeError, ValueError):
            return d
    limit, offset = num("limit", default), num("offset", 0)
    return {"total": len(items), "offset": offset, "limit": limit, "items": items[offset:offset + limit]}


def route(ws: S.Workspace, parts: list[str], query: dict, role: str) -> tuple[int, object]:
    from . import reports as R
    admin, client = views(ws)
    v = admin if (role == "ADMIN" and (query.get("view") or [""])[0] == "admin") else client
    head, rest = (parts[0] if parts else "overview"), parts[1:]
    q1 = lambda k: (query.get(k) or [""])[0]
    cards = R.report_cards(admin["reports"], include_admin=True) if role == "ADMIN" else client["reports"]
    if head == "overview" and not rest:
        keys = ("view", "computed_at", "last_update", "project", "status", "current_phase", "metrics", "summary", "next", "waiting",
                "quality", "milestones", "phases")
        return 200, ({k: v[k] for k in keys}
            | {"status_label": v.get("status_label") or ("Concluído" if v["status"] == "COMPLETED" else "Em andamento"),
               "minutes_since_update": minutes_since(v["last_update"]), "timeline": v["timeline"][:8], "hours": v["hours"],
               "reports": cards, "role": role, "labels": v["labels"]})
    if head == "phases":
        if not rest:
            return 200, v["phases"]
        ph = next((x for x in v["phases"] if x["phase_id"] == rest[0]), None)
        if ph is None:
            return 404, {"error": "fase não encontrada"}
        return 200, ph | {"task_items": [t for t in v["tasks"] if t["phase_id"] == ph["phase_id"]],
                          "reports": [r for r in cards if r.get("phase_id") == ph["phase_id"]]}
    if head == "tasks":
        if rest:
            t = next((x for x in v["tasks"] if x["id"] == rest[0]), None)
            return (200, t) if t else (404, {"error": "tarefa não encontrada"})
        items = v["tasks"]
        tab = q1("tab")
        if tab and tab != "todas":
            items = [t for t in items if t.get("tab") == tab]
        for k in ("phase_id", "priority"):
            if q1(k):
                items = [t for t in items if t.get(k) == q1(k)]
        return 200, items
    if head == "timeline" and not rest:
        return 200, _page(v["timeline"], query) | {"hours": v["hours"]}
    if head == "capabilities" and not rest:
        m = v["metrics"]
        return 200, {"domains": v["domains"], "plugins_count": m.get("plugins_count"), "plugin_skills_count": m.get("plugin_skills_count")}
    if head == "processes" and not rest:
        return 200, v["processes"]
    if head == "findings" and not rest:
        return 200, v["findings"]
    if head == "comparison" and not rest:
        return 200, v["comparison"]
    if head == "comparative" and not rest:
        return 200, {"comparative": v["comparative"], "evolution": v["evolution"]}
    if head == "quality" and not rest:
        return 200, {"quality": v["quality"], "metrics": v["metrics"]}
    if head == "reports":
        if not rest:
            return 200, cards
        r = next((x for x in cards if x["report_id"] == rest[0]), None)
        if r is None or len(rest) > 1:
            return 404, {"error": "relatório não encontrado"}
        body = R.load_report_json(ws, r["report_id"])
        if not body:
            return 404, {"error": "relatório não encontrado"}
        if role != "ADMIN":
            body = {k: val for k, val in body.items() if k != "source_hash"}
        return 200, {"report": r, "content": body}
    return 404, {"error": "rota desconhecida"}
