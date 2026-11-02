---
name: status-portal
description: Instala e configura, em qualquer projeto, o painel de acompanhamento de status do Control Center (mesmas telas do portal do cliente do legal-workspace — visão geral, fases e planejamento, tarefas, processos e capacidades, antes × agora, evolução e achados, histórico, relatórios PDF), somente leitura e derivado de backlog + eventos, com visão segura para o cliente. Use SEMPRE que o usuário pedir painel/portal/dashboard/interface de status ou acompanhamento de um projeto, "quero ver em que pé está esse projeto", relatório de evolução para cliente, "replica o painel de acompanhamento" ou "cria o status daqui", mesmo sem citar o nome da skill. Para registrar tarefas depois use status-portal-registro; para publicar use status-portal-publicar.
---

# status-portal — criar o painel de status de um projeto

Kit único, copiado para dentro do projeto (`<projeto>/status/`), que cria a **mesma interface** do portal de
acompanhamento do Control Center (o front é o mesmo código-fonte, compilado: `ui-src/` → `engine/ui/`) com os dados
**daquele** ambiente. O servidor e o CLI são Python puro (PyYAML; `reportlab` para PDF); Node só é preciso para
*reconstruir* a interface, nunca para usar o painel.

O status **nunca é digitado**: é calculado de `status/backlog.yaml` (o plano) + `status/events.jsonl` (o que aconteceu, com
data, hora e autor, encadeado por hash). Por isso a skill instala também as regras que obrigam quem trabalha a registrar
cada etapa — painel sem registro fica parado.

`<KIT>` = a pasta desta skill. Para rodar o kit use um Python com `pyyaml` e `reportlab`
(`python -m pip install pyyaml reportlab`; nesta máquina: `C:\dev\venv\legal-workspace\Scripts\python.exe`).

## As três skills

| Skill | Quando |
|---|---|
| **status-portal** (esta) | criar o painel: auditar, instalar, montar backlog/fases/gates/processos |
| **status-portal-registro** | depois: registrar sessão, tarefas, evidências, bloqueios, bastão e PDF na hora em que acontecem |
| **status-portal-publicar** | abrir para cliente/equipe: container, proxy, export estático e varredura de vazamento |

## Procedimento

Na ordem. Pare e pergunte só onde marcado **[perguntar]**; no resto decida pelo padrão e diga o que escolheu.

1. **Auditar (somente leitura).** `python <KIT>/scripts/discover.py <projeto>`: stack, testes, CI, documentos, histórico git,
   gates propostos, riscos (arquivos de segredo). Se `already_installed: true`, vá para `--upgrade` (passo 3).
2. **Definir o básico.** Título, dono/cliente (`--owner`), prefixo das tarefas (`--prefix`, 1–5 letras). Padrão: título = nome da
   pasta, prefixo = iniciais. **[perguntar]** se houver cliente externo que verá o painel e o nome não estiver claro.
3. **Instalar.** `python <KIT>/scripts/install.py <projeto> --title "..." --owner "..." --prefix X --patch-agents`.
   Não destrutivo: não sobrescreve dados existentes; só altera `status/`, 3 linhas do `.gitignore` e, com `--patch-agents`, um
   bloco delimitado no `AGENTS.md`. Atualizar só o motor/interface depois: mesma linha com `--upgrade`.
   `--demo` instala dados de exemplo (para ver o painel pronto ou tirar capturas).
4. **Montar os dados reais** seguindo `references/BOOTSTRAP.md`: backlog (uma tarefa por entrega verificável, com
   `depends_on`), fases, gates (verificações), textos executivos, e — quando houver fonte — `domains` (capacidades com a régua
   de 5 níveis), `processes`, `comparative`, achados e `comparison.yaml` (antes × agora). Regras de ouro: só escreva o que tem
   fonte (arquivo, commit, documento, o que o responsável disse); nunca declare status, datas, nível ou progresso; texto com
   vírgula ou `: ` entre aspas; deixe vazio em vez de inventar. Modelo completo: `references/DATA-MODEL.md`.
5. **Histórico já feito (opcional).** Trabalho concluído antes do painel entra por `status.py import-history arquivo.yaml`, cada
   item com datas reais e evidência (fica marcado "reconstruído"). Sem evidência, não importe.
6. **Validar.** `python <projeto>/status/status.py doctor` até `PASS`; `... gates` roda as verificações; `... state` resume. O
   `doctor` reprova campo de estado, chave desconhecida (vírgula em YAML de uma linha), tarefa inexistente e cadeia quebrada.
7. **Subir e conferir no navegador.** `... serve` → `http://127.0.0.1:8780`; confira cada aba em desktop e celular e a visão do
   cliente (`serve --role client-viewer --port 0`, que escolhe uma porta livre). Para evidência, capture telas.
8. **Publicar só se pedido** → skill `status-portal-publicar` (confirmar com o usuário antes de expor).
9. **Regras para quem trabalha no projeto.** O bloco do `AGENTS.md` (com `--patch-agents`) e a skill `status-portal-registro`
   obrigam registrar na hora. Diga ao usuário que sem isso o painel não atualiza.
10. **Relatório final:** o que foi instalado e onde, comandos de uso diário, de qual fonte saiu cada parte, o que ficou vazio por
    falta de fonte, limites (abaixo) e próximos passos.

## Fidelidade da interface

As telas são as do Control Center: o CSS é byte a byte o mesmo e o `project.tsx` é o original com só estas diferenças:
textos que dependem do projeto vêm de `labels:` no `portal.yaml` (padrões neutros), e o botão "Gerar relatório consolidado" vira
a instrução do CLI porque o servidor do kit é somente leitura. Comparado ao front original servindo os mesmos dados, a diferença
de pixels é 0,00% nas 8 abas (1440 px e 390 px) quando os textos parametrizados coincidem. Para mudar a interface: edite
`ui-src/` e rode `python <KIT>/scripts/build_ui.py` (Node + pnpm); depois `install.py --upgrade` nos projetos.

## Limites e honestidade

- O painel só sabe o que foi registrado; etapa feita e não registrada não existe para ele.
- Horas = união de sessões registradas, janelas de tarefa e atividade real (eventos, commits, arquivos). Tempo sem nenhum
  registro (só conversa/pesquisa) não conta; o método aparece no painel. Itens "reconstruídos" são rotulados assim.
- A visão do cliente é montada campo a campo com máscara e varredura; mesmo assim rode o scanner antes de abrir a terceiros.
- O servidor é somente leitura e não tem login: autenticação é do proxy/VPN.
- Docker nesta máquina: motor **Hyper-V** (regra do responsável). Nunca troque para WSL 2, nem prune/purge.

## Não faça
- Não escreva status, datas, nível ou progresso em `backlog/phases/portal/comparison.yaml`.
- Não edite `status/engine/` (é do kit; `--upgrade` o substitui) nem `events.jsonl` (só o CLI).
- Não copie dados/segredos do projeto para o painel; `.env`, chaves e dumps ficam de fora.
- Não grave no hub corporativo (`D:\dm-hub\.dm`) sem pedido: promover estas skills exige registro em `.dm/registry/skills.yaml` e
  varredura de segredos, com autorização do responsável.
- Não exponha o painel fora da máquina sem confirmação do usuário.

## Mapa do kit
`scripts/` discover · install · build_ui | `engine/` statuskit (Python) + ui (compilada) + docker | `ui-src/` fonte da interface |
`templates/` arquivos de dados e `demo/` | `references/` BOOTSTRAP · DATA-MODEL | `tests/` 31 testes (`python -m unittest discover -s tests -t .`) | `GUIA.md` guia humano.

## Servidores de teste: encerre só o que você subiu (regra de segurança)
Para conferir o painel no navegador ou rodar o scanner, suba o servidor com `--port 0 --pid-file <arquivo>` (porta livre, PID
gravado) e, ao terminar, encerre **pelo PID desse arquivo ou do processo que você iniciou**. **Nunca encerre processos "por
porta"** (`Get-NetTCPConnection -LocalPort ... | Stop-Process`, `fuser -k`, `netstat | taskkill`): a porta pode ser publicada por
outro programa — o backend do Docker Desktop publica portas do host — e matá-lo derruba containers inteiros. Nesta máquina
8765-8767 são do portal e do Control Center do escritório; nunca use essas portas.
