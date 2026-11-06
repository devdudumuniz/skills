import { AgentSkill } from "../types";

export const AGENT_SKILLS: AgentSkill[] = [
  {
    id: "discord-playbooks",
    name: "Manus para Discord",
    category: "aplicativos",
    description: "Planeje e gerencie comunidades do Discord, bots, moderação e anúncios.",
    path: "discord-playbooks",
    entrypoint: "SKILL.md",
    package: "packages/discord-playbooks.skill",
    execution_mode: "agent-loop",
    tags: ["discord", "comunidade", "bots", "moderacao", "anuncios", "canais"],
    isOfficial: true,
    author: "Manus",
    version: "2.4.0",
    supportedRuntimes: ["manus", "claude", "codex", "antigravity", "cursor", "local"],
    updatedAt: "28 de set. de 2026",
    usageCount: "2.8k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "discord",
      subtitle: "Comunidade & Moderação • Xilogravura",
      imageUrl: "/assets/cordel/discord.jpg",
      cordelArt: {
        themeName: "Praça do Forró & Casario da Comunidade",
        elements: ["Praça pública", "Bandeirinhas de cordel", "Trio de forró", "Casal dançando", "Igreja sertaneja"],
        caption: "Comunicação viva e acolhedora esculpida em xilogravura de cordel nordestino."
      }
    },
    promptSuggestions: [
      "Projete cargos e canais para uma nova comunidade do Discord.",
      "Elabore um plano de moderação e integração para o meu servidor do Discord.",
      "Resuma a atividade dos meus dados exportados do Discord.",
    ],
    whenToUse: "Use when the user asks what Manus can do with Discord, wants to set up channels/roles, build bots or manage community engagement.",
    whenNotToUse: "Do not execute direct API mutations without server owner permission or bot token configuration.",
    procedure: [
      "1. Refuse self-bots, normal-user scripting and artificial engagement.",
      "2. Inspect server permissions and ownership roles.",
      "3. Structure categories, channels, permissions and audit logging.",
      "4. Generate moderation policy and welcoming onboarding workflows.",
    ],
    markdown: `---
name: discord-playbooks
description: "Use when the user asks what Manus can do with Discord or needs assistance with server operations, roles, channels, or bot development."
---

# Discord Playbooks (Manus for Discord)

Route Discord work by server authority, durable state, frequency, and execution availability. Official APIs cover many server-management objects, but documented capability is not proof that the current Manus session exposes a configured Discord app.

## Step 0: Safety and authority

1. Refuse self-bots, normal-user-account scripting, unsolicited bulk messaging, fake members, fake views, and artificial engagement.
2. Inspect the user's actual server role and effective permissions. Server ownership is not the only valid authority, and membership alone is not permission to administer.
3. Separate read-only community discovery from destructive bulk actions (pruning members, deleting roles, bulk archiving).

## Core Capabilities

- **Community Architecture**: Hierarchy of categories, announcement channels, text forums, voice lounges, and private staff boards.
- **Role Permission Matrix**: Layered permissions honoring principle of least privilege.
- **Bot Integration & Event Handlers**: Slash commands, event listeners, webhook distribution, and interaction response schemas.
- **Moderation Rulebooks**: Auto-mod regex patterns, raid protection, message purging, and audit trails.`,
    files: [
      {
        name: "discord-playbooks",
        path: "discord-playbooks",
        isDir: true,
        children: [
          {
            name: "formats",
            path: "discord-playbooks/formats",
            isDir: true,
            children: [
              {
                name: "desktop_runtime.md",
                path: "discord-playbooks/formats/desktop_runtime.md",
                content: `# Desktop Runtime Guide\n\nGuidelines for running local Discord bot engines with WebSocket heartbeat management and reconnection backoff.`,
              },
              {
                name: "verification-matrix.md",
                path: "discord-playbooks/formats/verification-matrix.md",
                content: `# Verification Matrix\n\nEnsures OAuth2 scopes, gateway intents (GUILD_MEMBERS, MESSAGE_CONTENT), and rate limit headers are verified before deployment.`,
              },
              {
                name: "safety_rules.md",
                path: "discord-playbooks/formats/safety_rules.md",
                content: `# Discord Safety & Compliance Rules\n\n- Zero token logging in console outputs\n- Prohibit unprompted direct messaging\n- Strictly enforce age-restricted NSFW channel tags`,
              },
              {
                name: "route-contract.md",
                path: "discord-playbooks/formats/route-contract.md",
                content: `# Route Contract\n\nDefines endpoints for Discord REST API v10, interaction responses, and webhook payload serialization.`,
              },
            ],
          },
          {
            name: "references",
            path: "discord-playbooks/references",
            isDir: true,
            children: [
              {
                name: "data-guidance.md",
                path: "discord-playbooks/references/data-guidance.md",
                content: `# Data Guidance\n\nHandling GDPR data subject requests and parsing GDPR export archives from Discord user settings.`,
              },
              {
                name: "engagement.md",
                path: "discord-playbooks/references/engagement.md",
                content: `# Community Engagement Strategies\n\nTechniques for welcoming onboarding flows, scheduled community game nights, and thread discussions.`,
              },
              {
                name: "server-ops.md",
                path: "discord-playbooks/references/server-ops.md",
                content: `# Server Operations Playbook\n\nBest practices for server backups, channel cloning, emergency lockdown protocols, and role tiering.`,
              },
            ],
          },
          {
            name: "SKILL.md",
            path: "discord-playbooks/SKILL.md",
            type: "markdown",
            content: `---
name: discord-playbooks
description: "Use when the user asks what Manus can do with Discord or needs assistance with server operations, roles, channels, or bot development."
---

# Discord Playbooks (Manus for Discord)

Route Discord work by server authority, durable state, frequency, and execution availability. Official APIs cover many server-management objects, but documented capability is not proof that the current Manus session exposes a configured Discord app.

## Step 0: Safety and authority

1. Refuse self-bots, normal-user-account scripting, unsolicited bulk messaging, fake members, fake views, and artificial engagement.
2. Inspect the user's actual server role and effective permissions. Server ownership is not the only valid authority, and membership alone is not permission to administer.

## Step 1: Topology Design
- Structure channels with clear topic demarcations.
- Enforce slowmode where necessary to prevent floods.
- Set verification levels (Email, Phone, 10-minute wait).`,
          },
        ],
      },
    ],
  },
  {
    id: "audacity-mastering",
    name: "Manus para Audacity",
    category: "midia",
    description: "Limpe, restaure e finalize gravações de voz e podcasts.",
    path: "audacity-mastering",
    entrypoint: "SKILL.md",
    package: "packages/audacity-mastering.skill",
    execution_mode: "non-destructive",
    tags: ["audacity", "audio", "podcast", "masterizacao", "reducao-ruido", "voz"],
    isOfficial: true,
    author: "Manus",
    version: "1.8.2",
    supportedRuntimes: ["manus", "claude", "codex", "local"],
    updatedAt: "28 de set. de 2026",
    usageCount: "1.9k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "audacity",
      subtitle: "Engenharia de Som • Xilogravura",
      imageUrl: "/assets/cordel/creative.jpg",
    },
    promptSuggestions: [
      "Remova ruído de fundo e zumbido elétrico de uma entrevista em áudio.",
      "Equalize e aplique compressão para padronizar voz em um podcast com dois apresentadores.",
      "Masterize a faixa final para a especificação de streaming (-16 LUFS / -1.0 dB True Peak).",
    ],
    markdown: `---
name: audacity-mastering
description: Limpe, restaure e finalize gravações de voz e podcasts usando pipelines de processamento não-destrutivos.
---

# Manus para Audacity & Restauração de Áudio

Este kit de ferramentas orienta a automação de scripts Nyquist, pipelines de filtros no Audacity e restauração espectral de áudio falado.

## Cadeia de Sinal Recomendada
1. **High-pass filter**: Corte subgrave em 80 Hz para eliminar ruídos de manuseio.
2. **Noise Reduction**: Perfilamento de ruído estático em trechos silenciosos com atenuação controlada (-6 a -12 dB).
3. **De-Esser**: Atenuação cirúrgica de sibilâncias entre 5 kHz e 8 kHz.
4. **Compressor**: Razão 2.5:1, ataque rápido (20ms), liberação suave (120ms).
5. **Loudness Normalization**: Alvo de -16 LUFS integrado para podcasts estéreo (-19 LUFS mono).`,
    files: [
      {
        name: "audacity-mastering",
        path: "audacity-mastering",
        isDir: true,
        children: [
          {
            name: "chains",
            path: "audacity-mastering/chains",
            isDir: true,
            children: [
              {
                name: "podcast_vocal_chain.txt",
                path: "audacity-mastering/chains/podcast_vocal_chain.txt",
                content: `HighPass: frequency=80\nNoiseReduction: sensitivity=6 dB=12\nCompressor: ratio=2.5 threshold=-18\nLoudness: target=-16LUFS`,
              },
            ],
          },
          {
            name: "SKILL.md",
            path: "audacity-mastering/SKILL.md",
            type: "markdown",
            content: `---
name: audacity-mastering
description: Limpe, restaure e finalize gravações de voz e podcasts.
---

# Manus para Audacity & Áudio

Diretrizes detalhadas para engenharia de áudio digital, automação com macros e controle de ganho.`,
          },
        ],
      },
    ],
  },
  {
    id: "html-video-production",
    name: "Produção de Vídeo em HTML",
    category: "midia",
    description: "Crie vídeos HTML editáveis baseados em cenas, renderizados para MP4 usando HyperFrames, com animações GSAP e legendas sincronizadas.",
    path: "html-video-production",
    entrypoint: "SKILL.md",
    package: "packages/html-video-production.skill",
    execution_mode: "iterative-tdd",
    tags: ["video", "html5", "gsap", "hyperframes", "mp4", "motion-graphics"],
    isOfficial: true,
    author: "Manus",
    version: "3.1.0",
    supportedRuntimes: ["manus", "claude", "codex", "local"],
    updatedAt: "23 de jul. de 2026",
    usageCount: "4.3k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "video",
      subtitle: "Motion & Audiovisual • Xilogravura",
      imageUrl: "/assets/cordel/creative.jpg",
    },
    promptSuggestions: [
      "Crie um vídeo explicativo de 30 segundos sobre lançamento de produto SaaS.",
      "Gere uma animação tipográfica sincronizada com voz gerada por IA.",
      "Renderize uma sequência de cards de redes sociais em 9:16 para reels.",
    ],
    markdown: `---
name: html-video-production
description: Crie vídeos HTML editáveis baseados em cenas, renderizados para MP4 usando HyperFrames e GSAP.
---

# Produção de Vídeo em HTML & Motion Graphics

Renderize vídeos profissionais programaticamente através de tecnologias web modernas (HTML5 Canvas, CSS Grid, GSAP e Chromium Headless).

## Arquitetura de Cenas
- **Scene-Based Composition**: Cada cena é um componente determinístico com duração em ticks/frames.
- **Time Synchronizer**: Timeline global que orquestra trilha de áudio, efeitos sonoros (SFX) e legendas SRT.
- **Pixel-Accurate Export**: Exportador headless que gera frames PNG descompactados e os une com FFmpeg a 60fps.`,
    files: [
      {
        name: "html-video-production",
        path: "html-video-production",
        isDir: true,
        children: [
          {
            name: "templates",
            path: "html-video-production/templates",
            isDir: true,
            children: [
              {
                name: "saas_explainer.html",
                path: "html-video-production/templates/saas_explainer.html",
                content: `<!DOCTYPE html>\n<html>\n<head><title>SaaS Explainer</title></head>\n<body><div id="scene-root"></div></body>\n</html>`,
              },
            ],
          },
          {
            name: "SKILL.md",
            path: "html-video-production/SKILL.md",
            type: "markdown",
            content: `---
name: html-video-production
description: Crie vídeos HTML editáveis baseados em cenas, renderizados para MP4 usando HyperFrames.
---

# HTML Video Production Engine`,
          },
        ],
      },
    ],
  },
  {
    id: "lightroom-workflows",
    name: "Manus para Lightroom",
    category: "design",
    description: "Faça a triagem, edite, organize, exporte e migre bibliotecas de fotos.",
    path: "lightroom-workflows",
    entrypoint: "SKILL.md",
    package: "packages/lightroom-workflows.skill",
    execution_mode: "plan-first",
    tags: ["lightroom", "fotografia", "raw", "color-grading", "metadados", "edicao"],
    isOfficial: true,
    author: "Manus",
    version: "2.1.0",
    supportedRuntimes: ["manus", "claude", "codex", "local"],
    updatedAt: "28 de set. de 2026",
    usageCount: "1.4k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "lightroom",
      subtitle: "Curadoria & Cores • Xilogravura",
      imageUrl: "/assets/cordel/creative.jpg",
    },
    promptSuggestions: [
      "Faça a triagem automática de um ensaio de fotos descartando imagens fora de foco ou olhos fechados.",
      "Aplique um preset de color grading cinematográfico preservando o tom natural de pele.",
      "Padronize os metadados EXIF e adicione tags de direitos autorais para entrega ao cliente.",
    ],
    markdown: `---
name: lightroom-workflows
description: Faça a triagem, edite, organize, exporte e migre bibliotecas de fotos.
---

# Manus para Adobe Lightroom & Fotografia

Workflows automatizados para triagem acelerada (culling), aplicação de perfis de câmera, correção de lente e exportação em lote.

## Fluxo de Trabalho Recomendado
1. **Ingestão & Backup**: Criação de catálogo isolado por evento com backup espelhado.
2. **Culling Inteligente**: Avaliação de 1 a 5 estrelas e etiquetas de cor para seleção editorial.
3. **Tratamento Global**: Ajuste de exposição, balanço de branco e curvas de tom.
4. **Máscaras de IA**: Detecção de sujeito, céu e fundo para ajustes pontuais.
5. **Exportação Otimizada**: Perfis sRGB com compressão perceptual para web e AdobeRGB para impressão.`,
    files: [
      {
        name: "lightroom-workflows",
        path: "lightroom-workflows",
        isDir: true,
        children: [
          {
            name: "presets",
            path: "lightroom-workflows/presets",
            isDir: true,
            children: [
              {
                name: "warm_cinematic.xmp",
                path: "lightroom-workflows/presets/warm_cinematic.xmp",
                content: `<x:xmpmeta xmlns:x="adobe:ns:meta/">\n  <!-- Warm Cinematic Color Profile -->\n</x:xmpmeta>`,
              },
            ],
          },
          {
            name: "SKILL.md",
            path: "lightroom-workflows/SKILL.md",
            type: "markdown",
            content: `---
name: lightroom-workflows
description: Faça a triagem, edite, organize, exporte e migre bibliotecas de fotos.
---

# Adobe Lightroom Playbook`,
          },
        ],
      },
    ],
  },
  {
    id: "illustrator-vector",
    name: "Manus para Illustrator",
    category: "design",
    description: "Crie ilustrações vetoriais, exportações, pacotes e ativos de marca.",
    path: "illustrator-vector",
    entrypoint: "SKILL.md",
    package: "packages/illustrator-vector.skill",
    execution_mode: "iterative-tdd",
    tags: ["illustrator", "vetor", "svg", "branding", "logotipos", "iconografia"],
    isOfficial: true,
    author: "Manus",
    version: "2.3.0",
    supportedRuntimes: ["manus", "claude", "codex", "local"],
    updatedAt: "28 de set. de 2026",
    usageCount: "3.2k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "illustrator",
      subtitle: "Vetor & Identidade • Xilogravura",
      imageUrl: "/assets/cordel/web_design.jpg",
    },
    promptSuggestions: [
      "Converta um rascunho de logotipo em curvas vetoriais perfeitas com geometria dourada.",
      "Gere um pacote de 12 ícones de interface mantendo a mesma espessura de traço e grid de 24px.",
      "Prepare um manual de identidade visual em SVG com paleta de cores e tipografia de marca.",
    ],
    markdown: `---
name: illustrator-vector
description: Crie ilustrações vetoriais, exportações, pacotes e ativos de marca com precisão geométrica.
---

# Manus para Adobe Illustrator & Design Vetorial

Estruturação de vetores escaláveis, otimização de paths SVG, criação de patterns e preparação para pré-impressão (CMYK) e UI (RGB).`,
    files: [
      {
        name: "illustrator-vector",
        path: "illustrator-vector",
        isDir: true,
        children: [
          {
            name: "actions",
            path: "illustrator-vector/actions",
            isDir: true,
            children: [
              {
                name: "svg_minify_rules.json",
                path: "illustrator-vector/actions/svg_minify_rules.json",
                content: `{\n  "removeDoctype": true,\n  "removeXMLProcInst": true,\n  "removeComments": true\n}`,
              },
            ],
          },
          {
            name: "SKILL.md",
            path: "illustrator-vector/SKILL.md",
            type: "markdown",
            content: `---
name: illustrator-vector
description: Crie ilustrações vetoriais, exportações, pacotes e ativos de marca.
---

# Illustrator Vector Design Manual`,
          },
        ],
      },
    ],
  },
  {
    id: "marketing-copywriter",
    name: "Copywriter de Marketing",
    category: "conteudo",
    description: "Este kit de ferramentas de marketing profissional ajuda você a escrever e reescrever textos persuasivos para landing pages, páginas iniciais e anúncios. Ele abrange vários cenários de marketing...",
    path: "marketing-copywriter",
    entrypoint: "SKILL.md",
    package: "packages/marketing-copywriter.skill",
    execution_mode: "agent-loop",
    tags: ["copywriting", "marketing", "conversao", "landing-pages", "anuncios", "persuasao"],
    isOfficial: true,
    author: "Manus",
    version: "2.7.0",
    supportedRuntimes: ["manus", "claude", "codex", "local"],
    updatedAt: "20 de out. de 2026",
    usageCount: "5.6k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "copywriter",
      subtitle: "Cordel & Conversão • Xilogravura",
      imageUrl: "/assets/cordel/copywriting.jpg",
    },
    promptSuggestions: [
      "Escreva uma proposta de valor (hero section) e 3 chamadas para ação (CTAs) para um produto B2B.",
      "Reescreva um texto de e-mail de vendas frio aplicando a estrutura PAS (Problema, Agitação, Solução).",
      "Crie 5 variações de títulos de anúncios para teste A/B focados em conversão.",
    ],
    markdown: `---
name: marketing-copywriter
description: Este kit de ferramentas de marketing profissional ajuda você a escrever e reescrever textos persuasivos para landing pages, páginas iniciais e anúncios.
---

# Copywriter de Marketing de Alta Conversão

Frameworks consagrados de redação publicitária (AIDA, PAS, BAB, FAB) combinados com psicologia comportamental e análise de objeções de compra.

## Frameworks Nativos
- **PAS (Problem - Agitate - Solve)**: Conecte-se com a dor do cliente, amplifique a urgência e apresente a solução definitiva.
- **AIDA (Attention - Interest - Desire - Action)**: Conduza o leitor de forma irresistível pelo funil de conversão.
- **Social Proof Engineering**: Estruturação de depoimentos, dados e métricas de autoridade.`,
    files: [
      {
        name: "marketing-copywriter",
        path: "marketing-copywriter",
        isDir: true,
        children: [
          {
            name: "frameworks",
            path: "marketing-copywriter/frameworks",
            isDir: true,
            children: [
              {
                name: "pas_formula.md",
                path: "marketing-copywriter/frameworks/pas_formula.md",
                content: `# PAS Formula Playbook\n\n1. Problem: Hook with acute pain point\n2. Agitate: Reveal cost of inaction\n3. Solution: Introduce frictionless resolution`,
              },
            ],
          },
          {
            name: "SKILL.md",
            path: "marketing-copywriter/SKILL.md",
            type: "markdown",
            content: `---
name: marketing-copywriter
description: Redação publicitária de alta conversão para landing pages e anúncios.
---

# High-Conversion Copywriting Framework`,
          },
        ],
      },
    ],
  },
  {
    id: "exact-ui-extraction-transfer",
    name: "Exact UI Extraction & Transfer",
    category: "programacao",
    description: "Extrai geometria, CSS computado, tokens, ativos e estados de uma interface autorizada e reproduz componentes ou layouts selecionados em um projeto identificado, com comparação visual e gates de regressão.",
    path: "exact-ui-extraction-transfer",
    entrypoint: "SKILL.md",
    package: "packages/exact-ui-extraction-transfer.skill",
    execution_mode: "plan-first",
    tags: ["ui", "frontend", "design-tokens", "pixel-faithful", "tailwind", "components"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "manus", "antigravity", "hermes", "opencode", "cursor", "local"],
    updatedAt: "01 de nov. de 2026",
    usageCount: "3.7k",
    installed: true,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "code",
      subtitle: "UI & Geometria • Xilogravura",
      imageUrl: "/assets/cordel/web_design.jpg",
    },
    promptSuggestions: [
      "Extrair o card de estatísticas executivas e transferir como componente React modular com Tailwind CSS.",
      "Auditar os tokens de cor, tipografia e espaçamento de um layout de dashboard existente.",
      "Gerar testes de regressão visual para garantir fidelidade de 100% no clone de interface.",
    ],
    markdown: `---
name: exact-ui-extraction-transfer
description: Extrai geometria, CSS computado, tokens e ativos de interfaces com fidelidade pixel-faithful.
---

# Exact UI Extraction & Transfer

## Objetivo
Transposição exata de layouts para código React e Tailwind CSS com padrões profissionais de design sem tolerância para espaçamentos arbitrários.`,
    files: [
      {
        name: "exact-ui-extraction-transfer",
        path: "exact-ui-extraction-transfer",
        isDir: true,
        children: [
          {
            name: "references",
            path: "exact-ui-extraction-transfer/references",
            isDir: true,
            children: [
              {
                name: "extraction-playbook.md",
                path: "exact-ui-extraction-transfer/references/extraction-playbook.md",
                content: `# Extraction Playbook\n\n1. Inspect DOM computed metrics\n2. Extract typography scale\n3. Match hex codes with design tokens`,
              },
              {
                name: "transfer-and-qa.md",
                path: "exact-ui-extraction-transfer/references/transfer-and-qa.md",
                content: `# Transfer & QA Protocols\n\nExecute side-by-side visual diffing with 0% tolerable margin for layout shifts.`,
              },
            ],
          },
          {
            name: "SKILL.md",
            path: "exact-ui-extraction-transfer/SKILL.md",
            type: "markdown",
            content: `---
name: exact-ui-extraction-transfer
description: Extrai geometria, CSS computado, tokens e ativos de interfaces.
---

# Exact UI Extraction & Transfer`,
          },
        ],
      },
    ],
  },
  {
    id: "devops-delivery",
    name: "DevOps Delivery",
    category: "programacao",
    description: "Planeja e revisa entregas DevOps em um repositório, cobrindo CI/CD, ambientes, observabilidade, rollback e risco, sem executar deploy ou alterar produção por padrão.",
    path: "devops-delivery",
    entrypoint: "SKILL.md",
    package: "packages/devops-delivery.skill",
    execution_mode: "plan-first",
    tags: ["devops", "ci-cd", "deploy", "delivery", "infrastructure", "observability"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "manus", "antigravity", "hermes", "opencode", "cursor", "local"],
    updatedAt: "25 de out. de 2026",
    usageCount: "2.1k",
    installed: true,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "devops",
      subtitle: "CI/CD & Entrega • Xilogravura",
      imageUrl: "/assets/cordel/devops.jpg",
    },
    promptSuggestions: [
      "Preparar plano de entrega para atualização de microsserviço com estratégia de blue-green deployment.",
      "Revisar arquivo do GitHub Actions para adicionar etapas de auditoria de segurança e cache otimizado.",
      "Estruturar plano de rollback automático baseado em picos de erro 5xx e latência p99.",
    ],
    markdown: `---
name: devops-delivery
description: Planeja e revisa entregas DevOps em um repositório, cobrindo CI/CD, ambientes, observabilidade e rollback.
---

# DevOps Delivery Playbook

Produzir um plano de entrega verificável para uma aplicação ou serviço, separando fatos observados, decisões pendentes, mudanças propostas e gates de rollback.`,
    files: [
      {
        name: "devops-delivery",
        path: "devops-delivery",
        isDir: true,
        children: [
          {
            name: "SKILL.md",
            path: "devops-delivery/SKILL.md",
            type: "markdown",
            content: `---
name: devops-delivery
description: Planeja e revisa entregas DevOps em um repositório.
---

# DevOps Delivery`,
          },
        ],
      },
    ],
  },
  {
    id: "security-baseline",
    name: "Security Baseline",
    category: "dados",
    description: "Faz revisão defensiva e somente leitura de segurança em código, dependências, configuração e arquitetura, produzindo findings priorizados sem explorar ou exfiltrar dados.",
    path: "security-baseline",
    entrypoint: "SKILL.md",
    package: "packages/security-baseline.skill",
    execution_mode: "read-only",
    tags: ["security", "audit", "vulnerabilities", "credentials", "compliance", "hardening"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "manus", "antigravity", "hermes", "opencode", "cursor", "local"],
    updatedAt: "22 de out. de 2026",
    usageCount: "3.4k",
    installed: true,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "security",
      subtitle: "Auditoria Defensiva • Xilogravura",
      imageUrl: "/assets/cordel/security.jpg",
    },
    promptSuggestions: [
      "Executar varredura estática de segurança no código em busca de injeções de SQL e XSS.",
      "Auditar o histórico do repositório Git contra segredos ou chaves privadas commitadas acidentalmente.",
      "Verificar vulnerabilidades em dependências npm/pip contra a base CVE e sugerir atualizações seguras.",
    ],
    markdown: `---
name: security-baseline
description: Faz revisão defensiva e somente leitura de segurança em código, dependências e arquitetura.
---

# Security Baseline

## Objetivo
Encontrar fraquezas verificáveis, reduzir falsos positivos e produzir recomendações defensivas acionáveis com zero risco de exfiltração.`,
    files: [
      {
        name: "security-baseline",
        path: "security-baseline",
        isDir: true,
        children: [
          {
            name: "SKILL.md",
            path: "security-baseline/SKILL.md",
            type: "markdown",
            content: `---
name: security-baseline
description: Faz revisão defensiva e somente leitura de segurança.
---

# Security Baseline`,
          },
        ],
      },
    ],
  },
  {
    id: "automation-designer",
    name: "Automation Designer",
    category: "automacao",
    description: "Projeta automações e workflows confiáveis com gatilhos, idempotência, retries, timeouts, segredos por referência, observabilidade e rollback.",
    path: "automation-designer",
    entrypoint: "SKILL.md",
    package: "packages/automation-designer.skill",
    execution_mode: "plan-first",
    tags: ["automation", "workflows", "n8n", "cron", "orchestration", "idempotency"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "antigravity", "hermes", "opencode", "local"],
    updatedAt: "20 de out. de 2026",
    usageCount: "1.8k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "code",
      subtitle: "Workflows & Automação • Xilogravura",
      imageUrl: "/assets/cordel/automation.jpg",
    },
    promptSuggestions: [
      "Desenhar um fluxo de processamento de pedidos assíncrono com idempotência e Dead Letter Queue (DLQ).",
      "Modelar política de retry com backoff exponencial para chamadas a APIs de terceiros instáveis.",
      "Projetar integração de webhook segura com validação HMAC e proteção contra ataques de replay.",
    ],
    markdown: `---
name: automation-designer
description: Projeta automações e workflows confiáveis com gatilhos, idempotência e observabilidade.
---

# Automation Designer Playbook`,
    files: [
      {
        name: "automation-designer",
        path: "automation-designer",
        isDir: true,
        children: [
          {
            name: "SKILL.md",
            path: "automation-designer/SKILL.md",
            type: "markdown",
            content: `---
name: automation-designer
description: Projeta automações e workflows confiáveis.
---

# Automation Designer`,
          },
        ],
      },
    ],
  },
  {
    id: "status-portal",
    name: "Status Portal",
    category: "negocios",
    description: "Instala e configura um painel completo de acompanhamento e status de engenharia (visão geral, fases, tarefas, processos, antes × agora, evolução e relatórios), somente leitura e derivado de backlog + eventos.",
    path: "status-portal",
    entrypoint: "SKILL.md",
    package: "packages/status-portal.skill",
    execution_mode: "non-destructive",
    tags: ["governance", "dashboard", "status", "audit", "progress-tracking", "client-view"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "manus", "antigravity", "hermes", "opencode", "cursor", "local"],
    updatedAt: "30 de out. de 2026",
    usageCount: "2.9k",
    installed: true,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "code",
      subtitle: "Governança & Projeto • Xilogravura",
      imageUrl: "/assets/cordel/governance.jpg",
    },
    promptSuggestions: [
      "Configurar o painel de status para um projeto de modernização de ERP, definindo 3 fases e 8 tarefas críticas.",
      "Gerar relatório executivo de progresso com masking automático de dados sensíveis para clientes.",
      "Auditar o tempo investido em cada tarefa através dos checkpoints criptográficos de sessão.",
    ],
    markdown: `---
name: status-portal
description: Instala e configura um painel de acompanhamento e status de engenharia para clientes e diretoria.
---

# Status Portal

## Objetivo
Fornecer um painel executivo moderno, auditável e somente leitura que reflete o andamento real do projeto.`,
    files: [
      {
        name: "status-portal",
        path: "status-portal",
        isDir: true,
        children: [
          {
            name: "references",
            path: "status-portal/references",
            isDir: true,
            children: [
              {
                name: "DATA-MODEL.md",
                path: "status-portal/references/DATA-MODEL.md",
                content: `# Status Portal Data Model\n\nDefines portal.yaml, phases.yaml, backlog.yaml schemas and sanitization layers.`,
              },
              {
                name: "BOOTSTRAP.md",
                path: "status-portal/references/BOOTSTRAP.md",
                content: `# Bootstrap Guide\n\nZero-dependency quickstart for spinning up local portal preview containers.`,
              },
            ],
          },
          {
            name: "SKILL.md",
            path: "status-portal/SKILL.md",
            type: "markdown",
            content: `---
name: status-portal
description: Instala e configura um painel de acompanhamento e status de engenharia para clientes e diretoria.
---

# Status Portal Engine`,
          },
        ],
      },
    ],
  },
  {
    id: "network-server-diagnostics",
    name: "Network & Server Diagnostics",
    category: "dados",
    description: "Diagnostica conectividade e saúde de servidores de forma controlada, correlacionando DNS, rotas, portas, TLS, serviços, recursos e logs sem alterar firewall ou dados.",
    path: "network-server-diagnostics",
    entrypoint: "SKILL.md",
    package: "packages/network-server-diagnostics.skill",
    execution_mode: "read-only",
    tags: ["network", "dns", "tls", "ports", "firewall", "diagnostics", "troubleshooting"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "antigravity", "hermes", "opencode", "local"],
    updatedAt: "26 de out. de 2026",
    usageCount: "1.2k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "shield",
      subtitle: "Conectividade & Rotas • Xilogravura",
      imageUrl: "/assets/cordel/devops.jpg",
    },
    promptSuggestions: [
      "Diagnosticar falha de handshake SSL e verificar a cadeia de certificados até a CA raiz.",
      "Inspecionar latência de rede e perda de pacotes para o servidor de produção.",
      "Verificar se há portas abertas não documentadas ou serviços escutando em interfaces externas.",
    ],
    markdown: `---
name: network-server-diagnostics
description: Diagnostica conectividade e saúde de servidores de forma controlada e somente leitura.
---

# Network & Server Diagnostics`,
    files: [
      {
        name: "network-server-diagnostics",
        path: "network-server-diagnostics",
        isDir: true,
        children: [
          {
            name: "SKILL.md",
            path: "network-server-diagnostics/SKILL.md",
            type: "markdown",
            content: `---
name: network-server-diagnostics
description: Diagnostica conectividade e saúde de servidores de forma controlada.
---

# Network Diagnostics Playbook`,
          },
        ],
      },
    ],
  },
  {
    id: "vibecode-builder",
    name: "Vibecode Builder",
    category: "programacao",
    description: "Transforma uma ideia de produto em uma implementação pequena e verificável, orientando descoberta do repositório, escopo, UX, código, testes e revisão sem sacrificar segurança ou funcionalidade existente.",
    path: "skills/vibecode-builder",
    entrypoint: "SKILL.md",
    package: "packages/vibecode-builder.skill",
    execution_mode: "iterative-tdd",
    tags: ["product", "engineering", "feature", "tdd", "scaffolding", "fullstack"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "manus", "antigravity", "hermes", "opencode", "cursor", "local"],
    updatedAt: "02 de nov. de 2026",
    usageCount: "2.4k",
    installed: true,
    coverTheme: {
      bg: "linear-gradient(155deg, #10b981 0%, #047857 60%, #064e3b 100%)",
      accent: "#6ee7b7",
      icon: "code",
      subtitle: "Iterative TDD Builder",
    },
    promptSuggestions: [
      "Criar fatia vertical para novo fluxo de autenticação com formulário, validação de schema e testes unitários.",
      "Planejar e implementar componente de busca em tempo real com debounce e empty states.",
      "Refatorar lógica de cálculo de progresso com testes automatizados de regressão.",
    ],
    markdown: `---
name: vibecode-builder
description: Transforma uma ideia de produto em uma implementação pequena e verificável com TDD.
---

# Vibecode Builder Playbook`,
    files: [
      {
        name: "vibecode-builder",
        path: "skills/vibecode-builder",
        isDir: true,
        children: [
          {
            name: "SKILL.md",
            path: "skills/vibecode-builder/SKILL.md",
            type: "markdown",
            content: `---
name: vibecode-builder
description: Transforma uma ideia de produto em uma implementação verificável com TDD.
---

# Vibecode Builder`,
          },
        ],
      },
    ],
  },
  {
    id: "status-portal-registro",
    name: "Status Portal Registro",
    category: "dados",
    description: "Registra no painel de status do projeto cada etapa de trabalho no momento em que acontece: abrir sessão, assumir tarefa, rodar verificações, concluir com evidência criptográfica/hash, registrar bloqueios e passar bastão.",
    path: "skills/status-portal-registro",
    entrypoint: "SKILL.md",
    package: "packages/status-portal-registro.skill",
    execution_mode: "append-only",
    tags: ["ledger", "events", "audit-trail", "evidence", "handoff", "tracking"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "manus", "antigravity", "hermes", "opencode", "cursor", "local"],
    updatedAt: "28 de out. de 2026",
    usageCount: "1.9k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #6366f1 0%, #4338ca 60%, #312e81 100%)",
      accent: "#a5b4fc",
      icon: "history",
      subtitle: "Audited Ledger & Events",
    },
    promptSuggestions: [
      "Registrar conclusão de tarefa no log de auditoria com hash do commit como evidência.",
      "Abrir sessão de trabalho com actor agent:claude-code e puxar próximas tarefas prioritárias.",
      "Registrar passagem de bastão (handoff) detalhando itens concluídos e pendências.",
    ],
    markdown: `---
name: status-portal-registro
description: Registra no painel de status do projeto cada etapa de trabalho com trilha auditável.
---

# Status Portal Registro`,
    files: [
      {
        name: "status-portal-registro",
        path: "skills/status-portal-registro",
        isDir: true,
        children: [
          {
            name: "SKILL.md",
            path: "skills/status-portal-registro/SKILL.md",
            type: "markdown",
            content: `---
name: status-portal-registro
description: Registra etapas de trabalho no painel de status com auditoria e evidências.
---

# Status Portal Registro`,
          },
        ],
      },
    ],
  },
  {
    id: "status-portal-publicar",
    name: "Status Portal Publicar",
    category: "automacao",
    description: "Publica o painel de status de um projeto com segurança (container Docker em modo somente leitura, proxy reverso com domínio, export estático pré-compilado), executando varredura automatizada contra vazamento de dados internos.",
    path: "skills/status-portal-publicar",
    entrypoint: "SKILL.md",
    package: "packages/status-portal-publicar.skill",
    execution_mode: "read-only-publish",
    tags: ["deployment", "docker", "reverse-proxy", "sanitization", "privacy", "client-portal"],
    isOfficial: true,
    author: "devdudumuniz",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "manus", "antigravity", "hermes", "opencode", "cursor", "local"],
    updatedAt: "29 de out. de 2026",
    usageCount: "1.5k",
    installed: false,
    coverTheme: {
      bg: "linear-gradient(155deg, #059669 0%, #047857 60%, #064e3b 100%)",
      accent: "#6ee7b7",
      icon: "shield",
      subtitle: "Secure Publish & Redaction",
    },
    promptSuggestions: [
      "Executar varredura automatizada contra vazamento de credenciais na visão do cliente antes de publicar.",
      "Configurar container Docker em modo somente leitura com bind mount do projeto.",
      "Gerar arquivo de export estático pré-compilado para hospedagem estática segura.",
    ],
    markdown: `---
name: status-portal-publicar
description: Publica o painel de status de um projeto com segurança e sanitização ativa.
---

# Status Portal Publicar`,
    files: [
      {
        name: "status-portal-publicar",
        path: "skills/status-portal-publicar",
        isDir: true,
        children: [
          {
            name: "SKILL.md",
            path: "skills/status-portal-publicar/SKILL.md",
            type: "markdown",
            content: `---
name: status-portal-publicar
description: Publica o painel de status de um projeto com segurança e sanitização ativa.
---

# Status Portal Publicar`,
          },
        ],
      },
    ],
  },
];
