"""Testes do kit status-portal. Rodam em projetos TEMPORÁRIOS (instalados com o instalador real); nada fora da pasta temporária é tocado.

    python -m unittest discover -s tests -t .      (a partir da pasta da skill)
"""
import importlib.util
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KIT / "engine"))

from statuskit import hours as H  # noqa: E402
from statuskit import projection as P  # noqa: E402
from statuskit import reports as R  # noqa: E402
from statuskit import server as SV  # noqa: E402
from statuskit import store as S  # noqa: E402
from statuskit.common import StatusError  # noqa: E402
from statuskit.sanitize import OMITTED, Sanitizer  # noqa: E402

spec = importlib.util.spec_from_file_location("install_mod", KIT / "scripts" / "install.py")
INSTALL = importlib.util.module_from_spec(spec)
spec.loader.exec_module(INSTALL)

AGENT = {"type": "agent", "id": "agent:test-bot", "name": "test-bot"}
HUMAN = {"type": "human", "id": "human:tester", "name": "tester"}
PROBES = [r"[A-Za-z]:\\", r"127\.0\.0\.1", r":8\d{3}\b", r"https?://", r"\b[0-9a-f]{32,}\b", r"\d{3}\.\d{3}\.\d{3}-\d{2}", r"agent:test-bot",
          r"human:tester", r"\.env\b", r"/home/", r"secret", r"token"]


class Proj:
    """Projeto temporário com o kit instalado (demonstração)."""

    def __enter__(self):
        self.td = tempfile.TemporaryDirectory(prefix="status-kit-test-")
        self.root = Path(self.td.name) / "proj"
        self.root.mkdir()
        INSTALL.install(self.root, "Projeto Teste", "Empresa", "D", False, True, False)
        self.ws = S.Workspace(self.root)
        return self

    def __exit__(self, *exc):
        self.td.cleanup()


def complete(ws, tid, actor=AGENT, evidence=("docs/x.md",), gates=()):
    if S.get(ws, tid)["status"] == "TODO":
        S.start(ws, tid, actor)
    if gates:
        S.run_gates(ws, list(gates), actor)
    S.done(ws, tid, actor, list(evidence))


class StoreRules(unittest.TestCase):
    def test_demo_install_is_valid_and_state_derived(self):
        with Proj() as p:
            self.assertEqual(S.validate_backlog(p.ws), [])
            st = {t["id"]: t["status"] for t in S.state(p.ws)}
            self.assertEqual(st["D-001"], "DONE")
            self.assertEqual(st["D-003"], "IN_PROGRESS")
            self.assertEqual(st["D-004"], "TODO")

    def test_start_rules(self):
        with Proj() as p:
            with self.assertRaises(StatusError):
                S.start(p.ws, "D-004", AGENT)            # depende de D-003
            with self.assertRaises(StatusError):
                S.start(p.ws, "D-006", AGENT)            # executor humano
            with self.assertRaises(StatusError):
                S.start(p.ws, "D-001", AGENT)            # já DONE
            S.start(p.ws, "D-006", HUMAN)

    def test_done_requires_evidence_and_gates_after_start(self):
        with Proj() as p:
            with self.assertRaises(StatusError):
                S.done(p.ws, "D-003", AGENT, [])                        # sem evidência
            with self.assertRaises(StatusError):
                S.done(p.ws, "D-003", AGENT, ["src/x.py"])              # gates exigidos sem PASS depois do início
            S.run_gates(p.ws, ["tests"], AGENT)
            self.assertEqual(S.done(p.ws, "D-003", AGENT, ["src/x.py"])["status"], "DONE")

    def test_human_approval_task_only_human_completes(self):
        with Proj() as p:
            S.start(p.ws, "D-007", HUMAN)
            with self.assertRaises(StatusError):
                S.done(p.ws, "D-007", {"type": "agent", "id": "agent:x", "name": "x"}, ["ok"])
            self.assertEqual(S.done(p.ws, "D-007", HUMAN, ["aprovação por e-mail"])["status"], "DONE")

    def test_block_and_unblock_and_reopen_rules(self):
        with Proj() as p:
            S.block(p.ws, "D-003", AGENT, "aguardando cliente")
            self.assertEqual(S.get(p.ws, "D-003")["status"], "BLOCKED")
            S.unblock(p.ws, "D-003", AGENT, "ok")
            with self.assertRaises(StatusError):
                S.reopen(p.ws, "D-001", AGENT, "x")                     # só humano reabre
            S.reopen(p.ws, "D-001", HUMAN, "ajuste")
            self.assertEqual(S.get(p.ws, "D-001")["status"], "TODO")

    def test_event_chain_detects_tampering_and_forbidden_keys(self):
        with Proj() as p:
            self.assertEqual(S.EventStore(p.ws.events_path).verify(), [])
            with self.assertRaises(StatusError):
                S.EventStore(p.ws.events_path).append("TASK_STARTED", AGENT, {"reasoning": "x"}, task_id="D-004")
            lines = p.ws.events_path.read_text(encoding="utf-8").splitlines()
            ev = json.loads(lines[1])
            ev["data"] = {"tampered": True}
            lines[1] = json.dumps(ev)
            p.ws.events_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            self.assertTrue(S.EventStore(p.ws.events_path).verify())

    def test_backlog_rejects_state_unknown_keys_and_bad_refs(self):
        with Proj() as p:
            import yaml
            data = yaml.safe_load(p.ws.backlog_path.read_text(encoding="utf-8"))
            data["tasks"][0]["status"] = "DONE"
            data["tasks"][1]["dados e integrações"] = None        # sintoma de vírgula em YAML de uma linha
            data["tasks"][2]["depends_on"] = ["D-999"]
            p.ws.backlog_path.write_text(yaml.safe_dump(data, allow_unicode=True), encoding="utf-8")
            msgs = " | ".join(e["message"] for e in S.validate_backlog(p.ws))
            self.assertIn("estado não pode ser escrito", msgs)
            self.assertIn("campo desconhecido", msgs)
            self.assertIn("dependência inexistente", msgs)

    def test_gates_are_a_fixed_allowlist_from_config(self):
        with Proj() as p:
            with self.assertRaises(StatusError):
                S.run_gates(p.ws, ["rm -rf /"], AGENT)
            rep = S.run_gates(p.ws, ["tests", "security"], AGENT)
            self.assertEqual(rep["status"], "PASS")
            self.assertEqual(P.Projection(p.ws).metric("tests"), 42)

    def test_handoff_and_session_events(self):
        with Proj() as p:
            r = S.handoff(p.ws, AGENT, "feito X; pendente Y", "olhar Z")
            self.assertTrue((p.root / r["handoff"]).is_file())
            self.assertTrue((p.ws.data / "HANDOFF.md").is_file())
            with self.assertRaises(StatusError):
                S.handoff(p.ws, AGENT, "  ")


class ProjectionTests(unittest.TestCase):
    def test_phases_progress_next_and_waiting(self):
        with Proj() as p:
            proj = P.Projection(p.ws)
            ph = {x["phase_id"]: x for x in proj.phases()}
            self.assertEqual((ph["phase.discovery"]["status"], ph["phase.discovery"]["progress"]), ("COMPLETED", 100))
            self.assertTrue(ph["phase.discovery"]["completed_at"])
            self.assertEqual(ph["phase.migration"]["status"], "IN_PROGRESS")        # D-003 em execução
            self.assertEqual(ph["phase.golive"]["status"], "NOT_STARTED")            # D-006 liberada, ninguém começou
            complete(p.ws, "D-003", gates=("tests",))
            proj = P.Projection(p.ws)
            ph = {x["phase_id"]: x for x in proj.phases()}
            self.assertEqual(ph["phase.migration"]["progress"], 33)
            m = proj.admin_view()["metrics"]
            self.assertEqual((m["tasks_done"], m["tasks_total"], m["phases_completed"]), (3, 10, 1))
            admin = proj.admin_view()
            self.assertEqual(admin["next"]["task"]["id"], S.next_task(p.ws, "agent")["next"]["id"])   # mesma lógica do `next`
            waiting = {t["id"]: t["waiting_code"] for t in admin["waiting"]}
            self.assertEqual(waiting["D-005"], "acesso")
            self.assertEqual(waiting["D-006"], "decisao")
            self.assertEqual(waiting["D-007"], "aprovacao")

    def test_domains_ladder_processes_comparative_are_derived(self):
        with Proj() as p:
            proj = P.Projection(p.ws)
            dom = {d["domain_id"]: d for d in proj.domains()}
            self.assertEqual(dom["domain.catalogo"]["status"], "Em migração")              # D-003 em execução
            self.assertEqual(dom["domain.pedidos"]["level"], 0)                             # nada iniciado
            self.assertEqual(dom["domain.pagamento"]["automation"], "PARCIAL")             # declarado (já existia antes)
            self.assertEqual(dom["domain.pagamento"]["level"], 1)
            complete(p.ws, "D-003", gates=("tests",))                                       # construída e testada
            proj = P.Projection(p.ws)
            dom = {d["domain_id"]: d for d in proj.domains()}
            self.assertEqual((dom["domain.catalogo"]["level"], dom["domain.catalogo"]["status"]), (3, "Testada"))
            rows = proj.processes(proj.domains())
            self.assertEqual([r["process"] for r in rows][:2], ["Cadastro de produtos", "Fechamento de pedidos"])
            self.assertEqual(rows[-1]["automation"], "NÃO")                                  # linha só declarada, sem domínio
            m = proj.metrics(proj.phases(), proj.domains(), rows)
            self.assertEqual((m["processes_count"], m["processes_partial"]), (4, 1))
            cmpr = proj.comparative(m)
            self.assertIn("42", next(c["new"] for c in cmpr if c["category"] == "Testes"))    # {tests_count} preenchido
            self.assertEqual(proj.admin_view()["labels"]["processes_title"], "Processos da loja")

    def test_legacy_areas_still_load_as_domains(self):
        with Proj() as p:
            cfg = p.ws.portal_path
            import yaml
            data = yaml.safe_load(cfg.read_text(encoding="utf-8"))
            data["domains"] = []
            data["processes"] = []
            data["areas"] = [{"id": "area.x", "label": "Área X", "what": "Faz X", "tasks": ["D-001"], "priority": "P1"}]
            cfg.write_text(yaml.safe_dump(data, allow_unicode=True), encoding="utf-8")
            d = P.Projection(p.ws).domains()
            self.assertEqual([(x["label"], x["what_it_does"], x["level"]) for x in d], [("Área X", "Faz X", 2)])   # D-001 concluída

    def test_unassigned_tasks_fall_into_other_phase(self):
        with Proj() as p:
            import yaml
            data = yaml.safe_load(p.ws.phases_path.read_text(encoding="utf-8"))
            data["phases"][2]["tasks"].remove("D-010")
            p.ws.phases_path.write_text(yaml.safe_dump(data, allow_unicode=True), encoding="utf-8")
            ph = {x["phase_id"]: x for x in P.Projection(p.ws).phases()}
            self.assertEqual(ph["phase.other"]["tasks"], ["D-010"])

    def test_findings_and_comparison_status_derived_from_tasks(self):
        with Proj() as p:
            proj = P.Projection(p.ws)
            cmp = proj.comparison()
            e = {x["id"]: x for x in cmp["errors"]}
            self.assertEqual(e["e3"]["status_label"], "Sem tarefa vinculada")
            self.assertEqual(cmp["counts"]["errors_no_task"], 1)
            f = {x["finding_id"]: x for x in proj.findings()}
            self.assertEqual(f["finding.imagens"]["situation"], "Em tratamento")       # D-003 em execução

    def test_hours_idle_cutoff_and_union(self):
        from datetime import datetime, timezone
        with Proj() as p:
            with Proj() as q:  # projeto vazio de eventos reais: usa eventos sintéticos controlados
                store = S.EventStore(q.ws.events_path)
                q.ws.events_path.write_text("", encoding="utf-8")
                for typ, ts, tid in (("TASK_STARTED", "2026-10-05T10:00:00+00:00", "D-003"), ("GATES_RECORDED", "2026-10-05T10:45:00+00:00", None),
                                     ("GATES_RECORDED", "2026-10-08T09:00:00+00:00", None), ("GATES_RECORDED", "2026-10-08T09:20:00+00:00", None)):
                    ev = store.append(typ, AGENT, {"status": "PASS", "gates": {"tests": "PASS"}} if typ == "GATES_RECORDED" else {}, task_id=tid)
                    evs = store.read(); evs[-1]["ts"] = ts; evs[-1]["hash"] = S._hash(evs[-1])
                    q.ws.events_path.write_text("\n".join(S.canonical_json(e) for e in evs) + "\n", encoding="utf-8")
                tasks = S.state(q.ws)
                cfg = {"session_gap_minutes": 30, "idle_cutoff_minutes": 180, "git": False, "file_evidence": []}
                h = H.compute(q.ws, tasks, S.events(q.ws), {}, cfg, as_of=datetime(2026, 10, 8, 12, 0, tzinfo=timezone.utc))
                self.assertEqual(h["per_task"]["D-003"]["seconds"], 45 * 60 + 20 * 60)   # nunca os 3 dias parados
                self.assertEqual(h["total_seconds"], 65 * 60)
                self.assertFalse(h["running"])


class ClientSafety(unittest.TestCase):
    def test_sanitizer_keeps_prose_and_removes_internals(self):
        s = Sanitizer({"redact": ["Fulano da Silva"], "pii": "br"})
        self.assertEqual(s.text("8/9 arquivos e/ou Drive/Sheets em 08/10/2026"), "8/9 arquivos e/ou Drive/Sheets em 08/10/2026")
        out = s.text("Ver C:\\dev\\x\\y.json, src/app/main.py, http://127.0.0.1:8766/x, DM_SECRET_TOKEN, CPF 111.111.111-11, Fulano da Silva")
        for bad in ("C:\\", "main.py", "127.0.0.1", "SECRET", "111.111.111-11", "Fulano"):
            self.assertNotIn(bad, out)
        self.assertEqual(s.scan({"x": "chave em C:\\Users\\a\\b.txt", "ts": "2026-01-01"}, "", [])["x"], OMITTED)

    def test_client_view_has_no_internal_data_and_masks_security(self):
        with Proj() as p:
            complete(p.ws, "D-003", evidence=("C:\\secret\\notes.md", "abc1234deadbeef"), gates=("tests",))
            proj = P.Projection(p.ws)
            cv = proj.client_view(proj.admin_view())
            raw = json.dumps(cv, ensure_ascii=False)
            for rx in PROBES:
                self.assertIsNone(re.search(rx, raw, re.I), rx)
            self.assertNotIn('"where"', raw)
            self.assertNotIn("repositório legado", raw)
            sec = next(t for t in cv["tasks"] if t["id"] == "D-008")
            self.assertEqual(sec["title"], "Item de segurança em tratamento")
            err = next(e for e in cv["comparison"]["errors"] if e["id"] == "e2")
            self.assertEqual(err["title"], "Item de segurança em tratamento")
            self.assertEqual(cv["sanitization"]["omitted_fields"], 0)
            self.assertEqual(next(t for t in cv["tasks"] if t["id"] == "D-003")["executor"], "Agente de IA")                      # quem concluiu não está em actors


class ReportTests(unittest.TestCase):
    def test_phase_report_registered_versioned_and_reused(self):
        with Proj() as p:
            res = R.generate(p.ws)                                            # a demo já tem a fase 1 concluída
            self.assertEqual([(r["report_id"], r["status"]) for r in res], [("report.phase.discovery", "CREATED")])
            rep = R.load_report_json(p.ws, "report.phase.discovery")
            self.assertEqual(R.validate(rep), [])
            self.assertEqual(rep["decisions"], [])                            # nada inventado
            raw = json.dumps({k: v for k, v in rep.items() if k != "source_hash"}, ensure_ascii=False)   # hash = versionamento (admin)
            for rx in PROBES:
                self.assertIsNone(re.search(rx, raw, re.I), rx)
            self.assertEqual(R.generate(p.ws)[0]["status"], "REUSED")         # mesma fonte, mesma versão
            self.assertEqual(R.verify(p.ws), [])
            if R.pdf_available():
                data, name = R.pdf_bytes(p.ws, "report.phase.discovery")
                self.assertTrue(data.startswith(b"%PDF"))
                self.assertEqual(R.render_pdf(rep), data)                     # determinístico
            r = R.get(p.ws, "report.phase.discovery")
            f = p.root / r["json_path"]
            f.write_text(f.read_text(encoding="utf-8") + " ", encoding="utf-8")
            self.assertTrue(any("hash não confere" in x for x in R.verify(p.ws)))

    def test_changed_source_creates_new_version(self):
        with Proj() as p:
            R.generate(p.ws)
            import yaml
            data = yaml.safe_load(p.ws.phases_path.read_text(encoding="utf-8"))
            data["phases"][0]["objective"] = "objetivo revisado"
            p.ws.phases_path.write_text(yaml.safe_dump(data, allow_unicode=True), encoding="utf-8")
            res = R.generate(p.ws)
            self.assertEqual((res[0]["status"], res[0]["version"]), ("CREATED", 2))
            self.assertEqual(R.get(p.ws, "report.phase.discovery")["versions"], 2)

    def test_consolidated_is_admin_only(self):
        with Proj() as p:
            R.generate(p.ws, "consolidated")
            proj = P.Projection(p.ws)
            cv = proj.client_view(proj.admin_view())
            self.assertEqual([r for r in cv["reports"] if r["report_id"] == "report.consolidated"], [])
        with tempfile.TemporaryDirectory() as td:                              # projeto novo (sem fase concluída): nenhum relatório de fase
            INSTALL.install(Path(td), "P", "O", "T", False, False, False)
            self.assertEqual(R.generate(S.Workspace(td)), [])


class ServerTests(unittest.TestCase):
    def _serve(self, ws, role):
        srv = SV.serve(ws, "127.0.0.1", 0, role)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        return srv, f"http://127.0.0.1:{srv.server_address[1]}"

    def _get(self, url, method="GET", data=None):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, method=method, data=data), timeout=30) as r:
                return r.status, r.read(), dict(r.headers)
        except urllib.error.HTTPError as e:
            return e.code, e.read(), dict(e.headers)

    def test_client_viewer_routes_and_read_only(self):
        with Proj() as p:
            R.generate(p.ws)
            R.generate(p.ws, "consolidated")
            srv, base = self._serve(p.ws, "client-viewer")
            try:
                self.assertEqual(json.loads(self._get(base + "/api/session")[1])["role"], "CLIENT_VIEWER")
                for path in ("/api/project/overview", "/api/project/phases", "/api/project/phases/phase.discovery", "/api/project/tasks",
                             "/api/project/tasks?tab=concluidas", "/api/project/tasks/D-001", "/api/project/timeline?limit=2&offset=1",
                             "/api/project/processes", "/api/project/capabilities", "/api/project/comparative",
                             "/api/project/findings", "/api/project/comparison", "/api/project/quality", "/api/project/reports", "/api/project/reports/report.phase.discovery"):
                    code, body, _ = self._get(base + path)
                    self.assertEqual(code, 200, path)
                    for rx in PROBES:
                        self.assertIsNone(re.search(rx, body.decode("utf-8"), re.I), f"{path}: {rx}")
                ov = json.loads(self._get(base + "/api/project/overview?view=admin")[1])
                self.assertEqual(ov["view"], "client")                         # view=admin ignorado
                self.assertEqual(self._get(base + "/api/project/reports/report.consolidated")[0], 404)
                for m in ("POST", "PUT", "DELETE", "PATCH"):
                    self.assertEqual(self._get(base + "/api/project/overview", m, b"{}" if m != "DELETE" else None)[0], 405)
                self.assertEqual(self._get(base + "/api/nada")[0], 404)
                code, body, _ = self._get(base + "/")
                self.assertEqual(code, 200)
                self.assertIn(b"assets/", body)
                if R.pdf_available():
                    code, body, hdr = self._get(base + "/api/project/reports/report.phase.discovery/pdf")
                    self.assertTrue(code == 200 and body.startswith(b"%PDF"))
                    self.assertIn("attachment", hdr.get("Content-Disposition", ""))
                self.assertEqual(self._get(base + "/../../etc/passwd")[0], 200)  # cai no index.html (SPA), nunca no arquivo
            finally:
                srv.shutdown()
                srv.server_close()

    def test_admin_view_only_for_admin(self):
        with Proj() as p:
            srv, base = self._serve(p.ws, None)
            try:
                self.assertEqual(json.loads(self._get(base + "/api/session")[1])["role"], "ADMIN")
                t = json.loads(self._get(base + "/api/project/tasks/D-001?view=admin")[1])
                self.assertIn("history", t)
                self.assertTrue(any(e["ref"] == "docs/README.md" for e in t["evidence"]))
                cmp = json.loads(self._get(base + "/api/project/comparison?view=admin")[1])
                self.assertTrue(any(e.get("where") for e in cmp["errors"]))
            finally:
                srv.shutdown()
                srv.server_close()

    def test_bind_rules(self):
        with Proj() as p:
            for role, proxy, host in (("admin", "192.0.2.10", "192.0.2.1"), ("client-viewer", None, "192.0.2.1"), ("client-viewer", "192.0.2.10", "0.0.0.0")):
                with self.assertRaises(SystemExit):
                    SV.serve(p.ws, host, 0, role, proxy)
            with self.assertRaises(SystemExit):
                SV.trusted_proxies("192.0.2.0/24")
            with self.assertRaises(SystemExit):
                SV.resolve_role("superuser")

    def test_untrusted_source_and_proxy_token(self):
        with Proj() as p:
            srv, base = self._serve(p.ws, "client-viewer")
            srv.allowed_sources = {"192.0.2.10"}
            try:
                self.assertEqual(self._get(base + "/api/session")[0], 403)
                srv.allowed_sources = None
                srv.proxy_token = "t0k3n"
                self.assertEqual(self._get(base + "/api/session")[0], 200)   # loopback é isento do token
            finally:
                srv.shutdown()
                srv.server_close()


class ExportAndImport(unittest.TestCase):
    def test_static_export_is_client_safe_and_complete(self):
        from statuskit import cli
        with Proj() as p:
            R.generate(p.ws)
            out = p.root / "dist-status"
            res = cli.export_static(p.ws, out)
            self.assertGreater(res["files"], 10)
            self.assertIn("STATUS_STATIC", (out / "static-flag.js").read_text(encoding="utf-8"))
            self.assertIn("static-flag.js", (out / "index.html").read_text(encoding="utf-8"))
            self.assertTrue(any((out / "assets").glob("*.js")) and any((out / "assets").glob("*.css")))   # interface compilada
            for name in ("processes", "capabilities", "comparative"):
                self.assertTrue((out / "api" / "project" / f"{name}.json").is_file(), name)
            ov = json.loads((out / "api" / "project" / "overview.json").read_text(encoding="utf-8"))
            self.assertEqual(ov["view"], "client")
            for f in (out / "api").rglob("*.json"):
                raw = f.read_text(encoding="utf-8")
                for rx in PROBES:
                    self.assertIsNone(re.search(rx, raw, re.I), f"{f.name}: {rx}")
            if R.pdf_available():
                self.assertTrue(any((out / "files").glob("*.pdf")))
                self.assertTrue(all(r["pdf_url"].startswith("files/") for r in ov["reports"] if r["has_pdf"]))

    def test_import_history_accepts_in_progress_with_real_start_date(self):
        from statuskit import cli
        with Proj() as p:
            f = p.root / "hist.yaml"
            f.write_text("in_progress:\n  - id: D-006\n    started_at: '2026-10-12T14:10:00+00:00'\n    note: reconstruído do commit c2b6724\n", encoding="utf-8")
            res = cli.import_history(p.ws, str(f), HUMAN)
            self.assertEqual(res["started"], ["D-006"])
            t = S.get(p.ws, "D-006")
            self.assertEqual(t["status"], "IN_PROGRESS")
            self.assertTrue(t["history"][-1]["ts"].startswith("2026-10-12T14:10"))
            self.assertEqual(S.EventStore(p.ws.events_path).verify(), [])
            bad = p.root / "bad2.yaml"
            bad.write_text("in_progress:\n  - id: D-007\n    started_at: '2999-01-01T00:00:00+00:00'\n", encoding="utf-8")
            with self.assertRaises(StatusError):
                cli.import_history(p.ws, str(bad), HUMAN)

    def test_import_history_marks_reconstructed_and_validates(self):
        from statuskit import cli
        with Proj() as p:
            f = p.root / "hist.yaml"
            f.write_text("done:\n  - id: D-006\n    started_at: '2026-09-01T10:00:00+00:00'\n    completed_at: '2026-09-02T12:00:00+00:00'\n"
                         "    evidence: [abc1234]\n", encoding="utf-8")
            res = cli.import_history(p.ws, str(f), HUMAN)
            self.assertEqual(res["imported"], ["D-006"])
            t = S.get(p.ws, "D-006")
            self.assertEqual(t["status"], "DONE")
            self.assertEqual(S.EventStore(p.ws.events_path).verify(), [])
            self.assertTrue(any((e.get("data") or {}).get("reconstructed") for e in S.events(p.ws)))
            bad = p.root / "bad.yaml"
            bad.write_text("done:\n  - id: D-009\n    completed_at: '2999-01-01T00:00:00+00:00'\n    evidence: [x]\n", encoding="utf-8")
            with self.assertRaises(StatusError):
                cli.import_history(p.ws, str(bad), HUMAN)                # data futura recusada


class InstallerTests(unittest.TestCase):
    def test_install_is_non_destructive_and_upgrade_preserves_data(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / ".gitignore").write_text("node_modules/\n", encoding="utf-8")
            r = INSTALL.install(root, "P", "O", "PROJ", False, False, True)
            self.assertIn("status/engine/", r["created"])
            self.assertTrue((root / "AGENTS.md").read_text(encoding="utf-8").count(INSTALL.MARK_A) == 1)
            with self.assertRaises(SystemExit):
                INSTALL.install(root, "P", "O", "PROJ", False, False, False)       # já instalado
            (root / "status" / "backlog.yaml").write_text("tasks: []\n# meu backlog\n", encoding="utf-8")
            r2 = INSTALL.install(root, "P", "O", "PROJ", True, False, True)
            self.assertIn("status/backlog.yaml", r2["kept_existing"])
            self.assertIn("# meu backlog", (root / "status" / "backlog.yaml").read_text(encoding="utf-8"))
            self.assertEqual((root / "AGENTS.md").read_text(encoding="utf-8").count(INSTALL.MARK_A), 1)   # bloco não duplica
            self.assertIn("status/last-gates.json", (root / ".gitignore").read_text(encoding="utf-8"))
            with self.assertRaises(SystemExit):
                INSTALL.install(root, "P", "O", "1BAD", True, False, False)        # prefixo inválido

    def test_cli_end_to_end_via_launcher(self):
        with Proj() as p:
            py, launcher = sys.executable, str(p.root / "status" / "status.py")
            run = lambda *a: subprocess.run([py, launcher, *a], capture_output=True, text=True, encoding="utf-8", cwd=str(p.root))
            self.assertEqual(run("doctor").returncode, 0)
            self.assertEqual(run("state").returncode, 0)
            r = run("work", "start", "D-004", "--actor", "agent:test-bot")
            self.assertNotEqual(r.returncode, 0)                                   # depende de D-003
            self.assertIn("depende", r.stderr)
            self.assertEqual(run("gates", "--only", "tests").returncode, 0)
            self.assertEqual(run("work", "done", "D-003", "--actor", "agent:test-bot", "--evidence", "src/m.py").returncode, 0)
            self.assertEqual(run("sync").returncode, 0)

    def test_serve_port_zero_and_pid_file(self):
        import time
        import urllib.request
        with Proj() as p:
            pidf = p.root / "srv.pid"
            proc = subprocess.Popen([sys.executable, str(p.root / "status" / "status.py"), "serve", "--port", "0", "--role", "client-viewer",
                                     "--pid-file", str(pidf)], stdout=subprocess.PIPE, text=True, encoding="utf-8", cwd=str(p.root))
            try:
                line = proc.stdout.readline()
                m = re.search(r"http://127\.0\.0\.1:(\d+)/", line)
                self.assertIsNotNone(m, line)
                self.assertNotEqual(m.group(1), "0")
                for _ in range(50):
                    if pidf.is_file():
                        break
                    time.sleep(0.1)
                server_pid = int(pidf.read_text())                               # no Windows o launcher do venv é um processo pai
                self.assertGreater(server_pid, 0)
                with urllib.request.urlopen(f"http://127.0.0.1:{m.group(1)}/healthz", timeout=20) as r:
                    self.assertEqual(r.status, 200)
            finally:
                if pidf.is_file():                                               # encerra-se por este PID, nunca por porta
                    pid = pidf.read_text().strip()
                    if os.name == "nt":
                        subprocess.run(["taskkill", "/PID", pid, "/F"], capture_output=True)
                    else:
                        os.kill(int(pid), 15)
                proc.terminate()
                proc.wait(timeout=20)

    def test_repeated_evidence_flags_are_all_kept(self):
        with Proj() as p:
            run = lambda *a: subprocess.run([sys.executable, str(p.root / "status" / "status.py"), *a], capture_output=True, text=True,
                                            encoding="utf-8", cwd=str(p.root))
            self.assertEqual(run("gates", "--only", "tests").returncode, 0)
            r = run("work", "done", "D-003", "--actor", "agent:test-bot", "--evidence", "src/a.py", "--evidence", "tests/test_a.py", "abc1234")
            self.assertEqual(r.returncode, 0, r.stderr)
            done = [e for e in S.events(p.ws) if e["type"] == "TASK_COMPLETED" and e["task_id"] == "D-003"][-1]
            self.assertEqual(done["data"]["evidence"], ["src/a.py", "tests/test_a.py", "abc1234"])

    def test_doctor_rejects_declared_level_and_unknown_refs_in_domains(self):
        with Proj() as p:
            import yaml
            cfgp = p.root / "status" / "portal.yaml"
            cfg = yaml.safe_load(cfgp.read_text(encoding="utf-8"))
            cfg["domains"][0]["level"] = 4
            cfg["domains"][1]["tested_by"] = ["D-999"]
            cfg["processes"][0]["domain"] = "domain.nao-existe"
            cfgp.write_text(yaml.safe_dump(cfg, allow_unicode=True), encoding="utf-8")
            r = subprocess.run([sys.executable, str(p.root / "status" / "status.py"), "doctor"], capture_output=True, text=True,
                               encoding="utf-8", cwd=str(p.root))
            self.assertNotEqual(r.returncode, 0)
            for needle in ("estado não pode ser declarado (level)", "D-999", "domínio inexistente"):
                self.assertIn(needle, r.stdout)

    def test_ui_bundle_is_prebuilt_and_served(self):
        ui = Path(__file__).resolve().parent.parent / "engine" / "ui"
        html = (ui / "index.html").read_text(encoding="utf-8")
        self.assertIn("assets/", html)
        self.assertTrue(any((ui / "assets").glob("*.js")))

    def test_doctor_rejects_truncated_yaml_in_areas_and_findings(self):
        with Proj() as p:
            cfgp = p.root / "status" / "portal.yaml"
            txt = cfgp.read_text(encoding="utf-8")
            import yaml
            cfg = yaml.safe_load(txt)
            cfg["domains"][0]["bogus"] = "x"
            cfg["findings"][0]["tasks"] = ["D-999"]
            cfgp.write_text(yaml.safe_dump(cfg, allow_unicode=True), encoding="utf-8")
            py, launcher = sys.executable, str(p.root / "status" / "status.py")
            r = subprocess.run([py, launcher, "doctor"], capture_output=True, text=True, encoding="utf-8", cwd=str(p.root))
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("campo desconhecido em domains", r.stdout)
            self.assertIn("D-999", r.stdout)


if __name__ == "__main__":
    unittest.main()
