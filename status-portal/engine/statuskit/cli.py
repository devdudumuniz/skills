"""Linha de comando do kit: o caminho de ESCRITA do painel (o painel em si é somente leitura).

    python status/status.py <comando>        (ou: python -m statuskit, com PYTHONPATH=status/engine)
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

from . import projection as P
from . import reports as R
from . import server as SV
from . import store as S
from .common import StatusError, VERSION, load_yaml, now, parse_ts


def out(obj) -> None:
    print(json.dumps(obj, ensure_ascii=False, indent=2, default=str))


def build_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(prog="status", description="Painel de acompanhamento de status (statuskit " + VERSION + ")")
    ap.add_argument("--root", help="raiz do projeto (padrão: procura status/portal.yaml a partir daqui)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("doctor", help="valida backlog, configuração, cadeia de eventos e dependências")
    sub.add_parser("state", help="resumo do estado do projeto")
    p = sub.add_parser("next", help="próxima tarefa acionável com passos e critérios")
    p.add_argument("--human", action="store_true", help="inclui tarefas de executor humano")
    p = sub.add_parser("work", help="ciclo de vida das tarefas")
    w = p.add_subparsers(dest="work_cmd", required=True)
    x = w.add_parser("list")
    x.add_argument("--status", choices=S.STATUSES)
    for name in ("show", "start", "done", "block", "unblock", "reopen"):
        x = w.add_parser(name)
        x.add_argument("id")
        if name != "show":
            x.add_argument("--actor", help="agent:<id> | human:<id> (padrão: STATUS_ACTOR ou human:<usuário>)")
        if name == "done":
            x.add_argument("--evidence", nargs="+", required=True, action="extend",
                           help="uma ou mais evidências (arquivo, commit, link); pode repetir a opção — todas são guardadas")
            x.add_argument("--note", default="")
            x.add_argument("--skip-gates-reason", help="só humano: conclui sem verificações PASS, com motivo registrado")
        if name in ("block", "reopen"):
            x.add_argument("--reason", required=True)
        if name == "unblock":
            x.add_argument("--note", default="")
    p = sub.add_parser("session", help="sessão de trabalho (início; o fim é o handoff) — base das horas")
    ss = p.add_subparsers(dest="session_cmd", required=True)
    ss.add_parser("start").add_argument("--actor")
    p = sub.add_parser("handoff", help="encerra a sessão e registra a passagem de bastão")
    p.add_argument("--actor")
    p.add_argument("--summary", required=True)
    p.add_argument("--next", default="")
    p = sub.add_parser("gates", help="roda as verificações definidas em portal.yaml e registra o resultado")
    p.add_argument("--only", nargs="+")
    p.add_argument("--actor")
    p = sub.add_parser("report", help="relatórios por fase (PDF) e consolidado")
    r = p.add_subparsers(dest="report_cmd", required=True)
    r.add_parser("list")
    g = r.add_parser("generate")
    g.add_argument("--scope", choices=["phases", "consolidated", "all"], default="phases")
    g.add_argument("--actor")
    r.add_parser("verify")
    p = sub.add_parser("sync", help="gera/reaproveita os relatórios das fases concluídas (rode depois de concluir tarefas)")
    p.add_argument("--actor")
    p = sub.add_parser("serve", help="sobe o painel (somente leitura)")
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", type=int, default=8780, help="0 = escolhe uma porta livre e a imprime (use em testes)")
    p.add_argument("--pid-file", default=None, help="grava o PID deste servidor; encerre SÓ por ele, nunca por porta")
    p.add_argument("--role", choices=["admin", "client-viewer"], default=None)
    p.add_argument("--trusted-proxy", default=None, help="IP(s) do proxy reverso; exigido fora de loopback")
    p = sub.add_parser("export", help="gera uma versão ESTÁTICA do painel (visão do cliente) para hospedar em qualquer lugar")
    p.add_argument("--out", required=True)
    p = sub.add_parser("import-history", help="registra tarefas já concluídas no passado (reconstruídas) a partir de um YAML")
    p.add_argument("file")
    p.add_argument("--actor")
    return ap


def doctor(ws: S.Workspace) -> int:
    problems, notes = [], []
    for need in (ws.portal_path, ws.backlog_path):
        if not need.is_file():
            problems.append({"path": ws.rel(need), "message": "arquivo ausente"})
    if not problems:
        problems += S.validate_backlog(ws)
        cfg = ws.config()
        tasks = {t["id"] for t in S.load_backlog(ws)}
        phases = load_yaml(ws.phases_path)
        seen: dict[str, str] = {}
        for ph in phases.get("phases") or []:
            for k in ph:
                if k not in ("id", "title", "description", "objective", "tasks", "status", "progress", "started_at", "completed_at"):
                    problems.append({"path": f"phases.yaml#{ph.get('id')}", "message": f"campo desconhecido: {k!r} (use aspas em textos com vírgula)"})
            for tid in ph.get("tasks") or []:
                if tid not in tasks:
                    problems.append({"path": f"phases.yaml#{ph.get('id')}", "message": f"tarefa inexistente: {tid}"})
                if tid in seen:
                    problems.append({"path": f"phases.yaml#{ph.get('id')}", "message": f"{tid} já está em {seen[tid]}"})
                seen.setdefault(tid, ph.get("id"))
            for k in ("status", "progress", "started_at", "completed_at"):
                if k in ph:
                    problems.append({"path": f"phases.yaml#{ph.get('id')}", "message": f"estado não pode ser declarado ({k})"})
        for m in phases.get("milestones") or []:
            for tid in m.get("tasks") or []:
                if tid not in tasks:
                    problems.append({"path": f"phases.yaml#{m.get('id')}", "message": f"tarefa inexistente: {tid}"})
        cmp = load_yaml(ws.comparison_path)
        allowed = {"flows": {"id", "name", "before", "now", "source", "tasks"},
                   "changes": {"id", "title", "decision", "why", "impact", "source", "tasks"},
                   "decisions": {"id", "title", "why", "impact", "source", "tasks"},
                   "errors": {"id", "title", "what", "where", "source", "tasks", "sensitive"}}
        for kind in ("flows", "changes", "decisions", "errors"):
            for x in cmp.get(kind) or []:
                for k in x:
                    if k not in allowed[kind] and k not in ("status", "status_label", "done", "resolved"):
                        problems.append({"path": f"comparison.yaml#{x.get('id')}", "message": f"campo desconhecido: {k!r} (vírgula dentro de texto em YAML de uma linha? use aspas)"})
                for k in ("before", "now"):
                    if kind == "flows" and any(not isinstance(i, str) for i in x.get(k) or []):
                        problems.append({"path": f"comparison.yaml#{x.get('id')}", "message": f"{k}: todo item deve ser texto (item com ': ' sem aspas vira mapa)"})
                for tid in x.get("tasks") or []:
                    if tid not in tasks:
                        problems.append({"path": f"comparison.yaml#{x.get('id')}", "message": f"tarefa inexistente: {tid}"})
                for k in ("status", "status_label", "done", "resolved"):
                    if k in x:
                        problems.append({"path": f"comparison.yaml#{x.get('id')}", "message": f"estado não pode ser declarado ({k}); é derivado das tarefas"})
        cfg_allowed = {"areas": {"id", "label", "what", "input", "output", "priority", "tasks", "next_milestone"},
                       "domains": {"id", "label", "what_it_does", "input", "output", "priority", "automation", "migrated_by", "tested_by",
                                   "homologated_by", "next_milestone", "skills", "components"},
                       "processes": {"process", "domain", "objective", "automation", "priority", "next_milestone"},
                       "comparative": {"category", "current", "new", "source"},
                       "findings": {"id", "title", "category", "description", "impact", "action", "tasks", "sensitive"}}
        domain_ids = {d.get("id") for d in cfg.get("domains") or []}
        for kind in ("areas", "domains", "processes", "comparative", "findings"):
            for x in cfg.get(kind) or []:
                ident = x.get("id") or x.get("process") or x.get("category")
                for k in x:
                    if k not in cfg_allowed[kind]:
                        problems.append({"path": f"portal.yaml#{ident}", "message": f"campo desconhecido em {kind}: {k!r} (vírgula dentro de texto em YAML de uma linha? use aspas)"})
                for tid in (x.get("tasks") or []) + (x.get("migrated_by") or []) + (x.get("tested_by") or []) + (x.get("homologated_by") or []):
                    if tid not in tasks:
                        problems.append({"path": f"portal.yaml#{ident}", "message": f"tarefa inexistente: {tid}"})
                if kind == "processes" and x.get("domain") and x["domain"] not in domain_ids:
                    problems.append({"path": f"portal.yaml#{ident}", "message": f"domínio inexistente: {x['domain']}"})
                for k in ("level", "status", "progress"):
                    if kind in ("domains", "processes") and k in x:
                        problems.append({"path": f"portal.yaml#{ident}", "message": f"estado não pode ser declarado ({k}); é derivado das tarefas"})
        if not cfg.get("gates"):
            notes.append("nenhuma verificação (gates) definida em portal.yaml: a seção Qualidade ficará 'Não registrado'")
        if not R.pdf_available():
            notes.append("reportlab ausente: relatórios saem só em JSON (python -m pip install reportlab para PDF)")
        orphan = [t["id"] for t in S.state(ws) if t["id"] not in {x for p in phases.get("phases") or [] for x in p.get("tasks") or []}]
        if orphan and phases.get("phases"):
            notes.append(f"{len(orphan)} tarefa(s) sem fase (aparecem em 'Outras tarefas'): {orphan[:5]}")
    rep = {"status": "PASS" if not problems else "FAIL", "problems": problems, "notes": notes, "kit": VERSION}
    out(rep)
    return 0 if not problems else 1


def import_history(ws: S.Workspace, file: str, actor: dict) -> dict:
    """Registra trabalho do PASSADO (reconstruído). Cada item precisa de data real e evidência; fica marcado `reconstructed`."""
    data = load_yaml(Path(file))
    items = data.get("done") or []
    by_id = {t["id"]: t for t in S.state(ws)}
    store = S.EventStore(ws.events_path)
    written = []
    for it in sorted(items, key=lambda x: str(x.get("completed_at"))):
        tid = it.get("id")
        if tid not in by_id:
            raise StatusError(f"import-history: tarefa inexistente no backlog: {tid}")
        if by_id[tid]["status"] != "TODO":
            raise StatusError(f"import-history: {tid} já tem histórico ({by_id[tid]['status']})")
        done_at, start_at = parse_ts(str(it.get("completed_at"))), parse_ts(str(it.get("started_at") or it.get("completed_at")))
        if not done_at or not start_at or done_at > parse_ts(now()) or start_at > done_at:
            raise StatusError(f"import-history: datas inválidas em {tid} (use ISO-8601 reais, início ≤ conclusão ≤ agora)")
        evidence = [e for e in it.get("evidence") or [] if e]
        if not evidence:
            raise StatusError(f"import-history: {tid} sem evidência (commit, arquivo, link)")
        who = S.parse_actor(it["actor"]) if it.get("actor") else actor
        for typ, ts, payload in (("TASK_STARTED", start_at, {"reconstructed": True}),
                                 ("TASK_COMPLETED", done_at, {"evidence": evidence, "reconstructed": True, "note": it.get("note", "")})):
            ev = store.append(typ, who, payload, task_id=tid)
            _force_ts(store, ev["seq"], ts)
        written.append(tid)
    started = []
    for it in sorted(data.get("in_progress") or [], key=lambda x: str(x.get("started_at"))):
        tid = it.get("id")
        if tid not in by_id:
            raise StatusError(f"import-history: tarefa inexistente no backlog: {tid}")
        if by_id[tid]["status"] != "TODO" or tid in written:
            raise StatusError(f"import-history: {tid} já tem histórico ({by_id[tid]['status']})")
        start_at = parse_ts(str(it.get("started_at")))
        if not start_at or start_at > parse_ts(now()):
            raise StatusError(f"import-history: data de início inválida em {tid} (ISO-8601 real, não futura)")
        who = S.parse_actor(it["actor"]) if it.get("actor") else actor
        ev = store.append("TASK_STARTED", who, {"reconstructed": True, "note": it.get("note", "")}, task_id=tid)
        _force_ts(store, ev["seq"], start_at)
        started.append(tid)
    return {"imported": written, "started": started, "note": "marcadas como reconstruídas; datas vêm da evidência informada"}


def _force_ts(store: S.EventStore, seq: int, ts) -> None:
    """Reescreve o carimbo do ÚLTIMO evento recém-gravado (só no import histórico) e refaz a cadeia a partir dele."""
    evs = store.read()
    assert evs and evs[-1]["seq"] == seq
    evs[-1]["ts"] = ts.isoformat(timespec="seconds")
    evs[-1]["hash"] = S._hash(evs[-1])
    lines = [S.canonical_json(e) for e in evs]
    from .common import atomic_write_text
    atomic_write_text(store.path, "\n".join(lines) + "\n")


def export_static(ws: S.Workspace, out_dir: Path) -> dict:
    """Painel estático: visão do CLIENTE em JSON + UI com `window.STATUS_STATIC`. Hospede em qualquer servidor de arquivos."""
    out_dir = out_dir.resolve()
    ui = SV.DEFAULT_UI
    out_dir.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ui, out_dir, dirs_exist_ok=True)
    idx = out_dir / "index.html"
    idx.write_text(idx.read_text(encoding="utf-8").replace("</head>", "    <script src=\"static-flag.js\"></script>\n  </head>", 1), encoding="utf-8")
    (out_dir / "static-flag.js").write_text("window.STATUS_STATIC = true;\n", encoding="utf-8")
    _, cv = P.views(ws, wait=True)
    base = out_dir / "api" / "project"
    files = out_dir / "files"
    base.mkdir(parents=True, exist_ok=True)

    def put(name: str, obj) -> None:
        p = base / (name + ".json")
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(obj, ensure_ascii=False), encoding="utf-8")

    cards = []
    for c in cv["reports"]:
        c = dict(c)
        got = R.pdf_bytes(ws, c["report_id"]) if c.get("has_pdf") else None
        if got:
            files.mkdir(exist_ok=True)
            (files / got[1]).write_bytes(got[0])
            c["pdf_url"] = f"files/{got[1]}"
        else:
            c["pdf_url"] = None
        cards.append(c)
    code, ov = P.route(ws, ["overview"], {}, "CLIENT_VIEWER")
    ov["reports"] = cards
    put("overview", ov)
    put("phases", cv["phases"])
    for ph in cv["phases"]:
        put(f"phases/{ph['phase_id']}", ph | {"task_items": [t for t in cv["tasks"] if t["phase_id"] == ph["phase_id"]],
                                              "reports": [r for r in cards if r.get("phase_id") == ph["phase_id"]]})
    put("tasks", cv["tasks"])
    put("timeline", {"total": len(cv["timeline"]), "items": cv["timeline"], "hours": cv["hours"]})
    put("processes", cv["processes"])
    put("capabilities", {"domains": cv["domains"], "plugins_count": cv["metrics"].get("plugins_count"),
                         "plugin_skills_count": cv["metrics"].get("plugin_skills_count")})
    put("comparative", {"comparative": cv["comparative"], "evolution": cv["evolution"]})
    put("findings", cv["findings"])
    put("comparison", cv["comparison"])
    put("quality", {"quality": cv["quality"], "metrics": cv["metrics"]})
    put("reports", cards)
    (out_dir / "api" / "session.json").write_text(json.dumps({"role": "CLIENT_VIEWER", "mode": "CLIENT_READ_ONLY", "static": True}), encoding="utf-8")
    (out_dir / "snapshot.txt").write_text(f"Snapshot gerado em {now()} (visão do cliente). Atualize rodando: status export --out <pasta>\n", encoding="utf-8")
    return {"out": str(out_dir), "files": sum(1 for _ in out_dir.rglob("*") if _.is_file()), "generated_at": now()}


def main(argv: list[str] | None = None) -> int:
    for _s in (sys.stdout, sys.stderr):                 # consoles cp1252 (Windows) quebram com "→" e "…"
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    a = build_parser().parse_args(argv)
    try:
        ws = S.Workspace(a.root) if a.root else S.Workspace.locate()
        if a.cmd == "doctor":
            return doctor(ws)
        if a.cmd == "state":
            out(S.project_status(ws))
            return 0
        if a.cmd == "next":
            res = S.next_task(ws, "human" if a.human else "agent")
            out(res)
            return 0 if (res["next"] or res["in_progress"]) else 3
        if a.cmd == "work":
            c = a.work_cmd
            if c == "list":
                out([{k: t.get(k) for k in ("id", "status", "priority", "executor", "title", "assignee")}
                     for t in S.state(ws) if not a.status or t["status"] == a.status])
            elif c == "show":
                t = S.get(ws, a.id)
                out(S.brief(t) | {"history": t["history"], "blocked_by": t.get("blocked_by") or []})
            else:
                actor = S.parse_actor(a.actor)
                if c == "start":
                    out(S.start(ws, a.id, actor))
                elif c == "done":
                    out(S.done(ws, a.id, actor, a.evidence, a.note, a.skip_gates_reason))
                elif c == "block":
                    out(S.block(ws, a.id, actor, a.reason))
                elif c == "unblock":
                    out(S.unblock(ws, a.id, actor, a.note))
                elif c == "reopen":
                    out(S.reopen(ws, a.id, actor, a.reason))
            return 0
        if a.cmd == "session":
            out(S.session_start(ws, S.parse_actor(a.actor)))
            return 0
        if a.cmd == "handoff":
            out(S.handoff(ws, S.parse_actor(a.actor), a.summary, a.next))
            return 0
        if a.cmd == "gates":
            rep = S.run_gates(ws, a.only or [], S.parse_actor(a.actor))
            out({"status": rep["status"], "finished_at": rep["finished_at"],
                 "results": {k: {"status": v["status"], "seconds": v["seconds"]} | ({"tail": v["output_tail"][-400:]} if v["status"] != "PASS" else {})
                             for k, v in rep["results"].items()}})
            return 0 if rep["status"] == "PASS" else 1
        if a.cmd == "report":
            if a.report_cmd == "list":
                out([{k: r[k] for k in ("report_id", "kind", "version", "versions", "generated_at", "has_pdf", "audience")} for r in R.list_reports(ws)])
            elif a.report_cmd == "verify":
                problems = R.verify(ws)
                out({"problems": problems})
                return 0 if not problems else 1
            else:
                out(R.generate(ws, a.scope, S.parse_actor(a.actor) if a.actor else None))
            return 0
        if a.cmd == "sync":
            res = R.generate(ws, "phases", S.parse_actor(a.actor) if a.actor else None)
            out({"reports": res, "registry_problems": R.verify(ws), "pdf": R.pdf_available()})
            return 0
        if a.cmd == "serve":
            httpd = SV.serve(ws, a.host, a.port, a.role, a.trusted_proxy)
            print(f"Painel [{httpd.role}]: http://{httpd.server_address[0]}:{httpd.server_address[1]}/  (Ctrl+C para sair)", flush=True)
            if a.pid_file:
                Path(a.pid_file).write_text(str(os.getpid()), encoding="utf-8")
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                pass
            finally:
                httpd.server_close()
                if a.pid_file:
                    Path(a.pid_file).unlink(missing_ok=True)
            return 0
        if a.cmd == "export":
            out(export_static(ws, Path(a.out)))
            return 0
        if a.cmd == "import-history":
            out(import_history(ws, a.file, S.parse_actor(a.actor)))
            return 0
    except StatusError as exc:
        print(f"ERRO: {exc}", file=sys.stderr)
        return 2
    return 2


if __name__ == "__main__":
    sys.exit(main())
