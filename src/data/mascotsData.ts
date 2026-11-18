export interface MascotExpertise {
  title: string;
  description: string;
  icon: string;
}

export interface ProblemSolvingStyle {
  headline: string;
  description: string;
  approach: string;
  badge: string;
  keyMotto: string;
}

export interface MascotMediaKit {
  svgPath: string;
  pngRender: string;
  pngTransparent: string;
  objPath: string;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  dimension3D: {
    particleColor: number;
    haloColor: number;
    accentLight: number;
  };
  formatBadges: string[];
}

export type MascotId = "carcara" | "lobo_guara" | "tatu_bola" | "ararinha" | "sagui" | "onca_pintada";

export interface MascotAgent {
  id: MascotId;
  name: string;
  nickname: string;
  title: string;
  species: string;
  avatar: string;
  accentColor: string;
  role: string;
  tagline: string;
  description: string;
  collaborationStep: number;
  collaborationRole: string;
  collaborationAction: string;
  expertises: MascotExpertise[];
  problemSolvingStyle: ProblemSolvingStyle;
  uniqueSpecialties: string[];
  tools: string[];
  samplePrompts: string[];
  suggestedSkillId: string;
  teamQuote: string;
  mediaKit: MascotMediaKit;
}

export const MASCOT_AGENTS: MascotAgent[] = [
  {
    id: "carcara",
    name: "Carcará",
    nickname: "O Sentinela",
    title: "O Falcão Vigilante do Sertão",
    species: "Caracara plancus • Caatinga & Sertão",
    avatar: "/assets/aistudio/Caracar_-do-sul_em_pose_vigilante-5_6ce0eade.png",
    accentColor: "#EAEAEA",
    role: "Auditor de Segurança, Vulnerabilidades & Sentinela de Código",
    tagline: "Visão aguçada para encontrar riscos e vulnerabilidades antes que virem incidentes.",
    description:
      "O Carcará não é um chatbot passivo. Ele atua como seu sentinela de segurança e integridade, inspecionando repositórios, analisando dependências contra bases CVE e auditando permissões sem exfiltrar nenhum byte de dado confidencial.",
    collaborationStep: 4,
    collaborationRole: "Auditoria Final & Gate de Segurança",
    collaborationAction: "Executa varredura estática, verifica credenciais e valida a aprovação antes da entrega.",
    problemSolvingStyle: {
      headline: "Sentinela Analítico & Defensivo",
      description:
        "Examina a topologia do repositório de cima para baixo antes de qualquer intervenção. Separa fatos verificáveis de suposições, mapeia cada superfície de ataque com salvaguardas que impedem vazamentos e só emite parecer com provas auditáveis.",
      approach: "Inspecionar primeiro, exigir evidências e aplicar o princípio do menor privilégio.",
      badge: "Zero-Trust & Defesa Ativa",
      keyMotto: "Se não puder ser provado e auditado, não entra em produção.",
    },
    uniqueSpecialties: [
      "Varredura cirúrgica de segredos e credenciais com zero tolerância a falsos positivos",
      "Auditoria estática de código contra Top 10 OWASP e vulnerabilidades CVE conhecidas",
      "Diagnóstico defensivo de certificados TLS, rotas de rede e integridade de portas",
      "Salvaguarda automática de privacidade: zero exfiltração em tempo de execução",
    ],
    expertises: [
      {
        title: "Varredura Estática de Segurança",
        description: "Detecta injeções de SQL, vulnerabilidades XSS, SSRF e más configurações no código-fonte.",
        icon: "shield",
      },
      {
        title: "Detecção de Segredos Expostos",
        description: "Audita commits e arquivos de configuração contra chaves de API, senhas e tokens vazados.",
        icon: "check-circle",
      },
      {
        title: "Diagnóstico de Infraestrutura & Portas",
        description: "Inspeciona certificados TLS, rotas de rede e integridade de headers HTTP.",
        icon: "terminal",
      },
      {
        title: "Zero Exfiltração & Modo Defensivo",
        description: "Operação estritamente somente leitura com salvaguardas que impedem vazamento de dados.",
        icon: "lock",
      },
    ],
    tools: ["Git", "GitHub CLI", "CVE Database", "Trivy", "OWASP ZAP", "Terminal Seguro"],
    samplePrompts: [
      "Carcará, audite o repositório em busca de segredos vazados e dependências com CVEs conhecidas.",
      "Carcará, faça uma análise defensiva do módulo de autenticação e aponte riscos de autorização.",
      "Carcará, verifique se há portas abertas não documentadas ou endpoints sem validação de entrada.",
    ],
    suggestedSkillId: "security-diagnostics",
    teamQuote: "Nenhum bug ou brecha de segurança escapa da minha visão aérea.",
    mediaKit: {
      svgPath: "/assets/mascotes/carcara.svg",
      pngRender: "/assets/aistudio/Caracar_-do-sul_em_pose_vigilante-5_6ce0eade.png",
      pngTransparent: "/assets/aistudio/Caracar_-do-sul_em_pose_vigilante-5_6ce0eade.png",
      objPath: "/assets/mascotes/carcara.obj",
      themeColors: {
        primary: "#D97757",
        secondary: "#C05E3C",
        accent: "#E09F3E",
        glow: "rgba(217, 119, 87, 0.4)",
      },
      dimension3D: {
        particleColor: 0xd97757,
        haloColor: 0xc05e3c,
        accentLight: 0xd97757,
      },
      formatBadges: [
        "PNG Transparente HD (1024x1024)",
        "Vetor SVG Escalável",
        "Modelo 3D Conceitual (.OBJ)",
        "WebGL PBR 360°",
        "JSON Spec",
      ],
    },
  },
  {
    id: "lobo_guara",
    name: "Lobo-Guará",
    nickname: "O Estrategista",
    title: "O Guia Estrategista do Cerrado",
    species: "Chrysocyon brachyurus • Cerrado & Savanas",
    avatar: "/assets/aistudio/Lobo-guar__alerta_em_estilo_vetorial-3_464a316b.png",
    accentColor: "#EAEAEA",
    role: "Arquiteto de Sistemas, DevOps & Orquestrador de Entregas",
    tagline: "Passos firmes e visão panorâmica para guiar o projeto pelo caminho mais resiliente.",
    description:
      "Com suas passadas longas e orelhas atentas, o Lobo-Guará enxerga a topologia completa do sistema. Ele planeja arquiteturas distribuídas, orquestra pipelines de CI/CD, desenha estratégias de blue-green deployment e projeta políticas de rollback à prova de falhas.",
    collaborationStep: 1,
    collaborationRole: "Planejamento Arquitetural & DevOps",
    collaborationAction: "Mapeia a topologia do repositório, define limites de serviços e traça o plano de entrega.",
    problemSolvingStyle: {
      headline: "Estrategista Sistêmico & Resiliente",
      description:
        "Pensa no pior cenário antes do caminho feliz. Modela arquiteturas desacopladas que se recuperam sozinhas através de retries exponenciais, idempotência, dead letter queues e isolamento de falhas, guiando o sistema com passadas largas e estáveis.",
      approach: "Pensamento sistêmico, desacoplamento por domínio e observabilidade ponta a ponta.",
      badge: "Resiliência & Alta Disponibilidade",
      keyMotto: "Arquitetura sólida transforma imprevistos em transições suaves.",
    },
    uniqueSpecialties: [
      "Design de arquiteturas desacopladas e mensageria orientada a eventos",
      "Pipelines de CI/CD determinísticas com cache inteligente e zero fricção",
      "Políticas de rollback instantâneo acionadas por anomalias de latência e erro p99",
      "Infraestrutura ágil com containers Docker em modo somente leitura e proxy reverso",
    ],
    expertises: [
      {
        title: "Arquitetura Distribuída & Microsserviços",
        description: "Modela contratos de APIs, desacoplamento de domínios e comunicação assíncrona orientada a eventos.",
        icon: "layers",
      },
      {
        title: "Pipelines de CI/CD & Automação",
        description: "Estrutura GitHub Actions, caching determinístico e rotinas de build e deploy sem atrito.",
        icon: "devops",
      },
      {
        title: "Estratégias de Rollback & Resiliência",
        description: "Desenha fallbacks automáticos baseados em métricas de erro p99 e healthchecks.",
        icon: "repeat",
      },
      {
        title: "Observabilidade & Telemetria Prática",
        description: "Configuração de logs estruturados, tracing distribuído e alertas essenciais.",
        icon: "activity",
      },
    ],
    tools: ["Docker", "GitHub Actions", "Kubernetes", "OpenTelemetry", "Vite/Node.js", "Terminal"],
    samplePrompts: [
      "Lobo-Guará, desenhe uma pipeline de entrega contínua com blue-green deployment e rollback automático.",
      "Lobo-Guará, estruture a arquitetura de eventos para comunicação entre serviços com idempotência.",
      "Lobo-Guará, revise nossa configuração do Docker e otimize o cache de camadas para builds mais rápidos.",
    ],
    suggestedSkillId: "devops-delivery",
    teamQuote: "Caminho longo se faz com passos firmes e arquitetura sólida.",
    mediaKit: {
      svgPath: "/assets/mascotes/lobo_guara.svg",
      pngRender: "/assets/aistudio/Lobo-guar__alerta_em_estilo_vetorial-3_464a316b.png",
      pngTransparent: "/assets/aistudio/Lobo-guar__alerta_em_estilo_vetorial-3_464a316b.png",
      objPath: "/assets/mascotes/lobo_guara.obj",
      themeColors: {
        primary: "#00D2FF",
        secondary: "#E67E22",
        accent: "#0066FF",
        glow: "rgba(0, 210, 255, 0.4)",
      },
      dimension3D: {
        particleColor: 0x00d2ff,
        haloColor: 0xe67e22,
        accentLight: 0x00d2ff,
      },
      formatBadges: [
        "PNG Transparente HD (1024x1024)",
        "Vetor SVG Escalável",
        "Modelo 3D Conceitual (.OBJ)",
        "WebGL PBR 360°",
        "JSON Spec",
      ],
    },
  },
  {
    id: "tatu_bola",
    name: "Tatu-Bola",
    nickname: "O Blindado",
    title: "O Mestre Blindado da Caatinga",
    species: "Tolypeutes tricinctus • Caatinga & Nordeste",
    avatar: "/assets/aistudio/Tatu-bola_brasileiro_de_tr_s_faixas-2_911213eb.png",
    accentColor: "#EAEAEA",
    role: "Engenheiro de TDD, Testes Automatizados & Scaffolding",
    tagline: "Blindagem de testes para código modular que nunca quebra em produção.",
    description:
      "Quando o assunto é estabilidade, o Tatu-Bola se fecha em uma carapaça impenetrável de testes automatizados. Especialista em Test-Driven Development (TDD), ele escreve testes unitários e de integração antes do código final, garantindo 100% de confiabilidade em cada refatoração.",
    collaborationStep: 3,
    collaborationRole: "Implementação TDD & Cobertura",
    collaborationAction: "Escreve testes de regressão, implementa a lógica pura e garante 100% de passagem nos gates.",
    problemSolvingStyle: {
      headline: "Blindagem Iterativa com TDD",
      description:
        "Tolerância zero para código frágil: jamais inicia uma implementação sem conceber o teste automatizado que falha primeiro. Desenvolve em fatias verticais cirúrgicas, refatorando continuamente para manter a cobertura de 100% dos casos de borda.",
      approach: "Ciclo Red-Green-Refactor estrito, desacoplamento de funções puras e testes determinísticos.",
      badge: "TDD & Tolerância Zero a Falhas",
      keyMotto: "Código sem testes é castelo de areia; código blindado resiste a qualquer temporal.",
    },
    uniqueSpecialties: [
      "Ciclo rigoroso de Test-Driven Development com cobertura integral de branches",
      "Scaffolding determinístico de fatias funcionais verticais e componentes modulares",
      "Suítes automatizadas de regressão visual, testes unitários e ponta a ponta",
      "Empacotamento de especificações portáveis no padrão universal .skill",
    ],
    expertises: [
      {
        title: "Test-Driven Development (TDD)",
        description: "Aplica rigorosamente o ciclo Red-Green-Refactor para criar código robusto e livre de bugs.",
        icon: "check",
      },
      {
        title: "Scaffolding Modular & Fatias Verticais",
        description: "Implementa fatias funcionais completas de produto sem quebrar o código existente.",
        icon: "code",
      },
      {
        title: "Testes de Regressão & Casos de Borda",
        description: "Mapeia cenários críticos, concorrência, inputs maliciosos e dados truncados.",
        icon: "shield",
      },
      {
        title: "Empacotamento Universal .skill",
        description: "Prepara e empacota especificações de skills compatíveis com múltiplos runtimes de IA.",
        icon: "package",
      },
    ],
    tools: ["node:test", "Vitest", "Jest", "Playwright", "TypeScript", "ESLint"],
    samplePrompts: [
      "Tatu-Bola, crie uma suíte completa de testes unitários para a lógica de cálculo com cobertura total dos casos de borda.",
      "Tatu-Bola, implemente a nova fatia de autenticação usando TDD estrito com testes antes da implementação.",
      "Tatu-Bola, refatore o componente complexo garantindo que nenhum teste de regressão falhe.",
    ],
    suggestedSkillId: "vibecode-engineering",
    teamQuote: "Código sem testes é castelo de areia; código blindado resiste a qualquer temporal.",
    mediaKit: {
      svgPath: "/assets/mascotes/tatu_bola.svg",
      pngRender: "/assets/aistudio/Tatu-bola_brasileiro_de_tr_s_faixas-2_911213eb.png",
      pngTransparent: "/assets/aistudio/Tatu-bola_brasileiro_de_tr_s_faixas-2_911213eb.png",
      objPath: "/assets/mascotes/tatu_bola.obj",
      themeColors: {
        primary: "#FFD700",
        secondary: "#BC6C25",
        accent: "#DDA15E",
        glow: "rgba(255, 215, 0, 0.4)",
      },
      dimension3D: {
        particleColor: 0xffd700,
        haloColor: 0xbc6c25,
        accentLight: 0xffd700,
      },
      formatBadges: [
        "PNG Transparente HD (1024x1024)",
        "Vetor SVG Escalável",
        "Modelo 3D Conceitual (.OBJ)",
        "WebGL PBR 360°",
        "JSON Spec",
      ],
    },
  },
  {
    id: "ararinha",
    name: "Ararinha-Azul",
    nickname: "A Criativa",
    title: "A Criativa Encantadora dos Céus",
    species: "Cyanopsitta spixii • Sertão & Caatinga",
    avatar: "/assets/aistudio/Ararinha-azul_de_Spix_em_pose_serena-4_fbe33291.png",
    accentColor: "#EAEAEA",
    role: "Especialista em UI/UX, Design Systems & Copywriting",
    tagline: "Transformando lógica em experiências visuais memoráveis e interfaces encantadoras.",
    description:
      "Com sua plumagem vibrante e sensibilidade estética, a Ararinha-Azul traz elegância e calor humano para a engenharia de software. Ela transforma ideias em interfaces pixel-perfect com Tailwind CSS, audita design tokens e redige textos persuasivos que encantam os usuários.",
    collaborationStep: 2,
    collaborationRole: "Design de Interface & Experiência",
    collaborationAction: "Projeta telas responsivas com Tailwind CSS, ajusta tokens de cor e redige textos cativantes.",
    problemSolvingStyle: {
      headline: "Empatia Visual & Precisão Estética",
      description:
        "Enxerga o software através dos olhos e das mãos de quem vai utilizá-lo. Converte requisitos abstratos em telas acolhedoras com Tailwind CSS, harmoniza tipografia e espaçamentos, e redige textos persuasivos que eliminam atritos cognitivos.",
      approach: "Centralidade no usuário, fidelidade pixel-perfect e narrativa clara de produto.",
      badge: "Design System & Micro-Interações",
      keyMotto: "O código mais avançado do mundo é inútil se a experiência for fria ou confusa.",
    },
    uniqueSpecialties: [
      "Desenvolvimento de interfaces pixel-perfect com utilitários modernos do Tailwind CSS",
      "Extração exata de design tokens a partir de telas autorizadas e especificações Figma",
      "Redação publicitária persuasiva de alta conversão (frameworks PAS, AIDA, CTAs)",
      "Conformidade rigorosa com acessibilidade WCAG, contraste impecável e fluidez visual",
    ],
    expertises: [
      {
        title: "Frontend Pixel-Perfect com Tailwind CSS",
        description: "Desenvolve interfaces modernas com tipografia equilibrada, sombras suaves e micro-interações.",
        icon: "layout",
      },
      {
        title: "Extração Exata de Design Tokens",
        description: "Converte layouts do Figma e telas existentes em classes determinísticas e variáveis de tema.",
        icon: "eye",
      },
      {
        title: "Copywriting de Alta Conversão",
        description: "Redige chamadas para ação (CTAs), propostas de valor e microcópia persuasiva (AIDA, PAS).",
        icon: "edit-3",
      },
      {
        title: "Acessibilidade WCAG & Fluidez",
        description: "Garante contrastes adequados, navegação por teclado e semântica impecável em cada tela.",
        icon: "sparkles",
      },
    ],
    tools: ["Tailwind CSS", "React", "Figma API", "Lucide/SVG", "Web Standards", "Design Tokens"],
    samplePrompts: [
      "Ararinha, crie uma hero section inesquecível com Tailwind CSS e texto persuasivo para o lançamento do produto.",
      "Ararinha, extraia os tokens de cores e espaçamentos do layout e crie componentes reutilizáveis em React.",
      "Ararinha, reescreva a microcópia de onboarding para torná-la acolhedora, clara e com alta taxa de conclusão.",
    ],
    suggestedSkillId: "web-design",
    teamQuote: "Software bem feito deve ser tão agradável de usar quanto um vôo livre nas manhãs do sertão.",
    mediaKit: {
      svgPath: "/assets/mascotes/ararinha.svg",
      pngRender: "/assets/aistudio/Ararinha-azul_de_Spix_em_pose_serena-4_fbe33291.png",
      pngTransparent: "/assets/aistudio/Ararinha-azul_de_Spix_em_pose_serena-4_fbe33291.png",
      objPath: "/assets/mascotes/ararinha.obj",
      themeColors: {
        primary: "#00F2FE",
        secondary: "#0284C7",
        accent: "#F472B6",
        glow: "rgba(0, 242, 254, 0.4)",
      },
      dimension3D: {
        particleColor: 0x00f2fe,
        haloColor: 0x0284c7,
        accentLight: 0x00f2fe,
      },
      formatBadges: [
        "PNG Transparente HD (1024x1024)",
        "Vetor SVG Escalável",
        "Modelo 3D Conceitual (.OBJ)",
        "WebGL PBR 360°",
        "JSON Spec",
      ],
    },
  },
  {
    id: "sagui",
    name: "Sagui",
    nickname: "O Ágil",
    title: "O Explorador Ágil das Matas",
    species: "Callithrix jacchus • Caatinga & Mata Atlântica",
    avatar: "/assets/aistudio/Sagui-de-tufo-branco_em_pose__gil-1_921b9391.png",
    accentColor: "#EAEAEA",
    role: "Engenheiro de Automação Rápida, Scripts & Integrações de APIs",
    tagline: "Agilidade felina e saltos precisos para conectar ferramentas, scripts e APIs em segundos.",
    description:
      "Curioso, veloz e destemido, o Sagui salta de galho em galho entre ecossistemas de software. Especialista em automações pragmáticas, scripts em bash/python e integrações webhook, ele elimina tarefas manuais repetitivas com leveza e precisão.",
    collaborationStep: 5,
    collaborationRole: "Automação Ágil & Conectores de APIs",
    collaborationAction: "Desenvolve scripts rápidos, orquestra webhooks e automatiza tarefas repetitivas sem fricção.",
    problemSolvingStyle: {
      headline: "Velocidade, Automação & Pragmatismo",
      description:
        "Não tolera retrabalho manual: transforma rotinas cansativas em automações limpas e executáveis em um clique. Prefere abordagens diretas, ferramentas nativas e scripts modulares sem dependências desnecessárias.",
      approach: "Automação enxuta, pragmatismo operacional e integrações modulares sem overhead.",
      badge: "Agilidade & Automação Enxuta",
      keyMotto: "Se pode ser automatizado em um script limpo, não gaste tempo repetindo manualmente.",
    },
    uniqueSpecialties: [
      "Automação instantânea de tarefas com scripts Bash, Node.js e Python enxutos",
      "Integração contínua de Webhooks, REST APIs, GraphQL e serviços em nuvem",
      "Extração, limpeza e pipelines ágeis de transformação de dados (ETL local)",
      "Criação de CLIs e atalhos de produtividade para desenvolvimento acelerado",
    ],
    expertises: [
      {
        title: "Scripts de Automação & CLIs",
        description: "Automatiza processos manuais com scripts rápidos, seguros e auditáveis.",
        icon: "zap",
      },
      {
        title: "Conexão de APIs & Webhooks",
        description: "Integra serviços de terceiros, sincroniza dados e gerencia fluxos de mensageria.",
        icon: "repeat",
      },
      {
        title: "Tarefas em Segundo Plano & Cron",
        description: "Configura agendamentos confiáveis, workers e rotinas de manutenção preventiva.",
        icon: "clock",
      },
      {
        title: "Pipelines de Dados Leves",
        description: "Transforma arquivos JSON, CSV e bancos de dados locais sem dependências pesadas.",
        icon: "layers",
      },
    ],
    tools: ["Node.js / tsx", "Python", "Bash / Shell", "curl", "REST / Webhooks", "Cron"],
    samplePrompts: [
      "Sagui, automatize a extração e sincronização desses dados com um script limpo e idempotente.",
      "Sagui, integre essa API externa ao nosso fluxo de notificações via webhook seguro.",
      "Sagui, crie um comando de CLI personalizado para rodar as rotinas diárias com um só comando.",
    ],
    suggestedSkillId: "automation-workflow",
    teamQuote: "Saltando de galho em galho, conecto sistemas em segundos sem deixar rastro de lentidão.",
    mediaKit: {
      svgPath: "/assets/mascotes/sagui.svg",
      pngRender: "/assets/aistudio/Sagui-de-tufo-branco_em_pose__gil-1_921b9391.png",
      pngTransparent: "/assets/aistudio/Sagui-de-tufo-branco_em_pose__gil-1_921b9391.png",
      objPath: "/assets/mascotes/sagui.obj",
      themeColors: {
        primary: "#F59E0B",
        secondary: "#D97706",
        accent: "#FDE68A",
        glow: "rgba(245, 158, 11, 0.4)",
      },
      dimension3D: {
        particleColor: 0xf59e0b,
        haloColor: 0xd97706,
        accentLight: 0xf59e0b,
      },
      formatBadges: [
        "PNG Transparente HD (1254x1254)",
        "Vetor SVG Escalável",
        "Modelo 3D Conceitual (.OBJ)",
        "WebGL PBR 360°",
        "JSON Spec",
      ],
    },
  },
  {
    id: "onca_pintada",
    name: "Onça-Pintada",
    nickname: "A Soberana",
    title: "A Guardiã Soberana do Pantanal",
    species: "Panthera onca • Pantanal & Florestas Brasileiras",
    avatar: "/assets/aistudio/On_a-pintada_dourada_em_pose_confiante_c60bbd3b.png",
    accentColor: "#EAEAEA",
    role: "Especialista em Alta Performance, Banco de Dados & Otimização Extrema",
    tagline: "Força bruta controlada e precisão milimétrica para triturar gargalos de performance.",
    description:
      "Majestosa, imponente e dona de uma força inigualável, a Onça-Pintada domina o território da alta performance. Ela caça gargalos de CPU, otimiza consultas em bancos de dados relacionais e noSQL, e audita índices para garantir que o sistema processe volumes maciços na velocidade da luz.",
    collaborationStep: 6,
    collaborationRole: "Benchmarking & Otimização Crítica",
    collaborationAction: "Executa testes de carga, otimiza queries de banco de dados e tritura vazamentos de memória.",
    problemSolvingStyle: {
      headline: "Poder de Processamento & Precisão Milimétrica",
      description:
        "Analisa o perfil de execução (profiling) em profundidade. Não aceita latência desnecessária: reorganiza consultas de SQL, implementa cache multinível em memória e ajusta a concorrência para obter a máxima taxa de transferência.",
      approach: "Perfis de execução reais, benchmarking antes e depois, e zero tolerância a desperdício computacional.",
      badge: "Alta Performance & Escalabilidade",
      keyMotto: "Performance não é sorte: é força concentrada no ponto exato de impacto.",
    },
    uniqueSpecialties: [
      "Profiling aprofundado de memória e CPU com identificação cirúrgica de gargalos",
      "Otimização extrema de queries SQL/NoSQL, planos de execução (EXPLAIN) e índices compostos",
      "Arquitetura de cache resiliente multinível com Redis e estratégias de invalidação",
      "Testes de estresse e benchmarking comparativo sob alta concorrência",
    ],
    expertises: [
      {
        title: "Benchmarking & Profiling de CPU",
        description: "Mapeia gargalos em loops quentes e otimiza rotinas com benchmark antes e depois.",
        icon: "chart",
      },
      {
        title: "Otimização de Bancos de Dados & SQL",
        description: "Refatora queries lentas, desenha índices de cobertura e calibra pools de conexão.",
        icon: "server",
      },
      {
        title: "Prevenção de Memory Leaks",
        description: "Audita heap snapshots, streams e ciclo de vida de objetos para evitar vazamentos.",
        icon: "shield-check",
      },
      {
        title: "Estratégias de Cache Multinível",
        description: "Desenha políticas de cache near-cache, stale-while-revalidate e invalidação atômica.",
        icon: "zap",
      },
    ],
    tools: ["Node.js Profiler", "PostgreSQL", "Redis", "Flamegraphs", "k6", "Chrome DevTools"],
    samplePrompts: [
      "Onça-Pintada, analise o plano de execução dessa consulta e otimize os índices para latência < 10ms.",
      "Onça-Pintada, faça um profiling do processamento em lote e reduza o consumo de memória pela metade.",
      "Onça-Pintada, projete a estratégia de cache em memória para suportar 50.000 requisições simultâneas.",
    ],
    suggestedSkillId: "performance-benchmark",
    teamQuote: "Gargalos de código não sobrevivem à minha mira: performance absoluta é o único padrão aceitável.",
    mediaKit: {
      svgPath: "/assets/mascotes/onca.svg",
      pngRender: "/assets/aistudio/On_a-pintada_dourada_em_pose_confiante_c60bbd3b.png",
      pngTransparent: "/assets/aistudio/On_a-pintada_dourada_em_pose_confiante_c60bbd3b.png",
      objPath: "/assets/mascotes/onca.obj",
      themeColors: {
        primary: "#FFB800",
        secondary: "#D97706",
        accent: "#F59E0B",
        glow: "rgba(255, 184, 0, 0.45)",
      },
      dimension3D: {
        particleColor: 0xffb800,
        haloColor: 0xd97706,
        accentLight: 0xffb800,
      },
      formatBadges: [
        "PNG Transparente HD (1254x1254)",
        "Vetor SVG Escalável",
        "Modelo 3D Conceitual (.OBJ)",
        "WebGL PBR 360°",
        "JSON Spec",
      ],
    },
  },
];
