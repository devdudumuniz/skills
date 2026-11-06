# DM Skills

<p align="center">
  <img src="./assets/banner.svg" alt="DM Skills Banner" width="100%">
</p>

Catálogo aberto e profissional de **habilidades de engenharia para Agentes de IA** (Claude Code, OpenAI Codex, Manus, Antigravity, Cursor, Hermes, OpenCode e agentes locais).

Este repositório é dedicado exclusivamente ao desenvolvimento, empacotamento, teste e distribuição de **Skills**. Ele inclui uma interface gráfica integrada para execução local na sua máquina, além de mecanismos automáticos para tornar todas as skills **visíveis globalmente** para qualquer agente configurado no sistema.

---

## 📂 Estrutura do Repositório

```text
.
├── skills/                          # Diretório oficial das skills do repositório
│   ├── devops-delivery/             # Planejamento defensivo de CI/CD e entrega
│   ├── vibecode-builder/            # Engenharia incremental orientada a TDD
│   ├── automation-designer/         # Desenho de automações, webhooks e idempotência
│   ├── security-baseline/           # Análise estática e hardening defensivo
│   ├── network-server-diagnostics/  # Diagnóstico e triagem de infraestrutura
│   ├── exact-ui-extraction-transfer/# Extração e replicação de fidelidade visual
│   ├── status-portal/               # Skill geradora de portal de status executivo
│   ├── status-portal-registro/      # Registro auditável de progresso e timeline
│   └── status-portal-publicar/      # Sanitização e publicação para visão cliente
├── packages/                        # Pacotes compilados (.skill) portáteis
├── scripts/                         # Automações de empacotamento e link global
│   ├── install_global_skills.py     # Script para disponibilizar skills para todos os agentes
│   └── package_skills.py            # Empacotador de diretórios em arquivos .skill
└── src/                             # Plataforma Web local para exploração e testes de skills
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

## 📄 Licença

Distribuído sob licença MIT. Veja `LICENSE` para mais detalhes.
