#!/usr/bin/env python3
"""Acha o painel de status (status/status.py) a partir de uma pasta e escolhe um Python que consiga rodá-lo.

    python find_status.py [--cwd PASTA] [--json] [--run <comando do status.py e argumentos...>]

Sobe a árvore a partir de --cwd (padrão: pasta atual) procurando status/status.py + status/portal.yaml; respeita STATUS_ROOT.
Escolhe o primeiro Python (STATUS_PYTHON, o atual, python, python3, py) que importa PyYAML. Com --run, executa o painel com ele.
Somente leitura (a menos que o comando passado em --run escreva, como `work start`).
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def find_root(start: Path) -> Path | None:
    env = os.environ.get("STATUS_ROOT")
    if env and (Path(env) / "status" / "portal.yaml").is_file():
        return Path(env).resolve()
    for p in [start.resolve(), *start.resolve().parents]:
        if (p / "status" / "status.py").is_file() and (p / "status" / "portal.yaml").is_file():
            return p
    return None


def has_yaml(py: str) -> bool:
    try:
        return subprocess.run([py, "-c", "import yaml"], capture_output=True, timeout=20).returncode == 0
    except (OSError, subprocess.TimeoutExpired):
        return False


def pick_python() -> str | None:
    cands = [os.environ.get("STATUS_PYTHON"), sys.executable, shutil.which("python"), shutil.which("python3"), shutil.which("py")]
    seen: set[str] = set()
    for c in cands:
        if c and c not in seen:
            seen.add(c)
            if has_yaml(c):
                return c
    return None


def main() -> int:
    for _s in (sys.stdout, sys.stderr):                 # consoles cp1252 (Windows) quebram com "→" e "…"
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--cwd", default=".")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--run", nargs=argparse.REMAINDER, help="executa `status.py <args>` com o Python escolhido")
    a = ap.parse_args()
    root = find_root(Path(a.cwd))
    if root is None:
        print("Nenhum painel de status encontrado (status/status.py + status/portal.yaml) a partir de "
              f"{Path(a.cwd).resolve()}.\nPara instalar use a skill `status-portal`.", file=sys.stderr)
        return 3
    py = pick_python()
    if py is None:
        print("Nenhum Python com PyYAML encontrado. Instale: python -m pip install pyyaml reportlab "
              "(ou aponte STATUS_PYTHON para um que tenha).", file=sys.stderr)
        return 4
    cli = [py, str(root / "status" / "status.py")]
    if a.run:
        return subprocess.run(cli + a.run, cwd=str(root)).returncode
    info = {"root": str(root), "python": py, "status_cli": cli, "command": " ".join(f'"{c}"' if " " in c else c for c in cli)}
    print(json.dumps(info, ensure_ascii=False, indent=2) if a.json else f"raiz: {root}\ncomando: {info['command']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
