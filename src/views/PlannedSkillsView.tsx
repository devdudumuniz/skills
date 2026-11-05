import React, { useState } from "react";
import { BookCover } from "../components/BookCover";

export interface PlannedSkillItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  whyNeeded: string;
  targetRuntimes: string[];
  status: "planejada" | "discutindo" | "em_andamento" | "contribuicao_aberta";
  statusLabel: string;
  priority: "P0" | "P1" | "P2";
  votes: number;
  hasVoted?: boolean;
  contributors: string[];
  promptSuggestions: string[];
  initialSteps: string[];
  coverTheme: {
    bg: string;
    accent: string;
    icon: string;
  };
}

const INITIAL_PLANNED_SKILLS: PlannedSkillItem[] = [
  {
    id: "figma-tokens-extractor",
    name: "Manus para Figma & Design Tokens",
    category: "design",
    categoryLabel: "Design",
    description: "Extrai nós de design, variantes de componentes, estilos de cor e tipografia da API REST do Figma e converte diretamente para Tailwind CSS e tokens JSON.",
    whyNeeded: "Elimina discrepâncias entre equipes de design e código gerando componentes determinísticos 100% fiéis às especificações do Figma.",
    targetRuntimes: ["manus", "claude", "codex", "cursor", "local"],
    status: "contribuicao_aberta",
    statusLabel: "Aberta para Contribuição",
    priority: "P0",
    votes: 42,
    contributors: ["dudumuniz", "community-dev"],
    promptSuggestions: [
      "Extraia os tokens de cores e fontes do link do Figma https://figma.com/file/xyz.",
      "Gere os componentes React dos botões e cards com variantes correspondentes.",
      "Valide a compatibilidade de contraste de cores (WCAG AA) com base nos tokens.",
    ],
    initialSteps: [
      "1. Autenticar com token pessoal da API Figma por referência segura (DM_SECRET_FIGMA_TOKEN).",
      "2. Fazer requisição GET /v1/files/:file_key para extrair árvore de nós e estilos.",
      "3. Mapear fills, strokes e typography para classes utilitárias do Tailwind.",
      "4. Renderizar componente React limpo sem estilos inline redundantes.",
    ],
    coverTheme: {
      bg: "linear-gradient(155deg, #333333 0%, #242424 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "code",
    },
  },
  {
    id: "postgres-migration-guard",
    name: "PostgreSQL Migration & DDL Guard",
    category: "dados",
    categoryLabel: "Dados",
    description: "Analisa e planeja alterações de schema em bancos de dados relacionais Postgres, detectando locks de tabela perigosos, migrações destrutivas e propondo passos transacionais com rollback.",
    whyNeeded: "Prevenir downtime em produção causado por ALTER TABLE não indexados ou migrações que travam tabelas com milhões de registros.",
    targetRuntimes: ["manus", "claude", "codex", "local"],
    status: "discutindo",
    statusLabel: "Em Discussão",
    priority: "P0",
    votes: 38,
    contributors: ["devdudumuniz"],
    promptSuggestions: [
      "Audite a migração de adição de coluna NOT NULL na tabela transações sem causar exclusive table lock.",
      "Elabore uma migração em 3 etapas para renomear coluna com zero downtime (expand and contract pattern).",
      "Gere scripts de rollback seguros para a migração V12__add_indexes.sql.",
    ],
    initialSteps: [
      "1. Mapear tamanho estimado das tabelas e índices afetados.",
      "2. Verificar se o comando SQL causa ACCESS EXCLUSIVE lock.",
      "3. Estruturar migração em padrão Expand and Contract.",
      "4. Adicionar timeout de lock seguro (SET lock_timeout = '2s').",
    ],
    coverTheme: {
      bg: "linear-gradient(155deg, #383838 0%, #222222 60%, #151515 100%)",
      accent: "#C2C2C2",
      icon: "code",
    },
  },
  {
    id: "docker-container-ops",
    name: "Manus para Docker & Container Ops",
    category: "programacao",
    categoryLabel: "Programação",
    description: "Cria e otimiza Dockerfiles multi-stage enxutos, compose files isolados, configurações de saúde (health checks) e executa varreduras de segurança de imagem com Trivy.",
    whyNeeded: "Padronizar empacotamento determinístico de agentes e microsserviços sem vazamento de segredos ou imagens pesadas.",
    targetRuntimes: ["manus", "claude", "codex", "antigravity", "local"],
    status: "em_andamento",
    statusLabel: "Em Andamento",
    priority: "P1",
    votes: 29,
    contributors: ["devdudumuniz", "infra-lead"],
    promptSuggestions: [
      "Converta este projeto Node/React para Dockerfile multi-stage com imagem base Alpine mínima.",
      "Gere um docker-compose.yml com banco de dados, cache Redis e health checks com dependências estritas.",
      "Audite a imagem Docker em busca de CVEs críticos ou executáveis executando como root.",
    ],
    initialSteps: [
      "1. Mapear runtime necessário e arquivos estáticos compilados.",
      "2. Criar estágio de build separado do estágio de runtime enxuto.",
      "3. Configurar usuário não-root (USER 1001) para execução do processo.",
      "4. Configurar health checks determinísticos e sem dependência de curl/wget extras.",
    ],
    coverTheme: {
      bg: "linear-gradient(155deg, #2e2e2e 0%, #202020 60%, #151515 100%)",
      accent: "#9B9B9B",
      icon: "devops",
    },
  },
  {
    id: "web-vitals-optimizer",
    name: "Core Web Vitals & Performance Agent",
    category: "programacao",
    categoryLabel: "Programação",
    description: "Audita métricas reais de performance web (LCP, INP, CLS, TBT), identifica gargalos de renderização crítica e sugere correções automáticas de CSS inline e scripts adiados.",
    whyNeeded: "Atingir notas 95+ no Google Lighthouse e garantir carregamento ultrarrápido em redes móveis 4G.",
    targetRuntimes: ["manus", "claude", "codex", "cursor", "local"],
    status: "contribuicao_aberta",
    statusLabel: "Aberta para Contribuição",
    priority: "P1",
    votes: 24,
    contributors: ["frontend-guru"],
    promptSuggestions: [
      "Analise a página inicial e indique quais recursos estão atrasando a renderização do LCP.",
      "Otimize o carregamento de fontes personalizadas com font-display: swap e preconnect.",
      "Detecte shifts de layout cumulativo (CLS) causados por imagens sem largura e altura definidas.",
    ],
    initialSteps: [
      "1. Capturar timeline de carregamento de recursos via performance navigation timing.",
      "2. Mapear o elemento responsável pelo Largest Contentful Paint.",
      "3. Injetar dimensões de aspecto nas tags <img> e <video>.",
      "4. Validar regressão de renderização em viewport móvel de 375px.",
    ],
    coverTheme: {
      bg: "linear-gradient(155deg, #333333 0%, #222222 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "code",
    },
  },
  {
    id: "google-sheets-automation",
    name: "Manus para Google Sheets",
    category: "aplicativos",
    categoryLabel: "Aplicativos",
    description: "Lê, estrutura, limpa e gera fórmulas e automações para Google Sheets via API de forma não-destrutiva e auditável.",
    whyNeeded: "Permitir que agentes cruzem dados operacionais e emitam relatórios tabulares sem riscos de sobrescrita acidental.",
    targetRuntimes: ["manus", "claude", "codex", "antigravity", "local"],
    status: "planejada",
    statusLabel: "Planejada",
    priority: "P1",
    votes: 31,
    contributors: ["dudumuniz"],
    promptSuggestions: [
      "Consolide os dados das abas de vendas mensais em uma visão resumida anual.",
      "Gere fórmulas dinâmicas de PROCV/XLOOKUP com validação de erros #N/D.",
      "Audite duplicatas e linhas inconsistentes no arquivo exportado.",
    ],
    initialSteps: [
      "1. Autenticar com credenciais OAuth em modo somente leitura primeiro.",
      "2. Mapear dimensões da planilha e cabeçalhos de coluna.",
      "3. Preparar rascunho de alterações com confirmação visual antes de qualquer escrita.",
    ],
    coverTheme: {
      bg: "linear-gradient(155deg, #303030 0%, #202020 60%, #151515 100%)",
      accent: "#C2C2C2",
      icon: "sparkles",
    },
  },
  {
    id: "owasp-sast-auditor",
    name: "OWASP API Security & SAST Auditor",
    category: "dados",
    categoryLabel: "Dados",
    description: "Executa análise defensiva de endpoints de API para identificar falhas do OWASP API Security Top 10 (IDOR, Mass Assignment, Broken Object Level Auth).",
    whyNeeded: "Garantir conformidade estrita de segurança antes de qualquer deploy em produção.",
    targetRuntimes: ["manus", "claude", "codex", "local"],
    status: "contribuicao_aberta",
    statusLabel: "Aberta para Contribuição",
    priority: "P0",
    votes: 45,
    contributors: ["sec-analyst", "devdudumuniz"],
    promptSuggestions: [
      "Verifique se as rotas de mutação /api/users/:id validam se o token JWT pertence ao mesmo usuário.",
      "Audite o payload JSON de entrada contra problemas de Mass Assignment em campos sensíveis (is_admin, balance).",
      "Gere relatório de compliance no padrão OWASP com severidades CVSS priorizadas.",
    ],
    initialSteps: [
      "1. Identificar todos os manipuladores de rotas e middlewares de autorização.",
      "2. Checar correspondência entre parâmetros de rota e contexto de sessão.",
      "3. Emitir plano de mitigação defensivo sem exfiltrar credenciais reais.",
    ],
    coverTheme: {
      bg: "linear-gradient(155deg, #2b2b2b 0%, #1c1c1c 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "shield",
    },
  },
  {
    id: "playwright-e2e-suite",
    name: "Playwright E2E Test Suite Generator",
    category: "programacao",
    categoryLabel: "Programação",
    description: "Gera suítes de testes ponta a ponta Playwright com seletores semânticos acessíveis (getByRole, getByText), mocks de rede e geração automática de snapshots visuais.",
    whyNeeded: "Automatizar a validação de jornadas críticas de usuário com tolerância zero a testes instáveis (flaky tests).",
    targetRuntimes: ["manus", "claude", "codex", "cursor", "local"],
    status: "planejada",
    statusLabel: "Planejada",
    priority: "P2",
    votes: 19,
    contributors: ["qa-lead"],
    promptSuggestions: [
      "Gere um teste Playwright cobrindo o fluxo completo de checkout com cartão e confirmação de pedido.",
      "Configure testes visuais de regressão com tolerância máxima de 0.02% de diferença de pixels.",
      "Crie um mock de API para simular resposta 500 do gateway e testar o banner de erro amigável.",
    ],
    initialSteps: [
      "1. Mapear rota de navegação e seletores semânticos WCAG.",
      "2. Escrever assertions estritas com expectativas de timeout explícitas.",
      "3. Executar em modo headless e validar que screenshots são consistentes.",
    ],
    coverTheme: {
      bg: "linear-gradient(155deg, #363636 0%, #242424 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: "code",
    },
  },
];

export interface PlannedSkillsViewProps {
  onStartSkill?: (planned: PlannedSkillItem) => void;
  onSelectPlannedSkill?: (planned: PlannedSkillItem) => void;
  onNavigateCatalog?: () => void;
  onBackToLab?: () => void;
}

export const PlannedSkillsView: React.FC<PlannedSkillsViewProps> = ({
  onStartSkill,
  onSelectPlannedSkill,
  onNavigateCatalog,
  onBackToLab,
}) => {
  const handleStartSkill = (p: PlannedSkillItem) => {
    if (onSelectPlannedSkill) onSelectPlannedSkill(p);
    else if (onStartSkill) onStartSkill(p);
  };

  const handleBack = () => {
    if (onBackToLab) onBackToLab();
    else if (onNavigateCatalog) onNavigateCatalog();
  };

  const [plannedSkills, setPlannedSkills] = useState<PlannedSkillItem[]>(INITIAL_PLANNED_SKILLS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [selectedProposal, setSelectedProposal] = useState<PlannedSkillItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleVote = (id: string) => {
    setPlannedSkills((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const hasVoted = item.hasVoted;
          const nextVotes = hasVoted ? item.votes - 1 : item.votes + 1;
          showToast(
            hasVoted
              ? `Voto removido de '${item.name}'`
              : `Voto registrado! '${item.name}' subiu na fila de prioridades (+1)`
          );
          return { ...item, votes: nextVotes, hasVoted: !hasVoted };
        }
        return item;
      })
    );
  };

  const filteredSkills = plannedSkills.filter((item) => {
    if (statusFilter !== "todos" && item.status !== statusFilter) return false;
    if (categoryFilter !== "todos" && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchWhy = item.whyNeeded.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchWhy) return false;
    }
    return true;
  });

  const categories = [
    { id: "todos", label: "Todas" },
    { id: "programacao", label: "Programação" },
    { id: "dados", label: "Dados & SQL" },
    { id: "design", label: "Design" },
    { id: "aplicativos", label: "Aplicativos" },
  ];

  const statuses = [
    { id: "todos", label: "Todos os Status" },
    { id: "contribuicao_aberta", label: "Aberta para Contribuição" },
    { id: "em_andamento", label: "Em Andamento" },
    { id: "discutindo", label: "Em Discussão" },
    { id: "planejada", label: "Planejadas" },
  ];

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "24px 20px 60px 20px",
        color: "#EAEAEA",
      }}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            backgroundColor: "#202020",
            border: "1px solid #545454",
            color: "#EAEAEA",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13,
            boxShadow: "0 8px 24px rgba(0,0,0,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C2C2C2" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner - Monocromático */}
      <div
        style={{
          backgroundColor: "#202020",
          border: "1px solid #383838",
          borderRadius: 14,
          padding: "24px 28px",
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 660 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#9B9B9B",
              marginBottom: 4,
            }}
          >
            Planejamento & Roadmap de Competências
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#EAEAEA",
              margin: "0 0 8px 0",
              letterSpacing: "-0.01em",
            }}
          >
            Próximas Skills & Contribuição Aberta
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: "#C2C2C2",
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Explore as competências em roadmap para Agentes de IA. Você pode votar nas prioridades da comunidade ou clicar em <b>Iniciar Implementação</b> para carregar a proposta diretamente no Estúdio de Criação e contribuir com o código e diretrizes.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              backgroundColor: "#333333",
              color: "#EAEAEA",
              border: "1px solid #545454",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar ao Catálogo de Skills
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {/* Search input */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#767676",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            type="text"
            placeholder="Pesquisar propostas por nome, objetivo ou ferramenta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              backgroundColor: "#202020",
              border: "1px solid #545454",
              borderRadius: 22,
              padding: "10px 16px 10px 42px",
              color: "#EAEAEA",
              fontSize: 13.5,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        {/* Status and Category Filter Pills */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Status buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {statuses.map((st) => {
              const active = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  style={{
                    backgroundColor: active ? "#333333" : "transparent",
                    color: active ? "#EAEAEA" : "#9B9B9B",
                    border: active ? "1px solid #767676" : "1px solid transparent",
                    borderRadius: 18,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Category buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map((ct) => {
              const active = categoryFilter === ct.id;
              return (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setCategoryFilter(ct.id)}
                  style={{
                    backgroundColor: active ? "#262626" : "transparent",
                    color: active ? "#C2C2C2" : "#767676",
                    border: active ? "1px solid #545454" : "1px solid transparent",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 11.5,
                    cursor: "pointer",
                  }}
                >
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Planned Skills List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredSkills.length > 0 ? (
          filteredSkills.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "#202020",
                border: "1px solid #383838",
                borderRadius: 12,
                padding: "18px 22px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 20,
                transition: "border-color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#545454";
                e.currentTarget.style.backgroundColor = "#242424";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#383838";
                e.currentTarget.style.backgroundColor = "#202020";
              }}
            >
              {/* Left thumbnail book cover */}
              <div style={{ flexShrink: 0, paddingTop: 2 }}>
                <BookCover
                  title={item.name}
                  theme={item.coverTheme}
                  variant="thumbnail"
                />
              </div>

              {/* Middle details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: "#333333",
                      border: "1px solid #545454",
                      color: "#C2C2C2",
                      padding: "2px 8px",
                      borderRadius: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {item.categoryLabel}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: item.status === "contribuicao_aberta" ? "#333333" : "#262626",
                      border: item.status === "contribuicao_aberta" ? "1px solid #767676" : "1px solid #383838",
                      color: item.status === "contribuicao_aberta" ? "#EAEAEA" : "#9B9B9B",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {item.statusLabel}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: "#9B9B9B",
                      border: "1px solid #383838",
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}
                  >
                    Prioridade {item.priority}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#EAEAEA",
                    margin: "0 0 6px 0",
                    lineHeight: 1.3,
                  }}
                >
                  {item.name}
                </h3>

                <p
                  style={{
                    fontSize: 13,
                    color: "#C2C2C2",
                    margin: "0 0 8px 0",
                    lineHeight: 1.5,
                  }}
                >
                  {item.description}
                </p>

                <div
                  style={{
                    fontSize: 12,
                    color: "#9B9B9B",
                    marginBottom: 10,
                    lineHeight: 1.45,
                  }}
                >
                  <b style={{ color: "#EAEAEA" }}>Por que é necessária:</b> {item.whyNeeded}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "#767676" }}>
                  <span>
                    Contribuintes: <b style={{ color: "#9B9B9B" }}>{item.contributors.join(", ")}</b>
                  </span>
                  <span>•</span>
                  <span>
                    Compatível com: {item.targetRuntimes.join(", ")}
                  </span>
                </div>
              </div>

              {/* Right action column: Vote & Start Implementing */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                {/* Vote button */}
                <button
                  type="button"
                  onClick={() => handleVote(item.id)}
                  style={{
                    backgroundColor: item.hasVoted ? "#333333" : "#262626",
                    color: item.hasVoted ? "#EAEAEA" : "#C2C2C2",
                    border: item.hasVoted ? "1px solid #767676" : "1px solid #545454",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  title="Votar para priorizar esta habilidade"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={item.hasVoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  <span>{item.votes} votos</span>
                </button>

                {/* Iniciar / Contribuir button */}
                <button
                  type="button"
                  onClick={() => handleStartSkill(item)}
                  style={{
                    backgroundColor: "#EAEAEA",
                    color: "#151515",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C2C2C2")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#EAEAEA")}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Iniciar Implementação
                </button>

                {/* Ver Proposta Detalhada */}
                <button
                  type="button"
                  onClick={() => setSelectedProposal(item)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9B9B9B",
                    fontSize: 11.5,
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "2px 4px",
                  }}
                >
                  Ver proposta & checklist
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              backgroundColor: "#202020",
              borderRadius: 12,
              border: "1px dashed #545454",
              color: "#9B9B9B",
            }}
          >
            Nenhuma proposta encontrada para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Modal de Proposta & Diretrizes de Contribuição */}
      {selectedProposal && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProposal(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              backgroundColor: "#202020",
              borderRadius: 14,
              border: "1px solid #545454",
              boxShadow: "0 20px 45px rgba(0,0,0,0.8)",
              padding: "24px 28px",
              color: "#EAEAEA",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, backgroundColor: "#333333", border: "1px solid #545454", padding: "2px 8px", borderRadius: 4, color: "#C2C2C2" }}>
                  {selectedProposal.categoryLabel}
                </span>
                <span style={{ fontSize: 11, backgroundColor: "#262626", color: "#9B9B9B", padding: "2px 8px", borderRadius: 999 }}>
                  {selectedProposal.statusLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                style={{ background: "transparent", border: "none", color: "#9B9B9B", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px 0", color: "#EAEAEA" }}>
              {selectedProposal.name}
            </h2>

            <p style={{ fontSize: 13.5, color: "#C2C2C2", lineHeight: 1.55, margin: "0 0 16px 0" }}>
              {selectedProposal.description}
            </p>

            <div style={{ backgroundColor: "#151515", border: "1px solid #383838", borderRadius: 8, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", marginBottom: 6 }}>
                Justificativa & Caso de Uso Real
              </div>
              <div style={{ fontSize: 13, color: "#EAEAEA", lineHeight: 1.5 }}>
                {selectedProposal.whyNeeded}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", marginBottom: 8 }}>
                Sugestões de Gatilhos & Prompts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedProposal.promptSuggestions.map((pr, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "#262626",
                      border: "1px solid #383838",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 12.5,
                      color: "#C2C2C2",
                    }}
                  >
                    💬 {pr}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9B9B9B", textTransform: "uppercase", marginBottom: 8 }}>
                Checklist do Procedimento Inicial
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selectedProposal.initialSteps.map((st, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "#181818",
                      borderRadius: 6,
                      padding: "8px 12px",
                      fontSize: 12.5,
                      color: "#EAEAEA",
                    }}
                  >
                    {st}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #383838", paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                style={{
                  backgroundColor: "#333333",
                  color: "#EAEAEA",
                  border: "1px solid #545454",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = selectedProposal;
                  setSelectedProposal(null);
                  handleStartSkill(p);
                }}
                style={{
                  backgroundColor: "#EAEAEA",
                  color: "#151515",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Iniciar esta Implementação Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
