# Integração à Stack Existente (`stack-integration.md`)

O objetivo do **Agent Profile Builder** é acoplar o agente ao sistema que já existe — **sem migrar frameworks, bancos ou provedores**.

## Princípios de Integração

1. **Canal não substitui ferramenta**:
   - Chat web, Slack, Discord, WhatsApp ou webhook são apenas canais de entrada/saída.
   - Regras de negócio, leitura de banco e mutações devem viver em ferramentas tipadas (`API`, `CLI` ou `MCP`) sob controle do backend.
2. **Permissões sempre no servidor**:
   - O agente recebe apenas a lista de ferramentas permitidas para a sessão autenticada.
   - Antes de executar qualquer tool call, o servidor revalida escopo (`user_id`, `tenant_id`, role), allowlist e necessidade de aprovação humana.
3. **Credenciais fora do prompt e fora do perfil**:
   - O arquivo JSON de perfil declara apenas `credential_source: "env_ref"` e o nome simbólico da variável (`env_var_name`), ou `"none"`.
   - O executor no servidor injeta a credencial no momento da chamada HTTP/SDK e remove qualquer segredo dos logs.
4. **Idempotência e Rollback**:
   - Ferramentas com efeito colateral exigem chave de idempotência (`Idempotency-Key`), timeout explícito e procedimento documentado de reversão antes da ativação em produção.
