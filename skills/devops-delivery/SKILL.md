---
name: devops-delivery
description: Planeja e revisa entregas DevOps em um repositório, cobrindo CI/CD, ambientes, observabilidade, rollback e risco, sem executar deploy ou alterar produção por padrão.
---

# DevOps delivery

## Objetivo

Produzir um plano de entrega verificável para uma aplicação ou serviço, separando fatos
observados, decisões pendentes, mudanças propostas, validações e rollback.

## Quando usar

Use para preparar deploy, revisar pipeline, investigar falha de entrega ou transformar uma
mudança de código em um plano operacional. Funciona com qualquer provedor, sistema operacional
ou ferramenta de CI/CD.

## Quando não usar

Não use para executar deploy, alterar infraestrutura compartilhada, operar incidente em tempo
real ou aprovar mudança de produção. A skill pode preparar evidência e plano, mas a execução exige
autorização e o procedimento do ambiente alvo.

## Pré-condições e autorização

- Identifique repositório e ambiente alvo; se qualquer um estiver ambíguo, pare no plano.
- Leia as instruções do repositório e confirme os comandos reais antes de citá-los.
- Considere somente segredos por referência lógica; nunca peça ou registre o valor.
- Preparar o plano não autoriza comandos mutáveis.

## Entradas

- objetivo da entrega e ambiente alvo;
- estado do repositório, branch, mudanças e testes;
- pipeline, manifesto de deploy, runtime e critérios de saúde;
- restrições de janela, compatibilidade, migração, rollback e observabilidade.

## Procedimento

1. Mapear mudança, artefato, dependências e caminho de promoção.
2. Verificar scripts de build, testes, empacotamento, migração e health check; não inventar etapas.
3. Separar ambientes, dados, permissões, segredos, exposição de rede e dependências externas.
4. Definir preflight, rollout, sinais de sucesso, sinais de abortar e rollback.
5. Classificar lacunas como bloqueantes, riscos aceitos ou perguntas para o responsável.
6. Entregar comandos somente como proposta claramente marcada; não executá-los sem autorização.

## Critérios de aceite

O resultado contém alvo, artefato, pré-condições, validações, observabilidade, rollback, riscos
residuais e decisão entre pronto para revisão, bloqueado ou pronto para execução autorizada.
Nenhum fato não observado é apresentado como confirmado.

## Recusas e paradas

Pare se ambiente, proprietário, artefato, janela ou rollback não puderem ser identificados.
Recuse exposição de credenciais, bypass de controles, deploy destrutivo ou mudança irreversível
sem aprovação compatível.

## Evidência e saída

Produza resumo, inventário de evidências com caminho e comando, plano por etapas, matriz de riscos,
critérios de abortar/rollback e perguntas abertas. Redija valores sensíveis como referências ou
`[redigido]`.

## Limites

Não substitui runbook do provedor, responsável pelo serviço, aprovação de produção ou validação
humana. Não certifica disponibilidade, segurança ou sucesso de deploy sem evidência atual.

## Validação

Verifique que afirmações operacionais têm fonte atual, que comandos propostos existem no projeto
e que mudanças não relacionadas permanecem intocadas.
