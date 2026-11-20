# Deda Skills • Catálogo de Habilidades para Agentes de IA

<p align="center">
  <img src="./assets/banner.jpg" alt="Deda Skills Banner" width="100%">
</p>

Catálogo aberto, auditado e profissional de **habilidades de engenharia para Agentes de IA** (Claude Code, OpenAI Codex, Manus, Antigravity, Cursor, Hermes, OpenCode, OpenHands e agentes locais).

> 💡 **Versão 1.0.0 (Release Aberta)**: O **Deda Skills** está em sua versão inicial **v1.0.0** e preparado para publicação como repositório aberto e público. As skills listadas representam **algumas das habilidades disponíveis atualmente** no ecossistema, incluindo 6 mascotes assistentes da fauna brasileira (Carcará, Lobo-Guará, Tatu-Bola, Ararinha-Azul, Sagui e Onça-Pintada) e suítes com arte em xilogravura nordestina.

---

## 🔒 Portabilidade Universal & Segurança Zero-Vazamento

Nossas skills foram projetadas para serem **100% reaproveitáveis em qualquer agente e em qualquer ambiente**, e não apenas no nosso:

- **Compatibilidade Agnóstica**: Seguem o padrão canônico `.skill` com especificação aberta em `SKILL.md`, executáveis por Claude Code, Cursor IDE, OpenAI Codex, OpenHands, Hermes e agentes locais CLI.
- **Zero Vazamento de Credenciais**: Nenhuma skill armazena tokens privados, chaves de API, senhas ou caminhos pessoais de ambiente. A autenticação é provida via variáveis de ambiente padrão (`process.env`) ou parâmetros de execução informados pelo usuário.
- **Isolamento & Salvaguardas**: Cada habilidade opera com limites determinísticos e procedimentos plan-first, evitando exfiltração de dados ou mutações não autorizadas.
- **Tema & Responsividade**: Interface configurada no **Tema Claro do Sertão (`#FAF3E8` Pergaminho Quente & `#C45730` Terracota)** com superfícies em marfim/linho, acentos em cobre/barro queimado, modo opcional de Alto Contraste para baixa visão e arquitetura 100% responsiva para smartphones, tablets e desktops.

---

## 📂 Estrutura do Repositório (Amostra de Skills Disponíveis)

Abaixo estão **algumas das skills oficiais disponíveis** na versão atual:

```text
.
├── skills/                          # Amostra das skills oficiais prontas para uso
│   ├── devops-delivery/             # Planejamento defensivo de CI/CD, blue-green e entrega
│   ├── vibecode-builder/            # Engenharia incremental orientada a TDD e qualidade
│   ├── automation-designer/         # Desenho de automações, webhooks e idempotência
│   ├── security-baseline/           # Análise estática, hardening defensivo e zero-trust
│   ├── network-server-diagnostics/  # Diagnóstico e triagem de infraestrutura e portas
│   ├── exact-ui-extraction-transfer/# Extração e replicação de fidelidade visual pixel-perfect
│   ├── design-intelligence-studio/  # Design systems W3C DTCG, calibração estética e auditoria WCAG
│   ├── canvas-diagram-studio/       # Diagramas Excalidraw v2 com bindings nativos e layout anti-colisão
│   ├── excalidraw-diagram-generator/# Gerador interativo de diagramas arquiteturais via prompt no Excalidraw
│   ├── architecture-diagram-engine/ # Diagramas técnicos Draw.io/mxGraph (C4, ER, UML) validados
│   ├── agent-profile-builder/       # Kit técnico de perfil de agente (identidade, RBAC deny-by-default, memória e validador)
│   ├── status-portal/               # Skill geradora de portal de status executivo
│   ├── status-portal-registro/      # Registro auditável de progresso e timeline
│   └── status-portal-publicar/      # Sanitização e publicação para visão cliente
├── packages/                        # Pacotes compilados (.skill) portáteis
├── scripts/                         # Automações de empacotamento e link global
│   ├── install_global_skills.py     # Script para disponibilizar skills para todos os agentes
│   └── package_skills.py            # Empacotador de diretórios em arquivos .skill
└── src/                             # Plataforma Web local responsiva para testes e exploração
```

> **Nota sobre o `status-portal`**: O painel de status executivo é exclusivamente uma das habilidades empacotadas (`./skills/status-portal/`). Ele não governa a aplicação nem o repositório — sendo acionado sob demanda apenas quando um agente executa tarefas de relatório executivo.

---

## 🌐 Ativação Global para Todos os Agentes

Para que todos os seus agentes de IA (Claude Code, OpenAI Codex, Manus, Antigravity, Cursor, etc.) reconheçam e utilizem imediatamente todas as skills deste repositório no seu computador:

### Via Terminal:
```bash
# Sincroniza e cria links globais nos diretórios de agentes do sistema
npm run skills:global

# Ou diretamente via Python:
python3 scripts/install_global_skills.py
```

O script instala e conecta as skills aos seguintes diretórios globais padrão:
- `~/.agent/skills/` (Agentes Universais / OpenCode / Hermes)
- `~/.claude/skills/` (Claude Code)
- `~/.codex/skills/` (OpenAI Codex)
- `~/.cursor/skills/` (Cursor IDE)
- `~/.config/agents/skills/` (Configuração do Sistema)

### Via Plataforma Web:
Abra a plataforma localmente (`npm run dev`) e clique no botão **"Ativação Global de Skills"** na barra lateral para sincronizar ou inspecionar o status com 1 clique.

---

## 💻 Execução Local da Plataforma de Skills

Para explorar visualmente o catálogo, testar prompts no playground, criar novas skills via formulário ou gerenciar favoritas:

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar plataforma de visualização local
npm run dev

# 3. Gerar build de produção da plataforma
npm run build
```

Acesse em: `http://localhost:3000`

---

## 📦 Empacotamento de Novas Skills

```bash
# Empacota todas as skills de ./skills/ para a pasta ./packages/
npm run skills:package
```

---

## 📄 Licença & Autoria

- **Autor**: **Eduardo Muniz** (`@devdudumuniz`)
- **Licença**: Distribuído sob licença **MIT**. Veja `LICENSE` (raiz) e `skills/LICENSE` (skills e pacotes `.skill`) para mais detalhes.
- **Segurança**: Consulte `SECURITY.md` para diretrizes de execução local segura (`HOST=127.0.0.1`) e reporte responsável de vulnerabilidades.

