import React, { useState } from "react";
import { MascotAgent } from "../data/mascotsData";
import { Icon } from "./Icons";
import { DedaLogo } from "./DedaLogo";

interface MascotDetailModalProps {
  mascot: MascotAgent | null;
  onClose: () => void;
  onTestPrompt: (skillId: string, promptText: string) => void;
  onActivateGlobal?: () => void;
}

export const MascotDetailModal: React.FC<MascotDetailModalProps> = ({
  mascot,
  onClose,
  onTestPrompt,
  onActivateGlobal,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!mascot) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(prompt);
    showToast("Prompt copiado para a área de transferência!");
    setTimeout(() => setCopiedPrompt(null), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-[#27221E] border border-[#483E34] text-[#F5F2EB] px-4 py-2.5 rounded-lg text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Icon n="check-circle" size={15} />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Modal Box */}
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#24201D] border border-[#383129] rounded-2xl shadow-2xl text-[#F5F2EB] p-5 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-[#A39889] hover:text-[#F5F2EB] p-2 rounded-lg hover:bg-[#2F2721] transition-colors cursor-pointer"
          title="Fechar"
        >
          <Icon n="x" size={18} />
        </button>

        {/* Header Bar */}
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-[#383129] pr-8">
          <div className="w-8 h-8 rounded-lg bg-[#27221E] border border-[#483E34] flex items-center justify-center shrink-0">
            <DedaLogo size={18} color="#D97757" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider text-[#A39889]">
              Deda Skills • Mascote Assistente
            </span>
            <span className="text-xs text-[#766B5E]">•</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#32231C] border border-[#D97757]/40 text-[#E28768] font-medium">
              {mascot.species}
            </span>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 min-w-0">
            {/* Mascot Avatar Card */}
            <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-5 text-center relative overflow-hidden">
              <div className="relative mx-auto w-36 h-36 rounded-2xl overflow-hidden border-2 border-[#483E34] shadow-xl mb-4 group bg-[#191613]">
                <img
                  src={mascot.avatar}
                  alt={mascot.name}
                  className="w-full h-full object-cover filter contrast-105 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#191613]/85 backdrop-blur-md text-[10.5px] font-bold text-[#F5F2EB] border border-[#483E34]">
                  {mascot.nickname}
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#F5F2EB]">{mascot.name}</h2>
              <div className="text-xs font-semibold text-[#D4CDC3] mt-0.5">{mascot.title}</div>
              <p className="text-xs text-[#A39889] mt-2 italic">"{mascot.teamQuote}"</p>

              <div className="mt-3 pt-3 border-t border-[#383129] grid grid-cols-3 gap-1.5 text-xs">
                <a
                  href={mascot.mediaKit.svgPath}
                  download={`deda-mascote-${mascot.id}.svg`}
                  className="py-1.5 px-1.5 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#D97757] border border-[#483E34] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
                  title="Baixar SVG"
                >
                  <Icon n="download" size={11} />
                  <span>SVG</span>
                </a>
                <a
                  href={mascot.mediaKit.pngTransparent}
                  download={`deda-mascote-${mascot.id}-hd.png`}
                  className="py-1.5 px-1.5 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] border border-[#483E34] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
                  title="Baixar PNG HD"
                >
                  <Icon n="image" size={11} />
                  <span>PNG HD</span>
                </a>
                <a
                  href={mascot.mediaKit.objPath}
                  download={`deda-mascote-${mascot.id}.obj`}
                  className="py-1.5 px-1.5 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#E28768] border border-[#483E34] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
                  title="Baixar Modelo 3D Wavefront OBJ"
                >
                  <Icon n="cube" size={11} />
                  <span>3D OBJ</span>
                </a>
              </div>
            </div>

            {/* Expertises List */}
            <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#D4CDC3] mb-3 flex items-center gap-2">
                <Icon n="shield" size={13} />
                <span>Expertises Especializadas</span>
              </div>

              <div className="space-y-2.5">
                {mascot.expertises.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#24201D] border border-[#332C26] flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-md bg-[#32231C] flex items-center justify-center shrink-0 text-[#D97757] mt-0.5">
                      <Icon n={exp.icon} size={12} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F5F2EB]">{exp.title}</div>
                      <div className="text-[11px] text-[#A39889] leading-relaxed mt-0.5">
                        {exp.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools Used */}
            <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#D4CDC3] mb-2.5">
                Ferramentas & Integrações
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mascot.tools.map((tool, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded bg-[#24201D] border border-[#383129] text-[#D4CDC3]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4 min-w-0">
            {/* Feature 1 */}
            <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-5 hover:border-[#483E34] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757] shrink-0">
                  <Icon n="users" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#F5F2EB]">
                    Uma IA que trabalha como colega de equipe
                  </h3>
                  <p className="text-xs text-[#A39889] mt-1 leading-relaxed">
                    Não é um chatbot passivo de perguntas e respostas. {mascot.name} é um assistente autônomo que vive em seu ambiente local ou na nuvem, monitora o código e realiza trabalho real para você.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-5 hover:border-[#483E34] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757] shrink-0">
                  <Icon n="terminal" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#F5F2EB]">
                    Conecta-se às suas ferramentas de trabalho
                  </h3>
                  <p className="text-xs text-[#A39889] mt-1 leading-relaxed">
                    Dê acesso uma única vez. Ele inspeciona o repositório Git, executa scripts no terminal, interage com a suíte de testes e valida os pacotes do mesmo jeito que um engenheiro sênior faria.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-5 hover:border-[#483E34] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757] shrink-0">
                  <Icon n="check-circle" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#F5F2EB]">
                    Retorna com o trabalho concluído
                  </h3>
                  <p className="text-xs text-[#A39889] mt-1 leading-relaxed">
                    Dê uma missão ao {mascot.name} e continue seu fluxo. Ele retorna com testes passando, vulnerabilidades sanadas, telas responsivas prontas e relatório técnico detalhado.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-5 hover:border-[#483E34] transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-[#32231C] flex items-center justify-center text-[#D97757] shrink-0">
                    <Icon n="zap" size={12} />
                  </div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                    Estilo de Resolução: {mascot.problemSolvingStyle.headline}
                  </h4>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#32231C] border border-[#D97757]/40 text-[#E28768]">
                  {mascot.problemSolvingStyle.badge}
                </span>
              </div>

              <p className="text-xs text-[#D4CDC3] leading-relaxed">
                {mascot.problemSolvingStyle.description}
              </p>

              <div className="mt-3 pt-3 border-t border-[#383129] grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mascot.uniqueSpecialties.map((spec, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[#24201D] border border-[#332C26]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97757] mt-1.5 shrink-0"></span>
                    <span className="text-[11px] text-[#D4CDC3] leading-snug">{spec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Sample Prompts */}
            <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#D4CDC3] mb-3 flex flex-wrap items-center justify-between gap-2">
                <span>Comandos Prontos para Testar</span>
                <span className="text-[11px] font-normal text-[#A39889]">Clique para testar</span>
              </div>

              <div className="space-y-2">
                {mascot.samplePrompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#24201D] border border-[#383129] hover:border-[#483E34] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                  >
                    <p className="text-xs text-[#F5F2EB] font-mono leading-relaxed break-words min-w-0">
                      {p}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(p)}
                        className="p-1.5 rounded bg-[#2A241F] hover:bg-[#332C26] text-[#A39889] hover:text-[#F5F2EB] border border-[#383129] text-xs transition-colors cursor-pointer"
                        title="Copiar prompt"
                      >
                        <Icon n={copiedPrompt === p ? "check" : "clipboard"} size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onTestPrompt(mascot.suggestedSkillId, p);
                        }}
                        className="px-2.5 py-1.5 rounded bg-[#D97757] hover:bg-[#E28768] text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1"
                        title="Executar no Playground"
                      >
                        <span>Testar</span>
                        <Icon n="play" size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTestPrompt(mascot.suggestedSkillId, mascot.samplePrompts[0]);
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(217,119,87,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Icon n="play" size={14} />
                <span>Iniciar Sessão com {mascot.name}</span>
              </button>

              {onActivateGlobal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onActivateGlobal();
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] border border-[#483E34] text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Icon n="terminal" size={14} />
                  <span>Ativar no Claude Code / Codex</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
