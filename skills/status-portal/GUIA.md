# Guia — painel de status para qualquer projeto

## O que é

Uma interface web **somente leitura** que mostra em que pé o projeto está: fases, tarefas, próximo passo, o que aguarda
decisão, qualidade (testes/verificações), linha do tempo, horas trabalhadas, relatórios em PDF por fase e, se quiser, um
comparativo **antes × agora** com decisões, motivos, impacto e erros encontrados.

Princípio: **ninguém edita o status**. Ele é calculado de dois arquivos:

| Arquivo | Papel |
|---|---|
| `status/backlog.yaml` | **o plano** (o que precisa ser feito). Nunca guarda estado. |
| `status/events.jsonl` | **o que aconteceu** (iniciou, concluiu, bloqueou), com data/hora e autor, encadeado por hash. Só o CLI escreve. |

Se uma tarefa foi feita e ninguém registrou, o painel **não** sabe. Por isso existe a regra de registrar na hora (abaixo).

## Requisitos

- Python 3.10+ com `pyyaml` e (para PDF) `reportlab`: `python -m pip install pyyaml reportlab`.
- Git é opcional (usado só como evidência de atividade e para reconstruir histórico).
- Docker é opcional (só para deixar o painel sempre ativo; ver a skill `status-portal-publicar`).

## Em 10 minutos

Substitua `<KIT>` pela pasta desta skill (`~/.claude/skills/status-portal`) e `<projeto>` pela pasta do projeto.

```bash
# 1) olhar o projeto (não altera nada)
python <KIT>/scripts/discover.py <projeto>

# 2) instalar (não destrutivo)
python <KIT>/scripts/install.py <projeto> --title "Meu Projeto" --owner "Minha Empresa" --prefix PROJ --patch-agents

# 3) editar os dados reais (ver references/BOOTSTRAP.md)
#    <projeto>/status/backlog.yaml · phases.yaml · portal.yaml

# 4) validar e abrir
python <projeto>/status/status.py doctor
python <projeto>/status/status.py serve        # http://127.0.0.1:8780
```

Quer ver o painel pronto antes de configurar o seu? Instale a demonstração numa pasta de teste:

```bash
python <KIT>/scripts/install.py C:\temp\demo --title "Demo" --owner "Exemplo" --prefix D --demo
python C:\temp\demo\status\status.py serve
```

Dica: peça ao Claude **"use a skill status-portal neste projeto"**; ele faz os passos 1–4, monta o backlog a partir
dos documentos e do git, e entrega o relatório do que usou como fonte.

## Uso diário (de quem trabalha no projeto)

```bash
python status/status.py session start --actor agent:meu-id     # ao abrir a sessão
python status/status.py next                                   # o que fazer agora
python status/status.py work start PROJ-002 --actor agent:meu-id
python status/status.py gates                                  # roda testes/verificações do portal.yaml
python status/status.py work done PROJ-002 --actor agent:meu-id --evidence src/mod.py a1b2c3d
python status/status.py sync                                   # gera o PDF da fase concluída
python status/status.py handoff --actor agent:meu-id --summary "feito: X; falta: Y"
```

`--actor` é `agent:<id>` (IA) ou `human:<nome>`. Se omitir, usa `STATUS_ACTOR` ou `human:<usuário do sistema>`.

**Regras que o painel impõe (não dá para burlar pelo CLI):**
- só começa tarefa que está pendente, com dependências concluídas e sem bloqueio externo;
- concluir exige **evidência** (arquivo, commit, link) **e** as verificações da tarefa em PASS registradas depois do início;
- tarefa que exige aprovação humana só um humano conclui; só humano reabre;
- verificação é uma lista fixa de comandos em `portal.yaml` (sem shell, texto de tarefa nunca vira comando).

## O que cada aba mostra

| Aba | Conteúdo |
|---|---|
| Visão geral | situação, % concluído, fase atual, próximo passo, o que aguarda decisão, qualidade, horas |
| Fases e planejamento | fases e marcos, com progresso e datas reais |
| Tarefas | todas, por situação (concluídas, em execução, próximas, bloqueadas), com evidências e verificações |
| Processos e capacidades | tabela de processos e cartões de capacidades, cada um com a **régua de 5 níveis** (Identificada → Em migração → Implementada → Testada → Homologada), derivada das tarefas (`domains` no `portal.yaml`) |
| Antes × agora | fluxos (antes/agora), principais mudanças, decisões e erros encontrados, com a situação derivada das tarefas (`comparison.yaml`) |
| Evolução e achados | tabela "Ambiente atual × nova plataforma" (`comparative`), cards de evolução (existia, identificado, preservado, reconstruído, melhorado, falta) e achados do levantamento |
| Histórico | linha do tempo de eventos e horas por dia |
| Relatórios | PDFs por fase concluída (+ consolidado para administração) |

## Visões e segurança

- **Administração** (`serve`, padrão): tudo, só em `127.0.0.1`.
- **Cliente** (`serve --role client-viewer`): texto sanitizado campo a campo (sem caminhos, URLs, portas, e-mails,
  CPF/CNPJ, telefones, hashes, segredos), tarefas `kind: security` aparecem só como "Item de segurança em tratamento";
  os nomes em `redact:` viram iniciais. Esta é a única visão que pode ser publicada.
- O servidor **não tem login**: publique atrás de proxy/VPN com autenticação (skill `status-portal-publicar`).

## Personalizar

Tudo em `status/portal.yaml`: título, textos do resumo, rótulos de quem executa (`actors`), nome da automação
(`orchestrator.label`, ex.: "Zuza Agent"), verificações (`gates`), agrupamento da qualidade, `redact`, `domains`/`processes`/`comparative`, achados e `labels` (textos que dependem do projeto).
Cada campo está comentado no próprio arquivo. Modelo completo: `references/DATA-MODEL.md`.

## Atualizar o motor em projetos já instalados

```bash
python <KIT>/scripts/install.py <projeto> --upgrade
```
Substitui só `status/engine/`; backlog, fases, portal, comparação, eventos e relatórios ficam intactos.

## Problemas comuns

| Sintoma | Causa / solução |
|---|---|
| `doctor` FAIL "campo desconhecido" | vírgula dentro de texto em YAML de uma linha cortou o campo → coloque o texto entre aspas ou use o formato em bloco |
| Item de lista virou mapa | texto com `: ` sem aspas → entre aspas |
| Painel não mostra o que foi feito | etapa não registrada (`work done`) ou tarefa grande demais → quebre em tarefas menores |
| `work done` recusado | falta evidência ou verificações em PASS depois do início (`status.py gates`) |
| Horas parecem baixas | só conta sessão/tarefa/atividade registrada; abra a sessão (`session start`) e feche com `handoff` |
| PDF não sai | `python -m pip install reportlab` (sem ele, só JSON) |
| Fase "Outras tarefas" | tarefa sem fase em `phases.yaml` |
| Fora de loopback recusa subir | só a visão do cliente, com `--trusted-proxy <IP do proxy>` (ou container) |

## Testes do kit

```bash
cd <KIT> && python -m unittest discover -s tests -t .
```
