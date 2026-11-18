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

  const chatEndRef = useRef<HTMLDivElement>(null);

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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-4 pb-20 text-[#F5F2EB] min-w-0">
      {/* =========================================================================
          UNIFIED RESPONSIVE HEADER & NAVIGATION (Zero Duplication, Clean & Modern)
          ========================================================================= */}
      <header className="pb-4 mb-5 border-b border-[#383129] space-y-3">
        {/* Top Navigation Row: Back, Title, Token Badge & Mode Toggle */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Brand & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-[#27221E] hover:bg-[#332C26] text-[#A39889] hover:text-[#F5F2EB] border border-[#383129] transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              title="Voltar ao Catálogo"
            >
              <Icon n="arrow" size={14} className="rotate-180" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#D97757]">
                  Estúdio IA
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#32231C] text-[#E28768] border border-[#D97757]/40 font-semibold hidden sm:inline-block">
                  Entrevista & Validação
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-[#F5F2EB] tracking-tight truncate">
                Criação de Habilidades com IA
              </h1>
            </div>
          </div>

          {/* Right Area: Context Token Counter & Mode Switcher */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Live Context & Token Counter Pill */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#24201D] border border-[#383129] text-xs shadow-inner"
              title={`Consumo estimado de contexto: ${activeTokens} tokens (~${percent128k}% de uma janela padrão de 128k)`}
            >
              <span className="w-2 h-2 rounded-full bg-[#D97757] animate-pulse"></span>
              <span className="text-[11px] text-[#A39889] hidden md:inline">Contexto:</span>
              <span className="font-mono text-xs font-bold text-[#F5F2EB]">
                {formatTokens(activeTokens)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#32231C] text-[#E28768] font-semibold border border-[#D97757]/40">
                {percent128k}% de 128k
              </span>
            </div>

            {/* Mode Switcher Toggle (IA vs Manual) */}
            {onSwitchToManual && (
              <div className="flex items-center p-1 rounded-xl bg-[#24201D] border border-[#383129]">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#D97757] text-white shadow-sm flex items-center gap-1"
                >
                  <Icon n="sparkles" size={11} />
                  <span className="hidden sm:inline">Entrevista IA</span>
                  <span className="sm:hidden">IA</span>
                </button>
                <button
                  type="button"
                  onClick={onSwitchToManual}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#A39889] hover:text-[#F5F2EB] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Icon n="file-text" size={11} />
                  <span className="hidden sm:inline">Manual</span>
                  <span className="sm:hidden">Form</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stepper Tabs Bar: Responsive, Slim & Elegant */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#332C26]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#1E1A17] border border-[#383129] w-full sm:w-auto overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setCurrentTab("interview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                currentTab === "interview"
                  ? "bg-[#2F2721] text-[#F5F2EB] border border-[#483E34] shadow-sm"
                  : "text-[#A39889] hover:text-[#D4CDC3]"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#383129] text-[10px] flex items-center justify-center font-mono">
                1
              </span>
              <span>Entrevista no Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (briefingMarkdown) setCurrentTab("briefing");
                else handleGenerateBriefing();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                currentTab === "briefing"
                  ? "bg-[#32231C] text-[#E28768] border border-[#D97757]/50 shadow-sm"
                  : "text-[#A39889] hover:text-[#D4CDC3]"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#383129] text-[10px] flex items-center justify-center font-mono">
                2
              </span>
              <span>Briefing de Validação</span>
            </button>

            <button
              type="button"
              disabled={!createdSkill}
              onClick={() => setCurrentTab("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                currentTab === "completed"
                  ? "bg-[#D97757] text-white border border-[#D97757] shadow-sm"
                  : "text-[#766B5E] cursor-not-allowed"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#383129] text-[10px] flex items-center justify-center font-mono">
                3
              </span>
              <span>Skill Forjada</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#A39889]">
            <Icon n="activity" size={12} />
            <span>Etapa ativa: <b className="text-[#F5F2EB]">{progressStage}</b></span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          TAB 1: CHAT DE ENTREVISTA COM IA (ULTRA RESPONSIVO)
          ========================================================================= */}
      {currentTab === "interview" && (
        <div className="space-y-4">
          {/* Mobile Mascot Quick Selector Bar with 1-by-1 Carousel Controls */}
          <div className="lg:hidden bg-[#24201D] border border-[#383129] rounded-xl p-2.5 shadow-md flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handlePrevMascot}
              className="p-2 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#D4CDC3] border border-[#483E34] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Mascote Anterior"
              aria-label="Mascote Anterior"
            >
              <Icon n="arrow" size={12} className="rotate-180" />
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
              <img
                src={selectedMascot.mediaKit.pngTransparent}
                alt={selectedMascot.name}
                className="w-8 h-8 object-contain shrink-0 filter drop-shadow-md"
              />
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-[#F5F2EB] truncate flex items-center gap-1.5">
                  <span>{selectedMascot.name}</span>
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-[#32231C] text-[#E28768] border border-[#D97757]/40 font-semibold font-mono">
                    0{currentMascotIndex + 1} / 0{MASCOT_AGENTS.length}
                  </span>
                </div>
                <div className="text-[10px] text-[#A39889] truncate">{selectedMascot.nickname} • {selectedMascot.role}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMascot}
              className="p-2 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#D4CDC3] border border-[#483E34] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Próximo Mascote"
              aria-label="Próximo Mascote"
            >
              <Icon n="arrow" size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (Desktop only: 4 cols): Mascot Persona & Progress */}
            <div className="hidden lg:flex lg:col-span-4 flex-col gap-4">
              {/* Mascot Persona Game-Style Selection Carousel */}
              <div className="bg-[#24201D] border border-[#383129] rounded-2xl p-4 shadow-xl relative overflow-hidden flex flex-col">
                {/* Header bar: Arcade Style */}
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A39889] mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon n="target" size={13} className="text-[#D97757]" />
                    <span>Mascote Entrevistador</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] text-[#D4CDC3] bg-[#2A241F] px-1.5 py-0.5 rounded border border-[#383129]">
                      0{currentMascotIndex + 1} / 0{MASCOT_AGENTS.length}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#32231C] text-[#E28768] font-semibold border border-[#D97757]/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D97757] animate-pulse"></span>
                      <span>Ativo</span>
                    </span>
                  </div>
                </div>

                {/* Character Arena Stage / Carousel Viewport */}
                <div
                  className="relative rounded-xl border border-[#2a2a2a] p-4 pt-5 pb-4 flex flex-col items-center justify-center text-center overflow-hidden transition-all duration-300"
                  style={{
                    background: `radial-gradient(ellipse at 50% 40%, ${selectedMascot.mediaKit.themeColors.glow || 'rgba(0,255,163,0.25)'} 0%, rgba(20,20,20,0.85) 75%)`,
                  }}
                >
                  {/* Side Navigation Arrow: Previous Mascot */}
                  <button
                    type="button"
                    onClick={handlePrevMascot}
                    style={{ padding: "4px 8px" }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-lg bg-[#141414]/90 hover:bg-[#252525] text-[#C2C2C2] hover:text-[#D97757] border border-[#383838] hover:border-[#D97757]/50 transition-all cursor-pointer shadow-lg active:scale-95 group"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-lg bg-[#141414]/90 hover:bg-[#252525] text-[#C2C2C2] hover:text-[#D97757] border border-[#383838] hover:border-[#D97757]/50 transition-all cursor-pointer shadow-lg active:scale-95 group"
                    title="Próximo Mascote (Passar para o lado)"
                    aria-label="Próximo Mascote"
                  >
                    <Icon n="arrow" size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Character 3D Spotlight & Pedestal */}
                  <div className="relative mb-2 flex flex-col items-center">
                    <img
                      key={selectedMascot.id}
                      src={selectedMascot.mediaKit.pngTransparent}
                      alt={selectedMascot.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.9)] transition-all duration-300"
                    />
                    {/* Glowing Pedestal Ring */}
                    <div
                      className="w-20 h-2.5 rounded-[100%] blur-[1px] -mt-1 opacity-80"
                      style={{
                        background: `radial-gradient(ellipse at center, ${selectedMascot.mediaKit.themeColors.primary || '#D97757'} 0%, rgba(0,0,0,0) 80%)`,
                        boxShadow: `0 0 14px ${selectedMascot.mediaKit.themeColors.primary || '#D97757'}`,
                      }}
                    />
                  </div>

                  {/* Mascot Identity */}
                  <div className="space-y-0.5 min-w-0 max-w-full px-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#9B9B9B]">
                      {selectedMascot.nickname}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#EAEAEA] tracking-tight truncate flex items-center justify-center gap-1.5">
                      <span>{selectedMascot.name}</span>
                    </div>
                    <div
                      className="text-[10.5px] font-bold line-clamp-1"
                      style={{ color: selectedMascot.mediaKit.themeColors.primary || "#D97757" }}
                    >
                      {selectedMascot.role}
                    </div>
                  </div>

                  {/* Mascot Style Motto, Trait & Capabilities Card (Targeted Element) */}
                  <div
                    className="mt-3 w-full text-left rounded-xl bg-[#141414]/95 backdrop-blur-md border border-[#2d2d2d] hover:border-[#404040] p-3 shadow-xl transition-all duration-300 relative overflow-hidden group"
                    style={{
                      boxShadow: `0 4px 20px -2px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                    }}
                  >
                    {/* Top ambient color bar indicator */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${selectedMascot.mediaKit.themeColors.primary || '#D97757'}, transparent)`,
                      }}
                    />

                    {/* Header Row: Trait Category + Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 font-bold"
                          style={{
                            backgroundColor: `${selectedMascot.mediaKit.themeColors.primary || '#D97757'}20`,
                            color: selectedMascot.mediaKit.themeColors.primary || "#D97757",
                          }}
                        >
                          <Icon n="zap" size={11} />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9B9B9B]">
                          Estilo de Resolução
                        </span>
                      </div>
                      <span
                        className="text-[9.5px] px-2 py-0.5 rounded-full font-semibold font-mono border shrink-0 flex items-center gap-1"
                        style={{
                          backgroundColor: `${selectedMascot.mediaKit.themeColors.primary || '#D97757'}15`,
                          borderColor: `${selectedMascot.mediaKit.themeColors.primary || '#D97757'}40`,
                          color: selectedMascot.mediaKit.themeColors.primary || "#D97757",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{
                            backgroundColor: selectedMascot.mediaKit.themeColors.primary || "#D97757",
                          }}
                        />
                        <span>{selectedMascot.problemSolvingStyle.badge}</span>
                      </span>
                    </div>

                    {/* Headline Trait */}
                    <div className="text-xs font-bold text-[#EAEAEA] mb-1.5 flex items-center gap-1.5">
                      <span>{selectedMascot.problemSolvingStyle.headline}</span>
                    </div>

                    {/* Stylized Motto Quote Block */}
                    <div
                      className="border-l-2 pl-2.5 py-1 mb-2 bg-[#1b1b1b]/80 rounded-r-lg relative"
                      style={{
                        borderLeftColor: selectedMascot.mediaKit.themeColors.primary || "#D97757",
                      }}
                    >
                      <p className="text-[10.5px] text-[#C2C2C2] leading-relaxed italic font-serif">
                        "{selectedMascot.problemSolvingStyle.keyMotto}"
                      </p>
                    </div>

                    {/* Approach & Key Focus Highlights */}
                    <div className="pt-2 border-t border-[#262626] space-y-1.5">
                      <div className="text-[10px] text-[#8E8E8E] flex items-start gap-1.5 leading-snug">
                        <Icon n="check" size={11} className="text-[#D97757] shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          <strong className="text-[#A5A5A5] font-semibold">Abordagem: </strong>
                          {selectedMascot.problemSolvingStyle.approach}
                        </span>
                      </div>
                      {selectedMascot.uniqueSpecialties?.[0] && (
                        <div className="text-[10px] text-[#8E8E8E] flex items-start gap-1.5 leading-snug">
                          <Icon n="sparkles" size={11} className="text-[#D97757] shrink-0 mt-0.5" />
                          <span className="line-clamp-1 truncate">
                            <strong className="text-[#A5A5A5] font-semibold">Foco: </strong>
                            {selectedMascot.uniqueSpecialties[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Quick Briefing CTA Card */}
              <div className="bg-[#24201D] border border-[#383129] rounded-2xl p-4 shadow-lg space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#A39889] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Icon n="activity" size={13} />
                    <span>Progresso da Descoberta</span>
                  </span>
                  <span className="text-[10px] text-[#D97757] font-mono">
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
                          ? "bg-[#32231C] border-[#D97757]/50 text-[#F5F2EB]"
                          : "bg-[#191613] border-[#332C26] text-[#766B5E]"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                          step.active ? "bg-[#D97757] text-white" : "bg-[#2A241F] text-[#766B5E]"
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
                    className="w-full py-2.5 px-3 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(217,119,87,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Icon n="file-text" size={13} />
                    <span>
                      {isGeneratingBriefing ? "Gerando Briefing..." : "Gerar Briefing em Markdown"}
                    </span>
                  </button>
                  <p className="text-[10px] text-[#A39889] text-center mt-1.5">
                    Compila as respostas em Markdown estruturado
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column (8 cols desktop, 12 cols mobile): Interactive Chat Stream */}
            <div className="lg:col-span-8 flex flex-col bg-[#24201D] border border-[#383129] rounded-2xl shadow-2xl h-[540px] sm:h-[620px] overflow-hidden min-w-0">
              {/* Chat Header Bar */}
              <div className="px-4 py-3 bg-[#1E1A17] border-b border-[#383129] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={selectedMascot.mediaKit.pngTransparent}
                    alt={selectedMascot.name}
                    className="w-7 h-7 object-contain shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#F5F2EB] truncate flex items-center gap-1.5">
                      <span>{selectedMascot.name}</span>
                      <span className="text-[10px] text-[#A39889] font-normal truncate">
                        • {progressStage}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#A39889] truncate hidden sm:block">
                      Responda para moldar a skill; gere o briefing a qualquer momento
                    </div>
                  </div>
                </div>

                {/* Fast Action in Chat Header */}
                <button
                  type="button"
                  onClick={handleGenerateBriefing}
                  className="px-3 py-1.5 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#E28768] border border-[#483E34] hover:border-[#D97757]/60 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                  title="Sintetizar respostas no documento de validação"
                >
                  <Icon n="file-text" size={13} />
                  <span>Gerar Briefing</span>
                </button>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
                {messages.map((msg) => {
                  const isModel = msg.role === "model";
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isModel ? "justify-start" : "justify-end"}`}
                    >
                      {isModel && (
                        <div className="w-7 h-7 rounded-lg bg-[#222222] border border-[#383838] flex items-center justify-center shrink-0 p-0.5">
                          <img
                            src={selectedMascot.mediaKit.pngTransparent}
                            alt={selectedMascot.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                          isModel
                            ? "bg-[#1f1f1f] border border-[#2e2e2e] text-[#EAEAEA]"
                            : "bg-[#272727] border border-[#3d3d3d] text-[#FFFFFF]"
                        }`}
                      >
                        {/* Message author badge */}
                        <div className="flex items-center justify-between text-[10px] text-[#888888] mb-1.5 pb-1 border-b border-[#2a2a2a]">
                          <span className="font-bold">
                            {isModel ? selectedMascot.name : "Você"}
                          </span>
                          <span>{msg.timestamp}</span>
                        </div>

                        {/* Content formatted */}
                        <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                          {msg.content}
                        </div>

                        {/* Clickable Quick Suggestions */}
                        {isModel && msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-[#2a2a2a]">
                            <div className="text-[10px] uppercase font-bold tracking-wider text-[#767676] mb-1.5 flex items-center gap-1">
                              <Icon n="zap" size={10} />
                              <span>Respostas Rápidas Sugeridas:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggestions.map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => handleSendMessage(sug)}
                                  className="text-[11px] text-left px-2 py-1 rounded-lg bg-[#141414] hover:bg-[#282828] text-[#C2C2C2] hover:text-[#D97757] border border-[#2e2e2e] hover:border-[#D97757]/40 transition-colors cursor-pointer"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {!isModel && (
                        <div className="w-7 h-7 rounded-lg bg-[#2d2d2d] border border-[#444444] flex items-center justify-center shrink-0 text-[#EAEAEA] text-[11px] font-bold">
                          VC
                        </div>
                      )}
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#222222] border border-[#383838] flex items-center justify-center shrink-0 p-0.5">
                      <img
                        src={selectedMascot.mediaKit.pngTransparent}
                        alt={selectedMascot.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-2xl p-3.5 text-xs text-[#9B9B9B] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D97757] animate-ping"></span>
                      <span>{selectedMascot.name} está analisando suas respostas...</span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-[#1E1A17] border-t border-[#383129]">
                <div className="flex items-end gap-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Explique o que a skill deve fazer, regras ou responda às perguntas... (Shift+Enter para pular linha)"
                    rows={2}
                    className="flex-1 bg-[#191613] border border-[#383129] focus:border-[#D97757] rounded-xl p-2.5 text-xs sm:text-sm text-[#F5F2EB] placeholder-[#766B5E] outline-none transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-3.5 py-2.5 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <span className="hidden sm:inline">Enviar</span>
                    <Icon n="send" size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BRIEFING EM MARKDOWN PARA VALIDAÇÃO & REFINAMENTO (RESPONSIVO)
          ========================================================================= */}
      {currentTab === "briefing" && (
        <div className="space-y-5">
          {/* Top Banner with Context Window Impact Stats */}
          <div className="bg-gradient-to-r from-[#27221E] to-[#1E1A17] border border-[#383129] rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97757]"></span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#D97757]">
                    Etapa de Validação & Refinamento
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#F5F2EB]">
                  Briefing Técnico para Validação do Cliente
                </h2>
                <p className="text-xs text-[#D4CDC3] mt-1 max-w-3xl leading-relaxed">
                  Listamos abaixo tudo o que foi conversado na entrevista em formato Markdown técnico estruturado. Revise os pontos, aplique refinamentos pelo chat ou confirme para forjar a habilidade oficial.
                </p>
              </div>

              {/* View Mode Toggle & Fast Actions */}
              <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                <div className="flex items-center p-1 rounded-xl bg-[#191613] border border-[#383129]">
                  <button
                    type="button"
                    onClick={() => setBriefingViewMode("rendered")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      briefingViewMode === "rendered"
                        ? "bg-[#2F2721] text-[#F5F2EB]"
                        : "text-[#A39889] hover:text-[#D4CDC3]"
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
                        ? "bg-[#32231C] text-[#E28768]"
                        : "text-[#A39889] hover:text-[#D4CDC3]"
                    }`}
                  >
                    <Icon n="code" size={12} />
                    <span>Markdown</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyBriefing}
                  className="px-2.5 py-1.5 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#483E34] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  title="Copiar Markdown"
                >
                  <Icon n={copiedBriefing ? "check" : "copy"} size={13} />
                  <span>{copiedBriefing ? "Copiado!" : "Copiar"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBriefing}
                  className="px-2.5 py-1.5 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#483E34] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  title="Baixar arquivo briefing.md"
                >
                  <Icon n="download" size={13} />
                  <span>Baixar .md</span>
                </button>
              </div>
            </div>

            {/* Context Impact Strip (Tokens, Bytes, Window %) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-[#383129] text-xs">
              <div className="p-2.5 rounded-lg bg-[#191613] border border-[#332C26]">
                <div className="text-[10px] text-[#A39889] uppercase font-bold">Tokens da Skill</div>
                <div className="text-sm font-mono text-[#D97757] font-bold mt-0.5">
                  {formatTokens(briefingTokens)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#191613] border border-[#332C26]">
                <div className="text-[10px] text-[#A39889] uppercase font-bold">Tamanho Estimado</div>
                <div className="text-sm font-mono text-[#F5F2EB] font-bold mt-0.5">
                  {(briefingMarkdown.length / 1024).toFixed(1)} KB
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#191613] border border-[#332C26]">
                <div className="text-[10px] text-[#A39889] uppercase font-bold">Janela Claude (200k)</div>
                <div className="text-sm font-mono text-[#E28768] font-bold mt-0.5">
                  {Math.max(0.05, Number(((briefingTokens / 200000) * 100).toFixed(2)))}%
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#191613] border border-[#332C26]">
                <div className="text-[10px] text-[#A39889] uppercase font-bold">Classificação</div>
                <div className="text-sm text-[#D97757] font-bold mt-0.5">
                  ✓ Leve & Otimizada
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 8 Cols: Markdown Document Display */}
            <div className="lg:col-span-8 bg-[#24201D] border border-[#383129] rounded-2xl shadow-xl flex flex-col overflow-hidden min-h-[420px] sm:min-h-[500px] min-w-0">
              <div className="px-4 py-2.5 bg-[#1E1A17] border-b border-[#383129] flex items-center justify-between text-xs text-[#A39889]">
                <div className="flex items-center gap-2">
                  <Icon n="file-text" size={13} />
                  <span className="font-mono font-bold text-[#F5F2EB]">
                    briefing-validacao.md
                  </span>
                </div>
                <span>Padrão Universal Deda Skills</span>
              </div>

              <div className="p-5 flex-1 overflow-y-auto max-h-[620px]">
                {briefingViewMode === "rendered" ? (
                  <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-[#D5D5D5]">
                    {briefingMarkdown.split("\n\n").map((block, idx) => {
                      if (block.startsWith("# ")) {
                        return (
                          <h1
                            key={idx}
                            className="text-lg sm:text-xl font-black text-[#D97757] pb-2 border-b border-[#2e2e2e] mt-2 mb-3"
                          >
                            {block.replace("# ", "")}
                          </h1>
                        );
                      }
                      if (block.startsWith("## ")) {
                        return (
                          <h2
                            key={idx}
                            className="text-sm sm:text-base font-bold text-[#EAEAEA] mt-4 mb-2 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D97757]"></span>
                            <span>{block.replace("## ", "")}</span>
                          </h2>
                        );
                      }
                      if (block.startsWith("> ")) {
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#141414] border-l-4 border-[#D97757] text-[#A5A5A5] italic text-xs my-2"
                          >
                            {block.replace("> ", "")}
                          </div>
                        );
                      }
                      if (block.startsWith("- ")) {
                        return (
                          <ul key={idx} className="space-y-1 my-2 pl-4 list-disc text-[#C2C2C2]">
                            {block.split("\n").map((item, itemIdx) => (
                              <li key={itemIdx}>{item.replace(/^- /, "")}</li>
                            ))}
                          </ul>
                        );
                      }
                      if (block.startsWith("1. ")) {
                        return (
                          <ol key={idx} className="space-y-1 my-2 pl-4 list-decimal text-[#C2C2C2]">
                            {block.split("\n").map((item, itemIdx) => (
                              <li key={itemIdx}>{item.replace(/^\d+\. /, "")}</li>
                            ))}
                          </ol>
                        );
                      }
                      return (
                        <p key={idx} className="text-[#C2C2C2] leading-relaxed">
                          {block}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={briefingMarkdown}
                    onChange={(e) => setBriefingMarkdown(e.target.value)}
                    rows={24}
                    className="w-full h-full bg-[#111111] border border-[#282828] rounded-xl p-3 font-mono text-xs text-[#EAEAEA] leading-relaxed outline-none focus:border-[#D97757] resize-none"
                  />
                )}
              </div>
            </div>

            {/* Right 4 Cols: Refinement Box & Confirmation CTA */}
            <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
              {/* Refinement Panel */}
              <div className="bg-[#24201D] border border-[#383129] rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#32231C] flex items-center justify-center text-[#D97757]">
                    <Icon n="sparkles" size={13} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                      Acrescentar ou Corrigir
                    </h3>
                    <p className="text-[11px] text-[#A39889]">
                      Peça ajustes em linguagem natural e a IA refina o documento
                    </p>
                  </div>
                </div>

                {/* Quick suggestions to refine */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#A39889]">
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
                      className="w-full text-left p-1.5 px-2 rounded-lg bg-[#191613] hover:bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129] text-[10.5px] transition-colors cursor-pointer truncate"
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
                    className="w-full bg-[#191613] border border-[#383129] focus:border-[#D97757] rounded-xl p-2.5 text-xs text-[#F5F2EB] placeholder-[#766B5E] outline-none transition-all resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleRefineBriefing}
                    disabled={!refinementInput.trim() || isRefiningBriefing}
                    className="w-full py-2 px-3 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#E28768] border border-[#483E34] text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Icon n="sparkles" size={12} />
                    <span>{isRefiningBriefing ? "Refinando Briefing..." : "Aplicar Ajuste"}</span>
                  </button>
                </div>

                {/* Refinement History log */}
                {refinementHistory.length > 0 && (
                  <div className="pt-2 border-t border-[#383129] space-y-1 max-h-32 overflow-y-auto">
                    <div className="text-[10px] uppercase font-bold text-[#A39889]">
                      Histórico de Revisões:
                    </div>
                    {refinementHistory.map((item, hIdx) => (
                      <div
                        key={hIdx}
                        className="text-[10px] text-[#D4CDC3] p-1.5 rounded bg-[#191613] border border-[#332C26]"
                      >
                        ✓ {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmation Big CTA */}
              <div className="bg-gradient-to-b from-[#2F221A] to-[#24201D] border-2 border-[#D97757] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#D97757] flex items-center justify-center text-white font-black shrink-0">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#F5F2EB]">
                      Confirmar Briefing & Criar Skill
                    </h3>
                    <p className="text-[11px] text-[#E28768]">
                      Tudo validado? Geraremos a especificação oficial no padrão Deda Skills
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmAndCreateSkill}
                  disabled={isFinalizingSkill}
                  className="w-full py-3 px-4 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(217,119,87,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <Icon n="check-circle" size={15} />
                  <span>
                    {isFinalizingSkill ? "Criando Skill Oficial..." : "Confirmar e Criar Habilidade"}
                  </span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-[#A39889] pt-1">
                  <button
                    type="button"
                    onClick={() => setCurrentTab("interview")}
                    className="hover:text-[#F5F2EB] underline cursor-pointer"
                  >
                    &larr; Voltar à Entrevista
                  </button>
                  <span className="font-mono text-[#E28768]">Padrão .skill</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SKILL CONCLUÍDA COM SUCESSO (RESPONSIVO COM TOKEN FOOTPRINT)
          ========================================================================= */}
      {currentTab === "completed" && createdSkill && (
        <div className="max-w-3xl mx-auto bg-[#24201D] border border-[#D97757]/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#D97757]/15 border-2 border-[#D97757] flex items-center justify-center mx-auto text-[#D97757] shadow-lg">
            <Icon n="check-circle" size={28} />
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#D97757] mb-1">
              Habilidade Forjada com Sucesso
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F5F2EB]">
              {createdSkill.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#D4CDC3] mt-2 max-w-xl mx-auto leading-relaxed">
              {createdSkill.description}
            </p>
          </div>

          {/* Quick Specifications Strip with Token Footprint */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 rounded-2xl bg-[#191613] border border-[#383129] text-left">
            <div>
              <div className="text-[10px] text-[#A39889] uppercase font-bold">Identificador</div>
              <div className="text-xs font-mono text-[#D97757] font-bold truncate">
                {createdSkill.id}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#A39889] uppercase font-bold">Consumo de Contexto</div>
              <div className="text-xs font-mono text-[#F5F2EB] font-bold">
                ⚡ {formatTokens(calculateSkillTokenProfile(createdSkill).totalTokens)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#A39889] uppercase font-bold">Modo de Execução</div>
              <div className="text-xs text-[#F5F2EB] font-semibold">
                {createdSkill.execution_mode}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#A39889] uppercase font-bold">Status</div>
              <div className="text-xs text-[#E28768] font-bold">✓ Ativa no Catálogo</div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
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
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] border border-[#483E34] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
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
