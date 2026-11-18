---
name: canvas-diagram-studio
description: >-
  Gera diagramas Excalidraw (.excalidraw JSON v2) a partir de linguagem natural ou analise de
  repositorio, com vinculacao nativa de texto (containerId/boundElements), setas ancoradas
  (startBinding/endBinding), layout matematico sem colisoes e validacao de schema sem dependencias.
---

# Canvas Diagram Studio (Excalidraw Engine — Deda Skills)

Fluxo deterministico `extrair_entidades → selecionar_topologia → calcular_grade_sem_colisao → vincular_bindings → validar_json`.
Evolui a geracao de diagramas `.excalidraw` eliminando textos soltos, setas desconectadas, inflacao de tokens por bibliotecas JSON gigantes e sobreposicao de nos.

## 1. Quando Usar & Topologias Suportadas

- **Fluxograma / Decisao**: etapas sequenciais, losangos de decisao, desvios e fim.
- **Mapa Mental / Ideacao**: no central com 3–7 ramos radiais e sub-nos balanceados.
- **Fluxo de Dados (DFD) & Swimlanes**: atores/camadas em raias verticais ou horizontais.
- **Arquitetura Conceitual & Relacionamentos**: servicos, filas, bancos, contratos e fluxos.
- **Modelo ER / Classes / Sequencia**: entidades com chaves, lifelines e mensagens.

**Regra de Decomposicao Inteligente:** acima de **25 nos logicos**, divida automaticamente em diagrama macro (visao geral) + sub-diagramas detalhados por subsistema, evitando telas ilegíveis.

## 2. Descoberta Antes do Desenho

Se houver repositorio ou esquema disponivel (ex.: `package.json`, `schema.sql`, rotas REST/GraphQL), leia as entidades reais antes de desenhar qualquer caixa. Nunca invente microservicos ou tabelas inexistentes.

## 3. Engenharia de Vinculacao Nativa (Bound Text & Anchored Arrows)

Diferente de textos e setas flutuantes por coordenadas soltas, toda forma rotulada DEVE usar vinculacao bidirecional nativa do Excalidraw v2:

1. **Container + Texto Vinculado**:
   - O retangulo/elipse/losango declara `"boundElements": [{ "id": "txt-node-1", "type": "text" }, { "id": "arrow-1", "type": "arrow" }]`.
   - O elemento texto filho declara `"containerId": "node-1"`, garantindo centralizacao automatica e movimento conjunto ao arrastar.
2. **Setas Ancoradas (`startBinding` / `endBinding`)**:
   - Cada seta referencia `elementId` de origem e destino com `focus` (`0` = centro) e `gap` (`8`), alem de constar no `boundElements` dos dois nos ligados.
3. **Geometria & Margens Sem Colisao**:
   - Espacamento horizontal minimo entre nos: `>= 220px` (gap livre `>= 80px`).
   - Espacamento vertical minimo entre camadas/raias: `>= 140px`.
   - Alinhamento em grade de `20px` (`gridSize: 20`).

Consulte `references/excalidraw-binding-spec.md` para o esquema JSON completo e formulas de layout (Grid, DAG em camadas e Radial).

## 4. Paletas Dual-Mode (Claro & Escuro) e Tipografia Flexivel

- **Tema Claro (`#ffffff`)**: nos primarios `#dbeafe` (borda `#1d4ed8`), dados/sucesso `#dcfce7` (borda `#15803d`), decisao/atencao `#fef3c7` (borda `#b45309`), alerta `#fee2e2` (borda `#b91c1c`).
- **Tema Escuro (`#1e1a17`)**: nos primarios `#2f241d` (borda `#d97757`, texto `#f5f2eb`), camadas secundarias `#24201d` (borda `#6b5b4d`), destaque ambar `#33291a` (borda `#e09f3e`).
- **Tipografia**: `fontFamily: 5` (Excalifont) para estilo esbocado ou `fontFamily: 3` (Monospace) para diagramas tecnicos de codigo/banco.

## 5. Validacao Obrigatoria & Seguranca

- Nunca inclua credenciais, segredos, tokens ou URLs privadas reais dentro dos rotulos do diagrama.
- Sempre valide o JSON gerado antes da entrega executando:
  ```bash
  python3 scripts/validate_excalidraw.py <caminho/diagrama.excalidraw>
  ```
- Na entrega, informe o resumo estrutural do diagrama e indique que o arquivo abre diretamente em `excalidraw.com` ou qualquer visualizador compativel com `.excalidraw`.
