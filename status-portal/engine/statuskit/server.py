"""Servidor HTTP do painel (biblioteca padrão, SOMENTE LEITURA).

Papéis (do PROCESSO, sem senha em código):
* ADMIN (padrão) — visão completa; ``?view=admin`` devolve ids/evidências/referências; só escuta em loopback;
* CLIENT_VIEWER — só ``/api/session`` e ``/api/project/*`` com a visão SANITIZADA. É o único papel que pode escutar fora
  de loopback, e só com ``--trusted-proxy`` (IPs exatos); conexão de outra origem recebe 403.
Publicar para quem está fora da máquina exige proxy/VPN COM autenticação na frente (ver a skill status-portal-publicar).
"""
from __future__ import annotations

import hmac
import ipaddress
import json
import mimetypes
import os
import re
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from . import projection as P
from . import reports as R
from . import store as S

LOOPBACK = {"127.0.0.1", "::1", "localhost"}
ROLES = {"admin": "ADMIN", "ADMIN": "ADMIN", "client-viewer": "CLIENT_VIEWER", "client_viewer": "CLIENT_VIEWER", "CLIENT_VIEWER": "CLIENT_VIEWER"}
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY", "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; "
                               "connect-src 'self'; frame-ancestors 'none'",
}
DEFAULT_UI = Path(__file__).resolve().parent.parent / "ui"


def resolve_role(value: str | None) -> str:
    role = ROLES.get((value or "admin").strip())
    if role is None:
        raise SystemExit(f"papel inválido: {value!r} (use admin ou client-viewer)")
    return role


def trusted_proxies(value: str | None) -> list[str]:
    out = []
    for item in (value or "").replace(";", ",").split(","):
        item = item.strip()
        if item:
            try:
                out.append(str(ipaddress.ip_address(item)))
            except ValueError:
                raise SystemExit(f"--trusted-proxy inválido (use IPs exatos, sem faixa/curinga): {item!r}")
    return out


def in_container() -> bool:
    return os.environ.get("STATUS_CONTAINER") == "1" and (Path("/.dockerenv").exists() or Path("/run/.containerenv").exists())


def make_handler(ws: S.Workspace, role: str, ui_dir: Path):
    class Handler(BaseHTTPRequestHandler):
        server_version = "statuskit"
        sys_version = ""

        def log_message(self, fmt, *args):  # sem log de query string
            pass

        def parse_request(self):
            if not super().parse_request():
                return False
            allowed = getattr(self.server, "allowed_sources", None)
            if allowed is not None and self.client_address[0] not in allowed:
                self._json(403, {"error": "origem não autorizada"})
                return False
            token = getattr(self.server, "proxy_token", None)
            if token and self.client_address[0] not in LOOPBACK:
                if not hmac.compare_digest((self.headers.get("X-Portal-Proxy-Token") or "").encode(), token.encode()):
                    self._json(403, {"error": "origem não autorizada"})
                    return False
            return True

        def _send(self, code: int, body: bytes, ctype: str, extra: dict | None = None) -> None:
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(body)))
            for k, v in {**SECURITY_HEADERS, **(extra or {})}.items():
                self.send_header(k, v)
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        def _json(self, code: int, obj) -> None:
            self._send(code, json.dumps(obj, ensure_ascii=False, default=str).encode("utf-8"), "application/json; charset=utf-8")

        def do_GET(self):
            u = urlparse(self.path)
            if u.path == "/healthz":
                return self._json(200, {"ok": True})
            if u.path == "/api" or u.path.startswith("/api/"):
                parts = [unquote(p) for p in u.path.strip("/").split("/")][1:]
                if parts == ["session"]:
                    return self._json(200, {"role": role, "mode": "CLIENT_READ_ONLY" if role == "CLIENT_VIEWER" else "ADMIN"})
                if not parts or parts[0] != "project":
                    return self._json(404, {"error": "rota desconhecida"})
                m = re.match(r"^/api/project/reports/(report\.[a-z0-9.-]+)/pdf$", u.path)
                if m:
                    return self._pdf(m.group(1), parse_qs(u.query))
                try:
                    code, obj = P.route(ws, parts[1:], parse_qs(u.query), role)
                except Exception as exc:  # nunca vaza stack nem caminho
                    code, obj = 500, {"error": type(exc).__name__}
                return self._json(code, obj)
            return self._static(u.path)

        do_HEAD = do_GET

        def _deny(self):
            self._json(405, {"error": "painel somente leitura"})

        do_POST = do_PUT = do_DELETE = do_PATCH = _deny

        def _pdf(self, report_id: str, query: dict):
            rec = R.get(ws, report_id)
            if rec is None or (role != "ADMIN" and rec.get("audience") != "client"):
                return self._json(404, {"error": "relatório não encontrado"})
            got = R.pdf_bytes(ws, report_id)
            if got is None:
                return self._json(404, {"error": "PDF indisponível"})
            data, name = got
            disp = "inline" if (query.get("inline") or [""])[0] == "1" else "attachment"
            self._send(200, data, "application/pdf", {"Content-Disposition": f'{disp}; filename="{name}"'})

        def _static(self, path: str):
            if not ui_dir.is_dir():
                return self._send(503, b"UI nao encontrada.", "text/plain; charset=utf-8")
            rel = unquote(path).lstrip("/") or "index.html"
            target = (ui_dir / rel).resolve()
            if not target.is_relative_to(ui_dir.resolve()) or not target.is_file():
                target = ui_dir / "index.html"
            ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
            if ctype.startswith("text/") or ctype in ("application/javascript",):
                ctype += "; charset=utf-8"
            self._send(200, target.read_bytes(), ctype, {"Cache-Control": "no-cache"})

    return Handler


def serve(ws: S.Workspace, host: str = "127.0.0.1", port: int = 8780, role: str | None = None, trusted_proxy: str | None = None,
          ui_dir: Path | None = None) -> ThreadingHTTPServer:
    role = resolve_role(role or os.environ.get("STATUS_ROLE"))
    proxies = trusted_proxies(trusted_proxy or os.environ.get("STATUS_TRUSTED_PROXIES"))
    allowed = None
    if host not in LOOPBACK and not (host == "0.0.0.0" and in_container()):
        if role != "CLIENT_VIEWER":
            raise SystemExit("Recusado: fora de loopback só a visão do cliente (--role client-viewer); ADMIN fica em 127.0.0.1.")
        if host in ("0.0.0.0", "::"):
            raise SystemExit("Recusado: informe o IP da interface (ex.: 192.168.0.10), não todas as interfaces.")
        if not proxies:
            raise SystemExit("Recusado: bind fora de loopback exige --trusted-proxy <IP do proxy reverso>.")
        allowed = set(proxies) | {"127.0.0.1", "::1"}
    httpd = ThreadingHTTPServer((host, port), make_handler(ws, role, ui_dir or DEFAULT_UI))
    httpd.allowed_sources = allowed
    httpd.proxy_token = os.environ.get("STATUS_PROXY_TOKEN") or None
    httpd.role = role
    threading.Thread(target=lambda: P.views(ws), daemon=True, name="status-warmup").start()  # 1ª carga já em segundo plano
    return httpd
