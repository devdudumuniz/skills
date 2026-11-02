"""Sanitização da visão do CLIENTE (CLIENT_VIEWER).

Duas camadas, ambas fail-closed:
1. ``Sanitizer.text`` limpa cada frase (caminhos, URLs, portas, segredos, hashes, e-mails, telefones, CPF/CNPJ,
   nomes configurados em ``redact``);
2. ``Sanitizer.scan`` varre o DTO final e SUBSTITUI qualquer campo que ainda pareça interno por um aviso
   (nunca deixa passar).
O DTO do cliente é montado campo a campo em projection.py — nunca é uma cópia do objeto administrativo.
"""
from __future__ import annotations

import re

OMITTED = "[conteúdo técnico omitido]"
SECURITY_TITLE = "Item de segurança em tratamento"
SECURITY_TEXT = "Item de segurança identificado e em tratamento. Os detalhes ficam restritos à equipe técnica."

_CODE_SPAN = re.compile(r"`([^`]*)`")
_URL = re.compile(r"\bhttps?://\S+", re.I)
_HOSTPORT = re.compile(r"\b(?:127\.0\.0\.1|0\.0\.0\.0|localhost|::1|(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}(?:\.\d{1,3})?)(?::\d{2,5})?\b", re.I)
_PORT = re.compile(r"(?<![\d:])(?:porta\s*|port\s*|:)\d{4,5}\b", re.I)
_SECRETISH = re.compile(r"\b[A-Z][A-Z0-9]*_(?:SECRET|TOKEN|KEY|PASSWORD|PASSWD|CREDENTIAL)[A-Z0-9_]*\b")
_ENV_NAME = re.compile(r"\b[A-Z][A-Z0-9]*_[A-Z0-9_]{2,}\b")
_HEX = re.compile(r"\b[0-9a-f]{16,}\b", re.I)
_RUN_ID = re.compile(r"\b(?:run|artifact|approval|command|exec(?:ution)?)[._-][0-9a-f]{8,}[\w.-]*", re.I)
_REL_PATH = re.compile(r"(?<![\w@])(?:\.{0,2}/)?(?:[\w.-]+/)+[\w.-]*")
_FILE = re.compile(r"\b[\w.-]+\.(?:py|ts|tsx|js|mjs|jsx|json|jsonl|ya?ml|md|docx|pdf|ps1|cmd|sh|env|sqlite|toml|lock|cs|java|go|rb|php|sql|xml|csv|log)\b", re.I)
_BARE_EXT = re.compile(r"(?<![\w.])\.(?:py|ts|tsx|js|json|jsonl|ya?ml|md|docx|pdf|ps1|cmd|sh|env|sql|xml|csv)\b", re.I)
_INFRA = re.compile(r"\b(?:docker(?:-compose)?|kubernetes|k8s|stderr|stdout|traceback|stack trace|nginx|localhost)\b", re.I)
_CRED = re.compile(r"\b(?:api[_-]?key|access[_-]?token|bearer|password|passwd|senha|secret)\b\s*[:=]", re.I)
_EMAIL = re.compile(r"\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b")
_CPF = re.compile(r"\b(\d{3})[.\s]?(\d{3})[.\s]?(\d{3})[-\s]?(\d{2})\b")
_CNPJ = re.compile(r"\b(\d{2})\.?(\d{3})\.?(\d{3})/?(\d{4})-?(\d{2})\b")
_PHONE = re.compile(r"\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b")
_WIN_PATH = re.compile(r"\b[A-Za-z]:[\\/][^\s\"'<>|]*")
_POSIX_HOME = re.compile(r"(?:/home|/Users)/[^\s\"'<>|]*")
_SPACES = re.compile(r"[ \t]{2,}")

KEEP_ACRONYMS = {"API", "CPF", "CNPJ", "OAB", "PDF", "SQL", "LGPD", "CI", "UI", "UX", "IA", "SLA", "JSON", "HTML", "CSS"}

FORBIDDEN = {
    "absolute_path": re.compile(r"\b[A-Za-z]:[\\/]|(?:^|\s)/(?:home|Users|app|mnt|var|etc|tmp|opt|srv)/"),
    "url": _URL,
    "loopback_or_port": re.compile(r"\b(?:127\.0\.0\.1|0\.0\.0\.0|localhost)\b|:\d{4,5}\b(?!:)"),
    "secret_name": _SECRETISH, "credential": _CRED, "hash": re.compile(r"\b[0-9a-f]{32,}\b", re.I),
    "run_or_artifact_id": re.compile(r"\b(?:run|artifact|approval|command)[._-][0-9a-f]{8,}", re.I),
    "cpf": re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b"), "infra": _INFRA,
    "file_path": re.compile(r"\b[\w-]+/[\w./-]+\.\w{2,5}\b"),
}
SAFE_KEYS = {"ts", "at", "started_at", "completed_at", "generated_at", "last_update", "computed_at", "id", "task_id", "phase_id",
             "report_id", "milestone_id", "status", "priority", "tab", "tone", "kind", "view", "pdf_url", "json_url", "start",
             "end", "as_of"}


def initials(name: str) -> str:
    parts = [p for p in re.split(r"[\s_]+", name.strip()) if p and p.lower() not in ("da", "de", "do", "das", "dos", "e")]
    return " ".join(p[0].upper() + "." for p in parts) if parts else "***"


def _path_or_text(m: re.Match) -> str:
    """Remove o que parece caminho de repositório; mantém prosa com barra ("e/ou", "8/9", datas)."""
    tok = m.group(0)
    segs = [x for x in tok.strip("./").split("/") if x]
    if not any(re.search(r"[A-Za-z]", x) for x in segs):
        return tok
    looks_path = (tok.startswith(("./", "../", "/")) or tok.endswith("/") or re.search(r"\.[A-Za-z]\w{0,4}$", tok)
                  or any(re.search(r"[-_]", x) and re.search(r"[a-z]", x) for x in segs)
                  or (len(segs) >= 3 and all(re.fullmatch(r"[a-z0-9]+", x) for x in segs)))
    return "" if looks_path else tok


class Sanitizer:
    def __init__(self, cfg: dict | None = None):
        cfg = cfg or {}
        self.names = sorted({str(n) for n in cfg.get("redact") or [] if n and len(str(n)) >= 3}, key=len, reverse=True)
        self.pii = (cfg.get("pii") or "br") != "none"
        self.keep = KEEP_ACRONYMS | {str(a) for a in cfg.get("keep_acronyms") or []}

    def text(self, s) -> str:
        if s is None:
            return ""
        s = str(s).replace("**", "")
        s = _EMAIL.sub(lambda m: f"{m.group(1)}***@{m.group(2)}", s)
        if self.pii:
            s = _CNPJ.sub(lambda m: f"{m.group(1)}.***.***/****-{m.group(5)}", s)
            s = _CPF.sub(lambda m: f"***.{m.group(2)}.***-**", s)
            s = _PHONE.sub("(**) *****-****", s)
        s = _WIN_PATH.sub("", s)
        s = _POSIX_HOME.sub("", s)
        for n in self.names:  # frases inteiras, só palavras completas
            s = re.sub(r"(?<!\w)" + r"\s+".join(map(re.escape, n.split())) + r"(?!\w)", initials(n), s, flags=re.I)
        s = _CODE_SPAN.sub(lambda m: m.group(1) if not (_FILE.search(m.group(1)) or "/" in m.group(1) or "\\" in m.group(1)
                                                       or _ENV_NAME.search(m.group(1)) or " " in m.group(1).strip()) else "", s)
        for rx in (_URL, _HOSTPORT, _SECRETISH, _RUN_ID, _HEX, _INFRA):
            s = rx.sub("", s)
        s = _PORT.sub("", s)
        s = _REL_PATH.sub(_path_or_text, s)
        s = _FILE.sub("", s)
        s = _BARE_EXT.sub("", s)
        s = _ENV_NAME.sub(lambda m: m.group(0) if m.group(0) in self.keep else "", s)
        s = re.sub(r"\(\s*[,;:]?\s*\)", "", s)
        s = re.sub(r"\s+([,.;:)])", r"\1", s)
        return _SPACES.sub(" ", s).strip(" ,;:-—")

    @staticmethod
    def hits(s: str) -> list[str]:
        return [k for k, rx in FORBIDDEN.items() if isinstance(s, str) and rx.search(s)]

    def scan(self, obj, path: str = "", found: list | None = None):
        """Fail-closed: o que ainda parecer interno é substituído (e contado)."""
        found = [] if found is None else found
        if isinstance(obj, str):
            key = path.rsplit(".", 1)[-1].replace("[]", "")
            if key in SAFE_KEYS:
                return obj
            h = self.hits(obj)
            if h:
                found.append({"field": path, "patterns": h})
                return OMITTED
            return obj
        if isinstance(obj, list):
            return [self.scan(v, f"{path}[]", found) for v in obj]
        if isinstance(obj, dict):
            return {k: self.scan(v, f"{path}.{k}" if path else k, found) for k, v in obj.items()}
        return obj

    def sanitize_tree(self, obj, key: str = ""):
        if isinstance(obj, str):
            return obj if key in SAFE_KEYS else self.text(obj)
        if isinstance(obj, list):
            return [self.sanitize_tree(v, key) for v in obj]
        if isinstance(obj, dict):
            return {k: self.sanitize_tree(v, k) for k, v in obj.items()}
        return obj
