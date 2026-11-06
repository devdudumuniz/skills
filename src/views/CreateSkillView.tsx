import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { AgentSkill } from "../types";
import { BookCover } from "../components/BookCover";
import { Icon } from "../components/Icons";
import { DedaLogo } from "../components/DedaLogo";

interface CreateSkillViewProps {
  onSuccess: (skillId: string) => void;
  onCancel: () => void;
  initialData?: {
    name?: string;
    id?: string;
    category?: AgentSkill["category"] | string;
    description?: string;
    promptSuggestions?: string[];
    initialSteps?: string[];
    whyNeeded?: string;
  } | null;
}

const CORDEL_OPTIONS = [
  {
    id: "web_design",
    name: "Web Design & UI",
    image: "/assets/cordel/web_design.jpg",
    description: "Telas de interface, mandacaru, sol com espirais e jumento com estrela.",
  },
  {
    id: "devops",
    name: "DevOps & CI/CD",
    image: "/assets/cordel/devops.jpg",
    description: "Trilhos de entrega contínua, engrenagens a vapor e o pássaro carcará.",
  },
  {
    id: "security",
    name: "Defesa & Segurança",
    image: "/assets/cordel/security.jpg",
    description: "Carcará vigilante, escudo com estrela e portão de fortaleza do sertão.",
  },
  {
    id: "discord",
    name: "Comunidade & Praça",
    image: "/assets/cordel/discord.jpg",
    description: "Praça do forró, bandeirinhas de cordel, sanfoneiro e casario sertanejo.",
  },
  {
    id: "vibecode",
    name: "Vibecoding & Artesão",
    image: "/assets/cordel/vibecode.jpg",
    description: "Artesão com chapéu de couro esculpindo blocos de software em madeira.",
  },
  {
    id: "creative",
    name: "Criação & Audiovisual",
    image: "/assets/cordel/creative.jpg",
    description: "Cordelista projetando película, ondas sonoras de sanfona e casa de taipa.",
  },
  {
    id: "automation",
    name: "Automação & Roda d'Água",
    image: "/assets/cordel/automation.jpg",
    description: "Roda d'água mecânica, engrenagens de irrigação e cajueiros floridos.",
  },
  {
    id: "governance",
    name: "Governança & Escritura",
    image: "/assets/cordel/governance.jpg",
    description: "Ancião com pena no Livro da Verdade, balança da justiça e Cruzeiro do Sul.",
  },
  {
    id: "copywriting",
    name: "Redação & Cordel",
    image: "/assets/cordel/copywriting.jpg",
    description: "Folhetos pendurados no varal de cordel e orador recitando em praça pública.",
  },
];

const CATEGORIES = [
  { id: "programacao", label: "Programação & Engenharia" },
  { id: "frontend", label: "Frontend & UI Design" },
  { id: "devops", label: "DevOps & Entrega" },
  { id: "security", label: "Segurança & Auditoria" },
  { id: "automacao", label: "Automação & Workflows" },
  { id: "governance", label: "Governança & Projeto" },
  { id: "conteudo", label: "Conteúdo & Copywriting" },
  { id: "midia", label: "Áudio, Vídeo & Mídia" },
  { id: "aplicativos", label: "Comunidade & Apps" },
];

export function CreateSkillView({ onSuccess, onCancel, initialData }: CreateSkillViewProps) {
  const { addSkill } = useProject();

  const [name, setName] = useState(initialData?.name || "");
  const [id, setId] = useState(initialData?.id || "");
  const [idTouched, setIdTouched] = useState(Boolean(initialData?.id));
  const [category, setCategory] = useState<AgentSkill["category"]>(
    (initialData?.category as AgentSkill["category"]) || "programacao"
  );
  const [executionMode, setExecutionMode] = useState<AgentSkill["execution_mode"]>("plan-first");
  const [author, setAuthor] = useState("Deda Skills");
  const [version, setVersion] = useState("1.0.0");
  const [tagsInput, setTagsInput] = useState("agente, automacao, produtividade");
  const [description, setDescription] = useState(initialData?.description || "");
  const [whenToUse, setWhenToUse] = useState(initialData?.whyNeeded || "");
  const [whenNotToUse, setWhenNotToUse] = useState("");
  const [preconditions, setPreconditions] = useState(
    "Exige identificação clara do ambiente de execução e autorização expressa."
  );

  // Cordel Art selection
  const [selectedCordel, setSelectedCordel] = useState<string>("web_design");
  const [coverSubtitle, setCoverSubtitle] = useState("Deda Skills • Xilogravura");
  const [coverIcon, setCoverIcon] = useState<string>("code");

  // Prompt suggestions
  const [prompt1, setPrompt1] = useState(initialData?.promptSuggestions?.[0] || "");
  const [prompt2, setPrompt2] = useState(initialData?.promptSuggestions?.[1] || "");
  const [prompt3, setPrompt3] = useState(initialData?.promptSuggestions?.[2] || "");

  // Procedure Steps
  const [steps, setSteps] = useState<string[]>(
    initialData?.initialSteps && initialData.initialSteps.length > 0
      ? initialData.initialSteps
      : [
          "1. Inspecionar o contexto e identificar requisitos e restrições.",
          "2. Elaborar plano determinístico de execução com gates de validação.",
          "3. Executar exclusivamente passos autorizados e emitir relatório verificável.",
        ]
  );
  const [newStep, setNewStep] = useState("");
  const [sampleTestPrompt, setSampleTestPrompt] = useState("");

  // Preview tab state
  const [activePreviewTab, setActivePreviewTab] = useState<"book" | "card" | "markdown">("book");
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const activeCordel = CORDEL_OPTIONS.find((c) => c.id === selectedCordel) || CORDEL_OPTIONS[0];

  const getCoverTheme = () => {
    return {
      bg: "linear-gradient(155deg, #2a2a2a 0%, #1e1e1e 60%, #151515 100%)",
      accent: "#EAEAEA",
      icon: coverIcon,
      subtitle: coverSubtitle.trim() || `${name || "Habilidade"} • Xilogravura`,
      imageUrl: activeCordel.image,
      cordelArt: {
        themeName: activeCordel.name,
        elements: [activeCordel.description],
        caption: `Xilogravura tradicional nordestina forjada para ${name || "a habilidade"}.`,
      },
    };
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!idTouched) {
      const slug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setId(slug);
    }
  };

  const addProcedureStep = () => {
    if (newStep.trim()) {
      setSteps([...steps, `${steps.length + 1}. ${newStep.trim()}`]);
      setNewStep("");
    }
  };

  const removeProcedureStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const generatedMarkdown = `---
name: ${id || "nova-habilidade"}
description: "${description || "Descrição resumida da competência do agente."}"
version: ${version}
author: ${author}
execution_mode: ${executionMode}
---

# ${name || "Nova Habilidade"}

## Objetivo
${description || "Defina o que esta habilidade soluciona com autonomia e precisão."}

## Quando usar
${whenToUse || "Descreva os gatilhos e intenções do usuário que ativam esta habilidade."}

## Quando NÃO usar
${whenNotToUse || "Descreva contraindicações, recusas automáticas e operações de alto risco."}

## Pré-condições
${preconditions}

## Procedimento
${steps.join("\n")}
`;

  const copyMarkdownToClipboard = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2200);
  };

  const handleFillTemplate = () => {
    setName("Analisador de Arquitetura e Riscos");
    setId("architecture-risk-analyzer");
    setIdTouched(true);
    setCategory("security");
    setExecutionMode("read-only");
    setDescription(
      "Inspeciona a topologia de um repositório, dependências críticas e superfície de ataque, emitindo um diagnóstico de risco priorizado sem mutações em arquivos."
    );
    setWhenToUse(
      "Use antes de refatorações estruturais ou auditorias pré-deploy para mapear pontos únicos de falha e acoplamentos indevidos."
    );
    setWhenNotToUse(
      "Não use para alterar código automaticamente ou aplicar correções sem revisão prévia do time de engenharia."
    );
    setPrompt1("Audite o grafo de dependências do projeto e aponte bibliotecas obsoletas ou vulneráveis.");
    setPrompt2("Mapeie a superfície de ataque dos endpoints da API e verifique autenticação em todas as rotas.");
    setPrompt3("Gere um relatório executivo de conformidade arquitetural com pontuação de resiliência.");
    setSelectedCordel("security");
    setCoverSubtitle("Defesa & Arquitetura • Xilogravura");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim() || !description.trim()) {
      alert("Por favor preencha Nome, Identificador (Slug) e Descrição.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);

    const prompts = [prompt1, prompt2, prompt3]
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const theme = getCoverTheme();

    const newSkill: AgentSkill = {
      id: id.trim(),
      name: name.trim(),
      category,
      description: description.trim(),
      path: `skills/${id.trim()}`,
      entrypoint: "SKILL.md",
      package: `packages/${id.trim()}.skill`,
      execution_mode: executionMode,
      tags: tags.length ? tags : ["agente", "custom", "deda-skills"],
      markdown: generatedMarkdown,
      isOfficial: false,
      author: author.trim() || "Deda Skills",
      version: version.trim() || "1.0.0",
      supportedRuntimes: ["claude", "codex", "manus", "antigravity", "cursor", "local"],
      whenToUse: whenToUse.trim(),
      whenNotToUse: whenNotToUse.trim(),
      preconditions: preconditions.trim(),
      procedure: steps,
      updatedAt: "Hoje",
      usageCount: "1",
      installed: true,
      coverTheme: theme,
      imageUrl: theme.imageUrl,
      cordelArt: theme.cordelArt,
      promptSuggestions:
        prompts.length > 0
          ? prompts
          : [
              `Planeje a execução de ${name} para o meu projeto.`,
              `Gere um modelo inicial de configuração para ${name}.`,
              `Audite os dados e emita um relatório estruturado.`,
            ],
      sampleTestPrompt:
        sampleTestPrompt.trim() || `Executar e testar a habilidade ${name} com segurança.`,
      createdAt: new Date().toISOString().split("T")[0],
      files: [
        {
          name: id.trim(),
          path: `skills/${id.trim()}`,
          isDir: true,
          children: [
            {
              name: "SKILL.md",
              path: `skills/${id.trim()}/SKILL.md`,
              type: "markdown",
              content: generatedMarkdown,
            },
          ],
        },
      ],
    };

    addSkill(newSkill);
    onSuccess(newSkill.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 text-[#EAEAEA]">
      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#2e2e2e]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-center shrink-0">
            <DedaLogo size={24} color="#EAEAEA" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#9B9B9B]">
                Deda Skills • Estúdio de Autoria
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#292929] text-[#C2C2C2] border border-[#3d3d3d]">
                Padrão Universal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#EAEAEA] mt-0.5">
              Criar Nova Habilidade para Agentes
            </h1>
            <p className="text-xs sm:text-sm text-[#9B9B9B] mt-0.5">
              Defina competências auditáveis com capa 3D, arte de xilogravura nordestina e especificação SKILL.md.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleFillTemplate}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#C2C2C2] hover:text-[#EAEAEA] bg-[#202020] hover:bg-[#292929] border border-[#383838] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Preencher com exemplo de habilidade de auditoria"
          >
            <Icon n="sparkles" size={14} />
            <span>Exemplo Rápido</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#C2C2C2] hover:text-[#EAEAEA] bg-[#202020] hover:bg-[#292929] border border-[#383838] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icon n="arrow-left" size={14} />
            <span>Voltar ao Catálogo</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Cards (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Card 1: Identificação Básica */}
            <section className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#2e2e2e]">
                <div className="w-6 h-6 rounded-md bg-[#292929] border border-[#3d3d3d] flex items-center justify-center text-[#EAEAEA]">
                  <Icon n="layers" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#EAEAEA] uppercase tracking-wide">
                  1. Identificação Básica
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Nome da Habilidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manus para Notion"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Identificador (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: notion-workflows"
                    value={id}
                    onChange={(e) => {
                      setIdTouched(true);
                      setId(e.target.value);
                    }}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AgentSkill["category"])}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] transition-colors cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#1c1c1c] text-[#EAEAEA]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Modo de Execução
                  </label>
                  <select
                    value={executionMode}
                    onChange={(e) => setExecutionMode(e.target.value as AgentSkill["execution_mode"])}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] transition-colors cursor-pointer"
                  >
                    <option value="plan-first" className="bg-[#1c1c1c] text-[#EAEAEA]">
                      plan-first (Elaborar plano antes de mutações)
                    </option>
                    <option value="iterative-tdd" className="bg-[#1c1c1c] text-[#EAEAEA]">
                      iterative-tdd (Ciclos de testes e scaffolding)
                    </option>
                    <option value="read-only" className="bg-[#1c1c1c] text-[#EAEAEA]">
                      read-only (Auditoria e diagnóstico seguro)
                    </option>
                    <option value="agent-loop" className="bg-[#1c1c1c] text-[#EAEAEA]">
                      agent-loop (Loop autônomo com feedback)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Versão
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="notion, produtividade, agente"
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Card 2: Arte de Xilogravura Nordestina */}
            <section className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#292929] border border-[#3d3d3d] flex items-center justify-center text-[#EAEAEA]">
                    <Icon n="image" size={13} />
                  </div>
                  <h2 className="text-sm font-semibold text-[#EAEAEA] uppercase tracking-wide">
                    2. Arte de Capa • Xilogravura de Cordel
                  </h2>
                </div>
                <span className="text-[11px] text-[#9B9B9B] hidden sm:inline">
                  Estilo clássico em preto e branco
                </span>
              </div>

              <p className="text-xs text-[#9B9B9B] mb-3.5">
                Selecione a matriz de xilogravura nordestina que melhor representa a alma e o domínio desta habilidade:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {CORDEL_OPTIONS.map((opt) => {
                  const isSelected = selectedCordel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedCordel(opt.id);
                        if (!coverSubtitle || coverSubtitle === "Deda Skills • Xilogravura") {
                          setCoverSubtitle(`${opt.name} • Xilogravura`);
                        }
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-[#292929] border-[#EAEAEA] shadow-sm"
                          : "bg-[#151515] border-[#333333] hover:border-[#545454] hover:bg-[#1f1f1f]"
                      }`}
                    >
                      <img
                        src={opt.image}
                        alt={opt.name}
                        className="w-10 h-10 rounded-md object-cover border border-[#3d3d3d] shrink-0 filter contrast-110"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-[#EAEAEA] truncate">
                          {opt.name}
                        </div>
                        <div className="text-[10.5px] text-[#9B9B9B] truncate">
                          {isSelected ? "Selecionada" : "Usar gravura"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-[#2e2e2e]">
                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Subtítulo da Capa
                  </label>
                  <input
                    type="text"
                    value={coverSubtitle}
                    onChange={(e) => setCoverSubtitle(e.target.value)}
                    placeholder="Ex: Engenharia & Entrega • Xilogravura"
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Ícone Complementar
                  </label>
                  <select
                    value={coverIcon}
                    onChange={(e) => setCoverIcon(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] transition-colors cursor-pointer"
                  >
                    <option value="code">Código / Engenharia</option>
                    <option value="shield">Segurança / Defesa</option>
                    <option value="devops">DevOps / CI-CD</option>
                    <option value="terminal">Terminal / Scripts</option>
                    <option value="layers">Camadas / Arquitetura</option>
                    <option value="sparkles">Inteligência / IA</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Card 3: Escopo & Regras de Ativação */}
            <section className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#2e2e2e]">
                <div className="w-6 h-6 rounded-md bg-[#292929] border border-[#3d3d3d] flex items-center justify-center text-[#EAEAEA]">
                  <Icon n="file-text" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#EAEAEA] uppercase tracking-wide">
                  3. Escopo & Regras de Ativação
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Descrição da Competência *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Descreva de forma concisa o que o agente é capaz de resolver com esta habilidade..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Quando Usar (Trigger conditions)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Indique as solicitações do usuário ou contextos específicos que devem disparar esta habilidade..."
                    value={whenToUse}
                    onChange={(e) => setWhenToUse(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Quando NÃO Usar (Recusas & Limites)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contraindicações expressas, limites de autoridade e recusas automáticas para segurança..."
                    value={whenNotToUse}
                    onChange={(e) => setWhenNotToUse(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1.5">
                    Pré-condições & Permissões
                  </label>
                  <input
                    type="text"
                    value={preconditions}
                    onChange={(e) => setPreconditions(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Card 4: Procedimento Passo a Passo */}
            <section className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2e2e2e]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#292929] border border-[#3d3d3d] flex items-center justify-center text-[#EAEAEA]">
                    <Icon n="check-circle" size={13} />
                  </div>
                  <h2 className="text-sm font-semibold text-[#EAEAEA] uppercase tracking-wide">
                    4. Procedimento de Execução ({steps.length} etapas)
                  </h2>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#151515] border border-[#333333]"
                  >
                    <span className="text-xs text-[#EAEAEA]">{st}</span>
                    <button
                      type="button"
                      onClick={() => removeProcedureStep(idx)}
                      className="text-[#767676] hover:text-[#EAEAEA] p-1 transition-colors cursor-pointer"
                      title="Remover etapa"
                    >
                      <Icon n="x" size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Adicionar nova etapa do procedimento..."
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addProcedureStep();
                    }
                  }}
                  className="flex-1 bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors"
                />
                <button
                  type="button"
                  onClick={addProcedureStep}
                  className="px-4 py-2 rounded-lg bg-[#292929] hover:bg-[#333333] text-[#EAEAEA] border border-[#3d3d3d] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Adicionar
                </button>
              </div>
            </section>

            {/* Card 5: Prompts Sugeridos */}
            <section className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#2e2e2e]">
                <div className="w-6 h-6 rounded-md bg-[#292929] border border-[#3d3d3d] flex items-center justify-center text-[#EAEAEA]">
                  <Icon n="terminal" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#EAEAEA] uppercase tracking-wide">
                  5. Sugestões de Prompt para Testes
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#9B9B9B] mb-1">Prompt 1 (Comando principal)</label>
                  <input
                    type="text"
                    placeholder={`Planeje a execução de ${name || "esta habilidade"} para o meu repositório.`}
                    value={prompt1}
                    onChange={(e) => setPrompt1(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#9B9B9B] mb-1">Prompt 2 (Configuração / Modelo)</label>
                  <input
                    type="text"
                    placeholder={`Gere um modelo estruturado e verifique os artefatos para ${name || "a skill"}.`}
                    value={prompt2}
                    onChange={(e) => setPrompt2(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#9B9B9B] mb-1">Prompt 3 (Auditoria & Validação)</label>
                  <input
                    type="text"
                    placeholder="Audite a conformidade dos dados e emita um relatório estruturado."
                    value={prompt3}
                    onChange={(e) => setPrompt3(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors"
                  />
                </div>

                <div className="pt-2 border-t border-[#2e2e2e]">
                  <label className="block text-xs font-semibold text-[#C2C2C2] uppercase tracking-wider mb-1">
                    Prompt Padrão para o Playground
                  </label>
                  <input
                    type="text"
                    placeholder={`Executar e testar a habilidade ${name || "esta skill"} com segurança.`}
                    value={sampleTestPrompt}
                    onChange={(e) => setSampleTestPrompt(e.target.value)}
                    className="w-full bg-[#151515] border border-[#333333] focus:border-[#EAEAEA] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#EAEAEA] placeholder-[#767676] transition-colors"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Live Preview & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-6">
            {/* Preview Container */}
            <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl overflow-hidden shadow-lg">
              {/* Tab Selector */}
              <div className="flex border-b border-[#2e2e2e] bg-[#171717]">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("book")}
                  className={`flex-1 py-3 px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePreviewTab === "book"
                      ? "text-[#EAEAEA] border-b-2 border-[#EAEAEA] bg-[#1c1c1c]"
                      : "text-[#9B9B9B] hover:text-[#C2C2C2]"
                  }`}
                >
                  <Icon n="image" size={13} />
                  <span>Livro 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("card")}
                  className={`flex-1 py-3 px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePreviewTab === "card"
                      ? "text-[#EAEAEA] border-b-2 border-[#EAEAEA] bg-[#1c1c1c]"
                      : "text-[#9B9B9B] hover:text-[#C2C2C2]"
                  }`}
                >
                  <Icon n="layers" size={13} />
                  <span>Card no Catálogo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("markdown")}
                  className={`flex-1 py-3 px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePreviewTab === "markdown"
                      ? "text-[#EAEAEA] border-b-2 border-[#EAEAEA] bg-[#1c1c1c]"
                      : "text-[#9B9B9B] hover:text-[#C2C2C2]"
                  }`}
                >
                  <Icon n="file-text" size={13} />
                  <span>SKILL.md</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5">
                {activePreviewTab === "book" && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="mb-4">
                      <BookCover
                        title={name || "Nova Habilidade"}
                        theme={getCoverTheme()}
                        variant="tilted-3d"
                      />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs uppercase tracking-wider font-semibold text-[#C2C2C2]">
                        {activeCordel.name}
                      </div>
                      <div className="text-[11px] text-[#9B9B9B] mt-0.5 max-w-xs">
                        {activeCordel.description}
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === "card" && (
                  <div className="p-3 bg-[#151515] border border-[#2e2e2e] rounded-xl flex items-center gap-3">
                    <img
                      src={activeCordel.image}
                      alt={name || "Nova Habilidade"}
                      className="w-14 h-14 rounded-lg object-cover border border-[#383838] shrink-0 filter contrast-110"
                    />
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#EAEAEA] truncate">
                          {name || "Nova Habilidade"}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#292929] text-[#C2C2C2] border border-[#3d3d3d] shrink-0">
                          {executionMode}
                        </span>
                      </div>
                      <p className="text-xs text-[#9B9B9B] line-clamp-2 mt-0.5">
                        {description || "Descrição resumida da competência..."}
                      </p>
                      <div className="text-[11px] text-[#767676] mt-1 flex items-center gap-2">
                        <span>Por {author}</span>
                        <span>•</span>
                        <span>v{version}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === "markdown" && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={copyMarkdownToClipboard}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-[#292929] hover:bg-[#333333] text-[11px] text-[#EAEAEA] border border-[#3d3d3d] transition-colors cursor-pointer flex items-center gap-1 z-10"
                    >
                      <Icon n={copiedMarkdown ? "check" : "clipboard"} size={12} />
                      <span>{copiedMarkdown ? "Copiado!" : "Copiar"}</span>
                    </button>
                    <pre className="text-xs bg-[#151515] border border-[#2e2e2e] rounded-lg p-3 text-[#C2C2C2] overflow-x-auto max-h-72 font-mono whitespace-pre-wrap">
                      {generatedMarkdown}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Action Box */}
            <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl p-5 shadow-sm space-y-3">
              <button
                type="submit"
                className="w-full bg-[#EAEAEA] hover:bg-[#ffffff] text-[#151515] font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Icon n="plus" size={16} />
                <span>Publicar Habilidade no Deda Skills</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full bg-[#242424] hover:bg-[#2a2a2a] text-[#C2C2C2] hover:text-[#EAEAEA] border border-[#383838] py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Cancelar e Voltar
              </button>

              <div className="pt-2 text-center text-[11px] text-[#767676]">
                Salva localmente com persistência em cache e exportável como pacote universal <code className="text-[#9B9B9B]">.skill</code>.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
