# Transferência e QA

Use somente no modo `EXTRACT_AND_APPLY`.

## Contrato de fronteira

Antes do código, registre o nó-alvo e tudo que deve permanecer. Exemplo:

```text
TARGET_ELEMENT = section#conversation-panel
REPLACE = conteúdo interno e estilos da section
PRESERVE_ANCESTORS = aside e shell da página
PRESERVE_SIBLINGS = nav fixo e painel direito
ALLOW_LAYOUT_CHANGE = YES, somente a largura da section
```

Valide o contrato contra a linguagem do usuário. “Menu lateral” pode significar o shell inteiro ou apenas
um painel dentro dele; seletores e elementos nomeados pelo usuário vencem inferências visuais.

## Preflight do destino

- Leia instruções locais e identifique checkout/repositório.
- Inspecione `git status`, remotes/worktrees quando relevantes e arquivos já alterados.
- Localize o componente que produz o nó-alvo, seus consumidores e CSS efetivo.
- Identifique callbacks, rotas, dados, tokens, biblioteca de ícones e testes existentes.
- Capture baseline e falhas preexistentes sem limpar, resetar ou sobrescrever WIP.

## Crosswalk

| Referência | Valor bruto/evidência | Destino | Decisão | Resultado |
|---|---|---|---|---|

Resultados: `APPLIED`, `ADAPTED`, `NOT_APPLICABLE`, `BLOCKED`.

Adapte apenas quando a fidelidade literal conflitar com marca, verdade dos dados, acessibilidade ou
contrato funcional. Exemplo: preserve o layout de um cartão promocional, mas não invente créditos ou uma
ação inexistente; registre a adaptação.

## Ordem de implementação

1. Preserve shell e fronteiras declaradas.
2. Ajuste a caixa externa autorizada.
3. Implemente estrutura e componentes.
4. Aplique tokens/estilos no menor escopo canônico.
5. Conecte dados e ações existentes.
6. Implemente estados dinâmicos observados.
7. Reveja o diff antes do QA.

Evite acumular overrides sobre uma estrutura incorreta. Se a composição autorizada mudou, corrija o DOM
canônico e simplifique CSS obsoleto somente quando isso estiver dentro do escopo.

## Loop comparativo

1. Abra referência e destino em condições equivalentes.
2. Capture screenshot e métricas computadas dos mesmos elementos/estados.
3. Compare geometria externa, sequência de linhas, tokens, ícones e tipografia.
4. Corrija uma classe de diferença por vez.
5. Repita até que os invariantes coincidam ou uma adaptação seja documentada.

Não use porcentagem de similaridade inventada. Um diff de pixels só é conclusivo quando conteúdo,
viewport, DPR, fontes, animação e estado são comparáveis.

## Gates

| Gate | Prova |
|---|---|
| Fronteira | ancestrais e irmãos preservados no DOM |
| Geometria | caixas e sequências medidas novamente |
| Visual | screenshots comparáveis e estilos computados |
| Interação | hover, foco, collapse, resize, scroll e ações relevantes |
| Responsividade | viewports realmente observados |
| Acessibilidade | semântica, nomes, teclado e foco |
| Código | lint/typecheck/test/build aplicáveis |
| Higiene | diff check, console e arquivos fora do escopo |

Use `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN` ou `NOT_APPLICABLE`; justifique os dois últimos.

## Rollback

Liste somente arquivos alterados pela tarefa e reverta apenas esses hunks. Não use reset/clean/checkout
destrutivo e não descarte alterações preexistentes.
