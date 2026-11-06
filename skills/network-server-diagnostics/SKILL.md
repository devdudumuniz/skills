---
name: network-server-diagnostics
description: Diagnostica conectividade e saúde de servidores de forma controlada, correlacionando DNS, rotas, portas, TLS, serviços, recursos e logs sem alterar firewall, roteamento, serviços ou dados por padrão.
---

# Network/server diagnostics

## Objetivo

Transformar sintoma de rede ou servidor em diagnóstico reproduzível, distinguindo cliente,
transporte, resolução, serviço, autenticação, aplicação e dependências.

## Quando usar

Use para investigar indisponibilidade, timeout, falha de DNS, conexão recusada, erro TLS,
serviço parado, saturação ou diferença entre ambientes.

## Quando não usar

Não use para varrer redes sem escopo, acessar sistemas sem autorização, publicar portas, alterar
rotas/firewall, reiniciar serviço crítico ou remover evidências.

## Pré-condições e autorização

- Identifique origem, destino, protocolo, porta, ambiente, horário e sintoma.
- Use endpoints e hosts autorizados e o menor conjunto de testes necessário.
- Prefira comandos de leitura e testes não destrutivos; preserve logs e configuração.
- Mudanças, scans ampliados e acesso privilegiado exigem autorização específica.

## Entradas

- mensagem de erro e horário com fuso;
- topologia ou caminho esperado;
- resultados de DNS, rota, conexão, TLS, serviço, processo, recursos e logs;
- baseline e janela de mudança/incidente.

## Procedimento

1. Reproduzir sintoma com escopo mínimo e registrar origem, destino e horário.
2. Isolar camadas: resolução, rota, transporte, handshake, autenticação, serviço e aplicação.
3. Comparar resolução, rota, porta, certificado, configuração e health check entre ambientes.
4. Verificar serviço, dependências, CPU, memória, disco, relógio e logs sem modificá-los.
5. Formular hipóteses ordenadas por evidência e o teste de menor risco para cada uma.
6. Encerrar com causa provável, causa não comprovada, impacto e próximo passo.

## Critérios de aceite

O diagnóstico localiza a camada com evidência reproduzível ou declara inconclusão, separa
indisponibilidade de autenticação e distingue teste local, interno e externo.

## Recusas e paradas

Pare se alvo, autorização ou escopo forem ambíguos. Recuse varredura indiscriminada, tentativa
de credencial, bypass de ACL, exposição pública, alteração de firewall/roteador ou reinício destrutivo.

## Evidência e saída

Entregue linha do tempo, topologia declarada, testes, resultados redigidos, hipóteses, causa
provável, limitações e próximos passos. Use identificadores e referências lógicas para dados sensíveis.

## Limites

Teste de conectividade não prova saúde da aplicação nem autorização de acesso. Não corrige rede,
instala pacotes, altera configuração, reinicia serviço ou publica endpoint.

## Validação

Confirme que cada conclusão aponta para teste ou evidência, que os testes respeitaram o escopo e
que nenhum comando alterou estado.
