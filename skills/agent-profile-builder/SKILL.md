---
name: agent-profile-builder
description: >-
  Arquiteta e especifica um agente de IA especializado com identidade, personalidade, escolha de modelo
  (incluindo piloto local como qwen3.5:4b em Ollama), permissoes deny-by-default no servidor,
  ferramentas (API/CLI/MCP), memoria isolada por usuario/tenant, ciclo de execucao e criterios de aceite
  dentro de uma stack existente, sem migrar ou recriar o sistema.
---

# Agent Profile Builder (Deda Skills • Kit Técnico v0.1)

**Autoria:** Eduardo Muniz (`@devdudumuniz`) • **Licença:** MIT  
**Modo de execução:** `plan-first` (auditoria e especificação antes de qualquer integração)

Esta skill orienta a adição de **um agente especializado com perfil próprio** a um sistema **existente**, preservando a stack autorizada. **Ela é um artefato de engenharia e especificação — não é um runtime, servidor, agente autônomo pronto nem integração de produção.**

> **Regra de ouro:** *O modelo solicita, a aplicação decide.* Uma `SKILL.md` ou um prompt de persona **nunca** é mecanismo de autorização. RBAC, allowlists, isolamento de tenant e aprovação humana devem ser aplicados no servidor.

---

## 1. Quando Usar (e Quando Não Usar)

- **Use quando** precisar projetar e integrar um agente com identidade, modelo, ferramentas, memória e limites reais dentro de um repositório/stack já existente.
- **Não use para** reescrever a arquitetura da aplicação, enviar mensagens reais em demonstrações, embutir credenciais em prompts/arquivos de perfil ou prometer autonomia sem revisão humana em ações sensíveis.

---

## 2. Fluxo Determinístico em 8 Etapas

Siga rigorosamente a ordem abaixo. **Primeiro audite; não implemente integrações externas sem autorização explícita.**

### Etapa 1 — Auditar a Stack Existente (Sem Migração)
1. Inspecione o repositório alvo (`package.json`, `pyproject.toml`, `go.mod`, rotas de API, autenticação, banco, filas e logs).
2. Identifique onde já existem:
   - camada de autenticação/autorização (RBAC/ABAC, isolamento por `user_id`/`tenant_id`);
   - clientes HTTP/SDKs/CLIs ou servidores MCP já utilizados pela equipe;
   - mecanismo de variáveis de ambiente e cofre de segredos.
3. Registre o que será reaproveitado e o que ainda precisa ser implementado na stack autorizada.

### Etapa 2 — Escolher o Motor / Modelo
Consulte `references/model-selection.md`.
- Para um **piloto local de tarefas simples com tool calling**, considere `qwen3.5:4b` no Ollama:
  - O catálogo oficial lista ~3,3 a 4,0 GB de arquivos de modelo, **mas isso não equivale à RAM/VRAM total necessária** (contexto, quantização, KV cache, runtime e concorrência aumentam o consumo).
  - Comece com janela de contexto controlada e valide tool calling no hardware alvo.
  - Tarefas de planejamento profundo, programação extensa ou contextos longos podem exigir modelos maiores.
- **"Local" não garante offline**: o modelo pode rodar localmente, mas canais e APIs externas (WhatsApp, SMS, telefonia, CRMs, ERPs) continuam usando rede, provedores e políticas externas.

### Etapa 3 — Definir Identidade & Personalidade
Consulte `references/profile-spec.md`.
Preencha no contrato JSON (`assets/agent-profile.example.json`):
- `id` e `name` claros;
- `role` (papel técnico único — evite misturar múltiplos cargos num só perfil);
- `mission` (objetivo mensurável e limites do escopo);
- `tone` (tom de comunicação objetivo e verificável);
- `optional_voice` (desativado por padrão; habilitar apenas quando houver requisito real, orçamento e política de privacidade).

### Etapa 4 — Criar Limites Reais no Servidor (`deny-by-default`)
- Defina `permissions.default_policy: "deny"` e `permissions.enforcement_layer: "server"`.
- Liste explicitamente apenas ferramentas necessárias em `permissions.allowed_tools` (allowlist mínima).
- Declare ações proibidas em `permissions.denied_actions`.
- Exija aprovação humana (`permissions.human_approval_required_for`) para qualquer ação sensível, financeira, destrutiva ou com envio externo.

### Etapa 5 — Conectar a Stack (API, CLI, MCP)
Consulte `references/stack-integration.md`.
- Exponha capacidades como ferramentas tipadas com schema de entrada/saída, `timeout_ms` e flag `idempotent`.
- **Canal não substitui ferramenta**: receber mensagem via chat/WhatsApp/webhook é apenas transporte; a ação de negócio deve passar por ferramenta autenticada no backend.
- **Credenciais sempre fora do prompt**: use exclusivamente referências indiretas (`credential_source: "env_ref"` ou `"none"`), nunca tokens, senhas ou URLs privadas literais.

### Etapa 6 — Projetar Memória & Isolamento
Consulte `references/memory-and-isolation.md`.
- Comece com memória de **sessão** (`session_enabled: true`) e torne a memória **durável** opcional (`durable_enabled: false` até justificar necessidade).
- Aplique obrigatoriamente:
  - `scope: "user-tenant-isolated"` (ou isolamento equivalente por usuário/tenant);
  - `ttl_days` explícito para retenção e expiração;
  - `authorized_retrieval_only: true` (nunca recuperar contexto de outro usuário ou tenant).

### Etapa 7 — Definir o Ciclo de Execução
Estruture o runtime alvo com o ciclo explícito:
`request → plan → tool → verify → respond`
- `timeout_ms` por execução e por ferramenta;
- `max_steps` limitado para impedir loops infinitos;
- `idempotency_required: true` para operações com efeito colateral;
- `tracing_redacted_logs: true` (logs auditáveis com redação automática de segredos e PII);
- `human_fallback: true` (escalonamento limpo em caso de erro, ambiguidade ou bloqueio de permissão).

### Etapa 8 — Validar Contrato, Testes e Critérios de Aceite
Consulte `references/testing-and-acceptance.md`.
1. Execute o validador estático determinístico:
   ```bash
   # Linux / macOS
   python3 skills/agent-profile-builder/scripts/validate_profile.py \
     skills/agent-profile-builder/assets/agent-profile.example.json

   # Windows
   py -3 skills/agent-profile-builder/scripts/validate_profile.py \
     skills/agent-profile-builder/assets/agent-profile.example.json
   ```
2. Execute a suíte de testes de regressão do validador:
   ```bash
   python3 -m unittest discover -s skills/agent-profile-builder/scripts/tests -v
   ```
3. Quando houver integração ao projeto alvo, execute **lint, testes, build e varredura de segredos do projeto alvo** antes de qualquer commit ou push.

---

## 3. Invariantes de Segurança (Bloqueantes)

- Escopo demonstrativo por padrão: nenhuma mensagem real enviada, nenhuma mutação externa executada.
- Proibido incluir tokens, chaves de API, contas reais, endpoints privados ou dados de clientes no perfil ou exemplos.
- Proibido conceder `default_policy: "allow"` ou delegar autorização ao prompt.
- Toda integração real depende de escopos aprovados, revisão de código e plano de rollback.
