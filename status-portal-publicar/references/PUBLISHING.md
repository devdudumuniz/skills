# Publicar o painel

O servidor é **somente leitura** e **não tem login**. Qualquer exposição fora da máquina é decisão do responsável e deve
ter autenticação na frente (proxy com Access List, VPN, SSO). Escolha **uma** opção.

| Opção | Quando usar | Comando |
|---|---|---|
| A. Local | só quem trabalha no projeto | `python status/status.py serve` (`127.0.0.1:8780`, visão de administração) |
| B. Container dev | quer o painel sempre ativo, atualizando sozinho | `docker compose -f status/engine/docker/compose.yml up -d --build` |
| C. Proxy reverso | cliente/equipe acessa por subdomínio | B (ou `serve --role client-viewer --host <IP> --trusted-proxy <IP do proxy>`) + proxy |
| D. Estático | hospedar em qualquer lugar (Pages, S3, intranet) | `python status/status.py export --out dist-status` |

## Papéis

- **ADMIN** (padrão): visão completa (`?view=admin` devolve ids/evidências); **só escuta em loopback**.
- **CLIENT_VIEWER** (`--role client-viewer` ou `STATUS_ROLE`): visão sanitizada; só `/api/session`, `/api/project/*`,
  `/healthz` e a interface. É o único papel que pode escutar fora de loopback.
- Qualquer método além de GET responde 405. `?view=admin` é ignorado nesse papel.

## B. Container em modo dev (sempre ativo, sem rebuild)

- Imagem mínima (Python + PyYAML + reportlab). **O projeto entra por bind mount somente leitura** em `/project`; o motor
  vem de lá, então nada do projeto é copiado para a imagem. Evento novo e mudança de YAML aparecem sozinhos; mudança em `.py`
  do motor reinicia o servidor (`dev_reload.py`, 2 s). Rebuild só se mudar dependência.
- `restart: unless-stopped`: sobe junto com o Docker. Usuário sem privilégios, `read_only`, `cap_drop: ALL`, `no-new-privileges`.
- Variáveis (arquivo `.env` ao lado do `compose.yml` ou ambiente):
  `STATUS_PORT` (8780) · `STATUS_BIND` (127.0.0.1; para proxy na LAN use o **IP da interface**, nunca `0.0.0.0` no host) ·
  `STATUS_PROXY_TOKEN` (opcional) · `STATUS_COMPOSE_NAME` (nome do container; use um por projeto).
- Verificar: `docker compose -f status/engine/docker/compose.yml ps` e `curl http://127.0.0.1:8780/healthz`.
- Parar: `... down` (nada do projeto é apagado).
- **Limitação:** o container é somente leitura e visão do cliente. Para registrar eventos, gerar PDFs (`sync`) e ver a visão
  de administração, rode o CLI na máquina (`python status/status.py ...`): o container só lê o que o CLI gravou.
- **Nesta máquina (anton-server):** Docker Desktop usa o motor **Hyper-V**. Nunca ligue o motor WSL 2, não reinicie o Docker
  Desktop por conta própria, não faça prune/"Clean / Purge data" e não apague `.vhdx`. Docker parado: peça ao responsável.

## C. Proxy reverso (ex.: Nginx Proxy Manager)

1. Suba B com `STATUS_BIND=<IP da LAN do host>` e `STATUS_PORT=<porta>`.
2. No proxy: host `<subdominio>` → `http://<IP da LAN>:<porta>`, Websockets desligado (não usa), SSL/Let's Encrypt, **Access List**
   (usuário/senha) para o cliente. Sem Access List o painel fica aberto a quem souber a URL.
3. Fora de container, o servidor exige `--trusted-proxy <IP do proxy>` (IPs exatos); conexão de outra origem recebe 403.
4. Opcional, reforço: defina `STATUS_PROXY_TOKEN` e faça o proxy enviar o cabeçalho `X-Portal-Proxy-Token: <valor>`
   (Advanced → `proxy_set_header X-Portal-Proxy-Token "<valor>";`). Sem o cabeçalho, 403.
5. Teste de fora da rede: abrir `https://<subdominio>/healthz` (200) e conferir que `/api/project/overview` não traz caminhos,
   e-mails ou segredos.

## D. Estático

`python status/status.py export --out dist-status` gera HTML + JSONs da **visão do cliente** + PDFs (`files/`). É um retrato
do momento: reexporte quando o status mudar (ex.: no CI ou após `sync`). Hospede em qualquer servidor de arquivos; proteja o
acesso no hospedeiro. Não há API viva nem o log de eventos.

## Checklist de segurança antes de abrir a terceiros

Rode primeiro o scanner: `python scripts/scan_client_view.py <URL do client-viewer | pasta do export> --term "nome que não pode sair"` (da skill `status-portal-publicar`); só publique com `LIMPO`.

- [ ] `serve --role client-viewer` (ou export) revisado: sem caminho, URL interna, e-mail, CPF/CNPJ, token, hash de commit privado
- [ ] `redact:` com nomes de pessoas/clientes que não podem aparecer
- [ ] tarefas sensíveis com `kind: security` ou `sensitive: true`
- [ ] autenticação no proxy (Access List/VPN); HTTPS ativo
- [ ] `.env`, chaves e dumps fora do projeto publicado (o painel não os lê, mas o bind mount expõe a pasta **ao container**: somente leitura)
- [ ] responsável autorizou a publicação
