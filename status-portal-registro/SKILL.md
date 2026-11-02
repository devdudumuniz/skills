---
name: status-portal-registro
description: Registra no painel de status do projeto (status/status.py) cada etapa de trabalho NO MOMENTO em que acontece — abrir sessão, assumir tarefa, rodar verificações, concluir com evidência, bloquear, passar o bastão e gerar o PDF da fase. Use SEMPRE que estiver trabalhando em um projeto que tenha status/status.py, quando o AGENTS.md/CLAUDE.md citar o painel de acompanhamento, e quando o usuário disser "registra no painel", "conclui a tarefa X", "atualiza o status", "marca como feito", "o painel não atualizou", "passa o bastão" ou pedir para fechar a sessão — mesmo sem citar o nome da skill. Não serve para instalar nem publicar o painel (isso é status-portal e status-portal-publicar).
---

# status-portal-registro — manter o painel verdadeiro

O painel de status **não tem status próprio e ninguém o edita**: ele recalcula a cada consulta a partir de
`status/backlog.yaml` (o plano) + `status/events.jsonl` (o que aconteceu, com data, hora e autor, encadeado por hash).
Por isso ele só mostra o que **você registrou**. Etapa terminada e não registrada não existe para o painel, para o
cliente que o acompanha nem para as horas trabalhadas. Registrar é parte de terminar o trabalho, não um extra.

## 0. Achar o painel do projeto

```bash
python <esta-skill>/scripts/find_status.py            # procura status/status.py subindo a partir da pasta atual
python <esta-skill>/scripts/find_status.py --run state   # acha, escolhe um Python com PyYAML e roda `status.py state`
```
Imprime a raiz do projeto e o comando exato (`<python> <raiz>/status/status.py`). Use-o como `STATUS` nos exemplos
abaixo. Se não achar nenhum painel, o projeto não tem um: use a skill `status-portal` para instalar (não improvise).

## 1. O ciclo (registre na hora, não no fim da sessão)

| Momento | Comando |
|---|---|
| abrir a sessão | `STATUS session start --actor agent:<seu-id>` |
| situar-se | `STATUS state` e `STATUS next` (`--human` inclui tarefas de pessoas) |
| assumir | `STATUS work start <ID> --actor agent:<seu-id>` |
| terminou a entrega | `STATUS gates` → `STATUS work done <ID> --actor agent:<seu-id> --evidence <arquivo\|commit\|link>` **imediatamente** |
| dependência externa | `STATUS work block <ID> --actor ... --reason "o que falta"` |
| fase fechou | `STATUS sync` (gera o PDF da fase concluída) |
| encerrar | `STATUS handoff --actor ... --summary "feito / pendente" [--next "..."]` |

`<seu-id>` é estável e real (`agent:claude-code`, `agent:codex`). `STATUS_ACTOR=agent:<id>` no ambiente dispensa o `--actor`.
Nunca use um ator que não seja você: o painel mostra quem executou.

## 2. Decisões que exigem julgamento

- **Granularidade = tarefa do backlog.** Se o trabalho tem várias entregas verificáveis, ou dura mais de uma sessão,
  quebre em tarefas novas em `status/backlog.yaml` (uma por entrega, com `depends_on`, dentro de uma fase de
  `phases.yaml`). Assim cada conclusão aparece. Mostrar "em execução" por dias é pior do que várias tarefas pequenas.
- **Evidência de verdade.** `--evidence` recebe o que prova a entrega: arquivo gerado/alterado, hash de commit, link de
  relatório. Evidência vazia ou inventada é recusada pelo CLI e, se não fosse, enganaria o cliente.
- **Concluir exige PASS das verificações** da tarefa registrado *depois* do início. Rode `STATUS gates` (ou
  `--only nome`) antes. Se uma verificação falha, a tarefa **não** está pronta: corrija ou bloqueie, não contorne.
  `--skip-gates-reason` é só para pessoas e fica registrado; agentes não o usam.
- **Aprovação humana.** Tarefa com `requires_human_approval` só uma pessoa conclui. Reabrir tarefa concluída
  (`work reopen`) também é só humano. Não tente por outro ator.
- **Nunca deixe `IN_PROGRESS` parada.** Ao sair sem concluir: `work block` com o motivo ou `handoff` dizendo o que falta.
- **Nunca edite `events.jsonl`** nem `status/engine/`, nem escreva status, datas ou progresso nos YAML (o `doctor`
  reprova). Se a cadeia de eventos estiver quebrada (`doctor` FAIL), pare e avise o responsável.

## 3. Quando pedirem para "marcar como feito" sem estar feito

O painel é mostrado a clientes; um status falso é pior do que um painel atrasado. Se pedirem para concluir algo sem
evidência, sem verificações em PASS, ou que ainda depende de outra tarefa:
1. não registre; explique em uma frase o que falta (o CLI recusa e diz o motivo);
2. ofereça o caminho honesto: terminar e registrar com evidência, ou `work block` com o motivo, ou quebrar a tarefa;
3. se a pessoa insistir que **ela** aprova sem verificações, quem executa é um humano com `--skip-gates-reason`.

## 4. Fechar o trabalho
1. `STATUS doctor` → PASS (confere plano, referências e cadeia).
2. `STATUS sync` se alguma fase ficou concluída.
3. `STATUS handoff ...` com o que foi feito, o que ficou pendente e o próximo passo.
4. Diga ao usuário, em poucas linhas: tarefas concluídas/bloqueadas (ids), evidências usadas, o que ficou pendente.
   Commit/push só se o projeto ou o usuário pedirem.

## Problemas comuns
| Sintoma | Causa e saída |
|---|---|
| `work start` recusado | dependências não concluídas, bloqueio externo ou executor humano: leia a mensagem; `STATUS next` mostra o que dá |
| `work done` recusado | falta evidência ou `gates` em PASS depois do início: rode `STATUS gates` |
| `doctor` FAIL "campo desconhecido" | vírgula/`: ` dentro de texto no YAML: coloque o texto entre aspas |
| "painel não atualizou" | falta registrar (`work done`); a tela se atualiza a cada 30 s; veja `STATUS state` |
| PDF não sai | `python -m pip install reportlab` |
| ModuleNotFoundError: yaml | o Python escolhido não tem PyYAML: use `find_status.py`, que testa os candidatos |

Mais detalhes (por que cada regra existe, variáveis de ambiente, como aparece o executor): `references/AGENT-RULES.md`.

## Servidores de teste: encerre só o que você subiu (regra de segurança)
Para conferir o painel no navegador ou rodar o scanner, suba o servidor com `--port 0 --pid-file <arquivo>` (porta livre, PID
gravado) e, ao terminar, encerre **pelo PID desse arquivo ou do processo que você iniciou**. **Nunca encerre processos "por
porta"** (`Get-NetTCPConnection -LocalPort ... | Stop-Process`, `fuser -k`, `netstat | taskkill`): a porta pode ser publicada por
outro programa — o backend do Docker Desktop publica portas do host — e matá-lo derruba containers inteiros. Nesta máquina
8765-8767 são do portal e do Control Center do escritório; nunca use essas portas.
