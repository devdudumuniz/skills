import {
  ProjectOverview,
  TaskItem,
  PhaseItem,
  MilestoneItem,
  ProcessItem,
  CapabilityDomain,
  ComparativeItem,
  EvolutionData,
  FindingItem,
  FlowItem,
  ChangeItem,
  DecisionItem,
  ErrorItem,
  TimelineItem,
  WorkHours,
  ReportItem,
  QualityGate,
} from "../types";

export const initialTasks: TaskItem[] = [
  {
    id: "D-001",
    title: "Levantamento do sistema atual",
    priority: "P0",
    priority_label: "Crítica",
    kind: "docs",
    executor: "Agente de IA",
    goal: "Mapear módulos, dados e integrações do sistema atual.",
    steps: ["Ler o código e a documentação", "Identificar tabelas legadas", "Mapear fluxos de checkout"],
    acceptance: ["Documento de levantamento publicado e revisado"],
    depends_on: [],
    gates: [{ gate: "review", label: "Revisão de arquitetura", status: "PASS", at: "2026-10-24T11:00:00Z" }],
    status: "DONE",
    status_label: "Concluída",
    phase_id: "phase.discovery",
    phase_title: "Levantamento e plano",
    tab: "concluidas",
    started_at: "2026-10-23T09:15:00Z",
    completed_at: "2026-10-24T17:40:00Z",
    result: "Levantamento completo consolidado em docs/levantamento.md com 3 módulos críticos identificados.",
    evidence: [{ ref: "docs/levantamento.md", label: "Relatório de Levantamento", count: 1 }],
    worked: { seconds: 19800, label: "5h 30m" },
    assignee: "agent:demo-bot",
    completed_by: "agent:demo-bot",
    history: [
      { seq: 1, type: "task_start", actor: "agent:demo-bot", ts: "2026-10-23T09:15:00Z" },
      { seq: 2, type: "gate_pass", actor: "human:lead", ts: "2026-10-24T11:00:00Z" },
      { seq: 3, type: "task_done", actor: "agent:demo-bot", ts: "2026-10-24T17:40:00Z" }
    ]
  },
  {
    id: "D-002",
    title: "Plano de migração aprovado",
    priority: "P0",
    priority_label: "Crítica",
    kind: "docs",
    executor: "Equipe ou agente de IA",
    goal: "Definir a ordem de migração dos módulos e o plano de retorno.",
    steps: ["Definir estratégia de cutover", "Estruturar rollback plan", "Apresentar para stakeholders"],
    acceptance: ["Plano revisado pela equipe", "Matriz de risco homologada"],
    depends_on: [{ id: "D-001", title: "Levantamento do sistema atual" }],
    gates: [{ gate: "approval", label: "Aprovação de Gestão", status: "PASS", at: "2026-10-28T14:30:00Z" }],
    status: "DONE",
    status_label: "Concluída",
    phase_id: "phase.discovery",
    phase_title: "Levantamento e plano",
    tab: "concluidas",
    started_at: "2026-10-25T10:00:00Z",
    completed_at: "2026-10-28T14:30:00Z",
    result: "Plano aprovado sem ressalvas. Migração faseada catálogo -> pedidos -> pagamento aprovada.",
    evidence: [{ ref: "docs/plano.md", label: "Plano de Migração e Contingência", count: 1 }],
    worked: { seconds: 14400, label: "4h 00m" },
    assignee: "human:coord",
    completed_by: "human:coord",
    history: [
      { seq: 4, type: "task_start", actor: "human:coord", ts: "2026-10-25T10:00:00Z" },
      { seq: 5, type: "task_done", actor: "human:coord", ts: "2026-10-28T14:30:00Z" }
    ]
  },
  {
    id: "D-003",
    title: "Migrar o módulo de catálogo",
    priority: "P1",
    priority_label: "Alta",
    kind: "dev",
    executor: "Agente de IA",
    goal: "Levar o catálogo de produtos para a nova plataforma sem perder histórico.",
    steps: ["Extrair produtos do banco legado", "Normalizar imagens e variações", "Importar na nova plataforma"],
    acceptance: ["Produtos migrados e conferidos com 100% de integridade nos preços"],
    depends_on: [{ id: "D-002", title: "Plano de migração aprovado" }],
    gates: [{ gate: "tests", label: "Testes automatizados", status: "PASS", at: "2026-11-01T16:20:00Z" }],
    status: "DONE",
    status_label: "Concluída",
    phase_id: "phase.migration",
    phase_title: "Migração dos módulos",
    tab: "concluidas",
    started_at: "2026-10-29T08:00:00Z",
    completed_at: "2026-11-01T16:20:00Z",
    result: "1.420 produtos importados, categorizados e testados com testes automatizados passando.",
    evidence: [{ ref: "evidence/catalogo-validation.json", label: "Validação Criptográfica de Produtos", count: 1 }],
    worked: { seconds: 28800, label: "8h 00m" },
    assignee: "agent:demo-bot",
    completed_by: "agent:demo-bot",
    history: [
      { seq: 6, type: "task_start", actor: "agent:demo-bot", ts: "2026-10-29T08:00:00Z" },
      { seq: 7, type: "gate_pass", actor: "agent:demo-bot", ts: "2026-11-01T16:00:00Z" },
      { seq: 8, type: "task_done", actor: "agent:demo-bot", ts: "2026-11-01T16:20:00Z" }
    ]
  },
  {
    id: "D-004",
    title: "Migrar o módulo de pedidos",
    priority: "P1",
    priority_label: "Alta",
    kind: "dev",
    executor: "Agente de IA",
    goal: "Migrar pedidos e status de entrega mantendo referências e integridade contábil.",
    steps: ["Sanitizar histórico de pedidos", "Migrar histórico dos últimos 24 meses", "Validar totais"],
    acceptance: ["Pedidos migrados e conferidos", "Auditoria de valores sem divergência"],
    depends_on: [{ id: "D-003", title: "Migrar o módulo de catálogo" }],
    gates: [{ gate: "tests", label: "Testes automatizados", status: "PASS", at: "2026-11-03T18:00:00Z" }],
    status: "IN_PROGRESS",
    status_label: "Em execução",
    phase_id: "phase.migration",
    phase_title: "Migração dos módulos",
    tab: "em_execucao",
    started_at: "2026-11-02T09:00:00Z",
    completed_at: null,
    result: undefined,
    evidence: [{ ref: "evidence/pedidos-partial.log", label: "Log Parcial de Migração", count: 1 }],
    worked: { seconds: 18000, label: "5h 00m", running: true },
    assignee: "agent:demo-bot",
    history: [
      { seq: 9, type: "task_start", actor: "agent:demo-bot", ts: "2026-11-02T09:00:00Z" }
    ]
  },
  {
    id: "D-005",
    title: "Integração com o meio de pagamento",
    priority: "P1",
    priority_label: "Alta",
    kind: "ops",
    executor: "Equipe (humano)",
    goal: "Ligar o novo checkout ao meio de pagamento em ambiente de teste.",
    steps: ["Obter credenciais de sandbox", "Configurar webhook de notificação", "Testar transações Pix e Cartão"],
    acceptance: ["Pagamento de teste aprovado e conciliado no gateway"],
    depends_on: [],
    gates: [],
    blocked_by: ["credenciais de teste do meio de pagamento"],
    status: "WAITING",
    status_label: "Aguardando",
    phase_id: "phase.migration",
    phase_title: "Migração dos módulos",
    tab: "bloqueadas",
    evidence: [],
    assignee: "human:finance",
    history: [
      { seq: 10, type: "blocked", actor: "human:finance", ts: "2026-11-03T10:00:00Z" }
    ]
  },
  {
    id: "D-006",
    title: "Decidir a política de frete grátis",
    priority: "P2",
    priority_label: "Média",
    kind: "decision",
    executor: "Equipe (humano)",
    goal: "Definir o valor mínimo para frete grátis na nova loja.",
    steps: ["Simular impacto no ticket médio", "Definir regras por região"],
    acceptance: ["Decisão registrada formalmente no portal"],
    depends_on: [],
    gates: [],
    status: "WAITING",
    status_label: "Aguardando",
    phase_id: "phase.golive",
    phase_title: "Decisões e virada",
    tab: "bloqueadas",
    evidence: [],
    assignee: "human:comercial",
    history: []
  },
  {
    id: "D-007",
    title: "Aprovar o layout do checkout",
    priority: "P2",
    priority_label: "Média",
    kind: "dev",
    executor: "Equipe (humano)",
    requires_human_approval: true,
    approval_reason: "identidade visual",
    goal: "O cliente aprova o layout do checkout em mobile e desktop.",
    steps: ["Apresentar protótipo funcional", "Colher apontamentos de UX"],
    acceptance: ["Layout aprovado pelo cliente"],
    depends_on: [],
    gates: [],
    status: "WAITING",
    status_label: "Aguardando aprovação",
    phase_id: "phase.golive",
    phase_title: "Decisões e virada",
    tab: "bloqueadas",
    evidence: [],
    assignee: "human:design",
    history: []
  },
  {
    id: "D-008",
    title: "Corrigir exposição de chave no repositório antigo",
    priority: "P0",
    priority_label: "Crítica",
    kind: "security",
    executor: "Equipe (humano)",
    goal: "Trocar a chave e limpar o histórico do repositório antigo.",
    steps: ["Rotacionar chaves de API", "Executar git-filter-repo", "Invalidar credenciais legadas"],
    acceptance: ["Chave trocada e confirmada inativa"],
    depends_on: [],
    gates: [],
    status: "WAITING",
    status_label: "Aguardando",
    phase_id: "phase.golive",
    phase_title: "Decisões e virada",
    tab: "bloqueadas",
    evidence: [],
    assignee: "human:sec",
    history: []
  },
  {
    id: "D-009",
    title: "Publicar a nova loja em produção",
    priority: "P0",
    priority_label: "Crítica",
    kind: "ops",
    executor: "Equipe (humano)",
    requires_human_approval: true,
    approval_reason: "virada de produção",
    goal: "Colocar a nova loja no ar com plano de retorno e checklist de virada.",
    steps: ["Executar migração delta", "Virar DNS", "Verificar SSL e telemetria"],
    acceptance: ["Loja no ar respondendo tráfego real"],
    depends_on: [
      { id: "D-004", title: "Migrar o módulo de pedidos" },
      { id: "D-005", title: "Integração com o meio de pagamento" },
      { id: "D-007", title: "Aprovar o layout do checkout" }
    ],
    gates: [],
    status: "PLANNED",
    status_label: "Planejada",
    phase_id: "phase.golive",
    phase_title: "Decisões e virada",
    tab: "proximas",
    evidence: [],
    history: []
  },
  {
    id: "D-010",
    title: "Treinar a equipe de atendimento",
    priority: "P3",
    priority_label: "Baixa",
    kind: "docs",
    executor: "Equipe (humano)",
    goal: "Treinamento prático no novo painel de pedidos e SAC.",
    steps: ["Elaborar guia rápido", "Sessão ao vivo de capacitação"],
    acceptance: ["Equipe treinada e habilitada para suporte"],
    depends_on: [{ id: "D-009", title: "Publicar a nova loja em produção" }],
    gates: [],
    status: "PLANNED",
    status_label: "Planejada",
    phase_id: "phase.golive",
    phase_title: "Decisões e virada",
    tab: "proximas",
    evidence: [],
    history: []
  }
];

export const initialPhases: PhaseItem[] = [
  {
    phase_id: "phase.discovery",
    title: "Levantamento e plano",
    description: "Entender o sistema atual e definir a ordem da migração.",
    objective: "Plano aprovado e riscos conhecidos.",
    status: "COMPLETED",
    status_label: "Concluída",
    progress: 100,
    tasks_total: 2,
    tasks_done: 2,
    started_at: "2026-10-23T09:00:00Z",
    completed_at: "2026-10-28T14:30:00Z",
    worked: { seconds: 34200, label: "9h 30m" },
    tasks: ["D-001", "D-002"],
    reports: [
      {
        report_id: "report.phase.discovery",
        title: "Relatório de Conclusão: Levantamento e Plano",
        version: 1,
        period: { started_at: "2026-10-23T09:00:00Z", completed_at: "2026-10-28T14:30:00Z" },
        generated_at: "2026-10-28T15:00:00Z",
        audience: "client",
        pdf_url: "#report-phase-1",
        summary: "Fase de levantamento concluída com sucesso. Todos os módulos foram mapeados e o plano de migração foi aprovado sem ressalvas.",
        highlights: [
          "Mapeamento integral de produtos, clientes e histórico de pedidos legados.",
          "Matriz de risco homologada com estratégia de reversão ponta-a-ponta.",
          "Checklist de conformidade e segurança aprovado pela equipe de engenharia."
        ]
      }
    ]
  },
  {
    phase_id: "phase.migration",
    title: "Migração dos módulos",
    description: "Catálogo e pedidos na nova plataforma.",
    objective: "Dados migrados e conferidos.",
    status: "IN_PROGRESS",
    status_label: "Em andamento",
    progress: 33,
    tasks_total: 3,
    tasks_done: 1,
    started_at: "2026-10-29T08:00:00Z",
    completed_at: null,
    worked: { seconds: 46800, label: "13h 00m" },
    tasks: ["D-003", "D-004", "D-005"],
    reports: []
  },
  {
    phase_id: "phase.golive",
    title: "Decisões e virada",
    description: "Decisões do cliente e publicação final.",
    objective: "Loja no ar com segurança.",
    status: "WAITING",
    status_label: "Aguardando",
    progress: 0,
    tasks_total: 5,
    tasks_done: 0,
    started_at: null,
    completed_at: null,
    worked: { seconds: 0, label: "0h 00m" },
    tasks: ["D-006", "D-007", "D-008", "D-009", "D-010"],
    reports: []
  }
];

export const initialMilestones: MilestoneItem[] = [
  {
    milestone_id: "milestone.plan",
    title: "Plano de migração aprovado",
    description: "Ordem de migração e plano de retorno definidos e assinados.",
    delivered: true,
    delivered_at: "2026-10-28T14:30:00Z",
    phase: "phase.discovery",
    tasks: ["D-001", "D-002"],
    evidence: ["docs/levantamento.md", "docs/plano.md"]
  },
  {
    milestone_id: "milestone.catalogo",
    title: "Catálogo conferido na nova plataforma",
    description: "1.420 produtos importados, categorizados e testados com preços exatos.",
    delivered: true,
    delivered_at: "2026-11-01T16:20:00Z",
    phase: "phase.migration",
    tasks: ["D-003"],
    evidence: ["evidence/catalogo-validation.json"]
  },
  {
    milestone_id: "milestone.golive",
    title: "Virada e Loja no ar com segurança",
    description: "Publicação em produção com DNS propagado e telemetria ativa.",
    delivered: false,
    phase: "phase.golive",
    tasks: ["D-009", "D-010"],
    evidence: []
  }
];

export const initialProcesses: ProcessItem[] = [
  {
    process: "Cadastro de produtos",
    domain: "domain.catalogo",
    objective: "Cadastro, preços e estoque dos produtos.",
    level: 4,
    status: "Homologada",
    automation: "SIM",
    priority: "P1",
    priority_label: "Alta",
    next_milestone: "Catálogo conferido"
  },
  {
    process: "Fechamento de pedidos",
    domain: "domain.pedidos",
    objective: "Histórico de pedidos e acompanhamento de entrega.",
    level: 2,
    status: "Implementada",
    automation: "PARCIAL",
    priority: "P1",
    priority_label: "Alta",
    next_milestone: "Pedidos conferidos"
  },
  {
    process: "Cobrança no checkout",
    domain: "domain.pagamento",
    objective: "Checkout ligado ao meio de pagamento.",
    level: 1,
    status: "Em migração",
    automation: "PARCIAL",
    priority: "P1",
    priority_label: "Alta",
    next_milestone: "Pagamento de teste aprovado"
  },
  {
    process: "Emissão de nota fiscal",
    objective: "Emitir a nota a partir do pedido pago.",
    level: 0,
    status: "Identificada",
    automation: "NÃO",
    priority: "P2",
    priority_label: "Média",
    next_milestone: "Fora do escopo desta fase"
  }
];

export const initialCapabilities: CapabilityDomain[] = [
  {
    domain_id: "domain.catalogo",
    label: "Catálogo de produtos",
    what_it_does: "Cadastro, preços e estoque dos produtos.",
    input: "Planilha e banco antigo",
    output: "Catálogo na nova plataforma",
    priority: "P1",
    priority_label: "Alta",
    automation: "SIM",
    level: 4,
    status: "Homologada",
    next_milestone: "Catálogo conferido",
    skills_found: [
      { label: "Mapeamento de Schema", skills: ["exact-ui-extraction-transfer", "vibecode-builder"] }
    ],
    platform_components: [
      { name: "Motor de Catálogo GraphQL", status: "Ativo" },
      { name: "Sincronizador de Estoque", status: "Concluído" }
    ]
  },
  {
    domain_id: "domain.pedidos",
    label: "Pedidos e entregas",
    what_it_does: "Histórico de pedidos e acompanhamento de entrega.",
    input: "Banco antigo",
    output: "Pedidos na nova plataforma",
    priority: "P1",
    priority_label: "Alta",
    automation: "PARCIAL",
    level: 2,
    status: "Implementada",
    next_milestone: "Pedidos conferidos",
    skills_found: [
      { label: "Pipeline de Migração", skills: ["devops-delivery", "status-portal-registro"] }
    ],
    platform_components: [
      { name: "Order Management Engine", status: "Em teste" },
      { name: "Rastreamento Logístico", status: "Planejado" }
    ]
  },
  {
    domain_id: "domain.pagamento",
    label: "Meio de pagamento",
    what_it_does: "Checkout integrado com gateway de pagamento seguro.",
    priority: "P1",
    priority_label: "Alta",
    automation: "PARCIAL",
    level: 1,
    status: "Em migração",
    next_milestone: "Pagamento de teste aprovado",
    skills_found: [
      { label: "Verificação de Segurança", skills: ["security-baseline"] }
    ],
    platform_components: [
      { name: "Gateway Webhook Handler", status: "Aguardando credenciais" }
    ]
  }
];

export const initialComparative: ComparativeItem[] = [
  {
    category: "Cadastro",
    current: "Planilha enviada por e-mail, sem histórico de alterações.",
    new: "Cadastro único na plataforma, com auditoria e controle de versão de cada SKU."
  },
  {
    category: "Testes",
    current: "Conferência manual e por amostragem dos produtos.",
    new: "Testes automatizados contínuos (42 testes) antes de concluir cada módulo."
  },
  {
    category: "Segurança",
    current: "Acesso compartilhado por senha única.",
    new: "Acesso por conta individual com RBAC e verificação de segredos a cada commit."
  },
  {
    category: "Resiliência",
    current: "Servidor monolítico único sem failover.",
    new: "Arquitetura distribuída com containerização, auto-healing e monitoramento 24/7."
  }
];

export const initialEvolution: EvolutionData = {
  existed: {
    items: [
      "Loja na plataforma antiga com manutenção manual e alta fragilidade.",
      "Banco de dados legado com tabelas desnormalizadas sem chaves estrangeiras."
    ]
  },
  identified: {
    items: [
      "10 tarefas estruturadas planejadas para a virada segura.",
      "4 fluxos principais de negócio mapeados com respectivas dependências."
    ]
  },
  preserved: {
    items: [
      "Histórico integral de compras e faturamento dos últimos 24 meses.",
      "Base de clientes cadastrados e pontuação de fidelidade."
    ]
  },
  rebuilt: {
    items: [
      "Novo motor de busca e catálogo com resposta abaixo de 50ms.",
      "Checkout otimizado para celulares com um passo a menos."
    ]
  },
  improved: {
    items: [
      "3 tarefas de infraestrutura e migração já concluídas com validação criptográfica.",
      "42 testes automatizados garantindo conformidade matemática de preços e impostos."
    ]
  },
  missing: {
    items: [
      "Definição executiva da política de frete grátis (D-006).",
      "Credenciais de sandbox para homologação do meio de pagamento (D-005)."
    ]
  }
};

export const initialFindings: FindingItem[] = [
  {
    finding_id: "finding.chave",
    title: "Chave de acesso no repositório antigo",
    category: "Segurança",
    sensitive: true,
    description: "Chave de API do gateway de pagamento exposta no histórico do Git.",
    impact: "Risco de acesso indevido ou cobrança fraudulenta.",
    action: "Rotacionar imediatamente a chave no painel do gateway e reescrever histórico do Git.",
    tasks: ["D-008"],
    status: "WAITING",
    situation: "Em tratamento"
  },
  {
    finding_id: "finding.imagens",
    title: "Imagens de produto sem padrão",
    category: "Dados",
    description: "Fotos com formatos e resoluções muito díspares causando lentidão.",
    impact: "Loja lenta no celular com queda comprovada de conversão.",
    action: "Padronizar dimensões e converter para formato WebP otimizado durante a migração.",
    tasks: ["D-003"],
    status: "DONE",
    situation: "Resolvido"
  },
  {
    finding_id: "finding.cep",
    title: "Pedidos antigos com formato de CEP inconsistente",
    category: "Integridade",
    description: "Alguns registros antigos possuem 7 dígitos ou caracteres alfanuméricos.",
    impact: "Pode quebrar rotas automáticas de consulta aos Correios/transportadoras.",
    action: "Aplicar script de sanitização com fallback de preenchimento.",
    tasks: ["D-004"],
    status: "IN_PROGRESS",
    situation: "Em andamento"
  }
];

export const initialFlows: FlowItem[] = [
  {
    id: "catalogo",
    name: "Cadastro e Atualização de Produtos",
    before: [
      "Planilha Excel editada à mão e compartilhada por e-mail.",
      "Preço e estoque frequentemente divergentes entre o balcão e o site."
    ],
    now: [
      "Cadastro único na plataforma com histórico e auditoria completa.",
      "Preço e estoque sincronizados em tempo real com validação de formato."
    ],
    source: "docs/levantamento.md",
    tasks: [
      { id: "D-001", status_label: "Concluída" },
      { id: "D-003", status_label: "Concluída" }
    ],
    status: "DONE"
  },
  {
    id: "pedidos",
    name: "Processamento de Pedidos e Expedição",
    before: [
      "Status anotado em quadro físico e atualizado manualmente no sistema.",
      "Notificação de envio ao cliente dependia de digitação individual."
    ],
    now: [
      "Esteira integrada com rastreamento automático por código de despacho.",
      "Notificações automáticas via e-mail e mensageria instantânea."
    ],
    source: "docs/plano.md",
    tasks: [
      { id: "D-004", status_label: "Em andamento" }
    ],
    status: "IN_PROGRESS"
  }
];

export const initialChanges: ChangeItem[] = [
  {
    id: "c1",
    title: "Migração faseada por módulos em vez de big-bang",
    decision: "Migrar catálogo primeiro, depois pedidos, por último o meio de pagamento.",
    why: "Reduz drasticamente o risco de indisponibilidade e permite validação isolada.",
    impact: "A loja antiga permanece no ar sem interrupção para clientes atuais.",
    source: "docs/plano.md",
    tasks: [{ id: "D-002" }, { id: "D-003" }],
    status_label: "Feito",
    tone: "DONE"
  },
  {
    id: "c2",
    title: "Adoção de arquitetura API-first e JAMstack",
    decision: "Separar frontend de alta performance do backend e banco transacional.",
    why: "Melhora o tempo de carregamento no mobile e facilita integrações futuras.",
    impact: "Performance 3x superior no teste Google PageSpeed.",
    source: "docs/levantamento.md",
    tasks: [{ id: "D-001" }],
    status_label: "Feito",
    tone: "DONE"
  }
];

export const initialDecisions: DecisionItem[] = [
  {
    id: "d1",
    title: "Política de frete grátis por faixa de CEP",
    why: "Definir valor mínimo de compra na nova loja para compensar custo logístico.",
    impact: "Afeta diretamente a margem operacional e o ticket médio esperado.",
    source: "docs/decisoes.md",
    tasks: [{ id: "D-006" }],
    status_label: "Aguardando decisão humana",
    tone: "WAITING"
  },
  {
    id: "d2",
    title: "Escolha do Gateway de Pagamento Principal",
    why: "Homologar taxas de antecipação e suporte nativo a PIX dinâmico com QR Code.",
    impact: "Impacto no fluxo de caixa e na taxa de conversão final no checkout.",
    source: "docs/plano.md",
    tasks: [{ id: "D-005" }],
    status_label: "Em andamento",
    tone: "IN_PROGRESS"
  }
];

export const initialErrors: ErrorItem[] = [
  {
    id: "e1",
    title: "Produtos duplicados no cadastro antigo",
    what: "Havia produtos repetidos com preços divergentes no arquivo de produtos.xlsx.",
    where: "planilha produtos.xlsx (legado)",
    source: "docs/levantamento.md",
    tasks: [{ id: "D-003", status_label: "Concluída" }],
    status: "DONE",
    status_label: "Corrigido",
    tone: "DONE"
  },
  {
    id: "e2",
    title: "Chave de acesso exposta no repositório antigo",
    what: "Token de API legado gravado em commit histórico no repositório de 2022.",
    where: "git log (repositório antigo)",
    sensitive: true,
    source: "docs/security-audit.md",
    tasks: [{ id: "D-008", status_label: "Aguardando" }],
    status: "WAIT",
    status_label: "Aguardando ação",
    tone: "WAITING"
  },
  {
    id: "e3",
    title: "Pedidos antigos sem CEP normalizado",
    what: "128 pedidos com CEP nulo ou com caracteres especiais impediam validação estrita.",
    where: "banco legado (tabela pedidos)",
    source: "docs/levantamento.md",
    tasks: [],
    status: "OPEN",
    status_label: "Sem tarefa vinculada",
    tone: "WARNING"
  }
];

export const initialTimeline: TimelineItem[] = [
  {
    ts: "2026-11-04T08:30:00Z",
    action: "Sessão de trabalho iniciada",
    task_id: "D-004",
    task_title: "Migrar o módulo de pedidos",
    phase_title: "Migração dos módulos",
    executor: "Agente de IA",
    result: "Iniciado",
    type: "session_start"
  },
  {
    ts: "2026-11-03T18:00:00Z",
    action: "Testes automatizados executados",
    task_id: "D-004",
    task_title: "Migrar o módulo de pedidos",
    phase_title: "Migração dos módulos",
    executor: "Automação",
    result: "Aprovado (42 testes)",
    type: "gate_pass"
  },
  {
    ts: "2026-11-03T10:00:00Z",
    action: "Bloqueio externo registrado",
    task_id: "D-005",
    task_title: "Integração com o meio de pagamento",
    phase_title: "Migração dos módulos",
    executor: "Equipe (humano)",
    result: "Aguardando credenciais",
    type: "blocked"
  },
  {
    ts: "2026-11-01T16:20:00Z",
    action: "Tarefa concluída com evidência",
    task_id: "D-003",
    task_title: "Migrar o módulo de catálogo",
    phase_title: "Migração dos módulos",
    executor: "Agente de IA",
    result: "Concluído",
    type: "task_done"
  },
  {
    ts: "2026-10-28T14:30:00Z",
    action: "Fase concluída e marco alcançado",
    task_id: "D-002",
    task_title: "Plano de migração aprovado",
    phase_title: "Levantamento e plano",
    executor: "Equipe ou agente de IA",
    result: "Entregue",
    type: "milestone"
  },
  {
    ts: "2026-10-24T17:40:00Z",
    action: "Tarefa concluída",
    task_id: "D-001",
    task_title: "Levantamento do sistema atual",
    phase_title: "Levantamento e plano",
    executor: "Agente de IA",
    result: "Concluído",
    type: "task_done"
  }
];

export const initialHours: WorkHours = {
  total_label: "27h 30m",
  registered_label: "22h 30m",
  reconstructed_label: "5h 00m",
  tasks_label: "17h 30m",
  running: true,
  method: "Apuração baseada em sessões com corte de inatividade de 180 min e intervalo de sessão de 30 min.",
  sessions: [
    { start: "2026-10-23T09:15:00Z", end: "2026-10-23T14:45:00Z", label: "5h 30m", source: "D-001" },
    { start: "2026-10-25T10:00:00Z", end: "2026-10-25T14:00:00Z", label: "4h 00m", source: "D-002" },
    { start: "2026-10-29T08:00:00Z", end: "2026-10-29T16:00:00Z", label: "8h 00m", source: "D-003" },
    { start: "2026-11-02T09:00:00Z", end: "2026-11-02T14:00:00Z", label: "5h 00m", source: "D-004 (em andamento)" }
  ]
};

export const initialQuality: QualityGate[] = [
  {
    id: "tests",
    label: "Testes automatizados",
    status: "PASS",
    status_label: "Aprovado",
    at: "2026-11-03T18:00:00Z",
    note: "Ran 42 tests, 0 failures, 100% assertions ok"
  },
  {
    id: "security",
    label: "Segurança e segredos",
    status: "PASS",
    status_label: "Aprovado",
    at: "2026-11-04T07:15:00Z",
    note: "Nenhum segredo em código no novo repositório"
  }
];

export const initialReports: ReportItem[] = [
  {
    report_id: "report.phase.discovery",
    title: "Relatório de Conclusão: Levantamento e Plano",
    version: 1,
    period: { started_at: "2026-10-23T09:00:00Z", completed_at: "2026-10-28T14:30:00Z" },
    generated_at: "2026-10-28T15:00:00Z",
    audience: "client",
    pdf_url: "#report-phase-1",
    summary: "Fase 1 concluída com 100% dos objetivos entregues. Plano de migração aprovado e arquitetura definida.",
    highlights: [
      "Mapeamento completo dos 1.420 produtos e histórico de 24 meses.",
      "Plano de contingência e reversão validado.",
      "Critérios de aceite aprovados pela equipe do cliente."
    ]
  },
  {
    report_id: "report.consolidated",
    title: "Relatório Consolidado de Engenharia (Auditoria Completa)",
    version: 1,
    period: { started_at: "2026-10-23T09:00:00Z", completed_at: "2026-11-04T08:30:00Z" },
    generated_at: "2026-11-04T08:35:00Z",
    audience: "admin",
    pdf_url: "#report-consolidated",
    summary: "Visão técnica integral de todas as fases, hash de evidências, logs de execução de agentes e métricas de qualidade.",
    highlights: [
      "3 tarefas concluídas com evidências criptográficas.",
      "1 tarefa em execução (D-004) com progresso nominal.",
      "2 gates de qualidade com status PASS."
    ]
  }
];

export const projectOverviewData: ProjectOverview = {
  project: {
    title: "Migração da Loja Online",
    office: "Empresa Exemplo",
    report_heading: "Relatório de Evolução do Projeto"
  },
  status: "IN_PROGRESS",
  status_label: "Em andamento",
  current_phase: initialPhases[1],
  last_update: "2026-11-04T08:30:00Z",
  labels: {
    nothing_waiting: "Nada aguardando o cliente ou a equipe.",
    modernizing: "O que está sendo modernizado",
    processes_title: "Processos da loja",
    capabilities_title: "Capacidades identificadas",
    capabilities_intro: "Capacidades da loja migradas em etapas. A situação de cada uma vem do andamento real das tarefas.",
    comparative_title: "Ambiente atual × nova plataforma",
    before_after_intro: "Como era antes, o que existe hoje, por que cada mudança foi feita, o impacto e os erros encontrados. A situação de cada item vem das tarefas do projeto.",
    automation_pill: "Automatizada",
    components_label: "componentes da plataforma",
    skills_label: "skills encontradas"
  },
  metrics: {
    progress: 30,
    tasks_total: 10,
    tasks_done: 3,
    tasks_in_progress: 1,
    tasks_next: 2,
    tasks_waiting: 4,
    phases_total: 3,
    phases_completed: 1,
    processes_count: 4,
    processes_automated: 1,
    processes_in_migration: 2,
    tests_count: 42,
    hours_worked: "27h 30m"
  },
  hours: initialHours,
  next: {
    task: initialTasks[3], // D-004
    why: ["Dependência D-003 concluída com sucesso", "Prioridade P1 de alta relevância"],
    in_progress: [initialTasks[3]]
  },
  waiting: initialTasks.filter((t) => t.status === "WAITING"),
  summary: {
    objective: "Levar a loja online para uma plataforma nova, mais rápida e segura, sem perder o histórico de produtos e pedidos.",
    modernizing: "Catálogo e pedidos estão sendo migrados em etapas, com conferência de dados a cada módulo.",
    current_phase: "Migração dos módulos",
    next_milestones: ["Pedidos conferidos", "Pagamento de teste aprovado", "Virada de produção"]
  },
  phases: initialPhases,
  milestones: initialMilestones,
  quality: initialQuality,
  timeline: initialTimeline,
  reports: initialReports
};
