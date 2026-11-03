---
name: status-portal-publicar
description: Publica o painel de status de um projeto (status/status.py) para outras pessoas com segurança — container Docker em modo dev sempre ativo, proxy reverso com subdomínio (Nginx Proxy Manager), versão estática exportada ou acesso local — e varre a visão do cliente atrás de vazamentos antes de abrir. Use quando o usuário quiser que o cliente ou a equipe acompanhe o painel por link/subdomínio, "colocar o painel no ar", "rodar em container", "exportar o painel", "permitir acesso remoto", "o painel caiu" (container/proxy) ou conferir se a visão do cliente não expõe dados internos. Não serve para instalar o painel (status-portal) nem para registrar tarefas (status-portal-registro).
---

# status-portal-publicar — abrir o painel sem abrir o que não deve

O servidor do painel é **somente leitura e não tem login**. Publicar é uma decisão do responsável pelo projeto e muda
quem enxerga os dados: confirme com o usuário **antes** de expor qualquer coisa fora da máquina, e proteja o acesso com
autenticação na frente (Access List do proxy, VPN, SSO). O painel só publica a **visão do cliente** (texto sanitizado campo a
campo; o papel de administração só escuta em `127.0.0.1`).

Pré-requisito: o projeto já tem `status/status.py` (senão, use a skill `status-portal`). Para achar o painel e um Python
com PyYAML: `python ../status-portal-registro/scripts/find_status.py`.

## Procedimento

1. **Entender o público e o canal.** Quem vai ver (cliente externo, equipe), por qual endereço (subdomínio já existente?
   rede interna?), e se precisa estar sempre no ar. Pergunte só o que não der para inferir do pedido e do projeto.
2. **Escolher a opção** (tabela completa e comandos em `references/PUBLISHING.md`):
   - **A. Local** — só quem trabalha no projeto: `status.py serve` (administração, `127.0.0.1`).
   - **B. Container em modo dev** — sempre ativo, atualiza sozinho (o projeto entra por bind mount somente leitura):
     `docker compose -f status/engine/docker/compose.yml up -d --build`.
   - **C. Proxy reverso** — B (ou `serve --role client-viewer --host <IP> --trusted-proxy <IP do proxy>`) + proxy com SSL e Access List.
   - **D. Estático** — `status.py export --out dist-status`, para hospedar em qualquer servidor de arquivos.
3. **Varrer a visão do cliente ANTES de abrir** — é a etapa que protege o cliente do vazamento de caminhos, e-mails, CPF/CNPJ,
   chaves e campos administrativos:
   ```bash
   python status-portal-publicar/scripts/scan_client_view.py http://127.0.0.1:<porta> --term "Nome de pessoa que não pode aparecer"
   python status-portal-publicar/scripts/scan_client_view.py dist-status          # para export estático
   ```
   (para a URL, suba antes `status.py serve --role client-viewer --port 0 --pid-file <arquivo>`, que escolhe uma porta livre, imprime-a e grava o PID). `REPROVADO`: ajuste `redact:` e `kind: security` /
   `sensitive: true` no `portal.yaml`, reescreva o texto que vazou e repita até `LIMPO`. Não publique reprovado.
4. **Preparar a publicação (não sobe nada).** Para proxy reverso, gere o roteiro, o `.env` e o trecho do proxy de uma vez:
   ```bash
   python status-portal-publicar/scripts/prepare_publish.py <projeto> --domain status.cliente.com.br --proxy-ip <IP do NPM> [--host-ip <IP da LAN deste host>] --generate-token
   ```
   Cria `status/publicar/` com `PUBLICAR.md` (comandos na ordem), `publicar.env(.example)`, `npm-advanced.conf(.example)` e protege o
   token no `.gitignore` (o valor nunca é impresso). **`STATUS_BIND` é o IP da LAN do host Docker — não o do proxy.** O script descobre a
   interface que alcança o proxy; se houver dúvida, devolve `needs_host_ip_choice` com os candidatos e você pergunta ao usuário ou usa
   o que ele já informou (ex.: o IP para o qual o proxy atual aponta). Nunca `0.0.0.0` no host.
   Só depois de revisar, com autorização, rode os comandos do `PUBLICAR.md`. Variáveis do container: `STATUS_PORT`, `STATUS_BIND`,
   `STATUS_PROXY_TOKEN`, `STATUS_COMPOSE_NAME` (um por projeto).
5. **Verificar de fora**: `/healthz` responde 200, a interface carrega, e o scanner em modo URL passa também pelo endereço público.
6. **Entregar**: o que foi publicado e onde, o que o proxy precisa (host → IP:porta, SSL, Access List), como parar/reiniciar, e o que
   ficou pendente de decisão do responsável (autenticação, token, quem acessa).

## Regras que não mudam (e por quê)
- Fora de loopback só sobe a visão do cliente, com `--trusted-proxy` de IPs exatos, para o servidor recusar quem não é o proxy.
- Container é **somente leitura** (a pasta do projeto é montada `:ro`): ele mostra o que o CLI gravou. Registrar eventos e gerar
  PDFs (`sync`) continua sendo no CLI da máquina.
- O consolidado é só administração e nunca vai para a visão do cliente nem para o export.
- Export estático é um **retrato**: reexporte quando o status mudar (após `sync`, no CI ou agendado).
- **Docker & Runtime de Containers:** Respeite a configuração do Docker local e as políticas do host. Não faça prune destrutivo ("Clean / Purge data") nem apague volumes e discos virtuais sem autorização explícita. Se o Docker estiver indisponível, reporte ao operador antes de reiniciar serviços do sistema.
- Ações externas (subir container exposto à LAN, mexer em proxy/DNS) pedem confirmação do usuário; nunca presuma.

## Quando algo cai
Siga `references/PUBLISHING.md` (seção de verificação): `docker compose ps`, `curl /healthz`, logs; confira se o Docker está de pé
antes de recriar qualquer coisa; o container tem `restart: unless-stopped`.

## Servidores de teste: encerre só o que você subiu (regra de segurança)
Para conferir o painel no navegador ou rodar o scanner, suba o servidor com `--port 0 --pid-file <arquivo>` (porta livre, PID
gravado) e, ao terminar, encerre **pelo PID desse arquivo ou do processo que você iniciou**. **Nunca encerre processos "por
porta"** (`Get-NetTCPConnection -LocalPort ... | Stop-Process`, `fuser -k`, `netstat | taskkill`): a porta pode ser publicada por
outro programa — o backend do Docker Desktop publica portas do host — e matá-lo derruba containers inteiros. Nesta máquina
8765-8767 são do portal e do Control Center do escritório; nunca use essas portas.
