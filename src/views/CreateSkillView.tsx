import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { AgentSkill } from "../types";
import { BookCover } from "../components/BookCover";
import { Icon } from "../components/Icons";
import { DedaLogo } from "../components/DedaLogo";

import { AISkillInterviewCreator } from "../components/AISkillInterviewCreator";
import { estimateTokens, formatTokens } from "../utils/tokenUtils";

interface CreateSkillViewProps {
  onSuccess: (skillOrId: AgentSkill | string) => void;
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
  const [creationMode, setCreationMode] = useState<"ai-interview" | "manual">("ai-interview");

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
      bg: "linear-gradient(155deg, #322A24 0%, #24201D 60%, #191613 100%)",
      accent: "#D97757",
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
    onSuccess(newSkill);
  };

  if (creationMode === "ai-interview") {
    return (
      <div className="w-full">
        <AISkillInterviewCreator
          onSkillCreated={(skill) => {
            addSkill(skill);
            onSuccess(skill);
          }}
          onCancel={onCancel}
          initialPrompt={initialData?.whyNeeded || initialData?.description || ""}
          onSwitchToManual={() => setCreationMode("manual")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 pb-20 text-[#F5F2EB] min-w-0">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#383129]">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#24201D] border border-[#383129]">
          <button
            type="button"
            onClick={() => setCreationMode("ai-interview")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A39889] hover:text-[#F5F2EB] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icon n="sparkles" size={12} />
            <span>Entrevista com IA</span>
          </button>
          <button
            type="button"
            onClick={() => setCreationMode("manual")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#D97757] text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Icon n="file-text" size={12} />
            <span>Formulário Manual</span>
          </button>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-[#383129]">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#27221E] border border-[#483E34] flex items-center justify-center shrink-0">
            <DedaLogo size={24} color="#D97757" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#A39889]">
                Deda Skills • Estúdio de Autoria
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#32231C] text-[#E28768] border border-[#D97757]/40">
                Padrão Universal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F2EB] mt-0.5">
              Criar Nova Habilidade para Agentes
            </h1>
            <p className="text-xs sm:text-sm text-[#D4CDC3] mt-0.5">
              Defina competências auditáveis com capa 3D, arte de xilogravura nordestina e especificação SKILL.md.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Live Context Footprint Counter */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24201D] border border-[#383129] text-xs"
            title={`Consumo estimado de contexto: ${estimateTokens(generatedMarkdown)} tokens`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D97757] animate-pulse"></span>
            <span className="text-[11px] text-[#A39889]">Contexto:</span>
            <span className="font-mono text-xs font-bold text-[#F5F2EB]">
              {formatTokens(estimateTokens(generatedMarkdown))}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFillTemplate}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#D4CDC3] hover:text-[#F5F2EB] bg-[#24201D] hover:bg-[#2F2721] border border-[#383129] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Preencher com exemplo de habilidade de auditoria"
          >
            <Icon n="sparkles" size={14} />
            <span>Exemplo Rápido</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-[#D4CDC3] hover:text-[#F5F2EB] bg-[#24201D] hover:bg-[#2F2721] border border-[#383129] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icon n="arrow-left" size={14} />
            <span>Voltar ao Catálogo</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
          {/* Left Column: Form Cards (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">
            {/* Card 1: Identificação Básica */}
            <section className="bg-[#24201D] border border-[#383129] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#383129]">
                <div className="w-6 h-6 rounded-md bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757]">
                  <Icon n="layers" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#F5F2EB] uppercase tracking-wide">
                  1. Identificação Básica
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Nome da Habilidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manus para Notion"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AgentSkill["category"])}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] transition-colors cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#24201D] text-[#F5F2EB]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Modo de Execução
                  </label>
                  <select
                    value={executionMode}
                    onChange={(e) => setExecutionMode(e.target.value as AgentSkill["execution_mode"])}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] transition-colors cursor-pointer"
                  >
                    <option value="plan-first" className="bg-[#24201D] text-[#F5F2EB]">
                      plan-first (Elaborar plano antes de mutações)
                    </option>
                    <option value="iterative-tdd" className="bg-[#24201D] text-[#F5F2EB]">
                      iterative-tdd (Ciclos de testes e scaffolding)
                    </option>
                    <option value="read-only" className="bg-[#24201D] text-[#F5F2EB]">
                      read-only (Auditoria e diagnóstico seguro)
                    </option>
                    <option value="agent-loop" className="bg-[#24201D] text-[#F5F2EB]">
                      agent-loop (Loop autônomo com feedback)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] transition-colors"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Versão
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] transition-colors font-mono"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="notion, produtividade, agente"
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Card 2: Arte de Xilogravura Nordestina */}
            <section className="bg-[#24201D] border border-[#383129] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#383129]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757]">
                    <Icon n="image" size={13} />
                  </div>
                  <h2 className="text-sm font-semibold text-[#F5F2EB] uppercase tracking-wide">
                    2. Arte de Capa • Xilogravura de Cordel
                  </h2>
                </div>
                <span className="text-[11px] text-[#A39889] hidden sm:inline">
                  Estilo clássico em preto e branco
                </span>
              </div>

              <p className="text-xs text-[#D4CDC3] mb-3.5">
                Selecione a matriz de xilogravura nordestina que melhor representa a alma e o domínio desta habilidade:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
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
                          ? "bg-[#32231C] border-[#D97757] shadow-sm"
                          : "bg-[#191613] border-[#383129] hover:border-[#483E34] hover:bg-[#27221E]"
                      }`}
                    >
                      <img
                        src={opt.image}
                        alt={opt.name}
                        className="w-10 h-10 rounded-md object-cover border border-[#483E34] shrink-0 filter contrast-110"
                      />
                      <div className="overflow-hidden min-w-0">
                        <div className="text-xs font-semibold text-[#F5F2EB] truncate">
                          {opt.name}
                        </div>
                        <div className={`text-[10.5px] truncate ${isSelected ? "text-[#E28768]" : "text-[#A39889]"}`}>
                          {isSelected ? "Selecionada" : "Usar gravura"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-[#383129]">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Subtítulo da Capa
                  </label>
                  <input
                    type="text"
                    value={coverSubtitle}
                    onChange={(e) => setCoverSubtitle(e.target.value)}
                    placeholder="Ex: Engenharia & Entrega • Xilogravura"
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Ícone Complementar
                  </label>
                  <select
                    value={coverIcon}
                    onChange={(e) => setCoverIcon(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] transition-colors cursor-pointer"
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
            <section className="bg-[#24201D] border border-[#383129] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#383129]">
                <div className="w-6 h-6 rounded-md bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757]">
                  <Icon n="file-text" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#F5F2EB] uppercase tracking-wide">
                  3. Escopo & Regras de Ativação
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Descrição da Competência *
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Descreva de forma concisa o que o agente é capaz de resolver com esta habilidade..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Quando Usar (Trigger conditions)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Indique as solicitações do usuário ou contextos específicos que devem disparar esta habilidade..."
                    value={whenToUse}
                    onChange={(e) => setWhenToUse(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Quando NÃO Usar (Recusas & Limites)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contraindicações expressas, limites de autoridade e recusas automáticas para segurança..."
                    value={whenNotToUse}
                    onChange={(e) => setWhenNotToUse(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1.5">
                    Pré-condições & Permissões
                  </label>
                  <input
                    type="text"
                    value={preconditions}
                    onChange={(e) => setPreconditions(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Card 4: Procedimento Passo a Passo */}
            <section className="bg-[#24201D] border border-[#383129] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#383129]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757]">
                    <Icon n="check-circle" size={13} />
                  </div>
                  <h2 className="text-sm font-semibold text-[#F5F2EB] uppercase tracking-wide">
                    4. Procedimento de Execução ({steps.length} etapas)
                  </h2>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#191613] border border-[#383129]"
                  >
                    <span className="text-xs text-[#F5F2EB] break-words min-w-0">{st}</span>
                    <button
                      type="button"
                      onClick={() => removeProcedureStep(idx)}
                      className="text-[#A39889] hover:text-[#F5F2EB] p-1 transition-colors cursor-pointer shrink-0"
                      title="Remover etapa"
                    >
                      <Icon n="x" size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
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
                  className="flex-1 min-w-0 bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors"
                />
                <button
                  type="button"
                  onClick={addProcedureStep}
                  className="px-4 py-2 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] border border-[#483E34] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Adicionar
                </button>
              </div>
            </section>

            {/* Card 5: Prompts Sugeridos */}
            <section className="bg-[#24201D] border border-[#383129] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#383129]">
                <div className="w-6 h-6 rounded-md bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757]">
                  <Icon n="terminal" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#F5F2EB] uppercase tracking-wide">
                  5. Sugestões de Prompt para Testes
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#A39889] mb-1">Prompt 1 (Comando principal)</label>
                  <input
                    type="text"
                    placeholder={`Planeje a execução de ${name || "esta habilidade"} para o meu repositório.`}
                    value={prompt1}
                    onChange={(e) => setPrompt1(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A39889] mb-1">Prompt 2 (Configuração / Modelo)</label>
                  <input
                    type="text"
                    placeholder={`Gere um modelo estruturado e verifique os artefatos para ${name || "a skill"}.`}
                    value={prompt2}
                    onChange={(e) => setPrompt2(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A39889] mb-1">Prompt 3 (Auditoria & Validação)</label>
                  <input
                    type="text"
                    placeholder="Audite a conformidade dos dados e emita um relatório estruturado."
                    value={prompt3}
                    onChange={(e) => setPrompt3(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors"
                  />
                </div>

                <div className="pt-2 border-t border-[#383129]">
                  <label className="block text-xs font-semibold text-[#D4CDC3] uppercase tracking-wider mb-1">
                    Prompt Padrão para o Playground
                  </label>
                  <input
                    type="text"
                    placeholder={`Executar e testar a habilidade ${name || "esta skill"} com segurança.`}
                    value={sampleTestPrompt}
                    onChange={(e) => setSampleTestPrompt(e.target.value)}
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#F5F2EB] placeholder-[#766B5E] transition-colors"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Live Preview & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-6 min-w-0">
            {/* Preview Container */}
            <div className="bg-[#24201D] border border-[#383129] rounded-xl overflow-hidden shadow-lg">
              {/* Tab Selector */}
              <div className="flex border-b border-[#383129] bg-[#1E1A17]">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("book")}
                  className={`flex-1 py-3 px-2 sm:px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePreviewTab === "book"
                      ? "text-[#F5F2EB] border-b-2 border-[#D97757] bg-[#24201D]"
                      : "text-[#A39889] hover:text-[#D4CDC3]"
                  }`}
                >
                  <Icon n="image" size={13} />
                  <span>Livro 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("card")}
                  className={`flex-1 py-3 px-2 sm:px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePreviewTab === "card"
                      ? "text-[#F5F2EB] border-b-2 border-[#D97757] bg-[#24201D]"
                      : "text-[#A39889] hover:text-[#D4CDC3]"
                  }`}
                >
                  <Icon n="layers" size={13} />
                  <span>Card no Catálogo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("markdown")}
                  className={`flex-1 py-3 px-2 sm:px-3 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePreviewTab === "markdown"
                      ? "text-[#F5F2EB] border-b-2 border-[#D97757] bg-[#24201D]"
                      : "text-[#A39889] hover:text-[#D4CDC3]"
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
                      <div className="text-xs uppercase tracking-wider font-semibold text-[#D4CDC3]">
                        {activeCordel.name}
                      </div>
                      <div className="text-[11px] text-[#A39889] mt-0.5 max-w-xs">
                        {activeCordel.description}
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === "card" && (
                  <div className="p-3 bg-[#191613] border border-[#383129] rounded-xl flex items-center gap-3">
                    <img
                      src={activeCordel.image}
                      alt={name || "Nova Habilidade"}
                      className="w-14 h-14 rounded-lg object-cover border border-[#483E34] shrink-0 filter contrast-110"
                    />
                    <div className="overflow-hidden flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#F5F2EB] truncate">
                          {name || "Nova Habilidade"}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#32231C] text-[#E28768] border border-[#D97757]/40 shrink-0">
                          {executionMode}
                        </span>
                      </div>
                      <p className="text-xs text-[#A39889] line-clamp-2 mt-0.5">
                        {description || "Descrição resumida da competência..."}
                      </p>
                      <div className="text-[11px] text-[#766B5E] mt-1 flex items-center gap-2">
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
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-[#2A241F] hover:bg-[#332C26] text-[11px] text-[#F5F2EB] border border-[#483E34] transition-colors cursor-pointer flex items-center gap-1 z-10"
                    >
                      <Icon n={copiedMarkdown ? "check" : "clipboard"} size={12} />
                      <span>{copiedMarkdown ? "Copiado!" : "Copiar"}</span>
                    </button>
                    <pre className="text-xs bg-[#191613] border border-[#383129] rounded-lg p-3 text-[#D4CDC3] overflow-x-auto max-h-72 font-mono whitespace-pre-wrap">
                      {generatedMarkdown}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Action Box */}
            <div className="bg-[#24201D] border border-[#383129] rounded-xl p-5 shadow-sm space-y-3">
              <button
                type="submit"
                className="w-full bg-[#D97757] hover:bg-[#E28768] text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_2px_10px_rgba(217,119,87,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Icon n="plus" size={16} />
                <span>Publicar Habilidade no Deda Skills</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full bg-[#1E1A17] hover:bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129] py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Cancelar e Voltar
              </button>

              <div className="pt-2 text-center text-[11px] text-[#766B5E]">
                Salva localmente com persistência em cache e exportável como pacote universal <code className="text-[#A39889]">.skill</code>.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
