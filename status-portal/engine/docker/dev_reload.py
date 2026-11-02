"""Reinicia o servidor quando um .py observado muda. Polling (eventos de arquivo do Windows não chegam ao container).

    python dev_reload.py --watch <dir> [...] -- <comando>
"""
from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time


def snapshot(roots: list[str]) -> dict[str, int]:
    out: dict[str, int] = {}
    for root in roots:
        for dirpath, dirs, files in os.walk(root):
            dirs[:] = [d for d in dirs if d not in ("__pycache__", ".git", "node_modules")]
            for f in files:
                if f.endswith(".py"):
                    p = os.path.join(dirpath, f)
                    try:
                        out[p] = os.stat(p).st_mtime_ns
                    except OSError:
                        continue
    return out


def main() -> int:
    if "--" not in sys.argv:
        print("uso: dev_reload.py --watch <dir> [...] -- <comando>", file=sys.stderr)
        return 2
    i = sys.argv.index("--")
    ap = argparse.ArgumentParser()
    ap.add_argument("--watch", nargs="+", required=True)
    ap.add_argument("--interval", type=float, default=2.0)
    a = ap.parse_args(sys.argv[1:i])
    cmd = sys.argv[i + 1:]
    stop = {"flag": False}
    signal.signal(signal.SIGTERM, lambda *_: stop.update(flag=True))
    signal.signal(signal.SIGINT, lambda *_: stop.update(flag=True))
    state = snapshot(a.watch)
    child = subprocess.Popen(cmd)
    print(f"[dev_reload] iniciado pid={child.pid}; observando {len(state)} arquivos .py", flush=True)
    while not stop["flag"]:
        time.sleep(a.interval)
        now = snapshot(a.watch)
        changed = sorted(p for p in set(now) | set(state) if now.get(p) != state.get(p))
        if changed or child.poll() is not None:
            print(f"[dev_reload] reiniciando — {len(changed)} arquivo(s) alterado(s)" if changed else f"[dev_reload] processo saiu ({child.returncode})", flush=True)
            if child.poll() is None:
                child.terminate()
                try:
                    child.wait(10)
                except subprocess.TimeoutExpired:
                    child.kill()
            if not changed:
                time.sleep(3)
            state = now
            child = subprocess.Popen(cmd)
    if child.poll() is None:
        child.terminate()
        child.wait(10)
    return 0


if __name__ == "__main__":
    sys.exit(main())
