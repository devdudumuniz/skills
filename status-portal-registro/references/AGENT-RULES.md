# Regras para agentes: como o status chega ao painel

## Pergunta que sempre aparece: o painel se atualiza sozinho?

**A tela sim; o conteúdo não.** O painel recalcula a cada consulta (cache curto) e a página se atualiza sozinha a cada
30 segundos, **mas só enxerga o que foi registrado** em `events.jsonl` pelo CLI. Quem trabalha (agente ou pessoa) precisa
registrar cada etapa **no momento em que ela acontece**. Etapa concluída e não registrada não existe para o painel nem
para as horas trabalhadas. Por isso estas regras vão para o `AGENTS.md`/`CLAUDE.md` do projeto
(`install.py --patch-agents` faz isso com um bloco delimitado por `<!-- status-portal:begin/end -->`).

## Ciclo obrigatório

| Momento | Comando |
|---|---|
| abrir a sessão | `status.py session start --actor agent:<id>` |
| escolher o que fazer | `status.py next` (ou `work list --status TODO`) |
| assumir a tarefa | `status.py work start <ID> --actor agent:<id>` |
| terminou a entrega | `status.py gates` → `status.py work done <ID> --actor agent:<id> --evidence <arquivo\|commit\|link>` **imediatamente** |
| dependência externa | `status.py work block <ID> --reason "o que falta"` |
| fase concluída | `status.py sync` (gera o PDF) |
| encerrar a sessão | `status.py handoff --actor agent:<id> --summary "feito / pendente" [--next "..."]` |

## Regras

1. **Registrar na hora**, não no fim da sessão.
2. **Granularidade = tarefa do backlog.** Várias entregas verificáveis ou mais de uma sessão → quebrar em tarefas
   (com `depends_on`) para cada conclusão aparecer.
3. **Nunca deixar `IN_PROGRESS` parada.** Ao sair sem concluir: `work block` (motivo) ou `handoff` dizendo o que falta.
4. **Tarefa nova entra em uma fase** (`phases.yaml`) e, se for uma capacidade, em `domains` (`migrated_by`/`tested_by` no `portal.yaml`). Nunca escrever
   status, datas ou progresso nesses arquivos (o `doctor` reprova).
5. **Concluir exige** evidência + PASS das verificações da tarefa registrado depois do início; tarefa com aprovação humana
   só um humano conclui. Usar sempre o `--actor` real. Nunca inventar estado nem editar `events.jsonl`.
6. **Não editar `status/engine/`.** Atualização do motor: `install.py --upgrade` (a partir da skill).
7. Commits/push seguem a regra do projeto (pedir autorização quando exigido).

## Quem aparece como executor

O executor mostrado é quem **registrou** o evento. Ações do próprio sistema (rodar verificações, gerar relatório, fluxo
agendado) aparecem com o rótulo de `orchestrator.label` (padrão "Automação"; use "Zuza Agent" ou outro nome). Para agentes
use ids estáveis (`agent:claude-code`, `agent:codex`) e dê um rótulo em `portal.yaml → actors`.

## Variáveis úteis

- `STATUS_ACTOR=agent:<id>` — dispensa `--actor` em todos os comandos da sessão.
- `STATUS_ROOT=<pasta do projeto>` — usar o CLI de fora da pasta do projeto.

## Adaptar para outro arquivo de instruções

O texto pronto está em `status-portal/templates/AGENT-RULES.md` (≈20 linhas). Cole em `CLAUDE.md`, `.cursorrules` ou
`.github/copilot-instructions.md` se o projeto não usa `AGENTS.md`. Mantenha os caminhos `status/status.py`.
