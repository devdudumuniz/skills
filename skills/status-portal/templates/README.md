# status/ — painel de acompanhamento deste projeto

Painel somente leitura que mostra onde o projeto está: fases, tarefas, próximo passo, o que aguarda decisão,
qualidade, linha do tempo, horas trabalhadas e relatórios em PDF por fase. **Ninguém edita o status**: ele é derivado.

| Arquivo | O que é | Quem mexe |
|---|---|---|
| `backlog.yaml` | o plano: tarefas, prioridades, dependências | humano/agente (sem estado) |
| `events.jsonl` | o que aconteceu (iniciou, concluiu, bloqueou), encadeado por hash | só o CLI |
| `phases.yaml` | agrupa tarefas em fases e marcos | humano/agente |
| `portal.yaml` | título, verificações (gates), textos executivos | humano/agente |
| `comparison.yaml` | aba "Antes × agora" (opcional) | humano/agente |
| `reports/` | PDFs por fase e registro | gerado por `sync` |
| `engine/` | o motor do kit (substituído em upgrade) | **não editar** |

## Uso diário
```bash
python status/status.py doctor                      # valida tudo
python status/status.py session start --actor agent:meu-id
python status/status.py next                        # próxima tarefa
python status/status.py work start T-002 --actor agent:meu-id
python status/status.py gates                       # roda as verificações do portal.yaml
python status/status.py work done T-002 --actor agent:meu-id --evidence <arquivo|commit>
python status/status.py sync                        # PDF da fase concluída
python status/status.py handoff --actor agent:meu-id --summary "feito / pendente"
python status/status.py serve                       # http://127.0.0.1:8780  (somente leitura)
python status/status.py export --out dist-status    # versão estática para hospedar
```
Regras para agentes: `AGENT-RULES.md`. Skills: `status-portal` (criar), `status-portal-registro` (registrar na hora), `status-portal-publicar` (publicar com segurança).
