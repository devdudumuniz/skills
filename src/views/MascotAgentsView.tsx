import React, { useState } from "react";
import { MASCOT_AGENTS, MascotAgent } from "../data/mascotsData";
import { Icon } from "../components/Icons";
import { DedaLogo } from "../components/DedaLogo";
import { MascotDetailModal } from "../components/MascotDetailModal";
import { MascotQuickInfoModal } from "../components/MascotQuickInfoModal";
import { ThreeMascotStudio } from "../components/ThreeMascotStudio";
import { MascotAssetGallery } from "../components/MascotAssetGallery";

interface MascotAgentsViewProps {
  onTestPrompt: (skillId: string, promptText: string) => void;
  onNavigateGlobalSync: () => void;
  onBackToCatalog: () => void;
}

export const MascotAgentsView: React.FC<MascotAgentsViewProps> = ({
  onTestPrompt,
  onNavigateGlobalSync,
  onBackToCatalog,
}) => {
  const [selectedMascot, setSelectedMascot] = useState<MascotAgent | null>(null);
  const [quickInfoMascot, setQuickInfoMascot] = useState<MascotAgent | null>(null);
  const [activeTab, setActiveTab] = useState<"mascots" | "studio3d" | "mediahub" | "team">("mascots");
  const [initial3DMascotId, setInitial3DMascotId] = useState<string>("carcara");
  const [simulatingTeam, setSimulatingTeam] = useState(false);
  const [teamStep, setTeamStep] = useState(0);

  const handleOpen3DForMascot = (mascotId: string) => {
    setInitial3DMascotId(mascotId);
    setActiveTab("studio3d");
  };

  const handleRunTeamSimulation = () => {
    if (simulatingTeam) return;
    setSimulatingTeam(true);
    setTeamStep(1);

    const stepIntervals = [
      setTimeout(() => setTeamStep(2), 1600),
      setTimeout(() => setTeamStep(3), 3200),
      setTimeout(() => setTeamStep(4), 4800),
      setTimeout(() => {
        setSimulatingTeam(false);
        setTeamStep(5); // Complete
      }, 6200),
    ];

    return () => stepIntervals.forEach(clearTimeout);
  };

  return (
    <div className="max-w-6xl mx-auto px-1 sm:px-6 py-2 sm:py-6 pb-24 text-[#F5F2EB] min-w-0">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#383129]">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="flex items-center gap-2 text-xs text-[#D4CDC3] hover:text-[#F5F2EB] bg-[#27221E] hover:bg-[#302A24] border border-[#383129] hover:border-[#483E34] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <Icon n="chevron" size={14} />
          <span>Voltar ao Catálogo de Habilidades</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#27221E] text-[#D4CDC3] border border-[#383129] font-medium">
            6 Mascotes Ativos
          </span>
          <button
            type="button"
            onClick={onNavigateGlobalSync}
            className="flex items-center gap-1.5 text-xs text-[#D4CDC3] hover:text-[#F5F2EB] px-3 py-1.5 rounded-lg bg-[#27221E] border border-[#383129] hover:border-[#D97757]/60 transition-colors cursor-pointer"
          >
            <Icon n="terminal" size={12} />
            <span>Sincronizar com Agentes</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Conheça os Mascotes Assistentes */}
      <section className="bg-gradient-to-b from-[#27221E] to-[#1E1A17] border border-[#383129] rounded-2xl p-5 sm:p-7 mb-8 shadow-2xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#302A24] border border-[#483E34] flex items-center justify-center text-[#D97757] shadow-md shrink-0">
              <DedaLogo size={22} color="#D97757" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] uppercase font-bold tracking-widest text-[#D97757] block">
                Equipe de Agentes Autônomos • Deda Skills
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold text-[#F5F2EB] tracking-tight mt-0.5 mb-0">
                Conheça os 6 Mascotes Assistentes
              </h1>
            </div>
          </div>

          {/* 6 Avatars Preview Row — In normal flow so it never overlaps buttons */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-0 shrink-0">
            {MASCOT_AGENTS.map((m) => (
              <img
                key={m.id}
                src={m.avatar}
                alt={m.name}
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-[#383129] hover:border-[#D97757] shadow-lg sm:-ml-3 sm:first:ml-0 hover:scale-110 hover:z-10 transition-all cursor-pointer bg-[#1E1A17]"
                title={`${m.name} — ${m.title} (Clique para ver estilo & especialidades)`}
                onClick={() => setQuickInfoMascot(m)}
              />
            ))}
          </div>
        </div>

        {/* Tab Selector: 4 Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#383129] flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("mascots")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "mascots"
                ? "bg-[#D97757] text-white border border-[#D97757] shadow-[0_2px_10px_rgba(217,119,87,0.35)]"
                : "bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129] hover:border-[#483E34]"
            }`}
          >
            <Icon n="users" size={14} />
            <span>Galeria & Especialidades</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("studio3d")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "studio3d"
                ? "bg-[#D97757] text-white border border-[#D97757] shadow-[0_2px_10px_rgba(217,119,87,0.35)]"
                : "bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129] hover:border-[#483E34]"
            }`}
          >
            <Icon n="cube" size={14} />
            <span>Estúdio 3D Interativo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mediahub")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "mediahub"
                ? "bg-[#D97757] text-white border border-[#D97757] shadow-[0_2px_10px_rgba(217,119,87,0.35)]"
                : "bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129] hover:border-[#483E34]"
            }`}
          >
            <Icon n="download" size={14} />
            <span>Central de Mídias (PNG, SVG, 3D)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "team"
                ? "bg-[#D97757] text-white border border-[#D97757] shadow-[0_2px_10px_rgba(217,119,87,0.35)]"
                : "bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129] hover:border-[#483E34]"
            }`}
          >
            <Icon n="activity" size={14} />
            <span>Equipe Colaborativa (Cue)</span>
          </button>
        </div>
      </section>

      {/* View Mode 1: Individual Mascot Cards with Interactive Hover Scale & Click-to-Info Modal */}
      {activeTab === "mascots" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="text-xs uppercase tracking-wider font-bold text-[#A39889]">
              Selecione um mascote para ver estilo de resolução & especialidades
            </span>
            <span className="text-[11px] text-[#766B5E]">Clique no card para abrir o modal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MASCOT_AGENTS.map((mascot) => (
              <div
                key={mascot.id}
                onClick={() => setQuickInfoMascot(mascot)}
                className="bg-[#24201D] border border-[#383129] hover:border-[#D97757]/60 rounded-2xl p-5 sm:p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.65)] flex flex-col justify-between group cursor-pointer relative overflow-hidden min-w-0"
              >
                {/* Subtle Glow Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D97757]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Bar inside Card: Avatar + Name + Interactive Hover Pill */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#383129] group-hover:border-[#D97757] shrink-0 shadow-lg transition-all duration-300 bg-[#191613]">
                      <img
                        src={mascot.avatar}
                        alt={mascot.name}
                        className="w-full h-full object-cover filter contrast-105 group-hover:scale-105 transition-transform duration-300 ease-out"
                      />
                      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#D97757] border border-[#191613] animate-pulse"></span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-[#F5F2EB] group-hover:text-white transition-colors m-0">
                              {mascot.name}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#302A24] border border-[#483E34] text-[#D4CDC3] font-semibold whitespace-nowrap">
                              {mascot.nickname}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-[#D4CDC3] mt-1">
                            {mascot.title}
                          </div>

                          <div className="text-[11px] text-[#766B5E] mt-0.5 truncate">
                            {mascot.species}
                          </div>
                        </div>

                        {/* Interactive Pill on Card */}
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2A241F] text-[#A39889] border border-[#383129] group-hover:border-[#D97757] group-hover:text-[#D97757] group-hover:bg-[#32231C] transition-all shrink-0 mt-0.5">
                          <span>Ver Estilo</span>
                          <Icon n="chevron" size={10} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Problem Solving Style Badge & Approach */}
                  <div className="p-3 rounded-xl bg-[#1E1A17] border border-[#383129] group-hover:border-[#483E34] transition-colors mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#F5F2EB]">
                        <div className="w-4 h-4 rounded bg-[#32231C] flex items-center justify-center text-[#D97757] shrink-0">
                          <Icon n="zap" size={11} />
                        </div>
                        <span>Estilo: {mascot.problemSolvingStyle.headline}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A241F] border border-[#383129] text-[#D4CDC3] font-mono">
                        {mascot.problemSolvingStyle.badge}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#A39889] leading-relaxed line-clamp-2 m-0">
                      {mascot.problemSolvingStyle.description}
                    </p>
                  </div>

                  {/* Role & Tagline */}
                  <div className="p-2.5 rounded-xl bg-[#1E1A17] border border-[#322B24] mb-4">
                    <div className="text-xs font-semibold text-[#D4CDC3]">{mascot.role}</div>
                    <p className="text-[11px] text-[#766B5E] mt-0.5 mb-0 italic">"{mascot.tagline}"</p>
                  </div>

                  {/* Core Expertises */}
                  <div className="space-y-1.5 mb-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#A39889] flex items-center justify-between">
                      <span>Especialidades Únicas</span>
                      <span className="text-[10px] font-normal text-[#766B5E]">{mascot.expertises.length} áreas</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {mascot.expertises.slice(0, 4).map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-[#27221E] border border-[#383129] flex items-center gap-2 group-hover:border-[#483E34] transition-colors min-w-0"
                        >
                          <div className="w-4 h-4 rounded bg-[#302A24] flex items-center justify-center shrink-0 text-[#D97757]">
                            <Icon n={exp.icon} size={11} />
                          </div>
                          <span className="text-[11px] text-[#D4CDC3] truncate">{exp.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions (Stacked vertically, one button below the other across all cards) */}
                <div className="relative z-10 pt-4 border-t border-[#383129] flex flex-col gap-2 w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickInfoMascot(mascot);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#2A241F] hover:bg-[#342D26] text-[#F5F2EB] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-[#443A30]"
                    title="Abrir modal com estilo de resolução e especialidades"
                  >
                    <Icon n="zap" size={13} />
                    <span>Estilo & Especialidades</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMascot(mascot);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#1E1A17] hover:bg-[#27221E] text-[#D4CDC3] hover:text-[#F5F2EB] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-[#383129]"
                    title="Ver ficha completa do colega de equipe"
                  >
                    <Icon n="file-text" size={13} />
                    <span>Ficha Completa</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestPrompt(mascot.suggestedSkillId, mascot.samplePrompts[0]);
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white border border-[#D97757] text-xs font-bold transition-all shadow-[0_2px_10px_rgba(217,119,87,0.3)] cursor-pointer flex items-center justify-center gap-2"
                    title="Testar no Playground"
                  >
                    <Icon n="play" size={13} />
                    <span>Testar no Playground</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode 2: Interactive 3D WebGL Studio */}
      {activeTab === "studio3d" && (
        <div className="space-y-4">
          <ThreeMascotStudio
            initialMascotId={initial3DMascotId}
            onOpenQuickInfo={(m) => setQuickInfoMascot(m)}
            onTestPrompt={onTestPrompt}
          />
        </div>
      )}

      {/* View Mode 3: Media Hub & Mascot Asset Gallery (PNG, SVG, 3D OBJ) */}
      {activeTab === "mediahub" && (
        <MascotAssetGallery
          onOpenQuickInfo={(m) => setQuickInfoMascot(m)}
          onOpen3DStudio={handleOpen3DForMascot}
        />
      )}

      {/* View Mode 4: Team Collaboration Arena */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Team Explanation Card */}
          <div className="bg-[#24201D] border border-[#383129] rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#383129]">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-[#D97757]">
                  Pipeline Orquestrado de Engenharia
                </span>
                <h2 className="text-xl font-bold text-[#F5F2EB] mt-0.5 mb-0">
                  Como os 6 Mascotes Trabalham em Equipe
                </h2>
                <p className="text-xs text-[#A39889] mt-1 mb-0 max-w-2xl">
                  Ao invés de um agente solitário tentar resolver tudo, cada mascote assume a etapa em que é especialista, passando o bastão com evidências auditadas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunTeamSimulation}
                disabled={simulatingTeam}
                className="py-3 px-5 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white border border-[#D97757] text-xs font-extrabold uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(217,119,87,0.35)] cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50 active:scale-[0.99]"
              >
                <Icon n={simulatingTeam ? "activity" : "play"} size={14} />
                <span>{simulatingTeam ? "Executando Pipeline..." : "Simular Trabalho em Equipe"}</span>
              </button>
            </div>

            {/* Steps Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
              {[...MASCOT_AGENTS].sort((a, b) => a.collaborationStep - b.collaborationStep).map((m) => {
                const isActive = teamStep === m.collaborationStep;
                const isPassed = teamStep > m.collaborationStep;

                return (
                  <div
                    key={m.id}
                    onClick={() => setQuickInfoMascot(m)}
                    className={`p-4 rounded-xl border transition-all duration-300 relative cursor-pointer ${
                      isActive
                        ? "bg-[#32231C] border-[#D97757] shadow-xl scale-[1.01]"
                        : isPassed
                        ? "bg-[#27221E] border-[#483E34] hover:border-[#D97757]/50"
                        : "bg-[#1E1A17] border-[#383129] hover:border-[#483E34] opacity-85"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#302A24] text-[#F5F2EB] border border-[#483E34]">
                        Etapa {m.collaborationStep}
                      </span>
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#383129] bg-[#191613]">
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="text-sm font-bold text-[#F5F2EB]">{m.name}</div>
                    <div className="text-xs font-semibold text-[#D97757] mt-0.5">
                      {m.collaborationRole}
                    </div>

                    <p className="text-[11px] text-[#A39889] mt-2 leading-relaxed">
                      {m.collaborationAction}
                    </p>

                    <div className="mt-4 pt-2.5 border-t border-[#383129] flex items-center gap-2 text-[11px]">
                      {isActive ? (
                        <span className="text-[#D97757] font-semibold flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-[#D97757]"></span>
                          Executando agora...
                        </span>
                      ) : isPassed ? (
                        <span className="text-[#D4CDC3] font-medium flex items-center gap-1.5">
                          <Icon n="check-circle" size={12} />
                          Concluído com sucesso
                        </span>
                      ) : (
                        <span className="text-[#766B5E]">Aguardando bastão</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Terminal Log for Team Simulation */}
            {teamStep > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-[#191613] border border-[#383129] font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#322B24] text-[#A39889] text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D97757]"></span>
                    Terminal de Comunicação Entre Agentes (P2P Event Bus)
                  </span>
                  <span>Deda Skills v1.0</span>
                </div>

                <div className="space-y-1.5 text-[11.5px] text-[#D4CDC3]">
                  {teamStep >= 1 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#F5F2EB] font-bold shrink-0">[Lobo-Guará]</span>
                      <span>Topologia mapeada. Definida arquitetura limpa com 3 fatias verticais e contratos de API seguros.</span>
                    </div>
                  )}
                  {teamStep >= 2 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#F5F2EB] font-bold shrink-0">[Ararinha-Azul]</span>
                      <span>Interface projetada. Componentes Tailwind CSS e design tokens sincronizados. Cópia persuasiva pronta.</span>
                    </div>
                  )}
                  {teamStep >= 3 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#F5F2EB] font-bold shrink-0">[Tatu-Bola]</span>
                      <span>TDD finalizado. 14 testes unitários e 4 testes de regressão passando com 100% de cobertura.</span>
                    </div>
                  )}
                  {teamStep >= 4 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#F5F2EB] font-bold shrink-0">[Carcará]</span>
                      <span>Varredura de segurança concluída. Zero vulnerabilidades, zero segredos vazados. Gate aprovado para entrega!</span>
                    </div>
                  )}
                  {teamStep >= 5 && (
                    <div className="flex items-start gap-2 text-[#D97757] font-bold pt-1">
                      <span className="shrink-0">[Equipe Deda Skills]</span>
                      <span>Missão executada com perfeição. Pacote gerado e disponível para todos os agentes autônomos.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Quick Informative Modal (Requested: Mostrando as especialidades únicas e estilo de resolução de problemas) */}
      <MascotQuickInfoModal
        mascot={quickInfoMascot}
        onClose={() => setQuickInfoMascot(null)}
        onOpenFullDetails={(m) => setSelectedMascot(m)}
        onTestPrompt={onTestPrompt}
      />

      {/* Modal 2: Full Mascot Details Modal (Inspirado em Grok Bot - sem planos de pagamento, apenas expertises) */}
      <MascotDetailModal
        mascot={selectedMascot}
        onClose={() => setSelectedMascot(null)}
        onTestPrompt={onTestPrompt}
        onActivateGlobal={onNavigateGlobalSync}
      />
    </div>
  );
};
