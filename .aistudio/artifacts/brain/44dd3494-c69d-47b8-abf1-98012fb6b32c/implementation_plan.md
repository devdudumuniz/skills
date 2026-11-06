# Busca Avançada e Favoritos no Laboratório de Habilidades

Plano de implementação para adicionar busca combinada por nome e categoria na visualização 'Explorar Habilidades', botão interativo de favorito com ícone de estrela nos cards com persistência no objeto da skill e navegação dedicada na barra lateral para filtrar apenas habilidades favoritas.

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> As preferências do usuário coletadas na Fase 1 definem o comportamento e posicionamento dos novos componentes:

- **Filtro na Barra Lateral**: Botão dedicado na sidebar de navegação intitulado **"Habilidades Favoritas"** com contador em tempo real `(n)` e ícone de estrela.
- **Posicionamento do Botão de Favorito**: Canto superior direito de cada card de habilidade na lista, com ícone de estrela interativo (preenchido/vazado), feedback tátil e propagação de clique isolada para não disparar o modal de prévia.
- **Comportamento da Busca**: Busca combinada que respeita o filtro de categoria selecionado e pesquisa simultaneamente por nome da skill, categoria, descrição e tags.

---

## 1. Visão Geral e Conceito

O **Laboratório de Skills** passará a contar com duas funcionalidades fundamentais de produtividade e descoberta:
1. **Busca e Filtragem Aprimorada**: Campo de pesquisa intuitivo no catálogo que pesquisa em tempo real por nome e categoria (além de termos-chave na descrição), combinando-se com as pílulas de categoria existentes (`Programação`, `Dados`, `Automação`, etc.).
2. **Sistema de Favoritos Completo**: Cada habilidade terá um botão de alternância de favorito (`isFavorite: boolean`), permitindo aos desenvolvedores e gestores destacar as competências mais utilizadas no dia a dia, com persistência local e visualização dedicada tanto no catálogo quanto pela sidebar.

---

## 2. Experiência do Usuário e Design Visual

### Fluxos do Usuário
- **Buscar por Nome ou Categoria**: O usuário digita no campo de busca (ex: `"figma"`, `"segurança"` ou `"dados"`). A lista é filtrada instantaneamente sem recarregar a tela, exibindo mensagem clara caso nenhuma habilidade corresponda à busca.
- **Favoritar/Desfavoritar uma Habilidade**:
  - O usuário visualiza o ícone de estrela no canto superior direito do card.
  - Ao clicar, o estado alterna instantaneamente (`isFavorite: true/false`), acompanhado de transição suave e notificação toast (ex: *"Skill 'Manus para Discord' favoritada!"*).
  - O contador da barra lateral `"Habilidades Favoritas (n)"` atualiza imediatamente em tempo real.
- **Filtrar por Favoritas via Sidebar**:
  - O usuário clica no botão dedicado **"Habilidades Favoritas (n)"** na barra lateral.
  - O catálogo exibe somente as habilidades marcadas como favoritas, com cabeçalho contextual e botão rápido para voltar a todas as habilidades se a lista estiver vazia.

### Identidade Visual e Paleta Monocromática (7 Cores)
Seguindo estritamente a paleta de 7 tons monocromáticos do sistema:
- `#151515`: Fundo da aplicação e canvas principal.
- `#202020` / `#242424`: Painéis, cards e campo de busca.
- `#333333`: Botão da barra lateral ativo, botões secundários e estrelas inativas.
- `#545454`: Bordas dos cards, divisórias e contorno da barra de busca.
- `#767676`: Ícone de busca inativo e contorno de estrela vazia.
- `#9B9B9B`: Texto auxiliar, contador numérico e timestamps.
- `#C2C2C2`: Bordas em foco e realce de texto.
- `#EAEAEA`: Estrela preenchida de favorito, títulos principais e texto ativo.

---

## 3. Decisões Técnicas e Arquitetura

### A. Modelo de Dados (`AgentSkill`)
- Adição da propriedade `isFavorite?: boolean` na interface `AgentSkill` em `src/types.ts`.
- Mock inicial com algumas skills pré-favoritadas para demonstração imediata de valor.
- Persistência das preferências de favoritos no `localStorage` sob a chave `dm_skills_favorites_v1` para manter as escolhas do usuário entre sessões e reloads.

### B. Gerenciamento de Estado (`ProjectContext`)
- Adição da ação `toggleFavoriteSkill: (id: string) => void` no contexto.
- Atualização imutável do array `skills` sincronizando tanto `isFavorite` quanto o histórico auditável do laboratório via `recordEvent`.

### C. Diagrama de Arquitetura e Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────┐
│                    Sidebar Navigation                        │
│  [Explorar Habilidades (13)]   [Habilidades Favoritas (4) ★] │
└──────────────────────────────┬───────────────────────────────┘
                               │ Dispara filtro / hash
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     SkillsStoreView                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Search Input: [ Pesquisar habilidades por nome...   ✕] │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Category Pills: [Todos] [Programação] [Dados] [Design] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Skill Card                                    [ ★ Fav] │  │
│  │ ┌──────────┐  Manus para Discord                       │  │
│  │ │ Livro 3D │  Planeje e gerencie comunidades...        │  │
│  │ └──────────┘  Atualizado em 28 de set.   [+ Adicionar] │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────┘
                               │ toggleFavoriteSkill(id)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 ProjectContext & LocalStorage                │
│  - skills.map(s => s.id === id ? { ...s, isFavorite } : s)   │
│  - localStorage.setItem('dm_skills_favorites', JSON.stringify)│
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Etapas Detalhadas de Implementação

1. **Atualização de Tipos (`src/types.ts`)**:
   - Incluir `isFavorite?: boolean` na interface `AgentSkill`.

2. **Ícones (`src/components/Icons.tsx`)**:
   - Adicionar ícone `star` e `star-filled` SVG para a estrela vazada e preenchida.

3. **Gerenciamento de Estado (`src/context/ProjectContext.tsx`)**:
   - Implementar `toggleFavoriteSkill(skillId: string)` com sincronização no `localStorage`.
   - Inicializar estado recuperando preferências salvas.

4. **Componente de Exibição (`src/views/SkillsStoreView.tsx`)**:
   - Adicionar prop `onlyFavorites?: boolean` e callback `onToggleFavorite: (id: string) => void`.
   - Incluir o botão de estrela no canto superior direito de cada card com tooltips e feedback tátil.
   - Refinar a lógica de busca para pesquisar simultaneamente por nome da skill, categoria (e aliases de categoria) e descrição, combinada com a pílula de categoria ativa.
   - Tratar estado vazio específico quando nenhuma favorita existir com botão de atalho para explorar todas as skills.

5. **Navegação Principal (`src/App.tsx`)**:
   - Adicionar botão de navegação na barra lateral **"Habilidades Favoritas"** com contador dinâmico de favoritas e ícone de estrela.
   - Integrar suporte a rota/hash `#/favoritas` ou filtro ativo no catálogo.
   - Exibir notificação toast informativa ao favoritar/desfavoritar uma habilidade.

6. **Validação e Testes**:
   - Checagem de tipagem via `tsc --noEmit` (`lint_applet`).
   - Compilação via `compile_applet`.
   - Teste no navegador via `playwright-cli`: busca por texto, combinação com categorias, alternância do toggle de favorito e navegação pela barra lateral.
