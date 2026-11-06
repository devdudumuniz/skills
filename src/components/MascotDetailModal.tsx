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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-[#222222] border border-[#545454] text-[#EAEAEA] px-4 py-2.5 rounded-lg text-xs font-semibold shadow-2xl flex items-center gap-2">
          <Icon n="check-circle" size={15} />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Modal Box - Inspirado em Grok Bot (image_18ce22c5.png) & Cue (image_9671a91c.png) */}
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#181818] border border-[#333333] rounded-2xl shadow-2xl text-[#EAEAEA] p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9B9B9B] hover:text-[#EAEAEA] p-2 rounded-lg hover:bg-[#252525] transition-colors cursor-pointer"
          title="Fechar"
        >
          <Icon n="x" size={18} />
        </button>

        {/* Header Bar */}
        <div className="flex items-center gap-3 pb-5 mb-6 border-b border-[#2e2e2e]">
          <div className="w-8 h-8 rounded-lg bg-[#242424] border border-[#383838] flex items-center justify-center text-[#EAEAEA]">
            <DedaLogo size={18} color="#EAEAEA" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider text-[#9B9B9B]">
              Deda Skills • Mascote Assistente
            </span>
            <span className="text-xs text-[#545454]">•</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#262626] border border-[#383838] text-[#C2C2C2] font-medium">
              {mascot.species}
            </span>
          </div>
        </div>

        {/* 2-Column Content: Left Mascot Identity & Expertises, Right Grok-like Assistant Capabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 cols): Mascot Card with 3D Cute Avatar & Expertises (Sem planos, apenas expertises!) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Mascot Avatar Card */}
            <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-5 text-center relative overflow-hidden">
              <div className="relative mx-auto w-36 h-36 rounded-2xl overflow-hidden border-2 border-[#383838] shadow-xl mb-4 group">
                <img
                  src={mascot.avatar}
                  alt={mascot.name}
                  className="w-full h-full object-cover filter contrast-105 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10.5px] font-bold text-[#EAEAEA] border border-white/20">
                  {mascot.nickname}
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#EAEAEA]">{mascot.name}</h2>
              <div className="text-xs font-semibold text-[#C2C2C2] mt-0.5">{mascot.title}</div>
              <p className="text-xs text-[#9B9B9B] mt-2 italic">"{mascot.teamQuote}"</p>

              <div className="mt-4 pt-3 border-t border-[#2e2e2e] flex items-center justify-center gap-2 text-xs text-[#767676]">
                <span className="w-2 h-2 rounded-full bg-[#EAEAEA] animate-pulse"></span>
                <span>Assistente Autônomo Ativo • Pronto</span>
              </div>
            </div>

            {/* Expertises List (Foco nas habilidades puras, sem planos de pagamento) */}
            <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C2C2C2] mb-3 flex items-center gap-2">
                <Icon n="shield" size={13} />
                <span>Expertises Especializadas</span>
              </div>

              <div className="space-y-2.5">
                {mascot.expertises.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#181818] border border-[#2a2a2a] flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-md bg-[#252525] flex items-center justify-center shrink-0 text-[#EAEAEA] mt-0.5">
                      <Icon n={exp.icon} size={12} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#EAEAEA]">{exp.title}</div>
                      <div className="text-[11px] text-[#9B9B9B] leading-relaxed mt-0.5">
                        {exp.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools Used */}
            <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C2C2C2] mb-2.5">
                Ferramentas & Integrações
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mascot.tools.map((tool, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded bg-[#181818] border border-[#333333] text-[#C2C2C2]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): How the Mascot Works as a Teammate (Layout Grok Bot image_18ce22c5.png) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Feature 1: Uma IA que trabalha como colega de equipe */}
            <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#3d3d3d] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#292929] border border-[#383838] flex items-center justify-center text-[#EAEAEA] shrink-0">
                  <Icon n="users" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#EAEAEA]">
                    Uma IA que trabalha como colega de equipe
                  </h3>
                  <p className="text-xs text-[#9B9B9B] mt-1 leading-relaxed">
                    Não é um chatbot passivo de perguntas e respostas. {mascot.name} é um assistente autônomo que vive em seu ambiente local ou na nuvem, monitora o código e realiza trabalho real para você.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: Faz login em suas ferramentas */}
            <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#3d3d3d] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#292929] border border-[#383838] flex items-center justify-center text-[#EAEAEA] shrink-0">
                  <Icon n="terminal" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#EAEAEA]">
                    Conecta-se às suas ferramentas de trabalho
                  </h3>
                  <p className="text-xs text-[#9B9B9B] mt-1 leading-relaxed">
                    Dê acesso uma única vez. Ele inspeciona o repositório Git, executa scripts no terminal, interage com a suíte de testes e valida os pacotes do mesmo jeito que um engenheiro sênior faria.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Retorna com trabalho concluído */}
            <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#3d3d3d] transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#292929] border border-[#383838] flex items-center justify-center text-[#EAEAEA] shrink-0">
                  <Icon n="check-circle" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#EAEAEA]">
                    Retorna com o trabalho concluído
                  </h3>
                  <p className="text-xs text-[#9B9B9B] mt-1 leading-relaxed">
                    Dê uma missão ao {mascot.name} e continue seu fluxo. Ele retorna com testes passando, vulnerabilidades sanadas, telas responsivas prontas e relatório técnico detalhado.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Sample Prompts */}
            <div className="bg-[#1f1f1f] border border-[#2e2e2e] rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C2C2C2] mb-3 flex items-center justify-between">
                <span>Comandos Prontos para Testar</span>
                <span className="text-[11px] font-normal text-[#9B9B9B]">Clique para testar</span>
              </div>

              <div className="space-y-2">
                {mascot.samplePrompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#181818] border border-[#2e2e2e] hover:border-[#545454] transition-all flex items-center justify-between gap-3 group"
                  >
                    <p className="text-xs text-[#EAEAEA] font-mono leading-relaxed">{p}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(p)}
                        className="p-1.5 rounded bg-[#242424] hover:bg-[#2e2e2e] text-[#9B9B9B] hover:text-[#EAEAEA] text-xs transition-colors cursor-pointer"
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
                        className="px-2.5 py-1.5 rounded bg-[#333333] hover:bg-[#EAEAEA] text-[#EAEAEA] hover:text-[#151515] font-semibold text-xs transition-all cursor-pointer flex items-center gap-1"
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
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#EAEAEA] hover:bg-white text-[#151515] font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
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
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] text-[#C2C2C2] hover:text-[#EAEAEA] border border-[#383838] text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
