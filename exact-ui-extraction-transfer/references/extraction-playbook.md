# Playbook de extração exata

Use quando a referência renderizada estiver acessível ou quando a fidelidade depender de estados
dinâmicos. Adapte a sintaxe às ferramentas disponíveis; o objetivo é medir o DOM real, não depender de
um navegador ou agente específico.

## Inventário da sessão

Registre URL/rota e título, navegador, viewport CSS, DPR, tema, estado de autenticação sem credenciais,
elemento selecionado, seletor estável, estados necessários e horário da observação. Se a página for de
terceiros, confirme que a sessão e a reprodução são autorizadas.

## Anatomia e caixas

Inspecione o elemento, pai, ancestrais de layout e irmãos que afetam a caixa. Para cada um, capture
`getBoundingClientRect()` e as propriedades relevantes de `getComputedStyle()`.

```js
const inspect = (element) => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return {
    tag: element.tagName,
    classes: element.className,
    text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160),
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    display: style.display,
    position: style.position,
    flex: style.flex,
    grid: style.grid,
    padding: style.padding,
    margin: style.margin,
    gap: style.gap,
    border: style.border,
    borderRadius: style.borderRadius,
    background: style.background,
    color: style.color,
    font: style.font,
    lineHeight: style.lineHeight,
    overflow: style.overflow,
    transform: style.transform,
    transition: style.transition,
  };
};
```

Para pseudo-elementos, use `getComputedStyle(element, '::before')` e `::after`; registre `content`, caixa,
posição, background e pointer-events. Linhas divisórias de 1 px frequentemente são pseudo-elementos.

## Padrões repetidos

Para listas, grids e menus, capture uma sequência em vez de um item isolado:

```js
[...container.children].map((element) => inspect(element));
```

Compare `x`, `y`, largura, altura, gaps e padding de cada linha. Uma progressão como
`56, 93, 130, 167` demonstra linhas de 36 px com gap de 1 px e é mais forte que uma estimativa visual.

## Tokens e variáveis

Obtenha o valor resolvido e, quando possível, a variável de origem. Inspecione propriedades customizadas
relevantes no elemento/raiz. Não copie um bloco inteiro de tokens sem provar que cada token pertence ao
escopo. Preserve valores fracionários e o formato retornado pelo navegador antes de normalizar.

## Ícones e ativos

- Identifique biblioteca, nome da classe, viewBox, dimensões, stroke/fill e `currentColor`.
- Para SVG customizado, registre procedência e autorização antes de copiar.
- Prefira o componente de ícone equivalente já instalado no destino.
- Não hotlinke ativos da referência nem redistribua material sem licença/autorização.
- Não redesenhe manualmente um ícone quando o mesmo glyph existe na biblioteca usada.

## Estados dinâmicos

Meça o estado inicial e os estados necessários: hover, focus, selected, disabled, expanded/collapsed,
resize mínimo/padrão/máximo, scroll, menu/dialog, loading/error, viewports observados e movimento reduzido.

Interaja somente com controles visuais seguros. Não envie formulários, execute compras, mude permissões ou
altere dados externos para obter um estado.

## Quando só há screenshot

Registre dimensões conhecidas, escala provável e regiões medidas. Marque valores como `INFERRED`; não
converta estimativas em CSS “exato”. Solicite página/DOM quando isso for material.

## Tabela de evidência

| Elemento/estado | Seletor/descrição | Viewport | Medida/estilo | Classe | Fonte |
|---|---|---|---|---|---|

Classes: `MEASURED`, `OBSERVED`, `INFERRED`, `BLOCKED`.
