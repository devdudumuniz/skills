#!/usr/bin/env python3
"""Auditoria SOMENTE LEITURA de um projeto, para preparar o painel de status.

    python discover.py <pasta-do-projeto> [--json]

Não altera nada, não executa nenhum comando do projeto e NUNCA lê o conteúdo de .env, chaves ou segredos (só
informa que existem). Lê apenas manifestos pequenos (package.json, pyproject.toml, Makefile, composer.json) para
sugerir verificações (gates), e conta/lista documentos, testes, CI e histórico do git (datas reais).

Saída: o que existe, as verificações que dá para propor, as fontes onde o backlog/histórico podem ser reconstruídos
e os riscos (segredos, dados) a tratar antes de publicar. Tudo é PROPOSTA: quem decide é o responsável pelo projeto.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

SKIP = {".git", "node_modules", "dist", "build", "__pycache__", ".venv", "venv", ".next", "target", ".idea", ".vscode",
        "coverage", ".pytest_cache", ".mypy_cache", ".pnpm-store", "status"}
SECRET_NAMES = re.compile(r"^(?!.*\.(example|sample|template)$)(\.env(\..+)?|.*\.(pem|key|p12|pfx|kdbx)|id_rsa|id_ed25519|credentials(\.json)?|secrets?\.(ya?ml|json))$", re.I)
DOC_HINTS = ("readme", "changelog", "roadmap", "todo", "plano", "plan", "adr", "decis", "arquitet", "architecture", "levantamento", "backlog")
MAX_FILES = 30000


def walk(root: Path):
    n = 0
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in SKIP]
        for f in fn:
            n += 1
            if n > MAX_FILES:
                return
            yield Path(dp) / f


def git(root: Path, *args: str) -> str | None:
    if not (root / ".git").exists():
        return None
    try:
        p = subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return p.stdout if p.returncode == 0 else None


def read_json(p: Path) -> dict:
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def propose_gates(root: Path, found: dict) -> list[dict]:
    g = []
    pj = root / "package.json"
    if pj.is_file():
        scripts = read_json(pj).get("scripts") or {}
        pm = "pnpm" if (root / "pnpm-lock.yaml").is_file() else "yarn" if (root / "yarn.lock").is_file() else "npm"
        for name, label in (("test", "Testes automatizados"), ("lint", "Lint"), ("typecheck", "Checagem de tipos"), ("build", "Build")):
            if name in scripts:
                g.append({"id": name if name != "test" else "tests", "label": label, "cmd": [pm, "run", name] if pm != "npm" or name != "test" else ["npm", "test"],
                          "why": f"script '{name}' em package.json"})
    if (root / "pyproject.toml").is_file() or (root / "pytest.ini").is_file() or (root / "setup.cfg").is_file() or any(found["tests"]["python"]):
        g.append({"id": "tests", "label": "Testes automatizados", "cmd": ["{python}", "-m", "pytest", "-q"], "parse": r"(\d+) passed",
                  "metric": "tests", "why": "projeto Python com testes (troque por unittest se não usa pytest)"})
    if (root / "go.mod").is_file():
        g.append({"id": "tests", "label": "Testes automatizados", "cmd": ["go", "test", "./..."], "why": "go.mod"})
    if (root / "Cargo.toml").is_file():
        g.append({"id": "tests", "label": "Testes automatizados", "cmd": ["cargo", "test"], "why": "Cargo.toml"})
    if (root / "Makefile").is_file():
        try:
            targets = set(re.findall(r"^([A-Za-z0-9_.-]+):", (root / "Makefile").read_text(encoding="utf-8", errors="replace"), re.M))
        except OSError:
            targets = set()
        for t in ("test", "lint", "build"):
            if t in targets and not any(x["id"] == (t if t != "test" else "tests") for x in g):
                g.append({"id": t if t != "test" else "tests", "label": t.capitalize(), "cmd": ["make", t], "why": "alvo no Makefile"})
    seen, out = set(), []
    for x in g:
        if x["id"] not in seen:
            seen.add(x["id"])
            out.append(x)
    return out


def discover(root: Path) -> dict:
    root = root.resolve()
    files = list(walk(root))
    rel = lambda p: p.relative_to(root).as_posix()
    docs = [rel(p) for p in files if p.suffix.lower() in (".md", ".rst", ".txt") and any(h in rel(p).lower() for h in DOC_HINTS)]
    manifests = [m for m in ("package.json", "pnpm-lock.yaml", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml", "pom.xml",
                             "build.gradle", "composer.json", "Gemfile", "Dockerfile", "docker-compose.yml", "compose.yml", "Makefile")
                 if (root / m).exists()]
    tests = {"python": [rel(p) for p in files if re.match(r"(test_.*|.*_test)\.py$", p.name)][:200],
             "js": [rel(p) for p in files if re.search(r"\.(test|spec)\.[cm]?[jt]sx?$", p.name)][:200]}
    ci = [rel(p) for p in files if rel(p).startswith((".github/workflows/", ".gitlab-ci", ".circleci/")) or p.name in ("Jenkinsfile", "azure-pipelines.yml")]
    secrets = [rel(p) for p in files if SECRET_NAMES.match(p.name)]
    agent_files = [m for m in ("AGENTS.md", "CLAUDE.md", ".cursorrules", ".github/copilot-instructions.md") if (root / m).is_file()]
    top = sorted(d.name for d in root.iterdir() if d.is_dir() and d.name not in SKIP and not d.name.startswith("."))
    ext_count: dict[str, int] = {}
    for p in files:
        ext_count[p.suffix.lower() or "(sem)"] = ext_count.get(p.suffix.lower() or "(sem)", 0) + 1
    found = {"tests": tests}
    git_info = None
    log = git(root, "log", "--pretty=%ct|%an|%s", "-n", "3000")
    if log is not None:
        lines = [l for l in log.splitlines() if l.strip()]
        from datetime import datetime, timezone
        ts = [int(l.split("|", 1)[0]) for l in lines if l.split("|", 1)[0].isdigit()]
        git_info = {"commits": len(lines), "authors": len({l.split("|")[1] for l in lines if l.count("|") >= 2}),
                    "first": datetime.fromtimestamp(min(ts), timezone.utc).date().isoformat() if ts else None,
                    "last": datetime.fromtimestamp(max(ts), timezone.utc).date().isoformat() if ts else None,
                    "dirty": bool((git(root, "status", "--porcelain") or "").strip())}
    installed = (root / "status" / "portal.yaml").is_file()
    risks = []
    if secrets:
        risks.append(f"{len(secrets)} arquivo(s) com nome de segredo ({', '.join(secrets[:4])}…): NÃO entram no painel; confirme que estão no .gitignore")
    if git_info is None:
        risks.append("sem repositório git: horas e histórico só virão de arquivos e eventos do painel")
    if not (root / ".gitignore").is_file():
        risks.append("sem .gitignore")
    sources = []
    if git_info and git_info["commits"]:
        sources.append(f"git: {git_info['commits']} commits ({git_info['first']} → {git_info['last']}) — base para `import-history` e para as horas")
    if docs:
        sources.append(f"{len(docs)} documento(s) de plano/decisão/levantamento — base para backlog, fases e aba 'Antes × agora'")
    if any(x.lower().startswith(("todo", "roadmap", "backlog")) for x in (Path(d).name for d in docs)):
        sources.append("há TODO/ROADMAP/BACKLOG em arquivo: converta em tarefas (uma por entrega verificável)")
    return {"project": root.name, "root": str(root), "already_installed": installed, "manifests": manifests, "top_level_dirs": top[:40],
            "languages": dict(sorted(ext_count.items(), key=lambda kv: -kv[1])[:8]), "files_scanned": len(files),
            "tests": {"python": len(tests["python"]), "js": len(tests["js"])}, "ci": ci[:10], "agent_instruction_files": agent_files,
            "docs": docs[:60], "git": git_info, "proposed_gates": propose_gates(root, found), "sources_for_backlog_and_history": sources,
            "risks": risks,
            "next": ["Escolher prefixo de tarefas e título (references/BOOTSTRAP.md, passo 2)",
                     "python <kit>/scripts/install.py <projeto> --title ... --owner ... --prefix ... [--patch-agents]",
                     "Escrever backlog/fases/gates a partir das fontes acima; `doctor` até PASS"]}


def main() -> int:
    for _s in (sys.stdout, sys.stderr):                 # consoles cp1252 (Windows) quebram com "→" e "…"
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("target")
    ap.add_argument("--json", action="store_true", help="saída JSON (padrão: resumo legível)")
    a = ap.parse_args()
    root = Path(a.target)
    if not root.is_dir():
        print(f"Pasta não existe: {root}", file=sys.stderr)
        return 2
    d = discover(root)
    if a.json:
        print(json.dumps(d, ensure_ascii=False, indent=2))
        return 0
    print(f"Projeto: {d['project']}  ({d['root']})")
    print(f"Painel já instalado: {'sim' if d['already_installed'] else 'não'}")
    print(f"Arquivos analisados: {d['files_scanned']} · principais extensões: {d['languages']}")
    print(f"Manifestos: {', '.join(d['manifests']) or '—'}")
    print(f"Testes: {d['tests']['python']} arquivo(s) Python, {d['tests']['js']} JS/TS · CI: {', '.join(d['ci']) or '—'}")
    print(f"Instruções de agente: {', '.join(d['agent_instruction_files']) or '—'}")
    if d["git"]:
        g = d["git"]
        print(f"Git: {g['commits']} commits, {g['authors']} autor(es), {g['first']} → {g['last']}, alterações não commitadas: {'sim' if g['dirty'] else 'não'}")
    print("\nVerificações (gates) que dá para propor:")
    for x in d["proposed_gates"] or []:
        print(f"  - {x['id']}: {' '.join(x['cmd'])}   ({x['why']})")
    if not d["proposed_gates"]:
        print("  (nenhuma detectada — defina em status/portal.yaml)")
    print("\nFontes para backlog/histórico:")
    for s in d["sources_for_backlog_and_history"] or ["(nenhuma — o backlog nasce do zero)"]:
        print(f"  - {s}")
    if d["docs"]:
        print("\nDocumentos relevantes (primeiros 15):")
        for x in d["docs"][:15]:
            print(f"  - {x}")
    print("\nRiscos a tratar:")
    for r in d["risks"] or ["(nenhum detectado)"]:
        print(f"  - {r}")
    print("\nPróximos passos:")
    for n in d["next"]:
        print(f"  - {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
