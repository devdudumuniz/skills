# Excalidraw v2 Native Binding & Layout Spec

## 1. Esqueleto Minimo Valido (`.excalidraw`)

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "deda-skills/canvas-diagram-studio",
  "elements": [],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```

## 2. Forma com Texto Vinculado + Seta Ancorada

```json
[
  {
    "id": "node-api",
    "type": "rectangle",
    "x": 100,
    "y": 100,
    "width": 180,
    "height": 72,
    "angle": 0,
    "strokeColor": "#1d4ed8",
    "backgroundColor": "#dbeafe",
    "fillStyle": "solid",
    "strokeWidth": 2,
    "roughness": 1,
    "opacity": 100,
    "roundness": { "type": 3 },
    "boundElements": [
      { "id": "txt-api", "type": "text" },
      { "id": "edge-1", "type": "arrow" }
    ]
  },
  {
    "id": "txt-api",
    "type": "text",
    "x": 110,
    "y": 124,
    "width": 160,
    "height": 24,
    "text": "API Gateway",
    "fontSize": 18,
    "fontFamily": 5,
    "textAlign": "center",
    "verticalAlign": "middle",
    "containerId": "node-api",
    "originalText": "API Gateway"
  }
]
```

## 3. Formulas de Layout Livre de Colisao

- **Grid Balanceado**:
  - `cols = Math.ceil(Math.sqrt(nodeCount))`
  - `x = originX + (idx % cols) * (nodeWidth + 100)`
  - `y = originY + Math.floor(idx / cols) * (nodeHeight + 90)`
- **Mind Map Radial**:
  - `angle = (2 * Math.PI * i) / branchCount`
  - `x = centerX + Math.cos(angle) * radius - nodeWidth / 2`
  - `y = centerY + Math.sin(angle) * radius - nodeHeight / 2` (usar `radius >= 260`)
