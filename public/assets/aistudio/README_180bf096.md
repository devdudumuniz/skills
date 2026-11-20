# Agent Profile Builder — kit técnico v0.1

**Objetivo:** adicionar um agente com identidade, personalidade, modelo, permissões, ferramentas, memória e critérios de aceite a um sistema **existente**, sem migrar nem recriar a stack.

Este repositório é um **artefato educacional e uma skill de projeto**. **Não é um runtime, servidor, agente autônomo pronto ou integração de produção.** Os conectores reais e o motor de execução devem existir ou ser implementados na stack autorizada.

## O que vem no kit

- `.agents/skills/agent-profile-builder/SKILL.md` — workflow reutilizável, compatível com a estrutura do padrão Agent Skills.
- `assets/agent-profile.example.json` — perfil de exemplo com permissões `deny` por padrão, modelo local inicial, voz opcional e execução segura.
- `scripts/validate_profile.py` — verificação estática determinística de campos e invariantes de segurança.
- `scripts/tests/test_validate_profile.py` — testes de regressão do validador.
- `references/` — especificação de perfis, escolha de modelos, integração, memória e testes.
- `post/roteiro-carrossel.md` — roteiro inédito para uma publicação educativa (sem repetir a postagem sobre equipe digital).

## Comece pelo projeto que você já tem

1. Adicione `.agents/skills/agent-profile-builder/` ao **repositório** que deseja analisar (ou use a skill no diretório de um projeto já autorizado).
2. Peça ao agente de desenvolvimento: `Use $agent-profile-builder para analisar esta stack e planejar um agente especializado. Primeiro audite, não implemente integrações externas sem autorização.`
3. Ajuste `assets/agent-profile.example.json` com identidade e capacidades do seu caso. O exemplo **não tem credenciais**.
4. Valide no Windows com `py -3 .agents/skills/agent-profile-builder/scripts/validate_profile.py .agents/skills/agent-profile-builder/assets/agent-profile.example.json` ou em Linux com `python3 ...`.
5. Execute os testes: `py -3 -m unittest discover -s .agents/skills/agent-profile-builder/scripts/tests -v` (Windows) ou `python3 -m unittest discover ...`.
6. Só conecte credenciais, bancos e APIs depois de definir escopos, autorizações, revisão e rollback.

## Modelo local inicial

Para um *piloto de tarefas simples com chamadas de ferramenta*, experimente `qwen3.5:4b` em Ollama. O catálogo oficial lista aproximadamente **3,3 a 4,0 GB de arquivos de modelo**, mas isso **não é a RAM/VRAM total exigida**. A memória real depende do contexto, quantização, runtime e concorrência. Comece com contexto controlado e teste no seu hardware. Modelos maiores podem ser necessários para planejamento, programação e tarefas longas.

> "Local" não garante offline: modelos e rotinas podem ser locais, mas WhatsApp, SMS, telefonia e APIs externas ainda usam rede, provedores e políticas próprias.

## Regras do exemplo

- Escopo **apenas demonstrativo**; nenhuma mensagem real enviada e nenhuma alteração externa efetuada.
- Permissões do **servidor** controlam a ação; o prompt ou a skill nunca são autorização suficiente.
- Sem tokens, contas reais, endpoints privados ou dados de clientes.
- Aprovação humana para ações sensíveis, logs redigidos e isolamento por usuário/tenant.
- Executar lint, testes, build e verificação de segredos **do projeto alvo** antes de qualquer commit/push, quando houver integração.

## Referências

- Padrão Agent Skills: https://agentskills.io/
- Documentação de skills no Codex: https://learn.chatgpt.com/docs/build-skills
- Rerun como inspiração conceitual para identidade, habilidades, memória e ambiente por agente: https://github.com/rerun-build/rerun
- Catálogo de modelos Qwen 3.5 no Ollama: https://ollama.com/library/qwen3.5

**Status:** validação do contrato local e testes de regressão incluídos; **nenhuma integração ao projeto de terceiros foi executada ou homologada**.
