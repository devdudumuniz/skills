#!/usr/bin/env python3
"""Varre a VISÃO DO CLIENTE do painel atrás de vazamentos antes de publicá-la.

    python scan_client_view.py http://127.0.0.1:<porta>            # servidor rodando com --role client-viewer
    python scan_client_view.py dist-status                      # pasta gerada por `status export`
    python scan_client_view.py <alvo> --term "Fulano da Silva"  # palavras que NÃO podem aparecer (repita --term)

Procura caminhos de arquivo, URLs/IPs/portas internas, e-mails, CPF/CNPJ, telefones, chaves/tokens, hashes longos e
campos administrativos (source_hash, where, refs). Em modo URL também confere o comportamento: métodos de escrita
respondem 405, `?view=admin` é ignorado e o relatório consolidado (só administração) não é servido.
Saída: lista de achados (rota + trecho) e código 1 se houver algum; 0 se limpo. Somente leitura.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROUTES = ["session", "project/overview", "project/phases", "project/tasks", "project/processes", "project/capabilities",
          "project/comparative", "project/findings", "project/comparison", "project/quality", "project/reports",
          "project/timeline?limit=500"]
PROBES = {
    "caminho Windows": r"\b[A-Za-z]:\\[^\s\"']+",
    "caminho Unix": r"(?<![\w.])/(?:home|Users|etc|var|opt|srv|mnt|root|tmp)/[\w.\-/]+",
    "URL absoluta": r"https?://[^\s\"']+",
    "IP/localhost": r"\b(?:\d{1,3}\.){3}\d{1,3}\b|\blocalhost\b",
    "host:porta": r"\b[A-Za-z][\w.-]*:\d{2,5}\b(?!:)",
    "e-mail": r"[\w.+-]+@[\w-]+\.[\w.-]+",
    "CPF": r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b",
    "CNPJ": r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b",
    "telefone": r"\(?\b\d{2}\)?\s?9?\d{4}-\d{4}\b",
    "chave/token": r"\bsk-[A-Za-z0-9_-]{16,}|\bghp_[A-Za-z0-9]{20,}|\bAKIA[0-9A-Z]{16}\b|\bxox[abp]-[\w-]{10,}|-----BEGIN [A-Z ]*KEY|\bBearer\s+[\w.-]{16,}",
    "hash longo": r"\b[0-9a-fA-F]{32,}\b",
}
ADMIN_KEYS = ("source_hash", "\"where\"", "\"refs\"", "\"assignee\"", "\"completed_by\"")


def fetch(base: str, route: str, method: str = "GET") -> tuple[int, str]:
    req = urllib.request.Request(f"{base.rstrip('/')}/api/{route}", method=method, data=b"{}" if method != "GET" else None)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def scan_text(where: str, text: str, terms: list[str]) -> list[tuple[str, str, str]]:
    hits = []
    for label, rx in PROBES.items():
        for m in re.finditer(rx, text):
            s = m.group(0)
            hits.append((where, label, s[:60] + ("…" if len(s) > 60 else "")))
    for k in ADMIN_KEYS:
        if k in text:
            hits.append((where, "campo administrativo", k))
    low = text.lower()
    for t in terms:
        if t.lower() in low:
            hits.append((where, "termo proibido", t))
    return hits


def main() -> int:
    for _s in (sys.stdout, sys.stderr):                 # consoles cp1252 (Windows) quebram com "→" e "…"
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("target", help="URL base (http://host:porta) ou pasta de um export estático")
    ap.add_argument("--term", action="append", default=[], help="texto que não pode aparecer (nome de cliente/pessoa)")
    a = ap.parse_args()
    hits: list[tuple[str, str, str]] = []
    checks: list[str] = []
    if re.match(r"^https?://", a.target):
        for r in ROUTES:
            code, body = fetch(a.target, r)
            if code != 200:
                hits.append((r, "rota não respondeu 200", str(code)))
                continue
            hits += scan_text(r, body, a.term)
        tasks = json.loads(fetch(a.target, "project/tasks")[1] or "[]")
        for t in tasks[:50]:
            hits += scan_text(f"project/tasks/{t['id']}", fetch(a.target, f"project/tasks/{t['id']}")[1], a.term)
        ov = json.loads(fetch(a.target, "project/overview?view=admin")[1])
        checks.append(("?view=admin ignorado", ov.get("view") == "client"))
        checks.append(("POST responde 405", fetch(a.target, "project/tasks", "POST")[0] == 405))
        checks.append(("consolidado (admin) não é servido", fetch(a.target, "project/reports/report.consolidated")[0] == 404))
    else:
        base = Path(a.target)
        files = sorted((base / "api").rglob("*.json")) if (base / "api").is_dir() else []
        if not files:
            print(f"Nenhum JSON em {base}/api — é a pasta de um `status export`?", file=sys.stderr)
            return 2
        for f in files:
            hits += scan_text(str(f.relative_to(base)), f.read_text(encoding="utf-8"), a.term)
        idx = (base / "index.html").read_text(encoding="utf-8") if (base / "index.html").is_file() else ""
        checks.append(("index.html presente com a interface", "assets/" in idx))
        checks.append(("snapshot sem consolidado de administração", not any("consolidated" in f.name for f in files)))
    bad_checks = [n for n, ok in checks if not ok]
    for n, ok in checks:
        print(("OK    " if ok else "FALHA ") + n)
    if hits:
        print(f"\n{len(hits)} possível(is) vazamento(s):")
        uniq: dict[tuple[str, str, str], int] = {}
        for h in hits:
            uniq[h] = uniq.get(h, 0) + 1
        for (where, label, snip), n in list(uniq.items())[:80]:
            print(f"  [{label}] {where}: {snip}" + (f"  (x{n})" if n > 1 else ""))
        if len(uniq) > 80:
            print(f"  … e mais {len(uniq) - 80}")
    verdict = "LIMPO" if not hits and not bad_checks else "REPROVADO"
    print(f"\nResultado: {verdict}")
    return 0 if verdict == "LIMPO" else 1


if __name__ == "__main__":
    sys.exit(main())
