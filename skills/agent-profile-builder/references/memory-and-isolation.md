# Memória, TTL & Isolamento (`memory-and-isolation.md`)

Memória mal projetada é uma das principais fontes de vazamento entre clientes e respostas desatualizadas.

## Camadas de Memória

1. **Memória de Sessão (`session_enabled: true`)**:
   - Mantém contexto da conversa atual com janela limitada e descarte automático ao fim da sessão.
   - É o padrão seguro para começar.
2. **Memória Durável Opcional (`durable_enabled: false` por padrão)**:
   - Habilitar apenas quando houver caso de uso claro (preferências persistentes, histórico aprovado de atendimento).
   - Exige política de retenção (`ttl_days`), rotina de expiração e possibilidade de exclusão sob demanda.

## Invariantes de Isolamento

- **Escopo estrito (`user-tenant-isolated`)**: toda leitura e escrita de memória precisa filtrar obrigatoriamente por `tenant_id` e `user_id` autenticados pelo servidor (nunca fornecidos livremente pelo prompt).
- **Recuperação autorizada (`authorized_retrieval_only: true`)**: documentos recuperados via busca ou RAG devem respeitar exatamente as permissões do solicitante atual.
- **Zero segredos na memória**: tokens, senhas, chaves privadas e dados sensíveis não autorizados devem ser filtrados antes da persistência.
