# DM Skills & Project Status Portal (React SPA)

<p align="center">
  <img src="./assets/banner.svg" alt="DM Skills Banner" width="100%">
</p>

Universal AI Agent Skills Hub and Executive Project Status Portal rewritten as a modern React single-page application (SPA) powered by Vite and TypeScript.

---

## 🚀 Features

### 1. Executive Status Portal (Acompanhamento do Projeto)
- **Visão Geral:** Executive project summary, ring progress indicator, stats chips (Done, In Progress, Next, Waiting, Hours), next-step card, running tasks, and milestone deliverables.
- **Fases e Planejamento:** Phase tracking with progress bars, objective descriptions, and priority distribution matrix (P0, P1, P2, P3).
- **Tarefas:** Comprehensive backlog with status tabs (Concluídas, Em execução, Próximas, Aguardando, Todas), filters by phase and priority, text search, and task drawer with acceptance criteria, evidence references, and admin technical details.
- **Processos e Capacidades:** Process maturity ladder (0–4: Identificada, Em migração, Implementada, Testada, Homologada), automation degree, and domain capability cards.
- **Antes × Agora:** Comparative analysis of legacy architecture vs new platform, architectural changes with rationale and impact, decisions, and tracked errors.
- **Evolução e Achados:** Six-dimension evolution tracker (Existed, Identified, Preserved, Rebuilt, Improved, Missing) and security/data audit findings.
- **Histórico Auditável:** Timeline grouped by date with work hours calculation panel (registered, reconstructed, and task execution hours).
- **Relatórios Executivos:** Printable/downloadable phase reports and consolidated engineering reports.
- **Dual Role Mode:** Toggle in real-time between `CLIENT_VIEWER` (client-safe view with masked security details) and `ADMIN` (complete audit view with canonical statuses, evidence filepaths, and raw execution logs).

### 2. DM Skills Catalog Hub
- Interactive explorer for the 9 production-grade agent skills:
  - `devops-delivery`
  - `vibecode-builder`
  - `automation-designer`
  - `security-baseline`
  - `network-server-diagnostics`
  - `exact-ui-extraction-transfer`
  - `status-portal`
  - `status-portal-registro`
  - `status-portal-publicar`
- Markdown reference documentation viewer (`SKILL.md`).
- Multi-runtime installer command generator (Claude Code, OpenAI Codex, Manus, Antigravity, Hermes, OpenCode, Local).

---

## 🛠️ Tech Stack

- **Framework:** React 18
- **Bundler:** Vite
- **Language:** TypeScript
- **Styling:** CSS variables with executive dark navy theme (`.portal-theme`)
- **Port:** Dev server on port 3000 (`host: 0.0.0.0`)

---

## 💻 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
