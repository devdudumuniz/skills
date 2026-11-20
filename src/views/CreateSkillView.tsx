import React, { useEffect, useMemo, useRef, useState } from "react";
import { useProject } from "../context/ProjectContext";
import { AgentSkill } from "../types";
import { BookCover } from "../components/BookCover";
import { Icon } from "../components/Icons";
import { DedaLogo } from "../components/DedaLogo";

import { AISkillInterviewCreator } from "../components/AISkillInterviewCreator";
import { estimateTokens, formatTokens } from "../utils/tokenUtils";
import {
  CREATE_SKILL_PROGRESS_STEPS,
  CreateSkillField,
  getSaveProgressStep,
  slugifySkillName,
  validateCreateSkillForm,
} from "../utils/createSkillValidation";

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
  {
    id: "design_intelligence",
    name: "Design Systems & Contraste",
    image: "/assets/cordel/design_intelligence.jpg",
    description: "Paletas geométricas, tipografia estruturada e proporções em xilogravura.",
  },
  {
    id: "canvas_diagram",
    name: "Canvas & Fluxos",
    image: "/assets/cordel/canvas_diagram.jpg",
    description: "Blocos conectados à mão, mapas mentais e fluxogramas em traço nordestino.",
  },
  {
    id: "architecture_diagram",
    name: "Arquitetura C4 & UML",
    image: "/assets/cordel/architecture_diagram.jpg",
    description: "Topologias de microsserviços, bancos de dados e infraestrutura em cordel.",
  },
  {
    id: "excalidraw_generator",
    name: "Excalidraw ao Vivo",
    image: "/assets/cordel/excalidraw_generator.jpg",
    description: "Síntese arquitetural interativa via prompt com setas ancoradas.",
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
  const [author, setAuthor] = useState("Eduardo Muniz");
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
  const [formError, setFormError] = useState<string | null>(null);

  // Real-time validation state
  const [touchedFields, setTouchedFields] = useState<Partial<Record<CreateSkillField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Visual loading & progress state during skill generation and persistence
  const [isSaving, setIsSaving] = useState(false);
  const [saveStepIndex, setSaveStepIndex] = useState(0);
  const [savingSkillTitle, setSavingSkillTitle] = useState("");
  const saveTimersRef = useRef<number[]>([]);

  // Field refs for focusing the first invalid input on blocked submit
  const nameInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      saveTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      saveTimersRef.current = [];
    };
  }, []);

  const validation = useMemo(
    () =>
      validateCreateSkillForm({
        name,
        id,
        description,
        author,
        version,
      }),
    [name, id, description, author, version]
  );

  const markTouched = (field: CreateSkillField) => {
    setTouchedFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const getFieldError = (field: CreateSkillField): string | undefined => {
    if (!touchedFields[field] && !submitAttempted) return undefined;
    return validation.errors[field];
  };

  useEffect(() => {
    if (validation.isValid && formError) {
      setFormError(null);
    }
  }, [validation.isValid, formError]);

  const activeCordel = CORDEL_OPTIONS.find((c) => c.id === selectedCordel) || CORDEL_OPTIONS[0];
  const currentSaveStep = getSaveProgressStep(saveStepIndex);

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
    markTouched("name");
    if (!idTouched) {
      setId(slugifySkillName(val));
      markTouched("id");
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

  const runSaveWithProgress = (skillToPersist: AgentSkill) => {
    if (isSaving) return;
    saveTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    saveTimersRef.current = [];

    setIsSaving(true);
    setSavingSkillTitle(skillToPersist.name);
    setSaveStepIndex(0);

    const t1 = window.setTimeout(() => {
      setSaveStepIndex(1);
    }, 380);

    const t2 = window.setTimeout(() => {
      setSaveStepIndex(2);
    }, 820);

    const t3 = window.setTimeout(() => {
      addSkill(skillToPersist);
      setIsSaving(false);
      onSuccess(skillToPersist);
    }, 1220);

    saveTimersRef.current = [t1, t2, t3];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!validation.isValid) {
      setSubmitAttempted(true);
      setTouchedFields({
        name: true,
        id: true,
        description: true,
        author: true,
        version: true,
      });
      setFormError(
        `Preencha corretamente os campos obrigatórios antes de enviar: ${validation.missingRequiredLabels.join(", ")}.`
      );

      if (validation.errors.name) {
        nameInputRef.current?.focus();
      } else if (validation.errors.id) {
        idInputRef.current?.focus();
      } else if (validation.errors.author) {
        authorInputRef.current?.focus();
      } else if (validation.errors.version) {
        versionInputRef.current?.focus();
      } else if (validation.errors.description) {
        descriptionInputRef.current?.focus();
      }
      return;
    }

    setFormError(null);

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
              `Planeje a execução de ${name.trim()} para o meu projeto.`,
              `Gere um modelo inicial de configuração para ${name.trim()}.`,
              `Audite os dados e emita um relatório estruturado.`,
            ],
      sampleTestPrompt:
        sampleTestPrompt.trim() || `Executar e testar a habilidade ${name.trim()} com segurança.`,
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

    runSaveWithProgress(newSkill);
  };

  const renderSavingOverlay = () => {
    if (!isSaving) return null;
    return (
      <div
        className="fixed inset-0 z-[1100] bg-[#2E190F]/45 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saving-skill-title"
        aria-busy="true"
      >
        <div
          className="w-full max-w-md bg-[#FFFDF9] border-2 border-[#C45730] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-[#2E190F]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center shrink-0">
              <span
                className="w-5 h-5 rounded-full border-2 border-[#C45730] border-t-transparent animate-spin"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#B44B25]">
                Forjando Habilidade • {currentSaveStep.percent}%
              </div>
              <h2 id="saving-skill-title" className="text-base font-bold text-[#2E190F] truncate !m-0">
                {savingSkillTitle || "Nova Habilidade"}
              </h2>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div
              className="w-full h-2.5 rounded-full bg-[#EFE1CE] overflow-hidden border border-[#E2D1BC]"
              role="progressbar"
              aria-label="Progresso de geração e salvamento da habilidade"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={currentSaveStep.percent}
            >
              <div
                className="h-full bg-gradient-to-r from-[#C45730] to-[#D97757] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${currentSaveStep.percent}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-[#2E190F]">{currentSaveStep.label}</p>
            <p className="text-[11px] text-[#755B4B] leading-snug">{currentSaveStep.detail}</p>
          </div>

          {/* Step Checklist */}
          <div className="space-y-1.5 pt-2 border-t border-[#E2D1BC]">
            {CREATE_SKILL_PROGRESS_STEPS.map((step, idx) => {
              const isDone = idx < saveStepIndex;
              const isActive = idx === saveStepIndex;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    isActive
                      ? "bg-[#FCEEE6] border-[#E5A992] text-[#2E190F] font-semibold"
                      : isDone
                      ? "bg-[#F4EBDD] border-[#E2D1BC] text-[#5A4032]"
                      : "bg-[#FAF3E8] border-transparent text-[#8F7564]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isDone
                        ? "bg-[#4C6B49] text-white"
                        : isActive
                        ? "bg-[#C45730] text-white animate-pulse"
                        : "bg-[#E2D1BC] text-[#755B4B]"
                    }`}
                  >
                    {isDone ? "✓" : idx + 1}
                  </span>
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (creationMode === "ai-interview") {
    return (
      <div className="w-full">
        {renderSavingOverlay()}
        <AISkillInterviewCreator
          onSkillCreated={(skill) => {
            runSaveWithProgress(skill);
          }}
          onCancel={onCancel}
          initialPrompt={initialData?.whyNeeded || initialData?.description || ""}
          onSwitchToManual={() => setCreationMode("manual")}
        />
      </div>
    );
  }

  const nameError = getFieldError("name");
  const idError = getFieldError("id");
  const authorError = getFieldError("author");
  const versionError = getFieldError("version");
  const descriptionError = getFieldError("description");

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-3 xl:px-6 py-1 sm:py-5 pb-6 lg:pb-16 text-[#2E190F] min-w-0 w-full">
      {renderSavingOverlay()}
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 sm:mb-4 pb-3 border-b border-[#E2D1BC]">
        <div className="grid grid-cols-2 sm:inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#F4EBDD] border border-[#CEB79A] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCreationMode("ai-interview")}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-[#5A4032] hover:text-[#2E190F] transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Icon n="sparkles" size={12} />
            <span>Entrevista com IA</span>
          </button>
          <button
            type="button"
            onClick={() => setCreationMode("manual")}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-[#C45730] text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Icon n="file-text" size={12} />
            <span>Formulário Manual</span>
          </button>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4 pb-4 sm:pb-5 mb-5 sm:mb-6 border-b border-[#E2D1BC] min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FFFDF9] border border-[#CEB79A] flex items-center justify-center shrink-0">
            <DedaLogo size={24} color="#C45730" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#755B4B]">
                Deda Skills • Estúdio de Autoria
              </span>
              <span className="text-[10.5px] sm:text-[11px] px-2 py-0.5 rounded-full bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992] font-semibold">
                Padrão Universal
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-[#2E190F] mt-0.5 !mb-0 leading-tight">
              Criar Nova Habilidade para Agentes
            </h1>
            <p className="text-xs sm:text-sm text-[#5A4032] mt-1 leading-relaxed">
              Defina competências auditáveis com capa 3D, arte de xilogravura nordestina e especificação SKILL.md.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full xl:w-auto">
          {/* Live Context Footprint Counter */}
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#FFFDF9] border border-[#CEB79A] text-xs"
            title={`Consumo estimado de contexto: ${estimateTokens(generatedMarkdown)} tokens`}
          >
            <span className="w-2 h-2 rounded-full bg-[#C45730] animate-pulse shrink-0"></span>
            <span className="text-[11px] text-[#755B4B]">Contexto:</span>
            <span className="font-mono text-xs font-bold text-[#2E190F]">
              {formatTokens(estimateTokens(generatedMarkdown))}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              handleFillTemplate();
            }}
            className="px-3 py-2 rounded-lg text-xs font-medium text-[#5A4032] hover:text-[#2E190F] bg-[#FFFDF9] hover:bg-[#F6ECE0] border border-[#CEB79A] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Preencher com exemplo de habilidade de auditoria"
          >
            <Icon n="sparkles" size={14} />
            <span>Exemplo Rápido</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 sm:px-4 py-2 rounded-lg text-xs font-medium text-[#5A4032] hover:text-[#2E190F] bg-[#FFFDF9] hover:bg-[#F6ECE0] border border-[#CEB79A] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icon n="arrow" size={13} className="rotate-180" />
            <span className="sm:hidden">Voltar</span>
            <span className="hidden sm:inline">Voltar ao Catálogo</span>
          </button>
        </div>
      </header>

      {formError && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-xl bg-[#FDECE9] border border-[#9E2A1C]/40 text-[#9E2A1C] text-xs font-semibold flex items-center justify-between gap-2"
        >
          <span>{formError}</span>
          <button
            type="button"
            onClick={() => setFormError(null)}
            aria-label="Fechar aviso"
            className="p-1 hover:opacity-75 cursor-pointer shrink-0"
          >
            <Icon n="x" size={13} />
          </button>
        </div>
      )}

      {/* Main 2-Column Grid (stacked below 1280px because the 296px sidebar occupies space at 1024px–1279px) */}
      <form onSubmit={handleSubmit} noValidate aria-busy={isSaving}>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-8 items-start min-w-0">
          {/* Left Column: Form Cards (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-4 sm:gap-6 min-w-0">
            {/* Card 1: Identificação Básica */}
            <section className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E2D1BC]">
                <div className="w-6 h-6 rounded-md bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25]">
                  <Icon n="layers" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#2E190F] uppercase tracking-wide">
                  1. Identificação Básica
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label
                    htmlFor="create-skill-name"
                    className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5"
                  >
                    Nome da Habilidade *
                  </label>
                  <input
                    id="create-skill-name"
                    ref={nameInputRef}
                    type="text"
                    required
                    disabled={isSaving}
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? "create-skill-name-error" : undefined}
                    placeholder="Ex: Manus para Notion"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() => markTouched("name")}
                    className={`w-full rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors focus:outline-none border ${
                      nameError
                        ? "bg-[#FDF5F3] border-[#9E2A1C] focus:border-[#9E2A1C]"
                        : "bg-[#FAF3E8] border-[#CEB79A] focus:border-[#C45730]"
                    }`}
                  />
                  {nameError && (
                    <p
                      id="create-skill-name-error"
                      role="alert"
                      className="mt-1.5 text-[11.5px] font-medium text-[#9E2A1C] leading-snug"
                    >
                      {nameError}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="create-skill-id"
                    className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5"
                  >
                    Identificador (Slug) *
                  </label>
                  <input
                    id="create-skill-id"
                    ref={idInputRef}
                    type="text"
                    required
                    disabled={isSaving}
                    aria-invalid={Boolean(idError)}
                    aria-describedby={idError ? "create-skill-id-error" : undefined}
                    placeholder="Ex: notion-workflows"
                    value={id}
                    onChange={(e) => {
                      setIdTouched(true);
                      markTouched("id");
                      setId(e.target.value);
                    }}
                    onBlur={() => markTouched("id")}
                    className={`w-full rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors font-mono focus:outline-none border ${
                      idError
                        ? "bg-[#FDF5F3] border-[#9E2A1C] focus:border-[#9E2A1C]"
                        : "bg-[#FAF3E8] border-[#CEB79A] focus:border-[#C45730]"
                    }`}
                  />
                  {idError && (
                    <p
                      id="create-skill-id-error"
                      role="alert"
                      className="mt-1.5 text-[11.5px] font-medium text-[#9E2A1C] leading-snug"
                    >
                      {idError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AgentSkill["category"])}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] transition-colors cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#FFFDF9] text-[#2E190F]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5">
                    Modo de Execução
                  </label>
                  <select
                    value={executionMode}
                    onChange={(e) => setExecutionMode(e.target.value as AgentSkill["execution_mode"])}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] transition-colors cursor-pointer"
                  >
                    <option value="plan-first" className="bg-[#FFFDF9] text-[#2E190F]">
                      plan-first (Elaborar plano antes de mutações)
                    </option>
                    <option value="iterative-tdd" className="bg-[#FFFDF9] text-[#2E190F]">
                      iterative-tdd (Ciclos de testes e scaffolding)
                    </option>
                    <option value="read-only" className="bg-[#FFFDF9] text-[#2E190F]">
                      read-only (Auditoria e diagnóstico seguro)
                    </option>
                    <option value="agent-loop" className="bg-[#FFFDF9] text-[#2E190F]">
                      agent-loop (Loop autônomo com feedback)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="min-w-0">
                  <label
                    htmlFor="create-skill-author"
                    className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5"
                  >
                    Autor *
                  </label>
                  <input
                    id="create-skill-author"
                    ref={authorInputRef}
                    type="text"
                    disabled={isSaving}
                    aria-invalid={Boolean(authorError)}
                    aria-describedby={authorError ? "create-skill-author-error" : undefined}
                    value={author}
                    onChange={(e) => {
                      markTouched("author");
                      setAuthor(e.target.value);
                    }}
                    onBlur={() => markTouched("author")}
                    className={`w-full rounded-lg px-3.5 py-2 text-sm text-[#2E190F] transition-colors focus:outline-none border ${
                      authorError
                        ? "bg-[#FDF5F3] border-[#9E2A1C] focus:border-[#9E2A1C]"
                        : "bg-[#FAF3E8] border-[#CEB79A] focus:border-[#C45730]"
                    }`}
                  />
                  {authorError && (
                    <p
                      id="create-skill-author-error"
                      role="alert"
                      className="mt-1.5 text-[11.5px] font-medium text-[#9E2A1C] leading-snug"
                    >
                      {authorError}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="create-skill-version"
                    className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5"
                  >
                    Versão *
                  </label>
                  <input
                    id="create-skill-version"
                    ref={versionInputRef}
                    type="text"
                    disabled={isSaving}
                    aria-invalid={Boolean(versionError)}
                    aria-describedby={versionError ? "create-skill-version-error" : undefined}
                    value={version}
                    onChange={(e) => {
                      markTouched("version");
                      setVersion(e.target.value);
                    }}
                    onBlur={() => markTouched("version")}
                    className={`w-full rounded-lg px-3.5 py-2 text-sm text-[#2E190F] transition-colors font-mono focus:outline-none border ${
                      versionError
                        ? "bg-[#FDF5F3] border-[#9E2A1C] focus:border-[#9E2A1C]"
                        : "bg-[#FAF3E8] border-[#CEB79A] focus:border-[#C45730]"
                    }`}
                  />
                  {versionError && (
                    <p
                      id="create-skill-version-error"
                      role="alert"
                      className="mt-1.5 text-[11.5px] font-medium text-[#9E2A1C] leading-snug"
                    >
                      {versionError}
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="create-skill-tags"
                    className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5"
                  >
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    id="create-skill-tags"
                    type="text"
                    disabled={isSaving}
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="notion, produtividade, agente"
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Card 2: Arte de Xilogravura Nordestina */}
            <section className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#E2D1BC]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25]">
                    <Icon n="image" size={13} />
                  </div>
                  <h2 className="text-sm font-semibold text-[#2E190F] uppercase tracking-wide">
                    2. Arte de Capa • Xilogravura de Cordel
                  </h2>
                </div>
                <span className="text-[11px] text-[#755B4B] hidden sm:inline">
                  Estilo clássico em preto e branco
                </span>
              </div>

              <p className="text-xs text-[#5A4032] mb-3.5">
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
                          ? "bg-[#FCEEE6] border-[#C45730] shadow-sm"
                          : "bg-[#FAF3E8] border-[#E2D1BC] hover:border-[#CEB79A] hover:bg-[#F6ECE0]"
                      }`}
                    >
                      <img
                        src={opt.image}
                        alt={opt.name}
                        className="w-10 h-10 rounded-md object-cover border border-[#CEB79A] shrink-0 filter contrast-105"
                      />
                      <div className="overflow-hidden min-w-0">
                        <div className="text-xs font-semibold text-[#2E190F] truncate">
                          {opt.name}
                        </div>
                        <div className={`text-[10.5px] truncate ${isSelected ? "text-[#A8421E] font-semibold" : "text-[#755B4B]"}`}>
                          {isSelected ? "Selecionada" : "Usar gravura"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-[#E2D1BC]">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5">
                    Subtítulo da Capa
                  </label>
                  <input
                    type="text"
                    value={coverSubtitle}
                    onChange={(e) => setCoverSubtitle(e.target.value)}
                    placeholder="Ex: Engenharia & Entrega • Xilogravura"
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5">
                    Ícone Complementar
                  </label>
                  <select
                    value={coverIcon}
                    onChange={(e) => setCoverIcon(e.target.value)}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] transition-colors cursor-pointer"
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
            <section className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E2D1BC]">
                <div className="w-6 h-6 rounded-md bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25]">
                  <Icon n="file-text" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#2E190F] uppercase tracking-wide">
                  3. Escopo & Regras de Ativação
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="create-skill-description"
                      className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider"
                    >
                      Descrição da Competência *
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        description.trim().length >= 15 ? "text-[#4C6B49] font-semibold" : "text-[#8F7564]"
                      }`}
                    >
                      {description.trim().length}/15+ caracteres
                    </span>
                  </div>
                  <textarea
                    id="create-skill-description"
                    ref={descriptionInputRef}
                    required
                    disabled={isSaving}
                    aria-invalid={Boolean(descriptionError)}
                    aria-describedby={descriptionError ? "create-skill-description-error" : undefined}
                    rows={2}
                    placeholder="Descreva de forma concisa o que o agente é capaz de resolver com esta habilidade..."
                    value={description}
                    onChange={(e) => {
                      markTouched("description");
                      setDescription(e.target.value);
                    }}
                    onBlur={() => markTouched("description")}
                    className={`w-full rounded-lg px-3.5 py-2.5 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors resize-y focus:outline-none border ${
                      descriptionError
                        ? "bg-[#FDF5F3] border-[#9E2A1C] focus:border-[#9E2A1C]"
                        : "bg-[#FAF3E8] border-[#CEB79A] focus:border-[#C45730]"
                    }`}
                  />
                  {descriptionError && (
                    <p
                      id="create-skill-description-error"
                      role="alert"
                      className="mt-1.5 text-[11.5px] font-medium text-[#9E2A1C] leading-snug"
                    >
                      {descriptionError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5">
                    Quando Usar (Trigger conditions)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Indique as solicitações do usuário ou contextos específicos que devem disparar esta habilidade..."
                    value={whenToUse}
                    onChange={(e) => setWhenToUse(e.target.value)}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5">
                    Quando NÃO Usar (Recusas & Limites)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contraindicações expressas, limites de autoridade e recusas automáticas para segurança..."
                    value={whenNotToUse}
                    onChange={(e) => setWhenNotToUse(e.target.value)}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1.5">
                    Pré-condições & Permissões
                  </label>
                  <input
                    type="text"
                    value={preconditions}
                    onChange={(e) => setPreconditions(e.target.value)}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Card 4: Procedimento Passo a Passo */}
            <section className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E2D1BC]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25] shrink-0">
                    <Icon n="check-circle" size={13} />
                  </div>
                  <h2 className="text-sm font-semibold text-[#2E190F] uppercase tracking-wide !m-0">
                    4. Procedimento de Execução ({steps.length} etapas)
                  </h2>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#F4EBDD] border border-[#E2D1BC]"
                  >
                    <span className="text-xs text-[#2E190F] break-words min-w-0">{st}</span>
                    <button
                      type="button"
                      onClick={() => removeProcedureStep(idx)}
                      className="text-[#755B4B] hover:text-[#2E190F] p-1 transition-colors cursor-pointer shrink-0"
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
                  className="flex-1 min-w-0 bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors"
                />
                <button
                  type="button"
                  onClick={addProcedureStep}
                  className="px-4 py-2 rounded-lg bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] border border-[#CEB79A] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  Adicionar
                </button>
              </div>
            </section>

            {/* Card 5: Prompts Sugeridos */}
            <section className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-xl p-3.5 sm:p-5 shadow-sm min-w-0">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E2D1BC]">
                <div className="w-6 h-6 rounded-md bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25]">
                  <Icon n="terminal" size={13} />
                </div>
                <h2 className="text-sm font-semibold text-[#2E190F] uppercase tracking-wide">
                  5. Sugestões de Prompt para Testes
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#5A4032] font-medium mb-1">Prompt 1 (Comando principal)</label>
                  <input
                    type="text"
                    placeholder={`Planeje a execução de ${name || "esta habilidade"} para o meu repositório.`}
                    value={prompt1}
                    onChange={(e) => setPrompt1(e.target.value)}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#5A4032] font-medium mb-1">Prompt 2 (Configuração / Modelo)</label>
                  <input
                    type="text"
                    placeholder={`Gere um modelo estruturado e verifique os artefatos para ${name || "a skill"}.`}
                    value={prompt2}
                    onChange={(e) => setPrompt2(e.target.value)}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#5A4032] font-medium mb-1">Prompt 3 (Auditoria & Validação)</label>
                  <input
                    type="text"
                    placeholder="Audite a conformidade dos dados e emita um relatório estruturado."
                    value={prompt3}
                    onChange={(e) => setPrompt3(e.target.value)}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors"
                  />
                </div>

                <div className="pt-2 border-t border-[#E2D1BC]">
                  <label className="block text-xs font-semibold text-[#5A4032] uppercase tracking-wider mb-1">
                    Prompt Padrão para o Playground
                  </label>
                  <input
                    type="text"
                    placeholder={`Executar e testar a habilidade ${name || "esta skill"} com segurança.`}
                    value={sampleTestPrompt}
                    onChange={(e) => setSampleTestPrompt(e.target.value)}
                    className="w-full bg-[#FAF3E8] border border-[#CEB79A] focus:border-[#C45730] focus:outline-none rounded-lg px-3.5 py-2 text-sm text-[#2E190F] placeholder-[#8F7564] transition-colors"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Live Preview & Actions (5 cols on xl+) */}
          <div className="xl:col-span-5 flex flex-col gap-4 sm:gap-5 xl:sticky xl:top-6 min-w-0">
            {/* Preview Container */}
            <div className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-xl overflow-hidden shadow-sm min-w-0">
              {/* Tab Selector */}
              <div className="grid grid-cols-3 border-b border-[#E2D1BC] bg-[#F4EBDD]">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("book")}
                  className={`py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
                    activePreviewTab === "book"
                      ? "text-[#2E190F] border-b-2 border-[#C45730] bg-[#FFFDF9]"
                      : "text-[#5A4032] hover:text-[#2E190F]"
                  }`}
                >
                  <Icon n="image" size={13} className="shrink-0" />
                  <span className="truncate">Livro 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("card")}
                  className={`py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
                    activePreviewTab === "card"
                      ? "text-[#2E190F] border-b-2 border-[#C45730] bg-[#FFFDF9]"
                      : "text-[#5A4032] hover:text-[#2E190F]"
                  }`}
                >
                  <Icon n="layers" size={13} className="shrink-0" />
                  <span className="truncate sm:hidden">Card</span>
                  <span className="hidden sm:inline truncate">Card no Catálogo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab("markdown")}
                  className={`py-2.5 sm:py-3 px-1.5 sm:px-3 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
                    activePreviewTab === "markdown"
                      ? "text-[#2E190F] border-b-2 border-[#C45730] bg-[#FFFDF9]"
                      : "text-[#5A4032] hover:text-[#2E190F]"
                  }`}
                >
                  <Icon n="file-text" size={13} className="shrink-0" />
                  <span className="truncate">SKILL.md</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-5 min-w-0">
                {activePreviewTab === "book" && (
                  <div className="flex flex-col items-center justify-center py-3 sm:py-4 overflow-hidden">
                    <div className="mb-3 sm:mb-4 max-w-full flex justify-center scale-90 sm:scale-100 origin-center">
                      <BookCover
                        title={name || "Nova Habilidade"}
                        theme={getCoverTheme()}
                        variant="tilted-3d"
                      />
                    </div>
                    <div className="text-center mt-1 px-2">
                      <div className="text-xs uppercase tracking-wider font-semibold text-[#5A4032]">
                        {activeCordel.name}
                      </div>
                      <div className="text-[11px] text-[#755B4B] mt-0.5 max-w-xs mx-auto">
                        {activeCordel.description}
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === "card" && (
                  <div className="p-3 bg-[#FAF3E8] border border-[#E2D1BC] rounded-xl flex items-start sm:items-center gap-3 min-w-0">
                    <img
                      src={activeCordel.image}
                      alt={name || "Nova Habilidade"}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-[#CEB79A] shrink-0 filter contrast-105"
                    />
                    <div className="overflow-hidden flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="text-sm font-semibold text-[#2E190F] truncate max-w-full">
                          {name || "Nova Habilidade"}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992] font-semibold shrink-0">
                          {executionMode}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A4032] line-clamp-2 mt-0.5 break-words">
                        {description || "Descrição resumida da competência..."}
                      </p>
                      <div className="text-[11px] text-[#755B4B] mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="truncate">Por {author}</span>
                        <span>•</span>
                        <span>v{version}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewTab === "markdown" && (
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-[#755B4B] truncate">
                        skills/{id || "nova-habilidade"}/SKILL.md
                      </span>
                      <button
                        type="button"
                        onClick={copyMarkdownToClipboard}
                        className="px-2.5 py-1 rounded bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[11px] text-[#2E190F] border border-[#CEB79A] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Icon n={copiedMarkdown ? "check" : "clipboard"} size={12} />
                        <span>{copiedMarkdown ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                    <pre className="text-xs bg-[#F4EBDD] border border-[#E2D1BC] rounded-lg p-3 text-[#2E190F] overflow-x-auto max-h-72 font-mono whitespace-pre-wrap break-words !m-0">
                      {generatedMarkdown}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Action Box */}
            <div className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-xl p-4 sm:p-5 shadow-sm space-y-3 min-w-0">
              {/* Live Form Readiness Indicator */}
              <div className="p-3 rounded-lg bg-[#FAF3E8] border border-[#E2D1BC] space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#2E190F]">
                    {validation.isValid
                      ? "Formulário pronto para publicar"
                      : "Preenchimento obrigatório"}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      validation.isValid
                        ? "bg-[#EAF3E8] text-[#355233] border-[#B9D3B5]"
                        : "bg-[#FCEEE6] text-[#A8421E] border-[#E5A992]"
                    }`}
                  >
                    {validation.requiredCompleted}/{validation.requiredTotal}
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-[#E8DAC6] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      validation.isValid ? "bg-[#4C6B49]" : "bg-[#C45730]"
                    }`}
                    style={{ width: `${validation.completionPercent}%` }}
                  />
                </div>

                {!validation.isValid && (
                  <p className="text-[11px] text-[#755B4B] leading-snug">
                    Pendente:{" "}
                    <span className="font-semibold text-[#9E2A1C]">
                      {validation.missingRequiredLabels.join(", ")}
                    </span>
                  </p>
                )}
              </div>

              {/* Inline Progress Indicator while generating & saving */}
              {isSaving && (
                <div
                  className="p-3 rounded-lg bg-[#FCEEE6] border border-[#E5A992] space-y-1.5"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#A8421E]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-3 h-3 rounded-full border-2 border-[#C45730] border-t-transparent animate-spin shrink-0" />
                      <span className="truncate">{currentSaveStep.label}</span>
                    </span>
                    <span className="font-mono shrink-0">{currentSaveStep.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#F5D8CA] overflow-hidden">
                    <div
                      className="h-full bg-[#C45730] rounded-full transition-all duration-300"
                      style={{ width: `${currentSaveStep.percent}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                  isSaving
                    ? "bg-[#AE4823] text-white cursor-wait opacity-90"
                    : validation.isValid
                    ? "bg-[#C45730] hover:bg-[#AE4823] text-white shadow-[0_4px_12px_rgba(196,87,48,0.25)] cursor-pointer active:scale-[0.99]"
                    : "bg-[#D9A794] hover:bg-[#CE957F] text-[#FFFDF9] cursor-pointer"
                }`}
              >
                {isSaving ? (
                  <>
                    <span
                      className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0"
                      aria-hidden="true"
                    />
                    <span>Gerando e Salvando... ({currentSaveStep.percent}%)</span>
                  </>
                ) : (
                  <>
                    <Icon n="plus" size={16} />
                    <span>Publicar Habilidade no Deda Skills</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={onCancel}
                className="w-full bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] border border-[#CEB79A] py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Cancelar e Voltar
              </button>

              <div className="pt-2 text-center text-[11px] text-[#755B4B]">
                Salva localmente com persistência em cache e exportável como pacote universal <code className="text-[#A8421E]">.skill</code>.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
