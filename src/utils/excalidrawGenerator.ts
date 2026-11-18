export type DiagramTopology = "architecture" | "flowchart" | "dataflow" | "microservices";
export type DiagramTheme = "dark" | "light";
export type NodeRole =
  | "client"
  | "gateway"
  | "service"
  | "database"
  | "queue"
  | "cache"
  | "decision"
  | "external";

export interface ArchitectureNodeSpec {
  id: string;
  label: string;
  role: NodeRole;
  layer: number;
  shape?: "rectangle" | "ellipse" | "diamond";
}

export interface ArchitectureEdgeSpec {
  from: string;
  to: string;
  label?: string;
}

export interface ArchitectureBlueprint {
  title: string;
  summary: string;
  topology: DiagramTopology;
  nodes: ArchitectureNodeSpec[];
  edges: ArchitectureEdgeSpec[];
}

export interface BoundElementRef {
  id: string;
  type: "text" | "arrow";
}

export interface ExcalidrawElementData {
  id: string;
  type: "rectangle" | "ellipse" | "diamond" | "text" | "arrow";
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: "solid" | "hachure" | "cross-hatch";
  strokeWidth: number;
  strokeStyle: "solid" | "dashed" | "dotted";
  roughness: number;
  opacity: number;
  groupIds: string[];
  frameId: null;
  index: string;
  roundness: { type: number } | null;
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements: BoundElementRef[] | null;
  updated: number;
  link: null;
  locked: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  containerId?: string | null;
  originalText?: string;
  autoResize?: boolean;
  lineHeight?: number;
  points?: [number, number][];
  lastCommittedPoint?: [number, number] | null;
  startBinding?: { elementId: string; focus: number; gap: number } | null;
  endBinding?: { elementId: string; focus: number; gap: number } | null;
  startArrowhead?: string | null;
  endArrowhead?: string | null;
  elbowed?: boolean;
}

export interface ExcalidrawScene {
  type: "excalidraw";
  version: 2;
  source: string;
  elements: ExcalidrawElementData[];
  appState: {
    gridSize: number;
    viewBackgroundColor: string;
    theme: DiagramTheme;
  };
  files: Record<string, never>;
}

export interface DiagramPreset {
  id: string;
  title: string;
  topology: DiagramTopology;
  prompt: string;
  description: string;
}

export const DIAGRAM_PRESETS: DiagramPreset[] = [
  {
    id: "microservices-checkout",
    title: "E-Commerce & Kafka Event-Driven",
    topology: "microservices",
    description: "Gateway, Auth JWT, Serviços de Pedido/Pagamento, Kafka, Redis e PostgreSQL.",
    prompt:
      "Cliente Web -> API Gateway -> Auth JWT -> Order Service -> Kafka Event Bus -> Payment Worker -> PostgreSQL & Redis Cache",
  },
  {
    id: "oauth2-flow",
    title: "Fluxo de Autenticação OAuth2 + PKCE",
    topology: "flowchart",
    description: "Validação de sessão, troca de token, verificação de escopo e decisão de acesso.",
    prompt:
      "Usuário -> Frontend SPA -> Auth Gateway -> Token Válido? -> Identity Provider -> Sessão Redis -> API Protegida",
  },
  {
    id: "rag-agents",
    title: "Pipeline RAG & Orquestração de Agentes",
    topology: "dataflow",
    description: "Ingestão documental, embeddings, busca vetorial e síntese com guardrails.",
    prompt:
      "Prompt do Usuário -> Guardrail de Entrada -> Orquestrador IA -> Busca Vetorial + Embeddings -> Base de Conhecimento -> Resposta Auditada",
  },
  {
    id: "cicd-pipeline",
    title: "Esteira CI/CD com Rollback Automático",
    topology: "flowchart",
    description: "Build, testes unitários, validação de segurança, deploy canary e monitoramento.",
    prompt:
      "Git Push -> Build & Lint -> Testes Unitários -> Gate de Segurança -> Deploy Canary -> Healthcheck OK? -> Produção",
  },
];

function snapToGrid(value: number, grid = 20): number {
  return Math.round(value / grid) * grid;
}

function deterministicSeed(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 1000000000;
}

function sanitizeNodeId(raw: string, index: number): string {
  const slug = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return slug ? `node-${index + 1}-${slug}` : `node-${index + 1}`;
}

export function inferNodeRole(label: string): NodeRole {
  const lower = label.toLowerCase();
  if (/(client|usuário|usuario|user|browser|web|mobile|app|spa|frontend)/.test(lower)) {
    return "client";
  }
  if (/(gateway|ingress|proxy|nginx|load balancer|balancer|cdn|waf|edge)/.test(lower)) {
    return "gateway";
  }
  if (/(postgres|mysql|mongo|sqlite|database|banco|db|storage|s3|bucket|vetor|vector)/.test(lower)) {
    return "database";
  }
  if (/(kafka|rabbit|sqs|queue|fila|bus|pubsub|event|stream|webhook)/.test(lower)) {
    return "queue";
  }
  if (/(redis|cache|memcache|cdn)/.test(lower)) {
    return "cache";
  }
  if (/\?$|^(se |if |valid|check|ok\?|decis|aprova)/.test(lower) || lower.includes("?")) {
    return "decision";
  }
  if (/(oauth|idp|identity|stripe|external|terceiro|provider|llm|gemini|github)/.test(lower)) {
    return "external";
  }
  return "service";
}

function formatBoxLabel(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= 18) return clean;
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > 18 && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 3).join("\n");
}

function parseExplicitSegments(prompt: string): string[] | null {
  if (!/(->|=>|→)/.test(prompt)) return null;
  const parts = prompt
    .split(/\s*(?:->|=>|→)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts : null;
}

export function synthesizeBlueprintFromPrompt(
  rawPrompt: string,
  topology: DiagramTopology = "architecture"
): ArchitectureBlueprint {
  const prompt = (rawPrompt || "").trim();
  if (!prompt) {
    throw new Error("Descreva a arquitetura ou o fluxo de sistema no prompt antes de gerar.");
  }

  const lower = prompt.toLowerCase();

  // 1. Explicit arrow chain: "A -> B -> C + D"
  const explicitParts = parseExplicitSegments(prompt);
  if (explicitParts) {
    const nodes: ArchitectureNodeSpec[] = [];
    const edges: ArchitectureEdgeSpec[] = [];
    const layerIds: string[][] = [];

    explicitParts.forEach((segment, layerIdx) => {
      const subLabels = segment
        .split(/\s*(?:&|\+|,| e )\s*/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const currentLayerIds: string[] = [];

      subLabels.forEach((subLabel) => {
        const idx = nodes.length;
        const id = sanitizeNodeId(subLabel, idx);
        const role = inferNodeRole(subLabel);
        const shape =
          role === "decision" ? "diamond" : role === "client" ? "ellipse" : "rectangle";
        nodes.push({
          id,
          label: subLabel.slice(0, 42),
          role,
          layer: layerIdx,
          shape,
        });
        currentLayerIds.push(id);
      });

      layerIds.push(currentLayerIds);
    });

    for (let l = 0; l < layerIds.length - 1; l++) {
      const sources = layerIds[l];
      const targets = layerIds[l + 1];
      for (const src of sources) {
        for (const tgt of targets) {
          const srcNode = nodes.find((n) => n.id === src);
          const edgeLabel =
            srcNode?.role === "decision"
              ? targets.length > 1 && tgt === targets[0]
                ? "Sim"
                : "Fluxo"
              : undefined;
          edges.push({ from: src, to: tgt, label: edgeLabel });
        }
      }
    }

    return {
      title: prompt.length > 56 ? `${prompt.slice(0, 53)}...` : prompt,
      summary: `Diagrama com ${nodes.length} nós e ${edges.length} conexões ancoradas sintetizado a partir do fluxo informado.`,
      topology,
      nodes,
      edges,
    };
  }

  // 2. Semantic architectural blueprints from natural-language intent
  if (/(kafka|rabbit|fila|event|checkout|pedido|ecommerce|e-commerce|pagamento)/.test(lower)) {
    return {
      title: "Arquitetura Orientada a Eventos & Pedidos",
      summary:
        "Fluxo distribuído com API Gateway, autenticação JWT, serviços desacoplados via fila de eventos e persistência poliglota.",
      topology,
      nodes: [
        { id: "client-app", label: "Cliente Web & Mobile", role: "client", layer: 0, shape: "ellipse" },
        { id: "api-gw", label: "API Gateway", role: "gateway", layer: 1, shape: "rectangle" },
        { id: "auth-svc", label: "Auth & JWT Service", role: "service", layer: 2, shape: "rectangle" },
        { id: "order-svc", label: "Order Service", role: "service", layer: 2, shape: "rectangle" },
        { id: "event-bus", label: "Kafka Event Bus", role: "queue", layer: 3, shape: "rectangle" },
        { id: "payment-worker", label: "Payment Worker", role: "service", layer: 4, shape: "rectangle" },
        { id: "notify-worker", label: "Notification Worker", role: "service", layer: 4, shape: "rectangle" },
        { id: "pg-db", label: "PostgreSQL Primary", role: "database", layer: 5, shape: "rectangle" },
        { id: "redis-cache", label: "Redis Cache", role: "cache", layer: 5, shape: "rectangle" },
      ],
      edges: [
        { from: "client-app", to: "api-gw", label: "HTTPS" },
        { from: "api-gw", to: "auth-svc", label: "Valida Token" },
        { from: "api-gw", to: "order-svc", label: "POST /orders" },
        { from: "order-svc", to: "event-bus", label: "OrderCreated" },
        { from: "event-bus", to: "payment-worker", label: "Consome" },
        { from: "event-bus", to: "notify-worker", label: "Consome" },
        { from: "payment-worker", to: "pg-db", label: "ACID Write" },
        { from: "order-svc", to: "redis-cache", label: "Leitura Rápida" },
      ],
    };
  }

  if (/(oauth|jwt|login|autentica|auth|sess[aã]o|pkce)/.test(lower)) {
    return {
      title: "Fluxo de Autenticação & Autorização",
      summary:
        "Pipeline de autenticação segura com validação de token, refresh em cache distribuído e gate de decisão.",
      topology: topology === "architecture" ? "flowchart" : topology,
      nodes: [
        { id: "user-browser", label: "Navegador / App", role: "client", layer: 0, shape: "ellipse" },
        { id: "edge-gw", label: "API Gateway", role: "gateway", layer: 1, shape: "rectangle" },
        { id: "token-check", label: "Token JWT Válido?", role: "decision", layer: 2, shape: "diamond" },
        { id: "idp-oauth", label: "Identity Provider OAuth2", role: "external", layer: 3, shape: "rectangle" },
        { id: "session-redis", label: "Sessão Redis", role: "cache", layer: 3, shape: "rectangle" },
        { id: "core-api", label: "Serviços Protegidos", role: "service", layer: 4, shape: "rectangle" },
      ],
      edges: [
        { from: "user-browser", to: "edge-gw", label: "Bearer Token" },
        { from: "edge-gw", to: "token-check" },
        { from: "token-check", to: "idp-oauth", label: "Não / Expirado" },
        { from: "token-check", to: "session-redis", label: "Sim" },
        { from: "idp-oauth", to: "session-redis", label: "Emite JWT" },
        { from: "session-redis", to: "core-api", label: "Autorizado" },
      ],
    };
  }

  if (/(rag|agente|ia|ai|llm|gemini|embedding|vetor)/.test(lower)) {
    return {
      title: "Arquitetura RAG & Agentes Autônomos",
      summary:
        "Fluxo de recuperação aumentada por geração com guardrails, busca vetorial e síntese contextual.",
      topology,
      nodes: [
        { id: "user-prompt", label: "Prompt do Usuário", role: "client", layer: 0, shape: "ellipse" },
        { id: "guardrail", label: "Guardrail & Política", role: "gateway", layer: 1, shape: "rectangle" },
        { id: "orchestrator", label: "Agente Orquestrador", role: "service", layer: 2, shape: "rectangle" },
        { id: "vector-db", label: "Vector DB & Embeddings", role: "database", layer: 3, shape: "rectangle" },
        { id: "llm-engine", label: "Modelo LLM", role: "external", layer: 3, shape: "rectangle" },
        { id: "audit-log", label: "Audit Trail & Saída", role: "service", layer: 4, shape: "rectangle" },
      ],
      edges: [
        { from: "user-prompt", to: "guardrail", label: "Input" },
        { from: "guardrail", to: "orchestrator", label: "Sanitizado" },
        { from: "orchestrator", to: "vector-db", label: "Top-K Contexto" },
        { from: "orchestrator", to: "llm-engine", label: "Prompt Aumentado" },
        { from: "vector-db", to: "audit-log", label: "Citações" },
        { from: "llm-engine", to: "audit-log", label: "Resposta" },
      ],
    };
  }

  if (/(ci\/cd|deploy|pipeline|docker|kubernetes|k8s|rollback|build)/.test(lower)) {
    return {
      title: "Pipeline CI/CD & Gate de Rollback",
      summary:
        "Esteira automatizada de integração e entrega contínua com validação de testes, segurança e canary deploy.",
      topology: "flowchart",
      nodes: [
        { id: "git-trigger", label: "Commit & Pull Request", role: "client", layer: 0, shape: "ellipse" },
        { id: "build-lint", label: "Build & Typecheck", role: "service", layer: 1, shape: "rectangle" },
        { id: "unit-tests", label: "Suite de Testes", role: "service", layer: 2, shape: "rectangle" },
        { id: "sec-gate", label: "Audit & SBOM Gate?", role: "decision", layer: 3, shape: "diamond" },
        { id: "canary", label: "Deploy Canary", role: "gateway", layer: 4, shape: "rectangle" },
        { id: "rollback", label: "Rollback Automático", role: "external", layer: 5, shape: "rectangle" },
        { id: "prod", label: "Produção Estável", role: "database", layer: 5, shape: "rectangle" },
      ],
      edges: [
        { from: "git-trigger", to: "build-lint" },
        { from: "build-lint", to: "unit-tests" },
        { from: "unit-tests", to: "sec-gate" },
        { from: "sec-gate", to: "canary", label: "Aprovado" },
        { from: "canary", to: "prod", label: "SLO OK" },
        { from: "canary", to: "rollback", label: "Erro > 1%" },
      ],
    };
  }

  // 3. Generic natural-language entity extraction
  const rawTokens = prompt
    .split(/[,;\n]+|\s+(?:e|and|with|com|para|to)\s+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 7);

  if (rawTokens.length >= 3) {
    const nodes: ArchitectureNodeSpec[] = rawTokens.map((tok, idx) => {
      const role = idx === 0 ? "client" : inferNodeRole(tok);
      return {
        id: sanitizeNodeId(tok, idx),
        label: tok.slice(0, 38),
        role,
        layer: idx,
        shape: role === "decision" ? "diamond" : role === "client" ? "ellipse" : "rectangle",
      };
    });
    const edges: ArchitectureEdgeSpec[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
    }
    return {
      title: prompt.length > 56 ? `${prompt.slice(0, 53)}...` : prompt,
      summary: `Fluxo de sistema estruturado com ${nodes.length} componentes extraídos do prompt.`,
      topology,
      nodes,
      edges,
    };
  }

  // Fallback high-value 5-layer architecture tailored to the prompt title
  const shortTopic = prompt.slice(0, 34);
  return {
    title: `Arquitetura: ${shortTopic}`,
    summary: `Arquitetura de referência em camadas gerada para "${shortTopic}".`,
    topology,
    nodes: [
      { id: "client-entry", label: "Interface do Usuário", role: "client", layer: 0, shape: "ellipse" },
      { id: "api-edge", label: "API Gateway", role: "gateway", layer: 1, shape: "rectangle" },
      { id: "core-domain", label: shortTopic, role: "service", layer: 2, shape: "rectangle" },
      { id: "async-queue", label: "Mensageria / Eventos", role: "queue", layer: 3, shape: "rectangle" },
      { id: "primary-db", label: "Banco de Dados", role: "database", layer: 3, shape: "rectangle" },
    ],
    edges: [
      { from: "client-entry", to: "api-edge", label: "HTTPS / JSON" },
      { from: "api-edge", to: "core-domain", label: "Roteamento" },
      { from: "core-domain", to: "async-queue", label: "Eventos" },
      { from: "core-domain", to: "primary-db", label: "Persistência" },
    ],
  };
}

interface RolePalette {
  bg: string;
  stroke: string;
  text: string;
}

function getRolePalette(role: NodeRole): RolePalette {
  // Excalidraw natively renders dark mode via CSS `invert(93%) hue-rotate(180deg)`
  // on top of light-space scene colors. Using canonical light-space tones ensures
  // crisp dark-mode contrast without double-inversion artifacts.
  switch (role) {
    case "client":
      return { bg: "#FCECE6", stroke: "#C45D3B", text: "#1E1A17" };
    case "gateway":
      return { bg: "#FEF3C7", stroke: "#B45309", text: "#1E1A17" };
    case "database":
      return { bg: "#DCFCE7", stroke: "#15803D", text: "#1E1A17" };
    case "queue":
      return { bg: "#F3E8FF", stroke: "#7E22CE", text: "#1E1A17" };
    case "cache":
      return { bg: "#FFEDD5", stroke: "#C2410C", text: "#1E1A17" };
    case "decision":
      return { bg: "#FEF9C3", stroke: "#A16207", text: "#1E1A17" };
    case "external":
      return { bg: "#F1F5F9", stroke: "#475569", text: "#1E1A17" };
    case "service":
    default:
      return { bg: "#DBEAFE", stroke: "#1D4ED8", text: "#1E1A17" };
  }
}

function wrapSubtitle(text: string, maxCharsPerLine = 78): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= maxCharsPerLine) return clean;
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine && current) {
      lines.push(current.trim());
      current = word;
      if (lines.length === 2) break;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (lines.length < 2 && current) {
    lines.push(current.trim());
  }
  const joined = lines.join("\n");
  return clean.length > joined.length + 3 && lines.length === 2 ? `${joined}...` : joined;
}

export function compileBlueprintToExcalidraw(
  blueprint: ArchitectureBlueprint,
  theme: DiagramTheme = "dark"
): ExcalidrawScene {
  const now = Date.now();
  const isVertical = blueprint.topology === "flowchart";
  // White viewBackgroundColor becomes rich charcoal (#121212) under Excalidraw dark-mode inversion
  const viewBg = theme === "dark" ? "#FFFFFF" : "#FAF8F5";
  const titleColor = "#1E1A17";
  const mutedColor = "#57534E";
  const arrowStroke = "#C45D3B";

  // Group nodes by layer
  const layersMap = new Map<number, ArchitectureNodeSpec[]>();
  blueprint.nodes.forEach((node) => {
    const l = Math.max(0, Math.floor(node.layer ?? 0));
    const list = layersMap.get(l) || [];
    list.push(node);
    layersMap.set(l, list);
  });

  const sortedLayers = Array.from(layersMap.keys()).sort((a, b) => a - b);

  // Measure and place nodes without collisions
  const boxMap = new Map<
    string,
    {
      node: ArchitectureNodeSpec;
      x: number;
      y: number;
      width: number;
      height: number;
      shapeType: "rectangle" | "ellipse" | "diamond";
    }
  >();

  const maxPerLayer = Math.max(1, ...Array.from(layersMap.values()).map((v) => v.length));
  const startX = 80;
  const startY = 148;
  const colSpacing = 280;
  const rowSpacing = 180;

  sortedLayers.forEach((layerNum, layerIndex) => {
    const nodesInLayer = layersMap.get(layerNum) || [];
    const count = nodesInLayer.length;

    nodesInLayer.forEach((node, posIdx) => {
      const formattedLabel = formatBoxLabel(node.label);
      const lineCount = formattedLabel.split("\n").length;
      const maxLineLen = Math.max(...formattedLabel.split("\n").map((l) => l.length));
      const shapeType = node.shape || (node.role === "decision" ? "diamond" : "rectangle");

      const baseWidth = Math.max(180, Math.min(240, maxLineLen * 10 + 44));
      const width = snapToGrid(shapeType === "diamond" ? Math.max(200, baseWidth) : baseWidth);
      const height = snapToGrid(
        shapeType === "diamond" ? 120 : Math.max(80, 46 + lineCount * 22)
      );

      let x = startX;
      let y = startY;

      if (isVertical) {
        const totalSpan = (maxPerLayer - 1) * colSpacing;
        const layerSpan = (count - 1) * colSpacing;
        const offsetX = (totalSpan - layerSpan) / 2;
        x = snapToGrid(startX + offsetX + posIdx * colSpacing + (220 - width) / 2);
        y = snapToGrid(startY + layerIndex * rowSpacing);
      } else {
        const totalSpan = (maxPerLayer - 1) * rowSpacing;
        const layerSpan = (count - 1) * rowSpacing;
        const offsetY = (totalSpan - layerSpan) / 2;
        x = snapToGrid(startX + layerIndex * colSpacing);
        y = snapToGrid(startY + offsetY + posIdx * rowSpacing + (100 - height) / 2);
      }

      boxMap.set(node.id, { node, x, y, width, height, shapeType });
    });
  });

  const elements: ExcalidrawElementData[] = [];
  const shapeElementById = new Map<string, ExcalidrawElementData>();
  let orderCounter = 0;
  const nextIndex = () => `a${(orderCounter++).toString(36).padStart(4, "0")}`;

  // Title & Wrapped Summary text at canvas top
  elements.push({
    id: "diagram-title",
    type: "text",
    x: startX,
    y: 36,
    width: Math.max(360, blueprint.title.length * 13),
    height: 32,
    angle: 0,
    strokeColor: titleColor,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    index: nextIndex(),
    roundness: null,
    seed: deterministicSeed("diagram-title"),
    version: 1,
    versionNonce: deterministicSeed("diagram-title-v"),
    isDeleted: false,
    boundElements: null,
    updated: now,
    link: null,
    locked: false,
    text: blueprint.title,
    fontSize: 24,
    fontFamily: 5,
    textAlign: "left",
    verticalAlign: "top",
    containerId: null,
    originalText: blueprint.title,
    autoResize: true,
    lineHeight: 1.25,
  });

  const wrappedSummary = wrapSubtitle(blueprint.summary, 78);
  const summaryLineCount = wrappedSummary.split("\n").length;

  elements.push({
    id: "diagram-subtitle",
    type: "text",
    x: startX,
    y: 74,
    width: 620,
    height: summaryLineCount * 20,
    angle: 0,
    strokeColor: mutedColor,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    index: nextIndex(),
    roundness: null,
    seed: deterministicSeed("diagram-subtitle"),
    version: 1,
    versionNonce: deterministicSeed("diagram-subtitle-v"),
    isDeleted: false,
    boundElements: null,
    updated: now,
    link: null,
    locked: false,
    text: wrappedSummary,
    fontSize: 13,
    fontFamily: 3,
    textAlign: "left",
    verticalAlign: "top",
    containerId: null,
    originalText: wrappedSummary,
    autoResize: true,
    lineHeight: 1.35,
  });

  // Create node shapes + bound text
  for (const [nodeId, box] of boxMap.entries()) {
    const palette = getRolePalette(box.node.role);
    const textId = `txt-${nodeId}`;
    const formatted = formatBoxLabel(box.node.label);
    const lineCount = formatted.split("\n").length;
    const textHeight = lineCount * 20;
    const textWidth = box.width - 24;

    const shapeEl: ExcalidrawElementData = {
      id: nodeId,
      type: box.shapeType,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      angle: 0,
      strokeColor: palette.stroke,
      backgroundColor: palette.bg,
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      index: nextIndex(),
      roundness: box.shapeType === "rectangle" ? { type: 3 } : { type: 2 },
      seed: deterministicSeed(nodeId),
      version: 1,
      versionNonce: deterministicSeed(`${nodeId}-v`),
      isDeleted: false,
      boundElements: [{ id: textId, type: "text" }],
      updated: now,
      link: null,
      locked: false,
    };

    const textEl: ExcalidrawElementData = {
      id: textId,
      type: "text",
      x: box.x + 12,
      y: box.y + (box.height - textHeight) / 2,
      width: textWidth,
      height: textHeight,
      angle: 0,
      strokeColor: palette.text,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      index: nextIndex(),
      roundness: null,
      seed: deterministicSeed(textId),
      version: 1,
      versionNonce: deterministicSeed(`${textId}-v`),
      isDeleted: false,
      boundElements: null,
      updated: now,
      link: null,
      locked: false,
      text: formatted,
      fontSize: 15,
      fontFamily: 5,
      textAlign: "center",
      verticalAlign: "middle",
      containerId: nodeId,
      originalText: formatted,
      autoResize: true,
      lineHeight: 1.25,
    };

    shapeElementById.set(nodeId, shapeEl);
    elements.push(shapeEl, textEl);
  }

  // Create anchored arrows + optional arrow labels
  blueprint.edges.forEach((edge, idx) => {
    const srcBox = boxMap.get(edge.from);
    const tgtBox = boxMap.get(edge.to);
    const srcEl = shapeElementById.get(edge.from);
    const tgtEl = shapeElementById.get(edge.to);
    if (!srcBox || !tgtBox || !srcEl || !tgtEl) return;

    const arrowId = `arrow-${idx + 1}-${edge.from}-${edge.to}`;
    const srcCx = srcBox.x + srcBox.width / 2;
    const srcCy = srcBox.y + srcBox.height / 2;
    const tgtCx = tgtBox.x + tgtBox.width / 2;
    const tgtCy = tgtBox.y + tgtBox.height / 2;

    const dx = tgtCx - srcCx;
    const dy = tgtCy - srcCy;

    let startX = srcCx;
    let startY = srcCy;
    let endX = tgtCx;
    let endY = tgtCy;

    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx >= 0) {
        startX = srcBox.x + srcBox.width + 6;
        endX = tgtBox.x - 6;
      } else {
        startX = srcBox.x - 6;
        endX = tgtBox.x + tgtBox.width + 6;
      }
      startY = srcCy;
      endY = tgtCy;
    } else {
      if (dy >= 0) {
        startY = srcBox.y + srcBox.height + 6;
        endY = tgtBox.y - 6;
      } else {
        startY = srcBox.y - 6;
        endY = tgtBox.y + tgtBox.height + 6;
      }
      startX = srcCx;
      endX = tgtCx;
    }

    const relDx = endX - startX;
    const relDy = endY - startY;
    const edgeLabelId = edge.label ? `txt-${arrowId}` : null;

    const arrowEl: ExcalidrawElementData = {
      id: arrowId,
      type: "arrow",
      x: startX,
      y: startY,
      width: Math.abs(relDx),
      height: Math.abs(relDy),
      angle: 0,
      strokeColor: arrowStroke,
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      groupIds: [],
      frameId: null,
      index: nextIndex(),
      roundness: { type: 2 },
      seed: deterministicSeed(arrowId),
      version: 1,
      versionNonce: deterministicSeed(`${arrowId}-v`),
      isDeleted: false,
      boundElements: edgeLabelId ? [{ id: edgeLabelId, type: "text" }] : null,
      updated: now,
      link: null,
      locked: false,
      points: [
        [0, 0],
        [relDx, relDy],
      ],
      lastCommittedPoint: null,
      startBinding: { elementId: edge.from, focus: 0, gap: 8 },
      endBinding: { elementId: edge.to, focus: 0, gap: 8 },
      startArrowhead: null,
      endArrowhead: "arrow",
      elbowed: false,
    };

    srcEl.boundElements = [...(srcEl.boundElements || []), { id: arrowId, type: "arrow" }];
    tgtEl.boundElements = [...(tgtEl.boundElements || []), { id: arrowId, type: "arrow" }];
    elements.push(arrowEl);

    if (edge.label && edgeLabelId) {
      const labelWidth = Math.max(64, edge.label.length * 7.5 + 12);
      elements.push({
        id: edgeLabelId,
        type: "text",
        x: startX + relDx / 2 - labelWidth / 2,
        y: startY + relDy / 2 - 12,
        width: labelWidth,
        height: 18,
        angle: 0,
        strokeColor: mutedColor,
        backgroundColor: viewBg,
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        index: nextIndex(),
        roundness: null,
        seed: deterministicSeed(edgeLabelId),
        version: 1,
        versionNonce: deterministicSeed(`${edgeLabelId}-v`),
        isDeleted: false,
        boundElements: null,
        updated: now,
        link: null,
        locked: false,
        text: edge.label,
        fontSize: 12,
        fontFamily: 3,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: arrowId,
        originalText: edge.label,
        autoResize: true,
        lineHeight: 1.25,
      });
    }
  });

  return {
    type: "excalidraw",
    version: 2,
    source: "https://deda-skills.local/excalidraw-diagram-generator",
    elements,
    appState: {
      gridSize: 20,
      viewBackgroundColor: viewBg,
      theme,
    },
    files: {},
  };
}

export function validateExcalidrawScene(scene: ExcalidrawScene): {
  valid: boolean;
  errors: string[];
  stats: {
    totalElements: number;
    shapes: number;
    arrows: number;
    boundTexts: number;
  };
} {
  const errors: string[] = [];

  if (scene.type !== "excalidraw") {
    errors.push("Campo 'type' deve ser 'excalidraw'.");
  }
  if (scene.version !== 2) {
    errors.push("Campo 'version' deve ser 2.");
  }
  if (!Array.isArray(scene.elements) || scene.elements.length === 0) {
    errors.push("O diagrama deve conter ao menos um elemento.");
  }

  const byId = new Map<string, ExcalidrawElementData>();
  for (const el of scene.elements) {
    if (!el.id) {
      errors.push("Elemento sem 'id'.");
      continue;
    }
    if (byId.has(el.id)) {
      errors.push(`ID duplicado encontrado: ${el.id}`);
    }
    byId.set(el.id, el);

    if (
      !Number.isFinite(el.x) ||
      !Number.isFinite(el.y) ||
      !Number.isFinite(el.width) ||
      !Number.isFinite(el.height)
    ) {
      errors.push(`Coordenadas ou dimensões inválidas em '${el.id}'.`);
    }
  }

  let shapes = 0;
  let arrows = 0;
  let boundTexts = 0;

  for (const el of scene.elements) {
    if (el.type === "rectangle" || el.type === "ellipse" || el.type === "diamond") {
      shapes++;
    }
    if (el.type === "arrow") {
      arrows++;
      if (el.startBinding && !byId.has(el.startBinding.elementId)) {
        errors.push(`Seta '${el.id}' aponta para startBinding inexistente '${el.startBinding.elementId}'.`);
      }
      if (el.endBinding && !byId.has(el.endBinding.elementId)) {
        errors.push(`Seta '${el.id}' aponta para endBinding inexistente '${el.endBinding.elementId}'.`);
      }
    }
    if (el.type === "text" && el.containerId) {
      boundTexts++;
      const container = byId.get(el.containerId);
      if (!container) {
        errors.push(`Texto '${el.id}' referencia containerId inexistente '${el.containerId}'.`);
      } else if (!container.boundElements?.some((b) => b.id === el.id && b.type === "text")) {
        errors.push(`Container '${container.id}' não lista texto '${el.id}' em boundElements.`);
      }
    }
    if (el.boundElements) {
      for (const ref of el.boundElements) {
        if (!byId.has(ref.id)) {
          errors.push(`Elemento '${el.id}' referencia boundElement inexistente '${ref.id}'.`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stats: {
      totalElements: scene.elements.length,
      shapes,
      arrows,
      boundTexts,
    },
  };
}
