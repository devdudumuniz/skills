#!/usr/bin/env python3
"""Lançador do painel de status: python status/status.py <comando>  (veja `status.py --help` e status/README.md)."""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
os.environ.setdefault("STATUS_ROOT", str(HERE.parent))
sys.path.insert(0, str(HERE / "engine"))

from statuskit.cli import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
