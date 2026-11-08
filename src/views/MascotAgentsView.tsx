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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 text-[#EAEAEA]">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-[#2e2e2e]">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="flex items-center gap-2 text-xs text-[#9B9B9B] hover:text-[#EAEAEA] transition-colors cursor-pointer"
        >
          <Icon n="chevron" size={14} />
          <span>Voltar ao Catálogo de Habilidades</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#242424] text-[#C2C2C2] border border-[#383838]">
            4 Mascotes Ativos
          </span>
          <button
            type="button"
            onClick={onNavigateGlobalSync}
            className="flex items-center gap-1.5 text-xs text-[#9B9B9B] hover:text-[#EAEAEA] px-2.5 py-1 rounded bg-[#202020] border border-[#333333] hover:border-[#545454] transition-colors cursor-pointer"
          >
            <Icon n="terminal" size={12} />
            <span>Sincronizar com Agentes</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Conheça os Mascotes Assistentes (Inspirado em Cue Bot & Grok Bot) */}
      <section className="bg-gradient-to-b from-[#202020] to-[#171717] border border-[#383838] rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#292929] border border-[#3d3d3d] flex items-center justify-center text-[#EAEAEA] shadow-md">
              <DedaLogo size={22} color="#EAEAEA" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#9B9B9B]">
                Equipe de Agentes Autônomos • Deda Skills
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EAEAEA] tracking-tight mt-0.5">
                Conheça os 4 Mascotes Assistentes
              </h1>
            </div>
          </div>

          <p className="text-sm text-[#C2C2C2] leading-relaxed mt-2">
            Assistentes fofinhos da fauna brasileira equipados com expertises puras de engenharia. Disponíveis em todas as mídias (PNG, SVG, 3D WebGL, JSON) para enriquecer sua experiência local e conectar diretamente aos seus agentes autônomos.
          </p>

          {/* Tab Selector: 4 Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#333333] flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("mascots")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "mascots"
                  ? "bg-[#EAEAEA] text-[#151515] shadow-lg"
                  : "bg-[#252525] text-[#9B9B9B] hover:text-[#EAEAEA] border border-[#383838]"
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
                  ? "bg-[#EAEAEA] text-[#151515] shadow-lg"
                  : "bg-[#252525] text-[#9B9B9B] hover:text-[#EAEAEA] border border-[#383838]"
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
                  ? "bg-[#EAEAEA] text-[#151515] shadow-lg"
                  : "bg-[#252525] text-[#9B9B9B] hover:text-[#EAEAEA] border border-[#383838]"
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
                  ? "bg-[#EAEAEA] text-[#151515] shadow-lg"
                  : "bg-[#252525] text-[#9B9B9B] hover:text-[#EAEAEA] border border-[#383838]"
              }`}
            >
              <Icon n="activity" size={14} />
              <span>Equipe Colaborativa (Cue)</span>
            </button>
          </div>
        </div>

        {/* 4 Avatars floating preview in top banner */}
        <div className="hidden lg:flex items-center gap-2 absolute right-6 top-1/2 -translate-y-1/2 z-0 opacity-90">
          {MASCOT_AGENTS.map((m) => (
            <img
              key={m.id}
              src={m.avatar}
              alt={m.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#383838] shadow-lg -ml-4 first:ml-0 hover:scale-110 transition-transform cursor-pointer"
              title={`${m.name} — ${m.title} (Clique para ver estilo & especialidades)`}
              onClick={() => setQuickInfoMascot(m)}
            />
          ))}
        </div>
      </section>

      {/* View Mode 1: Individual Mascot Cards with Interactive Hover Scale & Click-to-Info Modal */}
      {activeTab === "mascots" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider font-bold text-[#9B9B9B]">
              Selecione um mascote para ver estilo de resolução & especialidades
            </span>
            <span className="text-[11px] text-[#767676]">Clique no card para abrir o modal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MASCOT_AGENTS.map((mascot) => (
              <div
                key={mascot.id}
                onClick={() => setQuickInfoMascot(mascot)}
                className="bg-[#1c1c1c] border border-[#2e2e2e] hover:border-[#666666] rounded-2xl p-6 transition-all duration-300 ease-out hover:scale-[1.025] hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                {/* Subtle Glow Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div>
                  {/* Top Bar inside Card: Avatar + Name + Interactive Hover Pill */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#383838] group-hover:border-[#EAEAEA] shrink-0 shadow-lg transition-all duration-300">
                      <img
                        src={mascot.avatar}
                        alt={mascot.name}
                        className="w-full h-full object-cover filter contrast-105 group-hover:scale-108 group-hover:rotate-1 transition-transform duration-300 ease-out"
                      />
                      <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#EAEAEA] border border-black animate-pulse"></span>
                    </div>

                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-[#EAEAEA] group-hover:text-white transition-colors">
                            {mascot.name}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#292929] border border-[#3d3d3d] text-[#C2C2C2] font-semibold">
                            {mascot.nickname}
                          </span>
                        </div>

                        {/* Interactive Pill on Card */}
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#242424] text-[#9B9B9B] border border-[#333333] group-hover:border-[#EAEAEA] group-hover:text-[#EAEAEA] group-hover:bg-[#2b2b2b] transition-all shrink-0">
                          <span>Ver Estilo</span>
                          <Icon n="chevron" size={10} />
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#9B9B9B] mt-0.5">
                        {mascot.title}
                      </div>

                      <div className="text-[11px] text-[#767676] mt-0.5">
                        {mascot.species}
                      </div>
                    </div>
                  </div>

                  {/* Problem Solving Style Badge & Approach (Requested by user) */}
                  <div className="p-3 rounded-xl bg-[#161616] border border-[#282828] group-hover:border-[#383838] transition-colors mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#EAEAEA]">
                        <div className="w-4 h-4 rounded bg-[#262626] flex items-center justify-center text-[#EAEAEA]">
                          <Icon n="zap" size={11} />
                        </div>
                        <span>Estilo: {mascot.problemSolvingStyle.headline}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#242424] border border-[#383838] text-[#C2C2C2] font-mono">
                        {mascot.problemSolvingStyle.badge}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-[#9B9B9B] leading-relaxed line-clamp-2">
                      {mascot.problemSolvingStyle.description}
                    </p>
                  </div>

                  {/* Role & Tagline */}
                  <div className="p-2.5 rounded-xl bg-[#191919] border border-[#242424] mb-4">
                    <div className="text-xs font-semibold text-[#C2C2C2]">{mascot.role}</div>
                    <p className="text-[11px] text-[#767676] mt-0.5 italic">"{mascot.tagline}"</p>
                  </div>

                  {/* Core Expertises */}
                  <div className="space-y-1.5 mb-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#767676] flex items-center justify-between">
                      <span>Especialidades Únicas</span>
                      <span className="text-[10px] font-normal text-[#9B9B9B]">{mascot.expertises.length} áreas</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {mascot.expertises.slice(0, 4).map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-[#202020] border border-[#2a2a2a] flex items-center gap-2 group-hover:border-[#383838] transition-colors"
                        >
                          <div className="w-4 h-4 rounded bg-[#292929] flex items-center justify-center shrink-0 text-[#EAEAEA]">
                            <Icon n={exp.icon} size={11} />
                          </div>
                          <span className="text-[11px] text-[#C2C2C2] truncate">{exp.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions (Stop propagation to allow distinct actions) */}
                <div className="pt-4 border-t border-[#2e2e2e] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickInfoMascot(mascot);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#292929] hover:bg-[#333333] text-[#EAEAEA] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#3d3d3d]"
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
                    className="py-2.5 px-3 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-[#C2C2C2] hover:text-[#EAEAEA] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#333333]"
                    title="Ver ficha completa do colega de equipe"
                  >
                    <Icon n="file-text" size={13} />
                    <span className="hidden sm:inline">Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTestPrompt(mascot.suggestedSkillId, mascot.samplePrompts[0]);
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-[#EAEAEA] hover:bg-white text-[#151515] text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Testar no Playground"
                  >
                    <Icon n="play" size={13} />
                    <span>Testar</span>
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

      {/* View Mode 4: Team Collaboration Arena (Inspirado em Cue Bot - image_9671a91c.png) */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Team Explanation Card */}
          <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2e2e2e]">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-[#9B9B9B]">
                  Pipeline Orquestrado de Engenharia
                </span>
                <h2 className="text-xl font-bold text-[#EAEAEA] mt-0.5">
                  Como os 4 Mascotes Trabalham em Equipe
                </h2>
                <p className="text-xs text-[#9B9B9B] mt-1 max-w-2xl">
                  Ao invés de um agente solitário tentar resolver tudo, cada mascote assume a etapa em que é especialista, passando o bastão com evidências auditadas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunTeamSimulation}
                disabled={simulatingTeam}
                className="py-3 px-5 rounded-xl bg-[#EAEAEA] hover:bg-white text-[#151515] text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50 active:scale-[0.99]"
              >
                <Icon n={simulatingTeam ? "activity" : "play"} size={14} />
                <span>{simulatingTeam ? "Executando Pipeline..." : "Simular Trabalho em Equipe"}</span>
              </button>
            </div>

            {/* 4 Steps Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {MASCOT_AGENTS.sort((a, b) => a.collaborationStep - b.collaborationStep).map((m) => {
                const isActive = teamStep === m.collaborationStep;
                const isPassed = teamStep > m.collaborationStep;

                return (
                  <div
                    key={m.id}
                    onClick={() => setQuickInfoMascot(m)}
                    className={`p-4 rounded-xl border transition-all duration-300 relative cursor-pointer ${
                      isActive
                        ? "bg-[#252525] border-[#EAEAEA] shadow-xl scale-[1.02]"
                        : isPassed
                        ? "bg-[#1f1f1f] border-[#3d3d3d] hover:border-[#545454]"
                        : "bg-[#181818] border-[#292929] hover:border-[#383838] opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#2e2e2e] text-[#EAEAEA] border border-[#3d3d3d]">
                        Etapa {m.collaborationStep}
                      </span>
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#383838]">
                        <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="text-sm font-bold text-[#EAEAEA]">{m.name}</div>
                    <div className="text-xs font-semibold text-[#9B9B9B] mt-0.5">
                      {m.collaborationRole}
                    </div>

                    <p className="text-[11px] text-[#767676] mt-2 leading-relaxed">
                      {m.collaborationAction}
                    </p>

                    <div className="mt-4 pt-2.5 border-t border-[#2a2a2a] flex items-center gap-2 text-[11px]">
                      {isActive ? (
                        <span className="text-[#EAEAEA] font-semibold flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-[#EAEAEA]"></span>
                          Executando agora...
                        </span>
                      ) : isPassed ? (
                        <span className="text-[#C2C2C2] font-medium flex items-center gap-1.5">
                          <Icon n="check-circle" size={12} />
                          Concluído com sucesso
                        </span>
                      ) : (
                        <span className="text-[#545454]">Aguardando bastão</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Terminal Log for Team Simulation */}
            {teamStep > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] font-mono text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222222] text-[#767676] text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Terminal de Comunicação Entre Agentes (P2P Event Bus)
                  </span>
                  <span>Deda Skills v2.4</span>
                </div>

                <div className="space-y-1.5 text-[11.5px] text-[#C2C2C2]">
                  {teamStep >= 1 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#EAEAEA] font-bold">[Lobo-Guará]</span>
                      <span>Topologia mapeada. Definida arquitetura limpa com 3 fatias verticais e contratos de API seguros.</span>
                    </div>
                  )}
                  {teamStep >= 2 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#EAEAEA] font-bold">[Ararinha-Azul]</span>
                      <span>Interface projetada. Componentes Tailwind CSS e design tokens sincronizados. Cópia persuasiva pronta.</span>
                    </div>
                  )}
                  {teamStep >= 3 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#EAEAEA] font-bold">[Tatu-Bola]</span>
                      <span>TDD finalizado. 14 testes unitários e 4 testes de regressão passando com 100% de cobertura.</span>
                    </div>
                  )}
                  {teamStep >= 4 && (
                    <div className="flex items-start gap-2">
                      <span className="text-[#EAEAEA] font-bold">[Carcará]</span>
                      <span>Varredura de segurança concluída. Zero vulnerabilidades, zero segredos vazados. Gate aprovado para entrega!</span>
                    </div>
                  )}
                  {teamStep >= 5 && (
                    <div className="flex items-start gap-2 text-emerald-400 font-bold pt-1">
                      <span>[Equipe Deda Skills]</span>
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
