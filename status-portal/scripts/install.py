#!/usr/bin/env python3
"""Instala o painel de status em um projeto (não destrutivo).

    python install.py <pasta-do-projeto> --title "Meu Projeto" --owner "Minha Empresa" [--prefix T]
                      [--upgrade] [--demo] [--patch-agents] [--no-doctor]

Cria <projeto>/status/ com: engine/ (motor; substituído em --upgrade), backlog.yaml, phases.yaml, portal.yaml,
comparison.yaml, README.md, AGENT-RULES.md e status.py. NUNCA sobrescreve arquivos de dados existentes.
Não altera nenhum outro arquivo do projeto, exceto .gitignore (acrescenta 3 linhas) e, com --patch-agents,
AGENTS.md (acrescenta um bloco delimitado por marcadores).
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent
ENGINE = KIT / "engine"
TEMPLATES = KIT / "templates"
VERSION = (ENGINE / "VERSION").read_text(encoding="utf-8").strip() if (ENGINE / "VERSION").is_file() else "?"
GITIGNORE = ["status/last-gates.json", "status/engine/**/__pycache__/", "__pycache__/"]
MARK_A, MARK_B = "<!-- status-portal:begin -->", "<!-- status-portal:end -->"
DATA_FILES = ["portal.yaml", "backlog.yaml", "phases.yaml", "comparison.yaml"]
IGNORE = shutil.ignore_patterns("__pycache__", "*.pyc", "tests")


def fill(text: str, **kw) -> str:
    for k, v in kw.items():
        text = text.replace(f"__{k.upper()}__", v)
    return text


def install(target: Path, title: str, owner: str, prefix: str, upgrade: bool, demo: bool, patch_agents: bool) -> dict:
    target = target.resolve()
    if not target.is_dir():
        raise SystemExit(f"Pasta do projeto não existe: {target}")
    status = target / "status"
    exists = (status / "portal.yaml").is_file()
    if exists and not upgrade:
        raise SystemExit(f"{status} já existe. Para atualizar só o motor use --upgrade (dados do projeto são preservados).")
    if not exists and upgrade:
        raise SystemExit("--upgrade exige uma instalação existente (status/portal.yaml).")
    if not prefix or not prefix.isalnum() or not prefix[0].isalpha():
        raise SystemExit("--prefix deve ser alfanumérico e começar com letra (ex.: T, PROJ)")
    prefix = prefix.upper()
    created, kept = [], []
    # 1) motor (sempre substituído: é do kit)
    eng = status / "engine"
    if eng.exists():
        shutil.rmtree(eng)
    shutil.copytree(ENGINE, eng, ignore=IGNORE)
    created.append("status/engine/")
    # 2) lançador
    shutil.copy2(TEMPLATES / "status.py", status / "status.py")
    created.append("status/status.py")
    # 3) dados (nunca sobrescreve)
    for name in DATA_FILES + ["README.md", "AGENT-RULES.md"]:
        dst = status / name
        if dst.exists():
            kept.append(f"status/{name}")
            continue
        src = TEMPLATES / name
        dst.write_text(fill(src.read_text(encoding="utf-8"), title=title, owner=owner, prefix=prefix), encoding="utf-8", newline="\n")
        created.append(f"status/{name}")
    for d in ("reports", "handoffs"):
        (status / d).mkdir(exist_ok=True)
    # 4) .gitignore
    gi = target / ".gitignore"
    cur = gi.read_text(encoding="utf-8") if gi.is_file() else ""
    add = [l for l in GITIGNORE if l not in cur.splitlines()]
    if add:
        gi.write_text(cur + ("" if cur.endswith("\n") or not cur else "\n") + "# status-portal\n" + "\n".join(add) + "\n", encoding="utf-8", newline="\n")
        created.append(".gitignore (+linhas)")
    # 5) regras para agentes no AGENTS.md (opcional, delimitado)
    if patch_agents:
        ag = target / "AGENTS.md"
        text = ag.read_text(encoding="utf-8") if ag.is_file() else "# AGENTS.md\n"
        if MARK_A not in text:
            block = (TEMPLATES / "AGENT-RULES.md").read_text(encoding="utf-8")
            ag.write_text(text.rstrip("\n") + f"\n\n{MARK_A}\n{block.rstrip()}\n{MARK_B}\n", encoding="utf-8", newline="\n")
            created.append("AGENTS.md (+bloco status-portal)")
        else:
            kept.append("AGENTS.md (bloco já presente)")
    res = {"target": str(target), "kit_version": VERSION, "created": created, "kept_existing": kept, "upgrade": upgrade}
    if demo:
        res["demo"] = load_demo(target)
    return res


def load_demo(target: Path) -> dict:
    """Preenche um projeto de demonstração (só para teste/captura de tela). Usa o CLI real."""
    status = target / "status"
    demo = KIT / "templates" / "demo"
    for f in ("backlog.yaml", "phases.yaml", "portal.yaml", "comparison.yaml"):
        shutil.copy2(demo / f, status / f)
    sys.path.insert(0, str(ENGINE))
    from statuskit import store as S  # noqa: E402  (em processo: sem subprocessos, mesmas regras do CLI)
    ws = S.Workspace(target)
    bot = S.parse_actor("agent:demo-bot")
    S.session_start(ws, bot)
    S.start(ws, "D-001", bot)
    S.done(ws, "D-001", bot, ["docs/README.md", "abc1234"])
    S.start(ws, "D-002", bot)
    S.done(ws, "D-002", bot, ["tests/test_core.py"])
    S.start(ws, "D-003", bot)
    return {"steps": "D-001 e D-002 concluídas; D-003 em execução; D-005 aguarda credenciais (bloqueio externo no backlog)"}


def main() -> int:
    for _s in (sys.stdout, sys.stderr):                 # consoles cp1252 (Windows) quebram com "→" e "…"
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("target")
    ap.add_argument("--title", default="Meu Projeto")
    ap.add_argument("--owner", default="")
    ap.add_argument("--prefix", default="T")
    ap.add_argument("--upgrade", action="store_true")
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--patch-agents", action="store_true", help="acrescenta as regras ao AGENTS.md do projeto")
    ap.add_argument("--no-doctor", action="store_true")
    a = ap.parse_args()
    try:
        import yaml  # noqa: F401
    except ImportError:
        print("PyYAML ausente neste Python. Instale: python -m pip install pyyaml  (opcional: reportlab, para PDF)", file=sys.stderr)
        return 2
    res = install(Path(a.target), a.title, a.owner, a.prefix, a.upgrade, a.demo, a.patch_agents)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    if not a.no_doctor:
        r = subprocess.run([sys.executable, str(Path(a.target).resolve() / "status" / "status.py"), "doctor"], capture_output=True, text=True, encoding="utf-8", errors="replace")
        print("doctor:", "PASS" if r.returncode == 0 else "FAIL")
        if r.returncode != 0:
            print(r.stdout or r.stderr)
    print("\nPróximos passos: edite status/backlog.yaml, status/phases.yaml e status/portal.yaml; depois\n"
          f"  python {Path(a.target) / 'status' / 'status.py'} doctor\n  python {Path(a.target) / 'status' / 'status.py'} serve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
