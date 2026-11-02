#!/usr/bin/env python3
"""Prepara os arquivos para publicar o painel atrás de um proxy reverso (NÃO sobe nada, NÃO altera proxy/DNS).

    python prepare_publish.py <projeto> --domain status.cliente.com.br --proxy-ip 192.168.1.50
                              [--host-ip IP] [--port 8780] [--name status-meuprojeto] [--generate-token] [--out status/publicar]

Cria em <projeto>/status/publicar/: PUBLICAR.md (roteiro com os comandos), publicar.env.example, npm-advanced.conf.example e,
com --generate-token, publicar.env e npm-advanced.conf com um token novo (o valor NUNCA é impresso; os dois arquivos entram no
.gitignore). Acrescenta ao .gitignore do projeto. Recusa 0.0.0.0.

--host-ip é o IP da LAN do host Docker (NÃO o do proxy). Sem ele, o script descobre a interface que alcança o proxy e a usa se
for inequívoca; se houver dúvida, deixa o marcador <IP_LAN_DO_HOST> e lista os candidatos para a pessoa escolher.
"""
from __future__ import annotations

import argparse
import ipaddress
import json
import re
import secrets
import socket
import sys
from pathlib import Path

GITIGNORE = ["status/publicar/publicar.env", "status/publicar/npm-advanced.conf", "dist-status/"]


def candidate_ips(proxy_ip: str) -> tuple[str | None, list[str]]:
    """(IP da interface que alcança o proxy, todos os IPv4 privados do host)."""
    via = None
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect((proxy_ip, 80))          # UDP: não envia nada, só escolhe a interface de saída
            via = s.getsockname()[0]
    except OSError:
        pass
    ips: set[str] = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ips.add(info[4][0])
    except OSError:
        pass
    if via:
        ips.add(via)
    private = sorted(i for i in ips if ipaddress.ip_address(i).is_private and not i.startswith("127.") and not i.startswith("169.254."))
    return via if via and via in private else None, private


def render_runbook(domain: str, proxy_ip: str, host_ip: str, port: int, name: str, has_token: bool, others: list[str]) -> str:
    warn = (f"\n> **Confirme o IP do host:** este host tem mais de um IP privado ({', '.join(others)}). O roteiro usa `{host_ip}`; "
            f"troque `STATUS_BIND` e o destino do Proxy Host se o proxy alcança outro.\n") if others else ""
    return f"""# Publicar o painel em https://{domain}

Preparado por `prepare_publish.py`. **Nada foi subido e o proxy não foi alterado**: execute os passos abaixo depois de revisar.

## 0. Antes de tudo
{warn}- Confirme com o responsável: quem verá `https://{domain}` e que a autenticação (Access List/VPN) será configurada no proxy.
  O painel **não tem login**; sem Access List qualquer pessoa com a URL vê tudo.
- Docker neste ambiente usa o motor **Hyper-V**; não troque de motor nem reinicie o Docker Desktop por causa deste passo.

## 1. Conferir o que o cliente enxerga (tem que dar LIMPO)
```bash
python status/status.py serve --role client-viewer --port 0 --pid-file status/publicar/serve.pid   # imprime a porta livre
python <skill status-portal-publicar>/scripts/scan_client_view.py http://127.0.0.1:<porta> --term "<nome que não pode aparecer>"
# encerre o servidor SÓ pelo PID do arquivo (nunca por porta)
```

## 2. Variáveis
```bash
copy status\\publicar\\publicar.env.example status\\publicar\\publicar.env     # se ainda não existe
```
Preencha `STATUS_BIND={host_ip}` (IP da LAN deste host; nunca `0.0.0.0`), `STATUS_PORT={port}` e o token
({"já gerado em publicar.env" if has_token else "gere com `prepare_publish.py --generate-token`, que não imprime o valor"}).

## 3. Subir o container (somente leitura, modo dev, reinicia sozinho)
```bash
docker compose --env-file status/publicar/publicar.env -f status/engine/docker/compose.yml up -d --build
docker compose --env-file status/publicar/publicar.env -f status/engine/docker/compose.yml ps
curl http://{host_ip}:{port}/healthz
```

## 4. Nginx Proxy Manager ({proxy_ip})
- Proxy Host: **{domain}** → `http://{host_ip}:{port}` · Block Common Exploits ligado · Websockets desligado.
- SSL: certificado (Let's Encrypt) + Force SSL.
- **Access List** com usuário/senha do cliente (obrigatório).
- Aba Advanced: cole `npm-advanced.conf` (cabeçalho `X-Portal-Proxy-Token`; sem ele o painel responde 403 fora do proxy).
- DNS: registro de `{domain}` apontando para o NPM.

## 5. Verificar de fora
```bash
curl -I https://{domain}/healthz          # 401 sem credencial (Access List) e 200 com ela
python <skill status-portal-publicar>/scripts/scan_client_view.py https://{domain}   # use a rede/credencial de teste
```

## 6. Operar
- Atualizar status: o CLI grava (`work done`, `sync`); o container só lê e a tela se atualiza a cada 30 s.
- Parar: `docker compose --env-file status/publicar/publicar.env -f status/engine/docker/compose.yml down` (nada do projeto é apagado).
- Reverter: remover o Proxy Host no NPM e dar `down`.

## Pendências do responsável
- [ ] Access List criada · [ ] DNS · [ ] certificado · [ ] token no proxy e no `publicar.env` iguais · [ ] revisão do que o cliente vê
"""


def main() -> int:
    for _s in (sys.stdout, sys.stderr):
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project")
    ap.add_argument("--domain", required=True)
    ap.add_argument("--proxy-ip", required=True)
    ap.add_argument("--host-ip")
    ap.add_argument("--port", type=int, default=8780)
    ap.add_argument("--name")
    ap.add_argument("--generate-token", action="store_true")
    ap.add_argument("--out", default="status/publicar")
    a = ap.parse_args()
    root = Path(a.project).resolve()
    if not (root / "status" / "engine" / "docker" / "compose.yml").is_file():
        print(f"{root} não tem o painel instalado (status/engine/docker/compose.yml). Use a skill status-portal.", file=sys.stderr)
        return 2
    if not re.fullmatch(r"[A-Za-z0-9.-]+", a.domain):
        print("--domain inválido", file=sys.stderr)
        return 2
    try:
        ipaddress.ip_address(a.proxy_ip)
    except ValueError:
        print("--proxy-ip inválido", file=sys.stderr)
        return 2
    via, cands = candidate_ips(a.proxy_ip)
    host_ip = a.host_ip or via or (cands[0] if len(cands) == 1 else None)
    if host_ip in ("0.0.0.0", "::"):
        print("Recusado: STATUS_BIND não pode ser 0.0.0.0; informe o IP da interface da LAN.", file=sys.stderr)
        return 2
    if host_ip == a.proxy_ip:
        print("Atenção: o IP do host Docker não é o do proxy; ignorando e pedindo escolha.", file=sys.stderr)
        host_ip = None
    placeholder = host_ip is None
    host_ip = host_ip or "<IP_LAN_DO_HOST>"
    name = a.name or f"status-{re.sub(r'[^a-z0-9]+', '-', root.name.lower()).strip('-')}"
    out = (root / a.out).resolve()
    if not str(out).startswith(str(root)):
        print("--out deve ficar dentro do projeto", file=sys.stderr)
        return 2
    out.mkdir(parents=True, exist_ok=True)
    created = []

    def write(fname: str, text: str) -> None:
        (out / fname).write_text(text, encoding="utf-8", newline="\n")
        created.append(str((out / fname).relative_to(root)).replace("\\", "/"))

    write("publicar.env.example", f"""# Copie para publicar.env (este arquivo é o modelo, sem segredos).
STATUS_BIND={host_ip}
STATUS_PORT={a.port}
STATUS_COMPOSE_NAME={name}
STATUS_PROXY_TOKEN=
""")
    write("npm-advanced.conf.example", 'proxy_set_header X-Portal-Proxy-Token "COLE_O_TOKEN_DO_publicar.env";\n')
    token = None
    if a.generate_token:
        token = secrets.token_urlsafe(32)
        write("publicar.env", f"STATUS_BIND={host_ip}\nSTATUS_PORT={a.port}\nSTATUS_COMPOSE_NAME={name}\nSTATUS_PROXY_TOKEN={token}\n")
        write("npm-advanced.conf", f'proxy_set_header X-Portal-Proxy-Token "{token}";\n')
    others = [i for i in cands if i != host_ip] if not placeholder and not a.host_ip else []
    write("PUBLICAR.md", render_runbook(a.domain, a.proxy_ip, host_ip, a.port, name, bool(token), others))
    gi = root / ".gitignore"
    cur = gi.read_text(encoding="utf-8") if gi.is_file() else ""
    add = [l for l in GITIGNORE if l not in cur.splitlines()]
    if add:
        gi.write_text(cur + ("" if cur.endswith("\n") or not cur else "\n") + "# status-portal (publicação)\n" + "\n".join(add) + "\n",
                      encoding="utf-8", newline="\n")
    print(json.dumps({"created": created, "host_ip": None if placeholder else host_ip, "host_ip_candidates": cands,
                      "needs_host_ip_choice": placeholder, "host_ip_other_candidates": others, "token_generated": bool(token), "gitignore_added": add}, ensure_ascii=False, indent=2))
    if placeholder:
        print("\nAtenção: não deu para decidir o IP da LAN do host Docker. Escolha entre os candidatos e rode de novo com --host-ip.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
