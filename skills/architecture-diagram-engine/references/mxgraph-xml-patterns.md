# mxGraph XML Patterns & Paletas Semanticas

## 1. Esqueleto Base `<mxfile>`

```xml
<mxfile host="Deda-Skills" modified="2026-11-16T00:00:00Z" compressed="false" version="26.0.0">
  <diagram id="overview" name="Visao Geral">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

## 2. Paleta Semantica Dual-Contrast

| Papel Semantico | fillColor | strokeColor | fontColor |
|---|---|---|---|
| Servico / Core | `#dae8fc` | `#6c8ebf` | `#1a1a1a` |
| Entrada / Sucesso | `#d5e8d4` | `#82b366` | `#1a1a1a` |
| Decisao / Fila | `#fff2cc` | `#d6b656` | `#1a1a1a` |
| Banco / Persistencia | `#f8cecc` | `#b85450` | `#1a1a1a` |
| Ator / Externo | `#e1d5e7` | `#9673a6` | `#1a1a1a` |
| Camada Sertao (Dark Doc) | `#24201D` | `#D97757` | `#F5F2EB` |

## 3. Snippets Validados

- **Swimlane de Camada**:
  `swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;whiteSpace=wrap;html=1;`
- **Banco de Dados**:
  `shape=mxgraph.flowchart.database;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;`
- **Tabela ER (Crow's Foot)**:
  `shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;`
- **Relacionamento ER 1:N**:
  `edgeStyle=entityRelationEdgeStyle;html=1;startArrow=ERone;endArrow=ERmany;`
- **Conector Ortogonal Limpo**:
  `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;`
