---
name: vibecode-builder
description: Transforma uma ideia de produto em uma implementação pequena e verificável, orientando descoberta do repositório, escopo, UX, código, testes e revisão sem sacrificar segurança ou funcionalidade existente.
---

# Vibecode builder

## Objetivo

Converter uma intenção informal em uma fatia vertical funcional: escopo curto, decisões
explícitas, implementação coerente, validação e próximos passos claros.

## Quando usar

Use para iniciar aplicação, adicionar tela ou fluxo, prototipar integração ou transformar
descrição natural em trabalho de código dentro de projeto existente.

## Quando não usar

Não use para copiar código, identidade visual, dados ou credenciais de terceiros sem autorização;
para mudanças de produção sem alvo inequívoco; ou para substituir contrato de API e decisão de
arquitetura ainda não definidos.

## Pré-condições e autorização

- Identifique projeto, stack e resultado esperado.
- Inspecione instruções, estrutura, scripts e estado do Git antes de editar.
- Preserve comportamento existente, acessibilidade, autenticação, validações e persistência.
- Edição local, commit, publicação e deploy são ações separadas e exigem autorização própria.

## Entradas

- ideia, usuário e problema;
- telas, fluxos, dados, integrações e restrições;
- repositório e comandos de validação;
- critérios mínimos de aceite e limites do primeiro incremento.

## Procedimento

1. Reescrever a ideia em resultado observável e separar obrigatório de desejável.
2. Mapear o projeto sem assumir framework, rotas, componentes ou comandos não verificados.
3. Propor a menor fatia vertical que atravesse interface, lógica, dados e validação necessários.
4. Implementar com padrões já presentes; evitar dependências novas sem justificativa.
5. Exercitar estados de carregamento, vazio, erro, sucesso, permissão e responsividade quando aplicáveis.
6. Rodar testes, linters e verificações existentes; relatar falhas sem mascará-las.

## Critérios de aceite

O fluxo principal funciona, o que ficou fora do escopo está declarado, as verificações disponíveis
passam ou têm falhas reproduzíveis, e contratos existentes conhecidos não são quebrados.

## Recusas e paradas

Pare quando destino do código ou comportamento esperado forem ambíguos. Recuse remover
autenticação, validações, logs, testes ou controles de segurança apenas para fazer o protótipo funcionar.

## Evidência e saída

Entregue resumo da mudança, arquivos afetados, decisões, comandos executados, resultados,
limitações, riscos e próximos passos. Não inclua segredos, dados pessoais ou material proprietário
desnecessário.

## Limites

Vibecode não significa ignorar arquitetura, segurança ou manutenção. A skill não garante
prontidão para produção e não autoriza commit, publicação, migração ou deploy.

## Validação

Confirme que a descrição corresponde ao comportamento implementado, que testes relevantes foram
executados e que mudanças não relacionadas permanecem intocadas.
