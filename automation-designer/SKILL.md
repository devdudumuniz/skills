---
name: automation-designer
description: Projeta automações e workflows confiáveis com gatilhos, idempotência, retries, timeouts, segredos por referência, observabilidade e rollback, sem executar integrações ou ações externas por padrão.
---

# Automation designer

## Objetivo

Desenhar uma automação compreensível, repetível, observável e segura para operar, incluindo
comportamento normal, falhas, duplicidade e intervenção humana.

## Quando usar

Use para criar workflows, jobs agendados, integrações entre APIs, notificações, manutenção ou
automações acionadas por eventos.

## Quando não usar

Não use para executar ação externa apenas porque o fluxo foi descrito, nem para contornar
autorização, rate limit, consentimento, auditoria ou controles de serviço.

## Pré-condições e autorização

- Defina dono, finalidade, origem dos eventos, destino e impacto de cada etapa.
- Use nomes de variáveis ou referências de segredo, nunca valores reais.
- Diferencie simulação, leitura, escrita reversível e escrita irreversível.
- Execute somente após aprovação compatível com os efeitos.

## Entradas

- gatilho e payload mínimo;
- sistemas envolvidos, contratos, limites e autenticação;
- frequência, concorrência, ordenação e janela;
- critérios de sucesso, retry, dead-letter, alerta e rollback.

## Procedimento

1. Desenhar o fluxo como estados e transições, identificando efeitos externos.
2. Definir idempotência, deduplicação, timeout, retry com backoff e limite de tentativas.
3. Tratar falhas parciais, reprocessamento, concorrência, cancelamento e recuperação manual.
4. Separar dados necessários de sensíveis e definir retenção e redaction de logs.
5. Especificar métricas, logs, alertas acionáveis e dry run seguro.
6. Propor testes de contrato, casos de erro e ativação gradual.

## Critérios de aceite

O desenho permite responder quem aciona, o que muda, como evitar duplicidade, como parar, como
recuperar e como provar o resultado. Cada efeito irreversível tem barreira de autorização e
caminho de recuperação.

## Recusas e paradas

Pare sem dono, contrato de destino, revogação, limite de custo ou recuperação. Recuse exfiltração,
spam, bypass de controles ou uso de segredo em payload, código, log ou configuração versionada.

## Evidência e saída

Entregue fluxo textual, estados, contrato de entrada/saída, retry, matriz de falhas,
observabilidade, testes e checklist de ativação. Redija valores confidenciais e dados pessoais.

## Limites

Um desenho não prova que a integração existe nem que a API é segura. Não cria tokens, configura
webhooks, envia mensagens, altera dados ou agenda jobs sem autorização explícita.

## Validação

Revise idempotência, concorrência, autorização, dados, custo, rate limit, timeout, retry,
rollback e operabilidade antes da implementação.
