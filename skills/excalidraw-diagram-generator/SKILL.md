---
name: excalidraw-diagram-generator
description: >-
  Gera diagramas arquiteturais e fluxos de sistemas em formato Excalidraw v2 (.excalidraw)
  a partir de prompts em linguagem natural, com renderizacao interativa na interface,
  vinculacao nativa de texto/setas e validacao estrutural sem dependencias.
---

# Gerador de Diagramas Excalidraw (Deda Skills)

Skill interativa de engenharia visual que converte prompts de arquitetura, microsservicos, fluxos de dados e fluxogramas de decisao em cenas **Excalidraw v2** renderizadas diretamente no navegador e exportaveis como `.excalidraw`, `.svg` ou `.png`.

## 1. Fluxo Operacional (`prompt -> blueprint -> layout -> render -> export`)

1. **Validacao de Prompt**: garanta descricao clara de componentes, camadas ou transicoes (`A -> B -> C`) antes de sintetizar o grafo.
2. **Extracao Semantica de Nos & Arestas**: classifique cada no por papel arquitetural (`client`, `gateway`, `service`, `database`, `queue`, `cache`, `decision`, `external`) e camada (`layer: 0..N`).
3. **Layout Livre de Colisoes**: posicione nos em grade ortogonal com snap de `20px` e espacamento minimo (`280px` entre colunas, `180px` entre linhas) sem sobreposicao.
4. **Vinculacao Nativa Excalidraw v2**:
   - Todo texto dentro de forma declara `containerId` apontando para o no pai, e o pai lista o texto em `boundElements`.
   - Toda seta declara `startBinding` e `endBinding` apontando para os IDs de origem e destino, registrados em `boundElements`.
5. **Renderizacao Direta & Exportacao**: renderize no componente `<Excalidraw />` com ajuste automatico de viewport (`scrollToContent`), suporte a tema claro/escuro e exportacao `.excalidraw` / `.svg`.

## 2. Topologias Suportadas

- **Arquitetura de Sistemas (`architecture`)**: camadas horizontais Cliente -> Gateway -> Servicos -> Mensageria -> Dados.
- **Fluxograma de Decisao (`flowchart`)**: fluxo vertical top-down com losangos de decisao (`?`) e desvios rotulados.
- **Fluxo de Dados & IA (`dataflow`)**: ingestao, guardrails, embeddings/vetores, processamento e auditoria.
- **Microsservicos & Eventos (`microservices`)**: barramento Kafka/RabbitMQ, workers paralelos, cache e banco primario.

## 3. Seguranca & Portabilidade

- Nunca insira chaves de API, segredos ou endpoints internos confidenciais nos rotulos do diagrama.
- Valide o JSON gerado com:
  ```bash
  python3 skills/excalidraw-diagram-generator/scripts/validate_excalidraw.py diagrama.excalidraw
  ```
- Consulte `references/architecture-layout-spec.md` para o contrato completo de nos, bindings e paletas dual-mode.
