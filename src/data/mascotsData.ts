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

export interface MascotAgent {
  id: "carcara" | "lobo_guara" | "tatu_bola" | "ararinha";
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
}

export const MASCOT_AGENTS: MascotAgent[] = [
  {
    id: "carcara",
    name: "Carcará",
    nickname: "O Sentinela",
    title: "O Falcão Vigilante do Sertão",
    species: "Caracara plancus • Caatinga & Sertão",
    avatar: "/assets/mascotes/carcara.jpg",
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
  },
  {
    id: "lobo_guara",
    name: "Lobo-Guará",
    nickname: "O Estrategista",
    title: "O Guia Estrategista do Cerrado",
    species: "Chrysocyon brachyurus • Cerrado & Savanas",
    avatar: "/assets/mascotes/lobo_guara.jpg",
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
  },
  {
    id: "tatu_bola",
    name: "Tatu-Bola",
    nickname: "O Blindado",
    title: "O Mestre Blindado da Caatinga",
    species: "Tolypeutes tricinctus • Caatinga & Nordeste",
    avatar: "/assets/mascotes/tatu_bola.jpg",
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
  },
  {
    id: "ararinha",
    name: "Ararinha-Azul",
    nickname: "A Criativa",
    title: "A Criativa Encantadora dos Céus",
    species: "Cyanopsitta spixii • Sertão & Caatinga",
    avatar: "/assets/mascotes/ararinha.jpg",
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
  },
];
