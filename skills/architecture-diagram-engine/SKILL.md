---
name: architecture-diagram-engine
description: >-
  Gera e valida diagramas tecnicos Draw.io / mxGraph XML (.drawio e .drawio.svg) para C4,
  arquitetura de sistemas, ER crow's foot, sequencia UML, fluxogramas e topologia de rede,
  com descoberta previa do repositorio, escaping seguro de XML e zero dependencia de IDE especifico.
---

# Architecture Diagram Engine (Draw.io — Deda Skills)

Fluxo deterministico `inspecionar_repositorio → modelar_camadas → gerar_mxgraph_xml → validar_xml`.
Produz arquivos `.drawio` e `.drawio.svg` compativeis com Draw.io Desktop, Web (`app.diagrams.net`), GitHub e qualquer extensao de editor sem lock-in proprietario.

## 1. Descoberta Tecnica Antes de Desenhar

Quando houver codigo-fonte disponivel, leia os artefatos reais antes de criar celulas:
- **Servicos & Containers**: `package.json`, `docker-compose.yml`, manifestos Kubernetes, arquivos `server.ts`.
- **Banco de Dados (ER)**: `schema.sql`, Drizzle (`schema.ts`), Prisma (`schema.prisma`) ou migracoes.
- **Fluxos & Contratos**: rotas API, filas/webhooks e maquinas de estado.
Nunca invente entidades nao confirmadas no codigo ou na especificacao do usuario.

## 2. Anatomia Obrigatoria do mxGraph XML

1. **Raiz `<mxfile>`**: informe `modified` em ISO-8601 real e `compressed="false"` (XML legivel e versionavel no Git).
2. **Celulas Reservadas por `<diagram>`**:
   - `<mxCell id="0" />` deve ser o primeiro no de `<root>`.
   - `<mxCell id="1" parent="0" />` deve ser o segundo no de `<root>`.
3. **Unicidade & Hierarquia**:
   - Todo `id` e unico dentro da respectiva pagina `<diagram>`.
   - Todo vertice possui `vertex="1"`, `parent` valido e `<mxGeometry x y width height as="geometry" />`.
   - Toda aresta possui `edge="1"` e `source`/`target` apontando para IDs existentes (ou `sourcePoint`/`targetPoint` explicito para lifelines flutuantes em diagramas de sequencia).
4. **Higiene & Escaping XML**:
   - Sempre escape `&` (`&amp;`), `<` (`&lt;`), `>` (`&gt;`) e aspas em atributos `value="..."`.
   - Inclua `whiteSpace=wrap;html=1;` em todos os vertices rotulados.

## 3. Regras de Layout, Escala & Multi-Pagina

- **Snap-to-Grid 10px**: todas as coordenadas e tamanhos multiplos de `10` (ex.: `120x60` servicos, `160x80` swimlanes).
- **Espacamento**: `40-60px` horizontal no mesmo nivel; `80-120px` vertical entre tiers.
- **Coordenadas Relativas**: nos filhos de `swimlane` ou `shape=table` usam `(x, y)` relativos ao container pai.
- **Teto de Legibilidade**: maximo `40` celulas por pagina; sistemas maiores devem usar multiplas abas `<diagram id="..." name="...">`.
- **Conectores Ortogonais**: use `edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;` para evitar cruzamentos confusos.

Consulte `references/mxgraph-xml-patterns.md` para templates prontos (C4 Swimlane, ER Crow's Foot, Sequencia UML, Classe UML e Paleta Semantica).

## 4. Validacao Obrigatoria & Seguranca

- Jamais exponha segredos, IPs internos restritos, chaves de API ou strings de conexao reais nos diagramas.
- Execute o validador XML sem dependencias antes de finalizar:
  ```bash
  python3 scripts/validate_drawio.py <caminho/arquitetura.drawio>
  ```
- Na entrega, resuma a topologia modelada e informe que o arquivo pode ser aberto no Draw.io Web/Desktop ou visualizadores compativeis.
