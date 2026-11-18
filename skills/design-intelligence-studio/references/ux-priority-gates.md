# UX Priority Gates (P0 → P2)

## P0 — Acessibilidade & Semantica (Bloqueante)
- [ ] Contraste de texto normal >= `4.5:1` e texto grande (>=18px bold / >=24px) >= `3.0:1`.
- [ ] Elementos interativos usam HTML nativo (`<button>`, `<a href>`, `<input>`, `<select>`, `<dialog>`). Nunca use `<div>` clicavel sem papel/teclado.
- [ ] Todo controle tem nome acessivel unico (`aria-label` em icon-buttons; `<label>` visivel em inputs).
- [ ] Ordem logica de foco por `Tab` e foco aprisionado/restaurado corretamente em modais e drawers.
- [ ] `:focus-visible` preservado em todos os botoes, links e abas.

## P1 — Responsividade, Toque & Fluxo (Alta)
- [ ] Viewport mobile (`390x844`) sem overflow horizontal (`documentElement.scrollWidth <= window.innerWidth`).
- [ ] Alvos de toque >= `44x44px` em navegacao e formularios touch.
- [ ] Menus de navegacao inferior limitados a no maximo 5 itens principais com labels curtos.
- [ ] Estados vazios orientam a proxima acao util; erros mostram causa e como resolver sem apagar o preenchimento do usuario.
- [ ] Acoes criticas oferecem confirmacao explicita ou desfazer.

## P2 — Tipografia, Movimento & Polimento (Media)
- [ ] Escala tipografica coerente sem mistura aleatoria de fontes; corpo minimo de `14px–16px`.
- [ ] Numeros tabulares (`font-variant-numeric: tabular-nums`) em tabelas, KPIs e contadores.
- [ ] Transicoes orientadas a contexto (`120ms–220ms`), respeitando `@media (prefers-reduced-motion: reduce)`.
- [ ] Dimensoes reservadas (`aspect-ratio` / `min-height`) para evitar saltos de layout (CLS).
