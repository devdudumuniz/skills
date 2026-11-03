#!/usr/bin/env python3
"""Reconstrói a interface do painel (engine/ui/) a partir de ui-src/. Só é preciso ao MUDAR a interface.

    python build_ui.py [--store-dir <path-to-pnpm-store>] [--keep]

Requer Node 18+ e pnpm (ou npm). Compila numa pasta temporária (o kit não guarda node_modules), faz typecheck (tsc) e
grava o resultado em engine/ui/. Usar o painel NÃO exige Node: o servidor Python serve os arquivos já compilados.
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent
SRC = KIT / "ui-src"
OUT = KIT / "engine" / "ui"


def run(cmd: list[str], cwd: Path, env: dict) -> None:
    exe = shutil.which(cmd[0])
    if not exe:
        raise SystemExit(f"'{cmd[0]}' não encontrado no PATH (instale Node 18+ e pnpm).")
    print("$", " ".join(cmd), flush=True)
    r = subprocess.run([exe, *cmd[1:]], cwd=cwd, env=env)
    if r.returncode != 0:
        raise SystemExit(f"falhou: {' '.join(cmd)} (código {r.returncode})")


def main() -> int:
    for _s in (sys.stdout, sys.stderr):                 # consoles cp1252 (Windows) quebram com "→" e "…"
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--store-dir", help="store do pnpm (padrão: o do próprio pnpm)")
    ap.add_argument("--keep", action="store_true", help="não apaga a pasta temporária de build")
    a = ap.parse_args()
    tmp = Path(tempfile.mkdtemp(prefix="status-ui-"))
    try:
        work = tmp / "ui"
        shutil.copytree(SRC, work, ignore=shutil.ignore_patterns("node_modules", "dist"))
        env = dict(os.environ, CI="true")
        if shutil.which("pnpm"):
            install = ["pnpm", "install", "--no-frozen-lockfile"] + (["--store-dir", a.store_dir] if a.store_dir else [])
            run(install, work, env)
            run(["pnpm", "run", "build"], work, env)
        else:
            run(["npm", "install", "--no-audit", "--no-fund"], work, env)
            run(["npm", "run", "build"], work, env)
        dist = work / "dist"
        if not (dist / "index.html").is_file():
            raise SystemExit("build não gerou dist/index.html")
        if OUT.exists():
            shutil.rmtree(OUT)
        shutil.copytree(dist, OUT)
        print(f"interface gravada em {OUT} ({sum(1 for f in OUT.rglob('*') if f.is_file())} arquivos)")
        return 0
    finally:
        if a.keep:
            print("pasta temporária mantida:", tmp)
        else:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
