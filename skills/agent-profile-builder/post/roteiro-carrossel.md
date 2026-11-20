# Carrossel Instagram — "Crie seu agente de IA com perfil próprio"

**Novo recorte, sem repetição da postagem da equipe digital:** focar no passo a passo de construção de **um único agente**, do modelo ao runtime, sem listar novamente cargos e organograma.

**Identidade:** estilo 2, 1080 x 1350, light/dark alternado entre publicações; neste novo carrossel iniciar DARK na capa apenas se a grade editorial atual estiver assim. Avatar humano 2D consistente (não 3D/robô), uma ilustração principal por página, no máximo 2 linhas de apoio e 3 labels curtos por slide. Paleta `#FAF9F5`, `#0B2540`, `#D95B35` e `#E8F1F6`. Assinatura `@devdudumuniz` em todas; logos oficiais apenas se obtidas de fontes verificáveis.

| Página | Título curto | Visual | Informação nova / cuidado técnico |
|---|---|---|---|
| 01 | **Dê identidade ao seu agente.** | Personagem ainda sem perfil; peças a encaixar em volta | "Modelo + perfil + ferramentas + controles"; não chamar persona de executor |
| 02 | **Escolha o motor.** | Modelo local ao lado de CPU/RAM simples | "Qwen3.5:4B: piloto local para tarefas simples" / "Modelo não é agente" / "Valide ferramentas". Sem mínimos universais de hardware |
| 03 | **Defina a identidade.** | Perfil ilustrado se preenchendo: nome, missão, tom, voz opcional | Uma definição por campo, evitando exibir outro catálogo de cargos |
| 04 | **Crie limites reais.** | Duas camadas: persona em cima; RBAC e executor embaixo | O modelo solicita, a aplicação decide; allowlist e aprovação, não só prompt |
| 05 | **Conecte sua stack.** | API ↔ tools ↔ agente; pequenos ícones CLI e MCP | Usar sistemas existentes; canal não substitui ferramenta; credenciais fora do prompt |
| 06 | **Escolha o que lembrar.** | Sessão → opcional memória durável | TTL, escopo por usuário/tenant, recuperar apenas dados autorizados |
| 07 | **Dê um ciclo de execução.** | Fluxo: pedido → plano → tool → verificação → resposta | Timeout, idempotência, rastreamento e fallback humano |
| 08 | **Reproduza com uma skill.** | Visão de arquivos `SKILL.md`, JSON, testes e resultado | CTA: "Comente AGENTE que eu te mando o blueprint / skill / documentação." |

## Conteúdo proibido nesta peça

- Repetir a lista de 5 agentes, cargos e permissões da postagem anterior.
- Prometer autonomia perfeita, inferência local sem custo, ou voz/WhatsApp grátis garantido.
- Dizer que uma `SKILL.md` por si só executa ações.
- Mostrar secrets, tokens, URLs privadas ou detalhes de infraestrutura real.
- Inventar benchmarks, logomarcas, suporte a tool calling ou resultado de testes.

## Recurso de conversão real

Entregar o repositório com `skills/agent-profile-builder/`, `README.md`, exemplos e testes, antes de automatizar respostas de comentário. Não divulgar URL fictícia. Se publicar um repositório, usar link real para branch/tag verificada e instrução de instalação.

## Texto curto sugerido para o feed

Seu agente precisa de mais do que um prompt.

Com modelo local, perfil, personalidade, memória, ferramentas e permissões, você consegue criar um agente especializado **dentro da stack que já usa**.

No carrossel mostro cada etapa — incluindo por onde começar com um modelo pequeno e como evitar acessos indevidos.

**Comente AGENTE que eu te mando o blueprint / skill / documentação.**

Salve para montar seu primeiro agente com critérios claros.

`#AgentesDeIA #AgentSkills #IALocal #DevTools #OpenSource`
