"""Utilidades compartilhadas. Só biblioteca padrão; PyYAML é a única dependência obrigatória (reportlab é opcional, p/ PDF)."""
from __future__ import annotations

import hashlib
import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path

VERSION = "1.0.0"


class StatusError(Exception):
    """Erro de uso/validação (mensagem já pronta para o usuário)."""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def parse_ts(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        d = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def canonical_json(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_json(obj) -> str:
    return sha256_bytes(canonical_json(obj).encode("utf-8"))


def load_yaml(path: Path | str):
    try:
        import yaml
    except ImportError as exc:  # pragma: no cover - mensagem de uso
        raise StatusError("PyYAML ausente. Instale com: python -m pip install pyyaml") from exc
    p = Path(path)
    if not p.is_file():
        return {}
    try:
        return yaml.safe_load(p.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        raise StatusError(f"YAML inválido em {p.name}: {exc}") from exc


def dump_yaml(obj) -> str:
    import yaml
    return yaml.safe_dump(obj, allow_unicode=True, sort_keys=False, default_flow_style=False, width=120)


def atomic_write_text(path: Path | str, text: str) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(p.parent), prefix=p.name + ".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        os.replace(tmp, p)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


def fmt_hours(seconds: int | None) -> str:
    if seconds is None:
        return "não registrado"
    h, m = divmod(int(seconds) // 60, 60)
    return f"{h}h {m:02d}min" if h else f"{m}min"


def fmt_day(ts: str | None) -> str:
    d = parse_ts(ts)
    return d.strftime("%d/%m/%Y") if d else "não registrado"


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
