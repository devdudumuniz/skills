# Testes, Ciclo de Execução & Critérios de Aceite (`testing-and-acceptance.md`)

## Ciclo de Execução Obrigatório

Todo agente integrado deve seguir cinco estágios observáveis:

```text
request → plan → tool → verify → respond
```

- **Timeout**: limite total do ciclo (`execution_loop.timeout_ms`) e limite individual por ferramenta (`tool.timeout_ms`).
- **Idempotência**: reexecuções causadas por retry de rede não podem duplicar efeitos colaterais.
- **Rastreamento com logs redigidos (`tracing_redacted_logs: true`)**: registrar `trace_id`, estágios, ferramentas chamadas e tempos de resposta, mascarando segredos e PII.
- **Fallback humano (`human_fallback: true`)**: diante de erro repetido, baixa confiança ou bloqueio de permissão, encaminhar contexto resumido para um operador humano.

## Checklist de Verificação Antes de Commit / Push

1. Validar o contrato do perfil:
   ```bash
   python3 skills/agent-profile-builder/scripts/validate_profile.py \
     skills/agent-profile-builder/assets/agent-profile.example.json
   ```
2. Rodar testes de regressão do validador:
   ```bash
   python3 -m unittest discover -s skills/agent-profile-builder/scripts/tests -v
   ```
3. Quando integrado a um repositório alvo:
   - Executar **lint** do projeto alvo;
   - Executar **testes automatizados** do projeto alvo;
   - Executar **build** do projeto alvo;
   - Executar **verificação de segredos** (nenhum `.env`, token, chave ou endpoint privado exposto).
