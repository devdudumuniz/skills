# Como montar os dados de um projeto novo (sem inventar)

Objetivo: o painel refletir **o que existe de verdade**. Cada afirmação precisa de fonte (arquivo, commit, documento,
conversa com o responsável). Na dúvida, deixe vazio: um painel honesto e curto vale mais que um bonito e inventado.

## 0. Entradas
- Saída de `scripts/discover.py` (stack, docs, git, testes, gates propostos, riscos).
- Documentos de plano/decisão/levantamento do projeto (README, ROADMAP, TODO, ADRs, planos).
- Histórico do git (`git log`), issues/tickets se o usuário fornecer.
- O que o usuário disser em chat (registre como fonte "informado pelo responsável em <data>").

## 1. Backlog (`status/backlog.yaml`)
1. Liste as **entregas verificáveis** do projeto: algo que dá para dizer "feito" com evidência (arquivo, commit, teste).
   Uma tarefa por entrega; trabalho que dura mais de uma sessão ou tem várias entregas vira várias tarefas.
2. Ordene por dependência real (`depends_on`). Não invente dependência para "ficar bonito".
3. Prioridade: `P0` bloqueia o projeto/risco alto · `P1` essencial · `P2` normal · `P3` desejável.
4. `executor`: `agent` (IA pode fazer sozinha), `human` (decisão, credencial, aprovação do cliente), `any`.
5. Dependência externa que só uma pessoa resolve → `blocked_by: ["o que falta"]`. Decisão que o cliente precisa aprovar →
   `requires_human_approval: true` + `approval_reason`.
6. Tarefa de segurança/credencial/dado pessoal → `kind: security` (o cliente verá só "Item de segurança em tratamento").
7. Atribua `gates` às tarefas de código (ex.: `[tests]`) para que a conclusão exija as verificações em PASS.
8. Formato em **bloco** (não `{a: b, c: d}`) para textos; texto com vírgula, `: ` ou `#` entre aspas.

Exemplo mínimo:
```yaml
tasks:
  - id: PROJ-001
    title: Levantar o sistema atual
    priority: P0
    kind: docs
    executor: any
    goal: "Mapear módulos, dados e integrações."
    acceptance: ["Documento de levantamento publicado"]
  - id: PROJ-002
    title: Migrar o módulo de catálogo
    priority: P1
    kind: dev
    executor: agent
    depends_on: [PROJ-001]
    gates: [tests]
```

## 2. Fases (`status/phases.yaml`)
Agrupe por **etapa do projeto** (ex.: Levantamento → Construção → Validação → Virada), 3 a 6 fases. Cada tarefa em
exatamente uma fase. `objective` = resultado esperado da fase em uma frase. Marcos só quando houver entregas que o
cliente reconhece como marco.

## 3. Verificações (`gates` em `status/portal.yaml`)
Use o que o projeto **já tem**: `discover.py` propõe (testes, lint, build). Comando como lista de argumentos, sem shell:
```yaml
gates:
  tests:
    label: Testes automatizados
    cmd: ["{python}", "-m", "pytest", "-q"]
    parse: "(\\d+) passed"      # regex com 1 grupo numérico
    metric: tests               # aparece como "nº de testes" no painel
  build:
    label: Build
    cmd: ["pnpm", "run", "build"]
    cwd: web                    # opcional, relativo ao projeto
quality_groups:
  - {id: tests, label: Testes, gates: [tests]}
  - {id: build, label: Build, gates: [build]}
```
Rode `status.py gates` uma vez para ver se passam antes de exigi-las nas tarefas. Gate que o projeto não consegue rodar
ainda: não defina (a seção Qualidade mostra "Não registrado", que é verdade).

## 4. Textos executivos (`portal.yaml`)
- `project.title/office`, `summary.objective` (para que o projeto existe) e `summary.modernizing` (o que está sendo feito
  agora) — retire de README/planos; uma ou duas frases, linguagem de cliente, sem jargão.
- `redact:` nomes de clientes/pessoas que não podem aparecer na visão do cliente.
- `tasks:` título/objetivo executivo só para tarefas cujo texto técnico não serve ao cliente.
- `orchestrator.label`: nome para automações do sistema (ex.: "Zuza Agent"); `actors`: rótulos para agentes/pessoas.

## 5. Histórico anterior (opcional)
Tarefas **já concluídas antes do painel** entram com `status.py import-history arquivo.yaml`:
```yaml
done:
  - id: PROJ-001
    started_at: "2026-08-01T09:00:00+00:00"      # datas REAIS (commits, arquivos, documentos)
    completed_at: "2026-08-03T17:30:00+00:00"
    evidence: [docs/levantamento.md, a1b2c3d]    # obrigatória
    actor: human:maria                            # opcional
    note: "Reconstruído do git e do documento X"
```
Trabalho que já começou e ainda não terminou entra em `in_progress:` com `id`, `started_at` real e `note` (sem evidência, pois
ainda não concluiu). Ficam marcados "reconstruído". Datas futuras ou conclusão sem evidência são recusadas. Sem fonte de data, não importe: deixe a tarefa
pendente e conclua de verdade quando for verificada.

## 6. Processos, capacidades, achados, antes × agora (opcional, só com fonte)
- `domains`: capacidades do sistema (o que faz, entrada, saída). A régua de 5 níveis sai das tarefas: `migrated_by` (quem constrói/migra), `tested_by` (quem testa), `homologated_by` (aprovação). Nunca escreva nível ou status.
- `processes`: tabela executiva (um processo por linha, ligado a um domínio); sem ela, uma linha por domínio.
- `comparative`: tabela "Ambiente atual × nova plataforma" (categoria, como era, como ficou, fonte).
- `labels`: ajuste os textos que citam o contexto do projeto (ex.: "Processos do escritório").
- `findings`: problemas/riscos encontrados no levantamento, com impacto e ação; sensíveis com `sensitive: true`.
- `comparison.yaml`: como era × como está (fluxos), por que decidiu e impacto (mudanças/decisões), erros encontrados.
  Cada item cita `source` e liga `tasks`. **Erro sem tarefa = crie a tarefa** (o painel o mostra como "Sem tarefa vinculada").

## 7. Conferência
```bash
python status/status.py doctor      # PASS
python status/status.py gates       # (opcional) registra PASS/FAIL inicial
python status/status.py state
python status/status.py serve       # abrir e revisar cada aba
```
Revise a visão do cliente (`serve --role client-viewer --port 0` (imprime a porta livre escolhida)): nenhum caminho, e-mail, documento ou nome que não deva sair.

## Antes de entregar, checklist
- [ ] `doctor` PASS · testes do projeto não quebraram (o kit só escreve em `status/`)
- [ ] nenhuma tarefa/fase com estado declarado · nenhuma data inventada
- [ ] cada item de domains/achados/comparação tem `source` (ou fonte registrada na revisão)
- [ ] visão do cliente revisada · `.env`/chaves fora do painel
- [ ] regras de agente no `AGENTS.md` (`--patch-agents`) · `.gitignore` atualizado
- [ ] usuário informado do que ficou vazio e por quê
