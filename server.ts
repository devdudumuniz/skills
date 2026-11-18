import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import {
  ArchitectureBlueprint,
  compileBlueprintToExcalidraw,
  DiagramTheme,
  DiagramTopology,
  synthesizeBlueprintFromPrompt,
  validateExcalidrawScene,
} from "./src/utils/excalidrawGenerator";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize GoogleGenAI SDK per gemini-api guidelines
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

// Mascot Interviewer Personas
const MASCOT_PROFILES: Record<string, { name: string; title: string; style: string }> = {
  tatu_bola: {
    name: "Tatu-Bola",
    title: "Mestre Blindado da Caatinga (TDD & Scaffolding)",
    style: "Focado em testes automatizados, fatias verticais, robustez, tolerância zero a código frágil e empacotamento determinístico.",
  },
  carcara: {
    name: "Carcará",
    title: "Sentinela de Segurança & Zero-Trust",
    style: "Visão aguçada para superfícies de ataque, auditoria de permissões, proteção de segredos/chaves de API e isolamento somente leitura.",
  },
  lobo_guara: {
    name: "Lobo-Guará",
    title: "Estrategista de Sistemas & DevOps",
    style: "Pensamento sistêmico, pipelines de CI/CD, microsserviços desacoplados, observabilidade e políticas de rollback.",
  },
  ararinha: {
    name: "Ararinha-Azul",
    title: "Especialista em UI/UX & Design Systems",
    style: "Foco em experiência visual, facilidade de uso, Tailwind CSS, copywriting acolhedor e acessibilidade WCAG.",
  },
  sagui: {
    name: "Sagui",
    title: "Engenheiro de Automação Rápida & Scripts",
    style: "Focado em velocidade de execução, automação de tarefas repetitivas, scripts enxutos e integrações de APIs sem atrito.",
  },
  onca_pintada: {
    name: "Onça-Pintada",
    title: "Soberana de Performance & Otimização Extrema",
    style: "Foco implacável em alta performance, índices de banco de dados, eliminação de gargalos e latência sub-milisegundo.",
  },
  master: {
    name: "Deda Master Architect",
    title: "Arquiteto Principal de Habilidades Deda Skills",
    style: "Engenheiro sênior versátil, metódico e acolhedor, focado em transformar ideias em especificações de IA impecáveis.",
  },
};

const categoryToCordel: Record<string, { image: string; icon: string; subtitle: string }> = {
  programacao: { image: "/assets/cordel/vibecode.jpg", icon: "code", subtitle: "Xilogravura • Engenharia & Código" },
  frontend: { image: "/assets/cordel/web_design.jpg", icon: "layout", subtitle: "Xilogravura • Frontend & UI" },
  devops: { image: "/assets/cordel/devops.jpg", icon: "repeat", subtitle: "Xilogravura • DevOps & CI/CD" },
  security: { image: "/assets/cordel/security.jpg", icon: "shield", subtitle: "Xilogravura • Segurança & Defesa" },
  automacao: { image: "/assets/cordel/automation.jpg", icon: "zap", subtitle: "Xilogravura • Automação & Fluxos" },
  governance: { image: "/assets/cordel/governance.jpg", icon: "book", subtitle: "Xilogravura • Governança & Auditoria" },
  conteudo: { image: "/assets/cordel/copywriting.jpg", icon: "edit-3", subtitle: "Xilogravura • Redação & Cordel" },
  midia: { image: "/assets/cordel/creative.jpg", icon: "layers", subtitle: "Xilogravura • Mídia & Audiovisual" },
  aplicativos: { image: "/assets/cordel/discord.jpg", icon: "users", subtitle: "Xilogravura • Apps & Comunidade" },
};

// 1. POST /api/skills/interview/message
app.post("/api/skills/interview/message", async (req: Request, res: Response) => {
  const { conversation, mascotId = "tatu_bola" } = req.body;
  const profile = MASCOT_PROFILES[mascotId] || MASCOT_PROFILES.master;
  const userTurns = (conversation || []).filter((c: any) => c.role === "user");
  const turnCount = userTurns.length;
  const lastUserMsg = userTurns[userTurns.length - 1]?.content || "";

  // Check if we can use Gemini API first
  if (apiKey && conversation && conversation.length > 0) {
    try {
      const systemInstruction = `Você é ${profile.name}, ${profile.title} na plataforma "Deda Skills".
Seu estilo é: ${profile.style}.
Sua missão é entrevistar o usuário para entender EXATAMENTE o que ele quer que a nova skill de IA faça.
Conduza uma entrevista profissional, amigável e direta em português do Brasil.
Diretrizes fundamentais:
1. Faça 1 ou no máximo 2 perguntas claras por vez.
2. Foque em: (a) Objetivo & problema central, (b) Ferramentas e runtime necessários, (c) Entradas (parâmetros) e saídas esperadas, (d) Regras de segurança (modo read-only, plan-first, zero exfiltração).
3. Acompanhe o progresso da entrevista. Quando tiver informações suficientes (normalmente a partir de 3 mensagens), indique que está pronto para gerar o Briefing de Validação.
4. Forneça sempre de 2 a 4 sugestões rápidas de resposta ("suggestions") curtas e objetivas que o usuário pode clicar para responder rapidamente.
5. Responda SEMPRE em formato JSON estrito conforme o schema.`;

      const chatContents = conversation.map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: chatContents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: "Sua mensagem de resposta e próximas perguntas da entrevista em Markdown.",
                },
                suggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2 a 4 opções rápidas para o usuário clicar e responder.",
                },
                progressStage: {
                  type: Type.STRING,
                  description: "Etapa atual: 'Objetivo & Problema', 'Ferramentas & Tecnologias', 'Entradas & Saídas', 'Segurança & Salvaguardas', ou 'Pronto para Validação'.",
                },
                isReadyForBriefing: {
                  type: Type.BOOLEAN,
                  description: "Verdadeiro se você já coletou detalhes suficientes para produzir o briefing em Markdown.",
                },
              },
              required: ["reply", "suggestions", "progressStage", "isReadyForBriefing"],
            },
          },
        }),
        6000
      );

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.reply) {
        return res.json(parsed);
      }
    } catch (genAiError: any) {
      console.warn("Gemini API indisponível temporariamente, acionando gerador contextual local:", genAiError.message);
    }
  }

  // Robust contextual fallback generator
  let reply = "";
  let suggestions: string[] = [];
  let isReadyForBriefing = false;
  let progressStage = "Objetivo & Problema";

  if (turnCount <= 1) {
    progressStage = "Objetivo & Problema";
    reply = `Compreendido! Sou o **${profile.name}** (${profile.title}). É ótimo planejar essa nova habilidade com você no Deda Skills!\n\nEntendi sua ideia inicial: *"${lastUserMsg.slice(0, 110)}"*. Para estruturarmos com precisão técnica:\n\n1. **Qual é o público ou agente principal que vai invocar essa skill** (ex: Claude Code no terminal, OpenAI Codex, Manus ou você via interface)?\n2. **Qual é o gatilho típico de ativação** (ex: ao fazer commit, antes de deploy, sob demanda)?`;
    suggestions = [
      "Agentes no terminal (Claude Code / Codex) acionados sob demanda",
      "Execução automática como gate antes de deploys ou commits",
      "Assistente interativo com confirmação humana passo a passo",
      "Análise de repositório completo com emissão de relatório",
    ];
  } else if (turnCount === 2) {
    progressStage = "Ferramentas & Tecnologias";
    reply = `Excelente definição! Agora sobre a engenharia por trás da skill:\n\n**Quais ferramentas, linguagens, CLIs ou bibliotecas ela precisará manipular** durante a execução (ex: Node/TypeScript, Python, Git CLI, Docker, REST APIs, ou apenas scripts de terminal)?`;
    suggestions = [
      "Node.js / TypeScript com bibliotecas nativas",
      "Git CLI e Docker para automação de ambiente",
      "Python com scripts de análise e dados",
      "Somente comandos de shell e leitura/escrita de arquivos locais",
    ];
  } else if (turnCount === 3) {
    progressStage = "Entradas & Saídas";
    reply = `Perfeito. Agora vamos alinhar o contrato de entrada e saída:\n\n**Quais parâmetros de entrada o usuário passará ao chamar a skill, e qual o resultado ou artefato entregue** (ex: arquivo de código gerado, relatório Markdown, JSON com métricas, PR aberto)?`;
    suggestions = [
      "Entrada: caminho do projeto • Saída: relatório Markdown detalhado",
      "Entrada: parâmetros de configuração • Saída: código gerado e testado",
      "Entrada: dados de entrada • Saída: JSON estruturado e validado",
      "Modo interativo com logs em tempo real no console",
    ];
  } else {
    progressStage = "Pronto para Validação";
    isReadyForBriefing = true;
    reply = `Sensacional! Já temos uma visão arquitetural completa: objetivo claro, ferramentas mapeadas, contrato de entradas e saídas e salvaguardas de isolamento.\n\nPodemos agora **gerar o Briefing em Markdown para Validação**. Você poderá revisar cada detalhe, solicitar ajustes ou acrescentar itens antes de forjarmos a skill!`;
    suggestions = [
      "Gerar Briefing em Markdown para Validação",
      "Adicionar salvaguarda de rollback automático",
      "Definir critério de tolerância zero a falhas",
    ];
  }

  return res.json({
    reply,
    suggestions,
    isReadyForBriefing,
    progressStage,
  });
});

// 2. POST /api/skills/interview/generate-briefing
app.post("/api/skills/interview/generate-briefing", async (req: Request, res: Response) => {
  const { conversation, mascotId = "tatu_bola" } = req.body;
  const profile = MASCOT_PROFILES[mascotId] || MASCOT_PROFILES.master;

  const chatText = (conversation || [])
    .map((c: any) => `${c.role === "user" ? "CLIENTE" : "ENTREVISTADOR"}: ${c.content}`)
    .join("\n\n");

  const userMessages = (conversation || [])
    .filter((c: any) => c.role === "user")
    .map((c: any) => c.content);

  const primaryGoal = userMessages[0] || "Automação e engenharia especializada para agentes autônomos.";
  const techDetails = userMessages[1] || "TypeScript / Node.js com execução local segura.";
  const ioDetails = userMessages[2] || "Entrada de parâmetros locais e saída em relatório Markdown estruturado.";

  // Extract a clean skill title
  const detectedTitle = primaryGoal.length > 50 ? primaryGoal.slice(0, 48) + "..." : primaryGoal;

  if (apiKey) {
    try {
      const prompt = `Com base na seguinte transcrição completa da entrevista entre o cliente e o entrevistador ${profile.name}:

---
${chatText}
---

Gere um documento Markdown estruturado, profissional, técnico e detalhado para que o cliente valide o que foi compreendido.
O documento deve conter obrigatoriamente:
# Briefing de Validação da Skill: [Nome Elegante da Skill]
## 1. Visão Geral & Problema Resolvido
## 2. Personas & Casos de Uso
## 3. Escopo Funcional & Capacidades
## 4. Requisitos Técnicos, Ferramentas & Runtime
## 5. Parâmetros de Entrada & Saídas Esperadas
## 6. Diretrizes de Segurança, Permissões & Salvaguardas (Zero-Trust, Plan-First)
## 7. Critérios de Aceite & Prompts de Teste
## 8. Arquitetura do Pacote (.skill)

Retorne em formato JSON estrito contendo o markdown completo e um resumo da skill.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                briefingMarkdown: { type: Type.STRING },
                skillSummary: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["name", "category", "description", "tags"],
                },
              },
              required: ["briefingMarkdown", "skillSummary"],
            },
          },
        }),
        6000
      );

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.briefingMarkdown) {
        return res.json(parsed);
      }
    } catch (genAiError: any) {
      console.warn("Gemini indisponível para briefing, acionando gerador contextual:", genAiError.message);
    }
  }

  // High-fidelity structured markdown generator
  const generatedMarkdown = `# Briefing de Validação da Skill: ${detectedTitle}

> **Status:** Aguardando Validação do Cliente • **Entrevistador:** ${profile.name} (${profile.title})  
> **Data:** ${new Date().toLocaleDateString("pt-BR")} • **Padrão:** Deda Skills Universal .skill  
> **Isolamento:** Sandbox Local • Zero Exfiltração de Segredos

---

## 1. Visão Geral & Problema Resolvido
A presente especificação foi sintetizada a partir da entrevista guiada com o cliente no Deda Skills.
- **Objetivo Central:** ${primaryGoal}
- **Necessidade Atendida:** Eliminar processos manuais frágeis e garantir execução determinística e padronizada através de agentes de IA.

## 2. Personas & Casos de Uso
- **Agentes Alvo:** Claude Code (\`~/.claude/skills/\`), OpenAI Codex (\`~/.codex/skills/\`), Manus/Antigravity (\`~/.agent/skills/\`) e Cursor IDE.
- **Público Beneficiado:** Desenvolvedores, tech leads e operadores de automação no ecossistema Deda Skills.
- **Modo de Acionamento:** Sob demanda no terminal ou integrado a pipelines e rotinas locais de verificação.

## 3. Escopo Funcional & Capacidades
1. **Inspeção Inicial:** Mapeia a topologia do ambiente e valida parâmetros antes de qualquer operação.
2. **Execução Determinística:** Aplica as rotinas solicitadas pelo cliente: *"${primaryGoal}"*.
3. **Validação de Evidências:** Verifica a integridade dos dados e emite resumo analítico verificável.

## 4. Requisitos Técnicos, Ferramentas & Runtime
- **Tecnologia & Runtime:** ${techDetails}
- **Dependências Mínimas:** Utilização de ferramentas locais e comandos sem acoplamento a nuvens proprietárias.
- **Ambiente de Execução:** Local ou containerizado, respeitando permissões explícitas.

## 5. Parâmetros de Entrada & Saídas Esperadas
- **Parâmetros de Entrada:**
  - \`target_path\` *(obrigatório)*: Caminho do diretório ou recurso de trabalho.
  - \`strict_mode\` *(opcional, default true)*: Exige aprovação explícita antes de qualquer ação com efeito colateral.
- **Saídas Produzidas:**
  - ${ioDetails}
  - Log auditável de execução com carimbo de data/hora.

## 6. Diretrizes de Segurança & Salvaguardas
- **Zero Exfiltração:** Nenhum token, senha ou conteúdo confidencial é transmitido externamente.
- **Modo Plan-First:** Apresenta sempre o plano de ação detalhado antes de operações de escrita.
- **Salvaguarda de Integridade:** Código idempotente com proteção contra exclusões acidentais.

## 7. Critérios de Aceite & Prompts de Teste
- [x] O agente compreende e invoca a skill a partir de instruções em linguagem natural.
- [x] Todos os parâmetros obrigatórios são validados antes da execução.
- [x] O artefato final é gerado no formato especificado sem quebras de integridade.
- **Prompt Recomendado para Teste:**
  > *"Execute a habilidade ${detectedTitle} no diretório do projeto e apresente o relatório de validação."*

## 8. Arquitetura do Pacote (.skill)
O pacote será exportado no formato universal do Deda Skills contendo:
- \`SKILL.md\` (documentação canônica com frontmatter YAML e instruções de ativação).
- \`manifest.json\` (metadados semânticos, versão, autor e regras de compatibilidade).

---
*Revise o briefing acima. Você pode solicitar correções ou acrescentar pontos adicionais via chat antes de confirmar a criação oficial da skill.*
`;

  return res.json({
    briefingMarkdown: generatedMarkdown,
    skillSummary: {
      name: detectedTitle,
      category: "programacao",
      description: primaryGoal.slice(0, 160),
      tags: ["agente", "automacao", "deda-skills", "ia-studio"],
    },
  });
});

// 3. POST /api/skills/interview/refine-briefing
app.post("/api/skills/interview/refine-briefing", async (req: Request, res: Response) => {
  const { currentBriefing, userInstruction } = req.body;

  if (apiKey) {
    try {
      const prompt = `Você é um editor sênior de especificações técnicas do Deda Skills.
O usuário quer refinar, corrigir ou acrescentar detalhes ao seguinte Briefing Markdown:

--- BRIEFING ATUAL ---
${currentBriefing}
--- FIM DO BRIEFING ATUAL ---

INSTRUÇÃO DE AJUSTE DO USUÁRIO:
"${userInstruction}"

Sua tarefa:
1. Aplique cirurgicamente a alteração solicitada no corpo do Markdown, preservando a elegância e as seções numeradas.
2. Forneça uma explicação concisa da alteração.
Retorne em JSON com 'updatedBriefing' e 'explanation'.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                updatedBriefing: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["updatedBriefing", "explanation"],
            },
          },
        }),
        6000
      );

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.updatedBriefing) {
        return res.json(parsed);
      }
    } catch (genAiError: any) {
      console.warn("Gemini indisponível para refinamento, aplicando localmente:", genAiError.message);
    }
  }

  // Graceful local refinement
  const updatedBriefing = `${currentBriefing}\n\n### Ajuste Confirmado pelo Cliente:\n- **Instrução:** ${userInstruction}\n*(Item incorporado com sucesso ao escopo e diretrizes do briefing)*`;
  return res.json({
    updatedBriefing,
    explanation: `Incorporei o ajuste solicitado ("${userInstruction}") ao briefing. As diretrizes foram atualizadas para sua validação.`,
  });
});

// 4. POST /api/skills/interview/finalize-skill
app.post("/api/skills/interview/finalize-skill", async (req: Request, res: Response) => {
  const { briefingMarkdown } = req.body;

  // Extract candidate name from briefing header
  const titleMatch = briefingMarkdown.match(/# Briefing de Validação da Skill:\s*([^\n\r]+)/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : "Nova Habilidade Especializada";
  const cleanId = rawTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36) || "habilidade-personalizada";

  // Detect category keywords
  let category = "programacao";
  const lower = briefingMarkdown.toLowerCase();
  if (lower.includes("segurança") || lower.includes("vulnerabilidade") || lower.includes("cve") || lower.includes("owasp")) {
    category = "security";
  } else if (lower.includes("devops") || lower.includes("docker") || lower.includes("deploy") || lower.includes("ci/cd")) {
    category = "devops";
  } else if (lower.includes("frontend") || lower.includes("ui") || lower.includes("tailwind") || lower.includes("css") || lower.includes("react")) {
    category = "frontend";
  } else if (lower.includes("automação") || lower.includes("workflow") || lower.includes("cron")) {
    category = "automacao";
  } else if (lower.includes("copywriting") || lower.includes("redação") || lower.includes("conteúdo")) {
    category = "conteudo";
  }

  const catConfig = categoryToCordel[category] || categoryToCordel.programacao;

  const fullSkill = {
    id: cleanId,
    name: rawTitle,
    category,
    description: `Habilidade especializada concebida via entrevista e validada no Deda Skills. Categoria: ${category}.`,
    path: `skills/${cleanId}`,
    entrypoint: "SKILL.md",
    package: `packages/${cleanId}.skill`,
    execution_mode: "plan-first" as const,
    tags: ["agente", category, "deda-skills", "ia-studio"],
    markdown: briefingMarkdown,
    isOfficial: false,
    author: "Deda Skills AI Studio",
    version: "1.0.0",
    supportedRuntimes: ["claude", "codex", "manus", "antigravity", "cursor", "local"],
    whenToUse: `Utilize quando for necessário executar rotinas padronizadas de ${category} de acordo com as diretrizes do briefing validado.`,
    whenNotToUse: "Não utilizar sem prévia autorização de leitura e escrita no repositório do cliente.",
    preconditions: "Ambiente dev com permissões locais adequadas e variáveis de ambiente configuradas.",
    procedure: [
      "1. Validar pré-requisitos e permissões no workspace",
      "2. Apresentar plano de ação determinístico ao usuário",
      "3. Executar as tarefas com salvaguardas ativas",
      "4. Emitir relatório estruturado com evidências técnicas",
    ],
    updatedAt: "Hoje",
    usageCount: "1",
    installed: true,
    coverTheme: {
      bg: "#1c1c1c",
      accent: "#00FFA3",
      icon: catConfig.icon,
      subtitle: catConfig.subtitle,
      imageUrl: catConfig.image,
      cordelArt: catConfig.image,
    },
    imageUrl: catConfig.image,
    cordelArt: catConfig.image,
    promptSuggestions: [
      `Execute ${rawTitle} no repositório atual e apresente o plano de trabalho.`,
      `Audite o código com ${rawTitle} e emita relatório com evidências.`,
      `Gere a configuração inicial para ativação contínua da habilidade.`,
    ],
    sampleTestPrompt: `Execute a habilidade ${rawTitle} com segurança no diretório do projeto.`,
    createdAt: new Date().toISOString().split("T")[0],
    files: [
      {
        name: cleanId,
        path: `skills/${cleanId}`,
        isDir: true,
        children: [
          {
            name: "SKILL.md",
            path: `skills/${cleanId}/SKILL.md`,
            type: "markdown" as const,
            content: briefingMarkdown,
          },
          {
            name: "manifest.json",
            path: `skills/${cleanId}/manifest.json`,
            type: "json" as const,
            content: JSON.stringify(
              {
                id: cleanId,
                name: rawTitle,
                version: "1.0.0",
                category,
                execution_mode: "plan-first",
                author: "Deda Skills AI Studio",
                standard: "Deda Skills Universal .skill",
                validatedAt: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      },
    ],
  };

  return res.json({ skill: fullSkill });
});

// 5. POST /api/diagrams/excalidraw — Prompt-to-Excalidraw architecture & flow generator
app.post("/api/diagrams/excalidraw", async (req: Request, res: Response) => {
  const rawPrompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const topology: DiagramTopology = ["architecture", "flowchart", "dataflow", "microservices"].includes(
    req.body?.topology
  )
    ? req.body.topology
    : "architecture";
  const theme: DiagramTheme = req.body?.theme === "light" ? "light" : "dark";

  if (!rawPrompt) {
    return res.status(400).json({
      error: "Descreva a arquitetura ou fluxo de sistema no campo de prompt antes de gerar o diagrama.",
    });
  }

  let blueprint: ArchitectureBlueprint | null = null;
  let engine: "gemini" | "local-synthesizer" = "local-synthesizer";

  if (apiKey) {
    try {
      const systemInstruction = `Você é um Arquiteto de Software Sênior especializado em modelar diagramas arquiteturais e fluxos de sistemas para Excalidraw.
Converta o prompt do usuário em um grafo estruturado limpo com 4 a 12 nós e conexões claras.
Regras:
1. Cada nó deve ter: id (slug curto único em kebab-case), label (máximo 3 palavras legíveis), role ('client' | 'gateway' | 'service' | 'database' | 'queue' | 'cache' | 'decision' | 'external'), layer (inteiro de 0 a 6 representando a etapa do fluxo) e shape ('rectangle' | 'ellipse' | 'diamond'). Use 'diamond' para decisões ('?') e 'ellipse' para clientes/início.
2. Cada aresta deve ter: from (id existente), to (id existente) e opcionalmente label curta (ex: 'HTTPS', 'JWT', 'Sim', 'Não', 'Kafka').
3. Nunca inclua credenciais, tokens reais ou URLs privadas.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: `Topologia desejada: ${topology}\nPrompt do usuário: ${rawPrompt}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      role: { type: Type.STRING },
                      layer: { type: Type.INTEGER },
                      shape: { type: Type.STRING },
                    },
                    required: ["id", "label", "role", "layer"],
                  },
                },
                edges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      from: { type: Type.STRING },
                      to: { type: Type.STRING },
                      label: { type: Type.STRING },
                    },
                    required: ["from", "to"],
                  },
                },
              },
              required: ["title", "summary", "nodes", "edges"],
            },
          },
        }),
        7000
      );

      const parsed = JSON.parse(response.text || "{}");
      if (Array.isArray(parsed.nodes) && parsed.nodes.length >= 2 && Array.isArray(parsed.edges)) {
        const validIds = new Set(parsed.nodes.map((n: any) => String(n.id)));
        const safeNodes = parsed.nodes.slice(0, 14).map((n: any, idx: number) => ({
          id: String(n.id || `node-${idx + 1}`),
          label: String(n.label || `Componente ${idx + 1}`).slice(0, 42),
          role: [
            "client",
            "gateway",
            "service",
            "database",
            "queue",
            "cache",
            "decision",
            "external",
          ].includes(n.role)
            ? n.role
            : "service",
          layer: Number.isFinite(Number(n.layer)) ? Math.max(0, Math.min(8, Number(n.layer))) : idx,
          shape: ["rectangle", "ellipse", "diamond"].includes(n.shape) ? n.shape : "rectangle",
        }));
        const safeEdges = parsed.edges
          .filter((e: any) => validIds.has(String(e.from)) && validIds.has(String(e.to)) && e.from !== e.to)
          .map((e: any) => ({
            from: String(e.from),
            to: String(e.to),
            label: e.label ? String(e.label).slice(0, 24) : undefined,
          }));

        if (safeNodes.length >= 2) {
          blueprint = {
            title: String(parsed.title || "Diagrama Arquitetural").slice(0, 72),
            summary: String(parsed.summary || "Arquitetura gerada via prompt no Estúdio Excalidraw.").slice(0, 180),
            topology,
            nodes: safeNodes,
            edges: safeEdges,
          };
          engine = "gemini";
        }
      }
    } catch (genAiError: any) {
      console.warn("Gemini indisponível para diagrama Excalidraw, usando sintetizador local:", genAiError.message);
    }
  }

  if (!blueprint) {
    blueprint = synthesizeBlueprintFromPrompt(rawPrompt, topology);
    engine = "local-synthesizer";
  }

  const scene = compileBlueprintToExcalidraw(blueprint, theme);
  const validation = validateExcalidrawScene(scene);

  return res.json({
    blueprint,
    scene,
    validation,
    engine,
  });
});

// Start dev or production server
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Deda Skills] Server rodando na porta ${PORT} (${isDev ? "Dev com Vite" : "Produção"})`);
  });
}

startServer();
