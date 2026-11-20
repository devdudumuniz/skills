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
    <div className="max-w-6xl mx-auto px-1 sm:px-6 py-2 sm:py-6 pb-24 text-[#2E190F] min-w-0">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#E2D1BC]">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="flex items-center gap-2 text-xs text-[#5A4032] hover:text-[#2E190F] bg-[#FFFDF9] hover:bg-[#F6ECE0] border border-[#CEB79A] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <Icon n="chevron" size={14} />
          <span>Voltar ao Catálogo de Habilidades</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#FFFDF9] text-[#5A4032] border border-[#CEB79A] font-medium">
            6 Mascotes Ativos
          </span>
          <button
            type="button"
            onClick={onNavigateGlobalSync}
            className="flex items-center gap-1.5 text-xs text-[#5A4032] hover:text-[#2E190F] px-3 py-1.5 rounded-lg bg-[#FFFDF9] border border-[#CEB79A] hover:border-[#C45730]/60 transition-colors cursor-pointer"
          >
            <Icon n="terminal" size={12} />
            <span>Sincronizar com Agentes</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Conheça os Mascotes Assistentes */}
      <section className="bg-gradient-to-b from-[#FFFDF9] to-[#F4EBDD] border border-[#E2D1BC] rounded-2xl p-5 sm:p-7 mb-8 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#C45730] shadow-sm shrink-0">
              <DedaLogo size={22} color="#C45730" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] uppercase font-bold tracking-widest text-[#B44B25] block">
                Equipe de Agentes Autônomos • Deda Skills
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold text-[#2E190F] tracking-tight mt-0.5 mb-0">
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
                className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-[#FFFDF9] hover:border-[#C45730] shadow-md sm:-ml-3 sm:first:ml-0 hover:scale-110 hover:z-10 transition-all cursor-pointer bg-[#F4EBDD]"
                title={`${m.name} — ${m.title} (Clique para ver estilo & especialidades)`}
                onClick={() => setQuickInfoMascot(m)}
              />
            ))}
          </div>
        </div>

        {/* Tab Selector: 4 Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#E2D1BC] flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("mascots")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "mascots"
                ? "bg-[#C45730] text-white border border-[#C45730] shadow-[0_4px_12px_rgba(196,87,48,0.25)]"
                : "bg-[#FFFDF9] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A] hover:bg-[#F6ECE0]"
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
                ? "bg-[#C45730] text-white border border-[#C45730] shadow-[0_4px_12px_rgba(196,87,48,0.25)]"
                : "bg-[#FFFDF9] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A] hover:bg-[#F6ECE0]"
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
                ? "bg-[#C45730] text-white border border-[#C45730] shadow-[0_4px_12px_rgba(196,87,48,0.25)]"
                : "bg-[#FFFDF9] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A] hover:bg-[#F6ECE0]"
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
                ? "bg-[#C45730] text-white border border-[#C45730] shadow-[0_4px_12px_rgba(196,87,48,0.25)]"
                : "bg-[#FFFDF9] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A] hover:bg-[#F6ECE0]"
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
            <span className="text-xs uppercase tracking-wider font-bold text-[#5A4032]">
              Selecione um mascote para ver estilo de resolução & especialidades
            </span>
            <span className="text-[11px] text-[#755B4B]">Clique no card para abrir o modal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MASCOT_AGENTS.map((mascot) => (
              <div
                key={mascot.id}
                onClick={() => setQuickInfoMascot(mascot)}
                className="bg-[#FFFDF9] border border-[#E2D1BC] hover:border-[#C45730]/60 rounded-2xl p-5 sm:p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(46,25,15,0.10)] flex flex-col justify-between group cursor-pointer relative overflow-hidden min-w-0"
              >
                {/* Subtle Glow Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C45730]/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Bar inside Card: Avatar + Name + Interactive Hover Pill */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#E2D1BC] group-hover:border-[#C45730] shrink-0 shadow-sm transition-all duration-300 bg-[#F4EBDD]">
                      <img
                        src={mascot.avatar}
                        alt={mascot.name}
                        className="w-full h-full object-cover filter contrast-105 group-hover:scale-105 transition-transform duration-300 ease-out"
                      />
                      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#C45730] border border-[#FFFDF9] animate-pulse"></span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-[#2E190F] transition-colors m-0">
                              {mascot.name}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4EBDD] border border-[#E2D1BC] text-[#5A4032] font-semibold whitespace-nowrap">
                              {mascot.nickname}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-[#5A4032] mt-1">
                            {mascot.title}
                          </div>

                          <div className="text-[11px] text-[#755B4B] mt-0.5 truncate">
                            {mascot.species}
                          </div>
                        </div>

                        {/* Interactive Pill on Card */}
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4EBDD] text-[#5A4032] border border-[#E2D1BC] group-hover:border-[#C45730] group-hover:text-[#A8421E] group-hover:bg-[#FCEEE6] transition-all shrink-0 mt-0.5">
                          <span>Ver Estilo</span>
                          <Icon n="chevron" size={10} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Problem Solving Style Badge & Approach */}
                  <div className="p-3 rounded-xl bg-[#FAF3E8] border border-[#E2D1BC] group-hover:border-[#CEB79A] transition-colors mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E190F]">
                        <div className="w-4 h-4 rounded bg-[#FCEEE6] flex items-center justify-center text-[#B44B25] shrink-0">
                          <Icon n="zap" size={11} />
                        </div>
                        <span>Estilo: {mascot.problemSolvingStyle.headline}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFFDF9] border border-[#E2D1BC] text-[#5A4032] font-mono">
                        {mascot.problemSolvingStyle.badge}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#5A4032] leading-relaxed line-clamp-2 m-0">
                      {mascot.problemSolvingStyle.description}
                    </p>
                  </div>

                  {/* Role & Tagline */}
                  <div className="p-2.5 rounded-xl bg-[#FAF3E8] border border-[#E2D1BC] mb-4">
                    <div className="text-xs font-semibold text-[#2E190F]">{mascot.role}</div>
                    <p className="text-[11px] text-[#755B4B] mt-0.5 mb-0 italic">"{mascot.tagline}"</p>
                  </div>

                  {/* Core Expertises */}
                  <div className="space-y-1.5 mb-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5A4032] flex items-center justify-between">
                      <span>Especialidades Únicas</span>
                      <span className="text-[10px] font-normal text-[#755B4B]">{mascot.expertises.length} áreas</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {mascot.expertises.slice(0, 4).map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-[#F4EBDD] border border-[#E2D1BC] flex items-center gap-2 group-hover:border-[#CEB79A] transition-colors min-w-0"
                        >
                          <div className="w-4 h-4 rounded bg-[#FFFDF9] flex items-center justify-center shrink-0 text-[#B44B25]">
                            <Icon n={exp.icon} size={11} />
                          </div>
                          <span className="text-[11px] text-[#2E190F] truncate">{exp.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions (Stacked vertically, one button below the other across all cards) */}
                <div className="relative z-10 pt-4 border-t border-[#E2D1BC] flex flex-col gap-2 w-full">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickInfoMascot(mascot);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-[#CEB79A]"
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
                    className="w-full py-2.5 px-3 rounded-xl bg-[#FFFDF9] hover:bg-[#F6ECE0] text-[#5A4032] hover:text-[#2E190F] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-[#CEB79A]"
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
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white border border-[#C45730] text-xs font-bold transition-all shadow-[0_4px_12px_rgba(196,87,48,0.25)] cursor-pointer flex items-center justify-center gap-2"
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
          <div className="bg-[#FFFDF9] border border-[#E2D1BC] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2D1BC]">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-[#B44B25]">
                  Pipeline Orquestrado de Engenharia
                </span>
                <h2 className="text-xl font-bold text-[#2E190F] mt-0.5 mb-0">
                  Como os 6 Mascotes Trabalham em Equipe
                </h2>
                <p className="text-xs text-[#5A4032] mt-1 mb-0 max-w-2xl">
                  Ao invés de um agente solitário tentar resolver tudo, cada mascote assume a etapa em que é especialista, passando o bastão com evidências auditadas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunTeamSimulation}
                disabled={simulatingTeam}
                className="py-3 px-5 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white border border-[#C45730] text-xs font-extrabold uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(196,87,48,0.25)] cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50 active:scale-[0.99]"
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
                        ? "bg-[#FCEEE6] border-[#C45730] shadow-md scale-[1.01]"
                        : isPassed
                        ? "bg-[#F4EBDD] border-[#CEB79A] hover:border-[#C45730]/60"
                        : "bg-[#FAF3E8] border-[#E2D1BC] hover:border-[#CEB79A]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#FFFDF9] text-[#2E190F] border border-[#CEB79A]">
                        Etapa {m.collaborationStep}
                      </span>
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#CEB79A] bg-[#F4EBDD]">
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="text-sm font-bold text-[#2E190F]">{m.name}</div>
                    <div className="text-xs font-semibold text-[#B44B25] mt-0.5">
                      {m.collaborationRole}
                    </div>

                    <p className="text-[11px] text-[#5A4032] mt-2 leading-relaxed">
                      {m.collaborationAction}
                    </p>

                    <div className="mt-4 pt-2.5 border-t border-[#E2D1BC] flex items-center gap-2 text-[11px]">
                      {isActive ? (
                        <span className="text-[#B44B25] font-semibold flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-[#C45730]"></span>
                          Executando agora...
                        </span>
                      ) : isPassed ? (
                        <span className="text-[#2E190F] font-medium flex items-center gap-1.5">
                          <Icon n="check-circle" size={12} className="text-[#B44B25]" />
                          Concluído com sucesso
                        </span>
                      ) : (
                        <span className="text-[#755B4B]">Aguardando bastão</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Terminal Log for Team Simulation */}
            {teamStep > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC] font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#E2D1BC] text-[#5A4032] text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C45730]"></span>
                    Terminal de Comunicação Entre Agentes (P2P Event Bus)
                  </span>
                  <span>Deda Skills v1.0</span>
                </div>

                <div className="space-y-1.5 text-[11.5px] text-[#5A4032]">
                  {teamStep >= 1 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#2E190F] font-bold shrink-0">[Lobo-Guará]</span>
                      <span>Topologia mapeada. Definida arquitetura limpa com 3 fatias verticais e contratos de API seguros.</span>
                    </div>
                  )}
                  {teamStep >= 2 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#2E190F] font-bold shrink-0">[Ararinha-Azul]</span>
                      <span>Interface projetada. Componentes Tailwind CSS e design tokens sincronizados. Cópia persuasiva pronta.</span>
                    </div>
                  )}
                  {teamStep >= 3 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#2E190F] font-bold shrink-0">[Tatu-Bola]</span>
                      <span>TDD finalizado. 14 testes unitários e 4 testes de regressão passando com 100% de cobertura.</span>
                    </div>
                  )}
                  {teamStep >= 4 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#2E190F] font-bold shrink-0">[Carcará]</span>
                      <span>Varredura de segurança concluída. Zero vulnerabilidades, zero segredos vazados. Gate aprovado para entrega!</span>
                    </div>
                  )}
                  {teamStep >= 5 && (
                    <div className="flex items-start gap-2 text-[#B44B25] font-bold pt-1">
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
