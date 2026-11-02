---
name: security-baseline
description: Faz revisão defensiva e somente leitura de segurança em código, dependências, configuração e arquitetura, produzindo findings priorizados sem explorar, exfiltrar ou corrigir sistemas automaticamente.
---

# Security baseline

## Objetivo

Encontrar fraquezas verificáveis, reduzir falsos positivos e produzir recomendações acionáveis
com impacto, evidência, severidade, condição e correção sugerida.

## Quando usar

Use para revisão de aplicação, infraestrutura como código, dependências, exposição de serviços,
autenticação, autorização, segredos e threat model.

## Quando não usar

Não use para teste invasivo sem escopo escrito, exploração ativa, persistência, evasão,
exfiltração, coleta de credenciais ou resposta operacional sem playbook autorizado.

## Pré-condições e autorização

- Defina escopo, finalidade, ambiente e nível de intrusão permitido.
- Prefira código, configuração sanitizada, SBOM e logs sem dados sensíveis.
- Faça buscas e testes somente de leitura por padrão.
- Validação ativa e correções exigem autorização, janela, responsável e rollback.

## Entradas

- repositório, artefatos ou arquitetura sob revisão;
- modelo de ameaça, acessos e dados protegidos;
- dependências, configurações, pipeline e superfície exposta;
- severidade, prazo e canal de tratamento, quando existirem.

## Procedimento

1. Confirmar escopo, origem, versão e lacunas de cobertura.
2. Procurar segredos, permissões excessivas, dependências vulneráveis, entradas não validadas,
   falhas de autenticação/autorização, exposição de dados e caminhos de confiança.
3. Distinguir observação, inferência e hipótese; não afirmar exploitabilidade sem evidência.
4. Priorizar por impacto, probabilidade, exposição, facilidade de abuso e compensações.
5. Recomendar correção mínima, teste de regressão e verificação pós-correção.

## Critérios de aceite

Cada finding tem título, severidade justificada, ativo, evidência redigida, impacto, condição,
recomendação, teste de validação e limitação. “Não encontrado” nunca vira “não existe”.

## Recusas e paradas

Pare diante de escopo ausente, artefato não confiável, risco de produção ou pedido ofensivo.
Não imprima segredos nem inclua chaves, tokens, cookies, dumps ou dados pessoais no relatório.

## Evidência e saída

Produza escopo, cobertura, findings, evidência sanitizada, recomendações, plano de validação e
risco residual. Preserve caminho, versão, hash ou linha quando for seguro.

## Limites

Revisão estática não prova ausência de vulnerabilidade. Não concede autorização para scan externo,
exploração, mudança de firewall, rotação de segredo, patch, commit ou deploy.

## Validação

Revise falsos positivos, duplicidades, severidade, redaction, rastreabilidade e teste de correção.
