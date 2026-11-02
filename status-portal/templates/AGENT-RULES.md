## Painel de acompanhamento — como o status chega lá (obrigatório)

O painel de status deste projeto (`python status/status.py serve`) **não tem status próprio e ninguém o edita**: ele
recalcula sozinho a partir de `status/backlog.yaml` (o plano) + `status/events.jsonl` (o que aconteceu, encadeado por
hash) + as verificações. Por isso ele só mostra o que o agente **registrou**. Regras:

1. **Registre no momento em que acontece**, não no fim da sessão:
   `python status/status.py session start --actor agent:<seu-id>` ao abrir · `work start <ID>` ao assumir ·
   ao terminar uma tarefa: `gates` → `work done <ID> --evidence <arquivo|commit|link>` **imediatamente** ·
   dependência externa: `work block <ID> --reason "..."` · ao encerrar: `handoff --summary "..."`.
   Etapa terminada e não registrada **não existe** para o painel nem para as horas trabalhadas.
2. **Granularidade = tarefa do backlog.** Trabalho com várias entregas verificáveis, ou que dura mais de uma sessão,
   deve ser **quebrado em tarefas** em `status/backlog.yaml` (uma por entrega, com `depends_on`), para que cada conclusão
   apareça no painel.
3. **Nunca deixe tarefa `IN_PROGRESS` parada.** Ao sair sem concluir: `work block` (com o motivo) ou `handoff` dizendo o
   que falta. Tarefa aberta sem atividade não soma horas, mas aparece como "em execução".
4. **Toda tarefa nova entra em uma fase** de `status/phases.yaml` (só agrupamento; sem fase vai para "Outras tarefas") e,
   se for uma capacidade/área, em `domains` (`migrated_by`/`tested_by`) de `status/portal.yaml`. Nunca escreva status, datas ou progresso nesses arquivos
   (`python status/status.py doctor` reprova).
5. **Depois de concluir:** `python status/status.py sync` gera o PDF da fase que acabou de ficar concluída.
6. Concluir exige **evidência** e **PASS das verificações da tarefa registrado depois do início**; tarefa que exige
   aprovação humana só um humano conclui. Use sempre o seu `--actor` real. Nunca invente estado.
7. Commits/push seguem a regra do projeto (peça autorização quando exigido).
