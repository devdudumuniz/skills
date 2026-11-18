# W3C DTCG & CSS Token Crosswalk

## 1. Modelo W3C Design Tokens (`tokens.json`)

```json
{
  "color": {
    "bg-canvas": { "$value": "#1E1A17", "$type": "color" },
    "bg-surface": { "$value": "#24201D", "$type": "color" },
    "border-subtle": { "$value": "#383129", "$type": "color" },
    "ink-primary": { "$value": "#F5F2EB", "$type": "color" },
    "ink-secondary": { "$value": "#A39889", "$type": "color" },
    "accent-primary": { "$value": "#D97757", "$type": "color" }
  },
  "font": {
    "sans": { "$value": "Inter, system-ui, sans-serif", "$type": "fontFamily" },
    "mono": { "$value": "JetBrains Mono, monospace", "$type": "fontFamily" }
  }
}
```

## 2. Variaveis CSS & Tailwind v4 (`@theme`)

```css
:root {
  --bg-canvas: #1E1A17;
  --bg-surface: #24201D;
  --border-subtle: #383129;
  --ink-primary: #F5F2EB;
  --ink-secondary: #A39889;
  --accent-primary: #D97757;
}
```

## 3. Tabela de Crosswalk para Migracao Segura

| Padrao Alvo | Token Semantico | Implementacao Nativa no Projeto | Status |
|---|---|---|---|
| Fundo principal | `--bg-canvas` | Classe utilitaria ou variavel existente | `APPLIED` |
| Acao primaria | `--accent-primary` | Contraste verificado >= 4.5:1 | `APPLIED` |
| Espacamento card | `--space-card` | Padding `p-4 sm:p-5` consistente | `APPLIED` |
