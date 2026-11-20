# Especificação de Perfil de Agente (`profile-spec.md`)

Um agente especializado precisa de contrato explícito, legível por humanos e validável por máquina — nunca apenas um prompt solto.

## Campos Obrigatórios

| Campo | Tipo | Objetivo | Regra |
|---|---|---|---|
| `schema_version` | `string` | Versão do contrato (`0.1.0`) | SemVer não vazio |
| `id` | `string` | Identificador estável do agente | `kebab-case` (3–64 chars) |
| `name` | `string` | Nome amigável exibido na interface | Claro e único |
| `role` | `string` | Papel técnico único do agente | Evitar agrupar cargos concorrentes |
| `mission` | `string` | Escopo mensurável e fronteira de atuação | Explicitar o que NÃO faz |
| `tone` | `string` | Estilo de comunicação esperado | Objetivo e verificável |
| `optional_voice` | `object` | Configuração opcional de voz | `enabled: false` por padrão |
| `model` | `object` | Motor de inferência e janela de contexto | Sem promessa universal de hardware |
| `permissions` | `object` | Política de acesso no servidor | `default_policy: "deny"`, `enforcement_layer: "server"` |
| `tools` | `array` | Capacidades tipadas (API, CLI, MCP) | Apenas `credential_source: "env_ref" \| "none"` |
| `memory` | `object` | Política de sessão, durabilidade e TTL | `authorized_retrieval_only: true` |
| `execution_loop` | `object` | Estágios, timeouts, idempotência e fallback | `["request","plan","tool","verify","respond"]` |
| `acceptance_criteria` | `array` | Critérios objetivos para homologação | Mínimo 1 critério verificável |

## Separação de Responsabilidades

- **Camada de Identidade (Persona)**: orienta clareza, tom e formatação. **Não aplica segurança.**
- **Camada de Controle (Servidor / RBAC)**: decide se o usuário/tenant pode invocar cada ferramenta, aplica rate-limit, timeout, aprovação humana e redação de logs.
