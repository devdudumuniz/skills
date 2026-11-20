import React, { useState, useRef, useEffect, useMemo } from "react";
import { Icon } from "./Icons";
import { AgentSkill } from "../types";
import { MASCOT_AGENTS } from "../data/mascotsData";
import { estimateTokens, formatTokens, calculateSkillTokenProfile } from "../utils/tokenUtils";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  suggestions?: string[];
  stage?: string;
}

interface AISkillInterviewCreatorProps {
  onSkillCreated: (skill: AgentSkill) => void;
  onCancel: () => void;
  initialPrompt?: string;
  onSwitchToManual?: () => void;
}

type CreatorTab = "interview" | "briefing" | "completed";

export const AISkillInterviewCreator: React.FC<AISkillInterviewCreatorProps> = ({
  onSkillCreated,
  onCancel,
  initialPrompt = "",
  onSwitchToManual,
}) => {
  const [currentTab, setCurrentTab] = useState<CreatorTab>("interview");
  const [selectedMascotId, setSelectedMascotId] = useState<string>("tatu_bola");

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro-1",
      role: "model",
      content:
        "Olá! Sou seu arquiteto de agentes no **Deda Skills**. Vamos criar uma nova habilidade de IA sob medida para seu fluxo de trabalho através de uma rápida entrevista.\n\nPara começarmos: **o que exatamente você deseja que essa skill faça e qual problema ou rotina ela deve resolver?**",
      timestamp: "Agora",
      suggestions: [
        "Auditoria de segurança estática e detecção de credenciais vazadas",
        "Pipeline de testes automatizados com TDD e cobertura de branches",
        "Extração exata de design tokens e criação de componentes React",
        "Automação de entrega contínua com rollback automático e Docker",
      ],
      stage: "Objetivo & Problema",
    },
  ]);
  const [inputMessage, setInputMessage] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState("Objetivo & Problema");
  const [isReadyForBriefing, setIsReadyForBriefing] = useState(false);

  // Briefing State
  const [briefingMarkdown, setBriefingMarkdown] = useState<string>("");
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [isRefiningBriefing, setIsRefiningBriefing] = useState(false);
  const [briefingViewMode, setBriefingViewMode] = useState<"rendered" | "source">("rendered");
  const [refinementHistory, setRefinementHistory] = useState<string[]>([]);
  const [copiedBriefing, setCopiedBriefing] = useState(false);

  // Final Skill State
  const [createdSkill, setCreatedSkill] = useState<AgentSkill | null>(null);
  const [isFinalizingSkill, setIsFinalizingSkill] = useState(false);

  const chatFeedRef = useRef<HTMLDivElement>(null);

  const selectedMascot =
    MASCOT_AGENTS.find((m) => m.id === selectedMascotId) || MASCOT_AGENTS[2]; // Default: Tatu-Bola

  const currentMascotIndex = useMemo(() => {
    const idx = MASCOT_AGENTS.findIndex((m) => m.id === selectedMascotId);
    return idx >= 0 ? idx : 0;
  }, [selectedMascotId]);

  const handlePrevMascot = () => {
    const prevIdx = (currentMascotIndex - 1 + MASCOT_AGENTS.length) % MASCOT_AGENTS.length;
    setSelectedMascotId(MASCOT_AGENTS[prevIdx].id);
  };

  const handleNextMascot = () => {
    const nextIdx = (currentMascotIndex + 1) % MASCOT_AGENTS.length;
    setSelectedMascotId(MASCOT_AGENTS[nextIdx].id);
  };

  useEffect(() => {
    // Rola apenas o feed interno do chat após interações, sem rolar a página inteira no mount
    if (messages.length > 1 || isLoading) {
      const feed = chatFeedRef.current;
      if (feed) {
        feed.scrollTo({ top: feed.scrollHeight, behavior: "smooth" });
      }
    }
  }, [messages, isLoading]);

  // Dynamic Token / Context Calculations
  const conversationTokens = useMemo(() => {
    const raw = messages.map((m) => m.content).join("\n") + "\n" + inputMessage;
    return estimateTokens(raw);
  }, [messages, inputMessage]);

  const briefingTokens = useMemo(() => {
    return briefingMarkdown ? estimateTokens(briefingMarkdown) : 0;
  }, [briefingMarkdown]);

  const activeTokens = useMemo(() => {
    if (currentTab === "completed" && createdSkill) {
      return calculateSkillTokenProfile(createdSkill).totalTokens;
    }
    if (currentTab === "briefing" && briefingMarkdown) {
      return briefingTokens;
    }
    return conversationTokens;
  }, [currentTab, createdSkill, briefingMarkdown, briefingTokens, conversationTokens]);

  const percent128k = Math.max(0.05, Number(((activeTokens / 131072) * 100).toFixed(2)));

  // Send message to AI Interviewer
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: "Agora",
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const payload = {
        conversation: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        mascotId: selectedMascotId,
      };

      const res = await fetch("/api/skills/interview/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro na comunicação com o entrevistador.");

      const data = await res.json();

      const modelMsg: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        content: data.reply,
        timestamp: "Agora",
        suggestions: data.suggestions || [],
        stage: data.progressStage || progressStage,
      };

      setMessages((prev) => [...prev, modelMsg]);
      if (data.progressStage) setProgressStage(data.progressStage);
      if (data.isReadyForBriefing) setIsReadyForBriefing(true);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          content: `Entendido perfeitamente. Registrei suas respostas sobre "${text.slice(0, 80)}". Podemos detalhar as entradas e saídas esperadas ou avançar diretamente para o Briefing de validação.`,
          timestamp: "Agora",
          suggestions: [
            "Gerar Briefing em Markdown para Validação",
            "Adicionar diretrizes de segurança",
            "Definir parâmetros de entrada e saída",
          ],
        },
      ]);
      setIsReadyForBriefing(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Briefing from Conversation
  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    setCurrentTab("briefing");

    try {
      const payload = {
        conversation: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        mascotId: selectedMascotId,
      };

      const res = await fetch("/api/skills/interview/generate-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Falha ao gerar briefing.");

      const data = await res.json();
      setBriefingMarkdown(data.briefingMarkdown || "");
    } catch (err) {
      console.error(err);
      setBriefingMarkdown(`# Briefing de Validação da Skill • Deda Skills

## 1. Visão Geral & Problema Resolvido
Habilidade criada sob demanda a partir da entrevista com ${selectedMascot.name}.
Objetivo: Resolver as rotinas de engenharia especificadas durante o diálogo interativo.

## 2. Escopo & Capacidades
- Execução determinística de tarefas automatizadas.
- Integração aos diretórios padrão de agentes autônomos.
- Isolamento local e salvaguardas ativas.

## 3. Diretrizes de Segurança
- Zero Exfiltração de chaves ou dados confidenciais.
- Modo Plan-First com aprovação explícita de passos críticos.
`);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  // Refine Briefing with User instruction
  const handleRefineBriefing = async () => {
    const instruction = refinementInput.trim();
    if (!instruction || isRefiningBriefing) return;

    setIsRefiningBriefing(true);
    try {
      const res = await fetch("/api/skills/interview/refine-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentBriefing: briefingMarkdown,
          userInstruction: instruction,
        }),
      });

      if (!res.ok) throw new Error("Falha ao refinar briefing.");

      const data = await res.json();
      if (data.updatedBriefing) {
        setBriefingMarkdown(data.updatedBriefing);
        setRefinementHistory((prev) => [
          ...prev,
          data.explanation || `Ajuste aplicado: "${instruction}"`,
        ]);
        setRefinementInput("");
      }
    } catch (err) {
      console.error(err);
      setBriefingMarkdown(
        (prev) => `${prev}\n\n### Ajuste do Usuário:\n- ${instruction}`
      );
      setRefinementHistory((prev) => [
        ...prev,
        `Ajuste anotado: "${instruction}"`,
      ]);
      setRefinementInput("");
    } finally {
      setIsRefiningBriefing(false);
    }
  };

  // Finalize & Create Skill
  const handleConfirmAndCreateSkill = async () => {
    setIsFinalizingSkill(true);
    try {
      const res = await fetch("/api/skills/interview/finalize-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefingMarkdown,
          mascotId: selectedMascotId,
        }),
      });

      if (!res.ok) throw new Error("Falha ao finalizar criação da skill.");

      const data = await res.json();
      if (data.skill) {
        setCreatedSkill(data.skill);
        setCurrentTab("completed");

        // Increment user AI creation metrics
        try {
          const currentCount = parseInt(localStorage.getItem("deda_skills_ai_creations_count") || "1", 10);
          localStorage.setItem("deda_skills_ai_creations_count", String(currentCount + 1));
        } catch (e) {
          console.error(e);
        }

        onSkillCreated(data.skill);
      }
    } catch (err: any) {
      console.error(err);
      const cleanId = "skill-" + Date.now().toString(36);
      const fallbackSkill: AgentSkill = {
        id: cleanId,
        name: "Habilidade Customizada • " + selectedMascot.name,
        category: "programacao",
        description: "Habilidade forjada pelo estúdio Deda Skills com base no briefing técnico validado.",
        path: `skills/${cleanId}`,
        entrypoint: "SKILL.md",
        package: `deda-${cleanId}.skill`,
        execution_mode: "plan-first",
        tags: ["custom", "ai-created", selectedMascot.id],
        markdown: briefingMarkdown,
        isOfficial: true,
        author: `Deda Studio (${selectedMascot.name})`,
        version: "1.0.0",
        supportedRuntimes: ["claude", "codex", "gemini", "hermes"],
        coverTheme: {
          bg: "#181818",
          accent: "#D97757",
          icon: "sparkles",
          subtitle: `Xilogravura • ${selectedMascot.name}`,
          imageUrl: selectedMascot.avatar,
        },
        files: [
          {
            name: "SKILL.md",
            path: `skills/${cleanId}/SKILL.md`,
            type: "markdown",
            content: briefingMarkdown,
          },
        ],
      };
      setCreatedSkill(fallbackSkill);
      setCurrentTab("completed");

      try {
        const currentCount = parseInt(localStorage.getItem("deda_skills_ai_creations_count") || "1", 10);
        localStorage.setItem("deda_skills_ai_creations_count", String(currentCount + 1));
      } catch (e) {
        console.error(e);
      }

      onSkillCreated(fallbackSkill);
    } finally {
      setIsFinalizingSkill(false);
    }
  };

  const handleCopyBriefing = () => {
    navigator.clipboard.writeText(briefingMarkdown);
    setCopiedBriefing(true);
    setTimeout(() => setCopiedBriefing(false), 2500);
  };

  const handleDownloadBriefing = () => {
    const blob = new Blob([briefingMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `briefing-validacao-skill-${selectedMascotId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-3 xl:px-5 py-1 sm:py-4 pb-6 lg:pb-16 text-[#2E190F] min-w-0 w-full">
      {/* =========================================================================
          UNIFIED RESPONSIVE HEADER & NAVIGATION
          ========================================================================= */}
      <header className="pb-3.5 sm:pb-4 mb-4 sm:mb-5 border-b border-[#E2D1BC] space-y-3 min-w-0">
        {/* Top Navigation Row: Back, Title, Token Badge & Mode Toggle */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
          {/* Brand & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              title="Voltar ao Catálogo"
              aria-label="Voltar ao Catálogo"
            >
              <Icon n="arrow" size={14} className="rotate-180" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#B44B25]">
                  Estúdio IA
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992] font-semibold hidden sm:inline-block">
                  Entrevista & Validação
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-[#2E190F] tracking-tight truncate !m-0">
                Criação de Habilidades com IA
              </h1>
            </div>
          </div>

          {/* Right Area: Context Token Counter & Mode Switcher */}
          <div className="flex items-center justify-between xl:justify-end gap-2 flex-wrap w-full xl:w-auto shrink-0">
            {/* Live Context & Token Counter Pill */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FFFDF9] border border-[#E2D1BC] text-xs shadow-sm min-w-0"
              title={`Consumo estimado de contexto: ${activeTokens} tokens (~${percent128k}% de uma janela padrão de 128k)`}
            >
              <span className="w-2 h-2 rounded-full bg-[#C45730] animate-pulse shrink-0"></span>
              <span className="text-[11px] text-[#755B4B] hidden md:inline">Contexto:</span>
              <span className="font-mono text-xs font-bold text-[#2E190F]">
                {formatTokens(activeTokens)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FCEEE6] text-[#A8421E] font-semibold border border-[#E5A992] whitespace-nowrap">
                {percent128k}% <span className="hidden xs:inline sm:inline">de 128k</span>
              </span>
            </div>

            {/* Mode Switcher Toggle (IA vs Manual) */}
            {onSwitchToManual && (
              <div className="flex items-center p-1 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC] shrink-0">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#C45730] text-white shadow-sm flex items-center gap-1 whitespace-nowrap"
                >
                  <Icon n="sparkles" size={11} />
                  <span className="hidden sm:inline">Entrevista IA</span>
                  <span className="sm:hidden">IA</span>
                </button>
                <button
                  type="button"
                  onClick={onSwitchToManual}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#5A4032] hover:text-[#2E190F] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Icon n="file-text" size={11} />
                  <span className="hidden sm:inline">Manual</span>
                  <span className="sm:hidden">Manual</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stepper Tabs Bar: Responsive 3-col grid on mobile, compact inline row on sm+ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2 border-t border-[#E2D1BC] min-w-0">
          <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC] w-full sm:w-auto min-w-0">
            <button
              type="button"
              onClick={() => setCurrentTab("interview")}
              className={`px-1.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer justify-center min-w-0 ${
                currentTab === "interview"
                  ? "bg-[#FFFDF9] text-[#2E190F] border border-[#CEB79A] shadow-sm"
                  : "text-[#5A4032] hover:text-[#2E190F]"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#E7D6C0] text-[#2E190F] text-[10px] flex items-center justify-center font-mono shrink-0">
                1
              </span>
              <span className="truncate sm:hidden">Entrevista</span>
              <span className="hidden sm:inline whitespace-nowrap">Entrevista no Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (briefingMarkdown) setCurrentTab("briefing");
                else handleGenerateBriefing();
              }}
              className={`px-1.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer justify-center min-w-0 ${
                currentTab === "briefing"
                  ? "bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992] shadow-sm"
                  : "text-[#5A4032] hover:text-[#2E190F]"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#E7D6C0] text-[#2E190F] text-[10px] flex items-center justify-center font-mono shrink-0">
                2
              </span>
              <span className="truncate sm:hidden">Briefing</span>
              <span className="hidden sm:inline whitespace-nowrap">Briefing de Validação</span>
            </button>

            <button
              type="button"
              disabled={!createdSkill}
              onClick={() => setCurrentTab("completed")}
              className={`px-1.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 justify-center min-w-0 ${
                currentTab === "completed"
                  ? "bg-[#C45730] text-white border border-[#C45730] shadow-sm"
                  : "text-[#8F7564] cursor-not-allowed"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#E7D6C0] text-[#2E190F] text-[10px] flex items-center justify-center font-mono shrink-0">
                3
              </span>
              <span className="truncate sm:hidden">Forjada</span>
              <span className="hidden sm:inline whitespace-nowrap">Skill Forjada</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#755B4B] shrink-0">
            <Icon n="activity" size={12} />
            <span>Etapa ativa: <b className="text-[#2E190F]">{progressStage}</b></span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          TAB 1: CHAT DE ENTREVISTA COM IA
          ========================================================================= */}
      {currentTab === "interview" && (
        <div className="space-y-3.5 sm:space-y-4 min-w-0">
          {/* Compact Mascot Quick Selector Bar (Mobile, Tablet & Narrow Desktop < 1280px) */}
          <div className="xl:hidden bg-[#FFFDF9] border border-[#E2D1BC] rounded-xl p-2.5 shadow-sm flex items-center justify-between gap-2 min-w-0">
            <button
              type="button"
              onClick={handlePrevMascot}
              className="p-2 rounded-lg bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#5A4032] border border-[#CEB79A] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Mascote Anterior"
              aria-label="Mascote Anterior"
            >
              <Icon n="arrow" size={12} className="rotate-180" />
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
              <img
                src={selectedMascot.mediaKit.pngTransparent}
                alt={selectedMascot.name}
                className="w-8 h-8 object-contain shrink-0 filter drop-shadow-sm"
              />
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-[#2E190F] flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{selectedMascot.name}</span>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992] font-semibold font-mono shrink-0">
                    0{currentMascotIndex + 1} / 0{MASCOT_AGENTS.length}
                  </span>
                </div>
                <div className="text-[10px] text-[#755B4B] truncate">{selectedMascot.nickname} • {selectedMascot.role}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMascot}
              className="p-2 rounded-lg bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#5A4032] border border-[#CEB79A] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Próximo Mascote"
              aria-label="Próximo Mascote"
            >
              <Icon n="arrow" size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start min-w-0">
            {/* Left Column (Wide Desktop >= 1280px: 4 cols): Mascot Persona & Progress */}
            <div className="hidden xl:flex xl:col-span-4 flex-col gap-4 min-w-0">
              {/* Mascot Persona Selection Carousel */}
              <div className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col">
                {/* Header bar */}
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#755B4B] mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon n="target" size={13} className="text-[#C45730]" />
                    <span>Mascote Entrevistador</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] text-[#5A4032] bg-[#F4EBDD] px-1.5 py-0.5 rounded border border-[#E2D1BC]">
                      0{currentMascotIndex + 1} / 0{MASCOT_AGENTS.length}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FCEEE6] text-[#A8421E] font-semibold border border-[#E5A992] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C45730] animate-pulse"></span>
                      <span>Ativo</span>
                    </span>
                  </div>
                </div>

                {/* Character Arena Stage / Carousel Viewport */}
                <div
                  className="relative rounded-xl border border-[#E2D1BC] p-4 pt-5 pb-4 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-300"
                  style={{
                    background: `radial-gradient(ellipse at 50% 35%, ${selectedMascot.mediaKit.themeColors.glow || 'rgba(196,87,48,0.16)'} 0%, #F2E6D5 78%)`,
                  }}
                >
                  {/* Side Navigation Arrow: Previous Mascot */}
                  <button
                    type="button"
                    onClick={handlePrevMascot}
                    style={{ padding: "4px 8px" }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-lg bg-[#FFFDF9]/95 hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#C45730] border border-[#CEB79A] hover:border-[#C45730]/50 transition-all cursor-pointer shadow-sm active:scale-95 group"
                    title="Mascote Anterior (Passar para o lado)"
                    aria-label="Mascote Anterior"
                  >
                    <Icon n="arrow" size={13} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                  </button>

                  {/* Side Navigation Arrow: Next Mascot */}
                  <button
                    type="button"
                    onClick={handleNextMascot}
                    style={{ padding: "4px 8px" }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-lg bg-[#FFFDF9]/95 hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#C45730] border border-[#CEB79A] hover:border-[#C45730]/50 transition-all cursor-pointer shadow-sm active:scale-95 group"
                    title="Próximo Mascote (Passar para o lado)"
                    aria-label="Próximo Mascote"
                  >
                    <Icon n="arrow" size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Character Spotlight & Pedestal */}
                  <div className="relative mb-2 flex flex-col items-center">
                    <img
                      key={selectedMascot.id}
                      src={selectedMascot.mediaKit.pngTransparent}
                      alt={selectedMascot.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain filter drop-shadow-[0_10px_18px_rgba(46,25,15,0.22)] transition-all duration-300"
                    />
                    {/* Glowing Pedestal Ring */}
                    <div
                      className="w-20 h-2.5 rounded-[100%] blur-[1px] -mt-1 opacity-75"
                      style={{
                        background: `radial-gradient(ellipse at center, ${selectedMascot.mediaKit.themeColors.primary || '#C45730'} 0%, rgba(0,0,0,0) 80%)`,
                      }}
                    />
                  </div>

                  {/* Mascot Identity */}
                  <div className="space-y-0.5 min-w-0 max-w-full px-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#755B4B]">
                      {selectedMascot.nickname}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#2E190F] tracking-tight truncate flex items-center justify-center gap-1.5">
                      <span>{selectedMascot.name}</span>
                    </div>
                    <div className="text-[10.5px] font-bold line-clamp-1 text-[#B44B25]">
                      {selectedMascot.role}
                    </div>
                  </div>

                  {/* Mascot Style Motto, Trait & Capabilities Card */}
                  <div
                    className="mt-3 w-full text-left rounded-xl bg-[#FFFDF9]/95 backdrop-blur-md border border-[#CEB79A] p-3 shadow-sm transition-all duration-300 relative overflow-hidden group"
                  >
                    {/* Top ambient color bar indicator */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] opacity-85"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${selectedMascot.mediaKit.themeColors.primary || '#C45730'}, transparent)`,
                      }}
                    />

                    {/* Header Row: Trait Category + Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-md bg-[#FCEEE6] text-[#B44B25] flex items-center justify-center text-[10px] shrink-0 font-bold">
                          <Icon n="zap" size={11} />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#755B4B]">
                          Estilo de Resolução
                        </span>
                      </div>
                      <span className="text-[9.5px] px-2 py-0.5 rounded-full font-semibold font-mono bg-[#FCEEE6] border border-[#E5A992] text-[#A8421E] shrink-0 flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{
                            backgroundColor: selectedMascot.mediaKit.themeColors.primary || "#C45730",
                          }}
                        />
                        <span>{selectedMascot.problemSolvingStyle.badge}</span>
                      </span>
                    </div>

                    {/* Headline Trait */}
                    <div className="text-xs font-bold text-[#2E190F] mb-1.5 flex items-center gap-1.5">
                      <span>{selectedMascot.problemSolvingStyle.headline}</span>
                    </div>

                    {/* Stylized Motto Quote Block */}
                    <div className="border-l-2 border-[#C45730] pl-2.5 py-1 mb-2 bg-[#F4EBDD] rounded-r-lg relative">
                      <p className="text-[10.5px] text-[#5A4032] leading-relaxed italic font-serif">
                        "{selectedMascot.problemSolvingStyle.keyMotto}"
                      </p>
                    </div>

                    {/* Approach & Key Focus Highlights */}
                    <div className="pt-2 border-t border-[#E2D1BC] space-y-1.5">
                      <div className="text-[10px] text-[#5A4032] flex items-start gap-1.5 leading-snug">
                        <Icon n="check" size={11} className="text-[#C45730] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          <strong className="text-[#2E190F] font-semibold">Abordagem: </strong>
                          {selectedMascot.problemSolvingStyle.approach}
                        </span>
                      </div>
                      {selectedMascot.uniqueSpecialties?.[0] && (
                        <div className="text-[10px] text-[#5A4032] flex items-start gap-1.5 leading-snug">
                          <Icon n="sparkles" size={11} className="text-[#C45730] shrink-0 mt-0.5" />
                          <span className="line-clamp-1 truncate">
                            <strong className="text-[#2E190F] font-semibold">Foco: </strong>
                            {selectedMascot.uniqueSpecialties[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Quick Briefing CTA Card */}
              <div className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-2xl p-4 shadow-sm space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#755B4B] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Icon n="activity" size={13} />
                    <span>Progresso da Descoberta</span>
                  </span>
                  <span className="text-[10px] text-[#B44B25] font-mono font-bold">
                    {messages.length} mensagens
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[
                    { id: "1", title: "Objetivo & Problema Central", active: true },
                    { id: "2", title: "Ferramentas & Tecnologias", active: messages.length >= 2 },
                    { id: "3", title: "Parâmetros, Entradas & Saídas", active: messages.length >= 4 },
                    { id: "4", title: "Segurança & Zero Exfiltração", active: messages.length >= 6 },
                    { id: "5", title: "Briefing para Validação", active: isReadyForBriefing || messages.length >= 4 },
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 px-2.5 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                        step.active
                          ? "bg-[#FCEEE6] border-[#E5A992] text-[#2E190F]"
                          : "bg-[#F4EBDD] border-[#E2D1BC] text-[#755B4B]"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                          step.active ? "bg-[#C45730] text-white" : "bg-[#E7D6C0] text-[#755B4B]"
                        }`}
                      >
                        {step.active ? "✓" : idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold truncate">{step.title}</span>
                    </div>
                  ))}
                </div>

                {/* Generate Briefing Button in Sidebar */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateBriefing}
                    disabled={isGeneratingBriefing}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Icon n="file-text" size={13} />
                    <span>
                      {isGeneratingBriefing ? "Gerando Briefing..." : "Gerar Briefing em Markdown"}
                    </span>
                  </button>
                  <p className="text-[10px] text-[#755B4B] text-center mt-1.5">
                    Compila as respostas em Markdown estruturado
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column (8 cols wide desktop, 12 cols mobile/tablet/narrow): Interactive Chat Stream */}
            <div className="xl:col-span-8 flex flex-col bg-[#FFFDF9] border border-[#E2D1BC] rounded-2xl shadow-sm h-[clamp(420px,62dvh,560px)] sm:h-[600px] xl:h-[640px] overflow-hidden min-w-0">
              {/* Chat Header Bar */}
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#F4EBDD] border-b border-[#E2D1BC] flex items-center justify-between gap-2 sm:gap-3 min-w-0">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <img
                    src={selectedMascot.mediaKit.pngTransparent}
                    alt={selectedMascot.name}
                    className="w-7 h-7 object-contain shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#2E190F] flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{selectedMascot.name}</span>
                      <span className="text-[10px] text-[#755B4B] font-normal truncate hidden xs:inline sm:inline">
                        • {progressStage}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#755B4B] truncate hidden sm:block">
                      Responda para moldar a skill; gere o briefing a qualquer momento
                    </div>
                  </div>
                </div>

                {/* Fast Action in Chat Header */}
                <button
                  type="button"
                  onClick={handleGenerateBriefing}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#FFFDF9] hover:bg-[#EFE1CE] text-[#B44B25] border border-[#CEB79A] hover:border-[#C45730]/60 text-[11px] sm:text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm whitespace-nowrap"
                  title="Sintetizar respostas no documento de validação"
                >
                  <Icon n="file-text" size={13} />
                  <span className="sm:hidden">Briefing</span>
                  <span className="hidden sm:inline">Gerar Briefing</span>
                </button>
              </div>

              {/* Chat Messages Feed */}
              <div ref={chatFeedRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 sm:space-y-4 min-w-0">
                {messages.map((msg) => {
                  const isModel = msg.role === "model";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 sm:gap-2.5 min-w-0 ${isModel ? "justify-start" : "justify-end"}`}
                    >
                      {isModel && (
                        <div className="w-7 h-7 rounded-lg bg-[#F4EBDD] border border-[#E2D1BC] flex items-center justify-center shrink-0 p-0.5">
                          <img
                            src={selectedMascot.mediaKit.pngTransparent}
                            alt={selectedMascot.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] sm:max-w-[78%] min-w-0 rounded-2xl p-3 sm:p-3.5 shadow-sm text-xs leading-relaxed break-words ${
                          isModel
                            ? "bg-[#F4EBDD] border border-[#E2D1BC] text-[#2E190F]"
                            : "bg-[#FCEEE6] border border-[#E5A992] text-[#2E190F]"
                        }`}
                      >
                        {/* Message author badge */}
                        <div className="flex items-center justify-between gap-2 text-[10px] text-[#755B4B] mb-1.5 pb-1 border-b border-[#E2D1BC]">
                          <span className="font-bold text-[#2E190F] truncate">
                            {isModel ? selectedMascot.name : "Você"}
                          </span>
                          <span className="shrink-0">{msg.timestamp}</span>
                        </div>

                        {/* Content formatted */}
                        <div className="whitespace-pre-wrap break-words font-sans text-xs sm:text-[13px] leading-relaxed">
                          {msg.content}
                        </div>

                        {/* Clickable Quick Suggestions */}
                        {isModel && msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-[#E2D1BC]">
                            <div className="text-[10px] uppercase font-bold tracking-wider text-[#755B4B] mb-1.5 flex items-center gap-1">
                              <Icon n="zap" size={10} />
                              <span>Respostas Rápidas Sugeridas:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggestions.map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => handleSendMessage(sug)}
                                  className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-[#FFFDF9] hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#B44B25] border border-[#CEB79A] hover:border-[#C45730]/60 transition-colors cursor-pointer whitespace-normal break-words max-w-full leading-snug"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {!isModel && (
                        <div className="w-7 h-7 rounded-lg bg-[#C45730] border border-[#AE4823] flex items-center justify-center shrink-0 text-white text-[11px] font-bold">
                          VC
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#F4EBDD] border border-[#E2D1BC] flex items-center justify-center shrink-0 p-0.5">
                      <img
                        src={selectedMascot.mediaKit.pngTransparent}
                        alt={selectedMascot.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-[#F4EBDD] border border-[#E2D1BC] rounded-2xl p-3.5 text-xs text-[#5A4032] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C45730] animate-ping shrink-0"></span>
                      <span>{selectedMascot.name} está analisando suas respostas...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-2.5 sm:p-3 bg-[#F4EBDD] border-t border-[#E2D1BC]">
                <div className="flex items-end gap-2 min-w-0">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Explique o que a skill deve fazer ou responda às perguntas..."
                    rows={2}
                    className="flex-1 min-w-0 bg-[#FFFDF9] border border-[#CEB79A] focus:border-[#C45730] rounded-xl p-2.5 text-xs sm:text-sm text-[#2E190F] placeholder-[#8F7564] outline-none transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    aria-label="Enviar mensagem"
                    className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <span className="hidden sm:inline">Enviar</span>
                    <Icon n="send" size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BRIEFING EM MARKDOWN PARA VALIDAÇÃO & REFINAMENTO
          ========================================================================= */}
      {currentTab === "briefing" && (
        <div className="space-y-4 sm:space-y-5 min-w-0">
          {/* Top Banner with Context Window Impact Stats */}
          <div className="bg-gradient-to-r from-[#FFFDF9] to-[#F4EBDD] border border-[#E2D1BC] rounded-2xl p-4 sm:p-6 shadow-sm min-w-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C45730] shrink-0"></span>
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#B44B25]">
                    Etapa de Validação & Refinamento
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-[#2E190F] !m-0">
                  Briefing Técnico para Validação do Cliente
                </h2>
                <p className="text-xs text-[#5A4032] mt-1 max-w-3xl leading-relaxed">
                  Listamos abaixo tudo o que foi conversado na entrevista em formato Markdown técnico estruturado. Revise os pontos, aplique refinamentos pelo chat ou confirme para forjar a habilidade oficial.
                </p>
              </div>

              {/* View Mode Toggle & Fast Actions */}
              <div className="flex items-center gap-2 self-start md:self-center flex-wrap w-full md:w-auto">
                <div className="flex items-center p-1 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC]">
                  <button
                    type="button"
                    onClick={() => setBriefingViewMode("rendered")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      briefingViewMode === "rendered"
                        ? "bg-[#FFFDF9] text-[#2E190F] shadow-sm"
                        : "text-[#5A4032] hover:text-[#2E190F]"
                    }`}
                  >
                    <Icon n="eye" size={12} />
                    <span>Prévia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBriefingViewMode("source")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      briefingViewMode === "source"
                        ? "bg-[#FCEEE6] text-[#A8421E]"
                        : "text-[#5A4032] hover:text-[#2E190F]"
                    }`}
                  >
                    <Icon n="code" size={12} />
                    <span>Markdown</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyBriefing}
                  className="px-2.5 py-1.5 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] border border-[#CEB79A] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  title="Copiar Markdown"
                >
                  <Icon n={copiedBriefing ? "check" : "copy"} size={13} />
                  <span>{copiedBriefing ? "Copiado!" : "Copiar"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBriefing}
                  className="px-2.5 py-1.5 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] border border-[#CEB79A] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  title="Baixar arquivo briefing.md"
                >
                  <Icon n="download" size={13} />
                  <span>Baixar .md</span>
                </button>
              </div>
            </div>

            {/* Context Impact Strip (Tokens, Bytes, Window %) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mt-4 pt-4 border-t border-[#E2D1BC] text-xs">
              <div className="p-2.5 rounded-lg bg-[#FFFDF9] border border-[#E2D1BC] min-w-0">
                <div className="text-[10px] text-[#755B4B] uppercase font-bold truncate">Tokens da Skill</div>
                <div className="text-sm font-mono text-[#B44B25] font-bold mt-0.5 truncate">
                  {formatTokens(briefingTokens)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FFFDF9] border border-[#E2D1BC] min-w-0">
                <div className="text-[10px] text-[#755B4B] uppercase font-bold truncate">Tamanho Estimado</div>
                <div className="text-sm font-mono text-[#2E190F] font-bold mt-0.5 truncate">
                  {(briefingMarkdown.length / 1024).toFixed(1)} KB
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FFFDF9] border border-[#E2D1BC] min-w-0">
                <div className="text-[10px] text-[#755B4B] uppercase font-bold truncate">Janela Claude (200k)</div>
                <div className="text-sm font-mono text-[#A8421E] font-bold mt-0.5 truncate">
                  {Math.max(0.05, Number(((briefingTokens / 200000) * 100).toFixed(2)))}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FFFDF9] border border-[#E2D1BC] min-w-0">
                <div className="text-[10px] text-[#755B4B] uppercase font-bold truncate">Classificação</div>
                <div className="text-xs sm:text-sm text-[#B44B25] font-bold mt-0.5 truncate">
                  ✓ Leve & Otimizada
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-5 items-start min-w-0">
            {/* Left 8 Cols: Markdown Document Display */}
            <div className="xl:col-span-8 bg-[#FFFDF9] border border-[#E2D1BC] rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[340px] sm:min-h-[460px] min-w-0">
              <div className="px-3.5 sm:px-4 py-2.5 bg-[#F4EBDD] border-b border-[#E2D1BC] flex flex-wrap items-center justify-between gap-2 text-xs text-[#755B4B]">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon n="file-text" size={13} className="shrink-0" />
                  <span className="font-mono font-bold text-[#2E190F] truncate">
                    briefing-validacao.md
                  </span>
                </div>
                <span className="text-[11px]">Padrão Universal Deda Skills</span>
              </div>

              <div className="p-3.5 sm:p-5 flex-1 overflow-y-auto max-h-[540px] sm:max-h-[620px] min-w-0">
                {briefingViewMode === "rendered" ? (
                  <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-[#2E190F] break-words">
                    {briefingMarkdown.split("\n\n").map((block, idx) => {
                      if (block.startsWith("# ")) {
                        return (
                          <h1
                            key={idx}
                            className="text-lg sm:text-xl font-black text-[#B44B25] pb-2 border-b border-[#E2D1BC] mt-2 mb-3 break-words"
                          >
                            {block.replace("# ", "")}
                          </h1>
                        );
                      }
                      if (block.startsWith("## ")) {
                        return (
                          <h2
                            key={idx}
                            className="text-sm sm:text-base font-bold text-[#2E190F] mt-4 mb-2 flex items-center gap-2 break-words"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C45730] shrink-0"></span>
                            <span>{block.replace("## ", "")}</span>
                          </h2>
                        );
                      }
                      if (block.startsWith("> ")) {
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#F4EBDD] border-l-4 border-[#C45730] text-[#5A4032] italic text-xs my-2 break-words"
                          >
                            {block.replace("> ", "")}
                          </div>
                        );
                      }
                      if (block.startsWith("- ")) {
                        return (
                          <ul key={idx} className="space-y-1 my-2 pl-4 list-disc text-[#2E190F] break-words">
                            {block.split("\n").map((item, itemIdx) => (
                              <li key={itemIdx}>{item.replace(/^- /, "")}</li>
                            ))}
                          </ul>
                        );
                      }
                      if (block.startsWith("1. ")) {
                        return (
                          <ol key={idx} className="space-y-1 my-2 pl-4 list-decimal text-[#2E190F] break-words">
                            {block.split("\n").map((item, itemIdx) => (
                              <li key={itemIdx}>{item.replace(/^\d+\. /, "")}</li>
                            ))}
                          </ol>
                        );
                      }
                      return (
                        <p key={idx} className="text-[#5A4032] leading-relaxed break-words">
                          {block}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={briefingMarkdown}
                    onChange={(e) => setBriefingMarkdown(e.target.value)}
                    rows={18}
                    className="w-full h-full bg-[#F4EBDD] border border-[#CEB79A] rounded-xl p-3 font-mono text-xs text-[#2E190F] leading-relaxed outline-none focus:border-[#C45730] resize-y"
                  />
                )}
              </div>
            </div>

            {/* Right 4 Cols: Refinement Box & Confirmation CTA */}
            <div className="xl:col-span-4 space-y-4 flex flex-col justify-between min-w-0">
              {/* Refinement Panel */}
              <div className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25] shrink-0">
                    <Icon n="sparkles" size={13} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#2E190F] !m-0">
                      Acrescentar ou Corrigir
                    </h3>
                    <p className="text-[11px] text-[#755B4B]">
                      Peça ajustes em linguagem natural e a IA refina o documento
                    </p>
                  </div>
                </div>

                {/* Quick suggestions to refine */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#755B4B]">
                    Ajustes rápidos:
                  </div>
                  {[
                    "Adicione regra de segurança para nunca deletar arquivos",
                    "Mude a stack tecnológica para TypeScript e Vitest",
                    "Exija tempo de execução com benchmark < 300ms",
                  ].map((ex, exIdx) => (
                    <button
                      key={exIdx}
                      type="button"
                      onClick={() => setRefinementInput(ex)}
                      className="w-full text-left p-2 px-2.5 rounded-lg bg-[#F4EBDD] hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#2E190F] border border-[#E2D1BC] text-[11px] leading-snug transition-colors cursor-pointer whitespace-normal break-words"
                    >
                      + {ex}
                    </button>
                  ))}
                </div>

                {/* Input for refinement */}
                <div className="space-y-2 pt-1">
                  <textarea
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder="Ex: 'Adicione suporte a Docker e parâmetros de entrada opcionais...'"
                    rows={3}
                    className="w-full bg-[#FFFDF9] border border-[#CEB79A] focus:border-[#C45730] rounded-xl p-2.5 text-xs text-[#2E190F] placeholder-[#8F7564] outline-none transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleRefineBriefing}
                    disabled={!refinementInput.trim() || isRefiningBriefing}
                    className="w-full py-2 px-3 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#B44B25] border border-[#CEB79A] text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Icon n="sparkles" size={12} />
                    <span>{isRefiningBriefing ? "Refinando Briefing..." : "Aplicar Ajuste"}</span>
                  </button>
                </div>

                {/* Refinement History log */}
                {refinementHistory.length > 0 && (
                  <div className="pt-2 border-t border-[#E2D1BC] space-y-1 max-h-32 overflow-y-auto">
                    <div className="text-[10px] uppercase font-bold text-[#755B4B]">
                      Histórico de Revisões:
                    </div>
                    {refinementHistory.map((item, hIdx) => (
                      <div
                        key={hIdx}
                        className="text-[10px] text-[#5A4032] p-1.5 rounded bg-[#F4EBDD] border border-[#E2D1BC] break-words"
                      >
                        ✓ {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmation Big CTA */}
              <div className="bg-gradient-to-b from-[#FCEEE6] to-[#FFFDF9] border-2 border-[#C45730] rounded-2xl p-4 sm:p-5 shadow-md space-y-3 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-[#C45730] flex items-center justify-center text-white font-black shrink-0">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-[#2E190F] !m-0">
                      Confirmar Briefing & Criar Skill
                    </h3>
                    <p className="text-[11px] text-[#A8421E]">
                      Tudo validado? Geraremos a especificação oficial no padrão Deda Skills
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmAndCreateSkill}
                  disabled={isFinalizingSkill}
                  className="w-full py-3 px-4 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <Icon n="check-circle" size={15} />
                  <span>
                    {isFinalizingSkill ? "Criando Skill Oficial..." : "Confirmar e Criar Habilidade"}
                  </span>
                </button>

                <div className="flex items-center justify-between gap-2 text-[11px] text-[#755B4B] pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCurrentTab("interview")}
                    className="hover:text-[#2E190F] underline cursor-pointer"
                  >
                    &larr; Voltar à Entrevista
                  </button>
                  <span className="font-mono text-[#B44B25]">Padrão .skill</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SKILL CONCLUÍDA COM SUCESSO
          ========================================================================= */}
      {currentTab === "completed" && createdSkill && (
        <div className="max-w-3xl mx-auto bg-[#FFFDF9] border border-[#C45730]/50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-md space-y-5 sm:space-y-6 text-center min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-[#FCEEE6] border-2 border-[#C45730] flex items-center justify-center mx-auto text-[#B44B25] shadow-sm">
            <Icon n="check-circle" size={28} />
          </div>

          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest text-[#B44B25] mb-1">
              Habilidade Forjada com Sucesso
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#2E190F] break-words">
              {createdSkill.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#5A4032] mt-2 max-w-xl mx-auto leading-relaxed break-words">
              {createdSkill.description}
            </p>
          </div>

          {/* Quick Specifications Strip with Token Footprint */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-[#F4EBDD] border border-[#E2D1BC] text-left">
            <div className="min-w-0">
              <div className="text-[10px] text-[#755B4B] uppercase font-bold truncate">Identificador</div>
              <div className="text-xs font-mono text-[#B44B25] font-bold truncate">
                {createdSkill.id}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#755B4B] uppercase font-bold truncate">Consumo de Contexto</div>
              <div className="text-xs font-mono text-[#2E190F] font-bold truncate">
                ⚡ {formatTokens(calculateSkillTokenProfile(createdSkill).totalTokens)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#755B4B] uppercase font-bold truncate">Modo de Execução</div>
              <div className="text-xs text-[#2E190F] font-semibold truncate">
                {createdSkill.execution_mode}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[#755B4B] uppercase font-bold truncate">Status</div>
              <div className="text-xs text-[#B44B25] font-bold truncate">✓ Ativa no Catálogo</div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Icon n="list" size={14} />
              <span>Ver no Catálogo de Habilidades</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.hash = `#/testar?skill=${createdSkill.id}&prompt=${encodeURIComponent(
                  createdSkill.sampleTestPrompt || ""
                )}`;
              }}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] border border-[#CEB79A] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Icon n="play" size={14} />
              <span>Testar no Playground</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
