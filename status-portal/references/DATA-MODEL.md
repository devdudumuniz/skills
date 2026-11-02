# Modelo de dados e regras

Tudo mora em `<projeto>/status/`. Plano e configuração são YAML escrito por humano/agente; eventos são escritos **só pelo CLI**.

```
status/
  backlog.yaml      plano: tarefas (sem estado)
  phases.yaml       fases e marcos (só agrupam)
  portal.yaml       título, gates, textos executivos, domains/processes/comparative, achados, evolução, labels, redação para o cliente
  comparison.yaml   aba "Antes × agora" (opcional)
  events.jsonl      histórico encadeado por hash (SHA-256: seq, prev_hash, hash)
  reports/          PDFs por fase + registry.jsonl
  handoffs/         passagens de bastão (+ HANDOFF.md)
  last-gates.json   último resultado das verificações (ignorado pelo git)
  engine/           motor do kit (substituído em --upgrade)
  status.py         lançador
```

## Estado derivado

Estado da tarefa: `TODO` → `IN_PROGRESS` → `DONE`, ou `BLOCKED`. É **calculado** repetindo os eventos
(`TASK_STARTED`, `TASK_BLOCKED`, `TASK_UNBLOCKED`, `TASK_COMPLETED`, `TASK_REOPENED`). Também existem `GATES_RECORDED`,
`SESSION_STARTED`, `HANDOFF_RECORDED`, `REPORT_REGISTERED`, `REPORT_ARTIFACT_REGISTERED`, `PHASE_COMPLETED`, `MILESTONE_DELIVERED`.
O `doctor` reprova `status`, `started_at`, `completed_at`, `assignee`, `progress` declarados em qualquer arquivo de plano.

Regras aplicadas pelo CLI:
1. só `TODO` pode iniciar, com todas as `depends_on` em `DONE` e sem `blocked_by` pendente;
2. `done` exige evidência **e** PASS de todos os `gates` da tarefa registrado **depois** do início
   (humano pode usar `--skip-gates-reason "motivo"`, que fica registrado);
3. `requires_human_approval: true` → só ator `human:*` conclui;
4. só humano reabre tarefa concluída (`work reopen --reason`); `work unblock` remove um bloqueio registrado;
5. cadeia de hash verificada pelo `doctor`; evento adulterado ou fora de ordem reprova.

## backlog.yaml

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | sim | `<PREFIXO>-NNN`, único |
| `title` | sim | título técnico |
| `priority` | não (P2) | `P0` crítica · `P1` alta · `P2` média · `P3` baixa |
| `kind` | não | `dev`, `docs`, `ops`, `security`, `decision`, `input`… (`security` é mascarado para o cliente) |
| `executor` | não (`any`) | `agent` · `human` · `any` — papel previsto (o executor **real** vem do evento) |
| `goal` | recomendado | o que a tarefa entrega, em uma frase |
| `steps` / `acceptance` | recomendado | passos e critérios de aceite (lista de textos) |
| `depends_on` | não | lista de ids; define a ordem e o "próximo passo" |
| `blocked_by` | não | lista de bloqueios **externos** (credencial, decisão do cliente); aparece como "Aguardando…" |
| `requires_human_approval`, `approval_reason` | não | exige humano para concluir |
| `gates` | não | nomes de verificações definidas em `portal.yaml` |
| `refs`, `context` | não | referências livres (admin) |

Chave fora desta lista reprova no `doctor` (quase sempre é vírgula dentro de texto num mapa de uma linha).

## phases.yaml

`phases: [{id, title, description, objective, tasks: [ids]}]` e `milestones: [{id, title, description, phase, tasks}]`.
Situação da fase: `COMPLETED` (todas `DONE`), `IN_PROGRESS` (alguma em execução ou concluída), `WAITING` (todas aguardando
humano/bloqueio), senão `NOT_STARTED` ("Planejada"). Uma tarefa em duas fases reprova. Tarefa sem fase vai para "Outras tarefas".
Marco entregue = todas as suas tarefas `DONE`.

## portal.yaml (principais chaves)

| Chave | Efeito |
|---|---|
| `project.title/office/report_heading` | cabeçalho e capa dos PDFs |
| `task_id_prefix` | prefixo das tarefas |
| `summary.objective/modernizing` | "Resumo do projeto" |
| `actors` / `actor_types` | rótulo de quem executou (`"agent:claude-code": Claude Code`) |
| `orchestrator` | ações do próprio sistema (verificações, relatórios, fluxos agendados) aparecem com este rótulo (ex.: "Zuza Agent") |
| `hours` | `session_gap_minutes` (30), `idle_cutoff_minutes` (180), `git` (true), `file_evidence` (`null` = projeto todo; `[]` = nenhuma pasta; ou `[src, docs]`) |
| `gates` | verificações permitidas: `{label, cmd: [argv...], parse, metric, cwd, timeout}`. Sem shell; `{python}` = interpretador atual; `parse` = regex com 1 grupo numérico → `metric` (ex.: nº de testes) |
| `quality_groups` | agrupa gates na seção Qualidade |
| `client.mask_kinds` | `kind` mascarados para o cliente (padrão `[security]`) |
| `redact` | nomes a mascarar nos textos do cliente (viram iniciais) |
| `pii` | `br` (CPF/CNPJ/telefone) ou `none` |
| `tasks` | `{ID: {title, goal}}` — texto executivo por tarefa (sem entrada, usa o backlog sanitizado) |
| `domains` | capacidades (cartões) com a **régua de 5 níveis** derivada das tarefas: `{id, label, what_it_does, input, output, priority, automation?, migrated_by[], tested_by[], homologated_by[], next_milestone, skills?, components?}` |
| `processes` | tabela "Processos" (opcional; sem ela, uma linha por domínio): `{process, domain?, objective?, automation?, priority?, next_milestone?}` |
| `comparative` | tabela "Ambiente atual × nova plataforma": `{category, current, new, source}`; aceita `{tests_count}`, `{tasks_done}`… |
| `labels` | textos que dependem do projeto: `modernizing`, `nothing_waiting`, `processes_title`, `capabilities_title`, `capabilities_intro`, `comparative_title`, `before_after_intro`, `automation_pill` (todos opcionais) |
| `areas` | formato antigo (`{id, label, what, tasks…}`); ainda é lido e convertido em `domains` (as tarefas viram `migrated_by`) |
| `findings` | `{id, title, category, description, impact, action, tasks, sensitive}` |
| `evolution` | cards `existed/identified/preserved/rebuilt/improved` com `{items: [...]}`; aceita `{tasks_done}`, `{tasks_total}`, `{tests_count}`, `{hours_worked}` |

## comparison.yaml

Quatro listas: `flows` (`name`, `before[]`, `now[]`), `changes` (`decision`, `why`, `impact`), `decisions` (`why`, `impact`),
`errors` (`what`, `where`, `sensitive`). Todos aceitam `source` (documento que sustenta) e `tasks`. A situação mostrada
(Feito / Em andamento / Aguardando / Em aberto / **Sem tarefa vinculada**) é derivada das tarefas ligadas. Erro sem tarefa
é, por si só, um achado: crie a tarefa. `where` e `source` nunca vão ao cliente.

## Horas trabalhadas

União, sem dupla contagem, de: (1) sessões (`session start` → `handoff`); (2) janelas de tarefa (início → conclusão/bloqueio);
(3) atividade reconstruída de carimbos reais (eventos, commits, arquivos modificados), agrupada com pausas ≤ `session_gap_minutes`.
Em (1) e (2) pausas sem nenhum registro maiores que `idle_cutoff_minutes` são descontadas (tarefa esquecida aberta não soma).
Tempo sem registro algum não conta. Blocos aparecem como "registrada" ou "reconstruída".

## Visão do cliente (CLIENT_VIEWER)

Montada **campo a campo** a partir da visão de administração (nunca filtrando um JSON completo), com `Sanitizer.text`
(caminhos, URLs, portas, e-mails, CPF/CNPJ/telefone, segredos, hashes, nomes de `redact`) e uma varredura final que
substitui qualquer vazamento por "[conteúdo técnico omitido]". Não contém: ids de evidência, caminhos, `source_hash`, `where`,
`refs`, saída bruta de comandos. Tarefas `security`/`sensitive` aparecem como "Item de segurança em tratamento".

## Relatórios

Um PDF por fase **concluída** e um consolidado (só administração). Versionados por `source_hash` do conteúdo: mesma fonte →
`REUSED`, fonte mudou → nova versão (`CREATED`). `registry.jsonl` encadeia e `report verify` confere. Sem `reportlab`, sai só JSON.
`sync` gera os que faltam; rode depois de concluir tarefas.
