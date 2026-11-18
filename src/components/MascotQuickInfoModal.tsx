import React from "react";
import { MascotAgent } from "../data/mascotsData";
import { Icon } from "./Icons";
import { DedaLogo } from "./DedaLogo";

interface MascotQuickInfoModalProps {
  mascot: MascotAgent | null;
  onClose: () => void;
  onOpenFullDetails: (mascot: MascotAgent) => void;
  onTestPrompt: (skillId: string, promptText: string) => void;
}

export const MascotQuickInfoModal: React.FC<MascotQuickInfoModalProps> = ({
  mascot,
  onClose,
  onOpenFullDetails,
  onTestPrompt,
}) => {
  if (!mascot) return null;

  const style = mascot.problemSolvingStyle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#24201D] border border-[#483E34] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.85)] text-[#F5F2EB] p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A39889] hover:text-[#F5F2EB] p-2 rounded-lg hover:bg-[#2F2721] transition-colors cursor-pointer"
          title="Fechar"
        >
          <Icon n="x" size={16} />
        </button>

        {/* Brand bar */}
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#383129] text-[#A39889]">
          <DedaLogo size={16} color="#D97757" />
          <span className="font-semibold uppercase tracking-wider text-[10.5px] text-[#D4CDC3]">
            Deda Skills • Ficha de Estilo do Mascote
          </span>
        </div>

        {/* Mascot Quick Header */}
        <div className="flex items-start gap-4 pb-4 mb-5 border-b border-[#383129]">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#483E34] shadow-lg shrink-0 bg-[#191613]">
            <img
              src={mascot.avatar}
              alt={mascot.name}
              className="w-full h-full object-cover filter contrast-105"
            />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#D97757] border border-[#191613] animate-pulse"></span>
          </div>

          <div className="overflow-hidden flex-1 pr-6 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-extrabold text-[#F5F2EB]">{mascot.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#32231C] border border-[#D97757]/40 text-[#E28768] font-semibold">
                {mascot.nickname}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2A241F] text-[#A39889] border border-[#383129]">
                {mascot.species.split("•")[0].trim()}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#D4CDC3] mt-0.5">{mascot.role}</div>
            <div className="text-[11px] text-[#A39889] italic mt-1">"{mascot.tagline}"</div>
          </div>
        </div>

        {/* Media Formats Strip */}
        <div className="mb-4 p-2.5 rounded-xl bg-[#1E1A17] border border-[#383129] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-[#A39889]">
            <Icon n="cube" size={12} />
            <span className="font-semibold text-[#F5F2EB]">Mídias:</span>
            <span>PNG HD • SVG • 3D OBJ • WebGL</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={mascot.mediaKit.svgPath}
              download={`deda-${mascot.id}.svg`}
              className="text-[10.5px] font-semibold text-[#D97757] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon n="download" size={11} />
              <span>SVG</span>
            </a>
            <span className="text-[#483E34]">•</span>
            <a
              href={mascot.mediaKit.objPath}
              download={`deda-${mascot.id}.obj`}
              className="text-[10.5px] font-semibold text-[#E28768] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon n="cube" size={11} />
              <span>3D OBJ</span>
            </a>
          </div>
        </div>

        <div className="mb-5 p-4 rounded-xl bg-[#1E1A17] border border-[#383129]">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#32231C] flex items-center justify-center text-[#D97757]">
                <Icon n="zap" size={12} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
                Estilo de Resolução de Problemas
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#32231C] border border-[#D97757]/40 text-[#E28768]">
              {style.badge}
            </span>
          </div>

          <div className="text-sm font-bold text-[#F5F2EB] mt-1">{style.headline}</div>
          <p className="text-xs text-[#D4CDC3] leading-relaxed mt-1.5">{style.description}</p>

          <div className="mt-3 pt-2.5 border-t border-[#383129] flex items-start gap-2">
            <Icon n="terminal" size={13} />
            <div className="text-[11px] text-[#A39889]">
              <span className="font-semibold text-[#F5F2EB]">Abordagem: </span>
              {style.approach}
            </div>
          </div>

          <div className="mt-2 text-[11px] text-[#D4CDC3] italic font-mono bg-[#191613] p-2.5 rounded-lg border border-[#332C26]">
            "{style.keyMotto}"
          </div>
        </div>

        {/* Section 2: Especialidades Únicas */}
        <div className="mb-5 p-4 rounded-xl bg-[#1E1A17] border border-[#383129]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-[#32231C] flex items-center justify-center text-[#D97757]">
              <Icon n="star" size={12} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#F5F2EB]">
              Especialidades Únicas
            </span>
          </div>

          <div className="space-y-2">
            {mascot.uniqueSpecialties.map((spec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-[#24201D] border border-[#332C26]"
              >
                <div className="w-4 h-4 rounded-full bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#E28768] shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                </div>
                <span className="text-xs text-[#D4CDC3] leading-snug">{spec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-[#383129]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onTestPrompt(mascot.suggestedSkillId, mascot.samplePrompts[0]);
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(217,119,87,0.35)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
          >
            <Icon n="play" size={13} />
            <span>Testar com {mascot.name}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFullDetails(mascot);
            }}
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#483E34] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Ver ficha completa com ferramentas e colega de equipe"
          >
            <Icon n="file-text" size={13} />
            <span>Ficha Completa</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-[#1E1A17] hover:bg-[#2A241F] text-[#A39889] hover:text-[#F5F2EB] border border-[#383129] text-xs font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
