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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#181818] border border-[#383838] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.85)] text-[#EAEAEA] p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9B9B9B] hover:text-[#EAEAEA] p-2 rounded-lg hover:bg-[#252525] transition-colors cursor-pointer"
          title="Fechar"
        >
          <Icon n="x" size={16} />
        </button>

        {/* Brand bar */}
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#262626] text-[#9B9B9B]">
          <DedaLogo size={16} color="#EAEAEA" />
          <span className="font-semibold uppercase tracking-wider text-[10.5px] text-[#C2C2C2]">
            Deda Skills • Ficha de Estilo do Mascote
          </span>
        </div>

        {/* Mascot Quick Header */}
        <div className="flex items-start gap-4 pb-4 mb-5 border-b border-[#2e2e2e]">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#383838] shadow-lg shrink-0">
            <img
              src={mascot.avatar}
              alt={mascot.name}
              className="w-full h-full object-cover filter contrast-105"
            />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#EAEAEA] border border-black animate-pulse"></span>
          </div>

          <div className="overflow-hidden flex-1 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-extrabold text-[#EAEAEA]">{mascot.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#242424] border border-[#383838] text-[#C2C2C2] font-semibold">
                {mascot.nickname}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2a2a2a] text-[#9B9B9B]">
                {mascot.species.split("•")[0].trim()}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#9B9B9B] mt-0.5">{mascot.role}</div>
            <div className="text-[11px] text-[#767676] italic mt-1">"{mascot.tagline}"</div>
          </div>
        </div>

        {/* Media Formats Strip (Requested: todas as mídias disponíveis) */}
        <div className="mb-4 p-2.5 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-[#9B9B9B]">
            <Icon n="cube" size={12} />
            <span className="font-semibold text-[#EAEAEA]">Mídias:</span>
            <span>PNG HD • SVG • 3D OBJ • WebGL</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={mascot.mediaKit.svgPath}
              download={`deda-${mascot.id}.svg`}
              className="text-[10.5px] font-semibold text-[#00FFA3] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon n="download" size={11} />
              <span>SVG</span>
            </a>
            <span className="text-[#444]">•</span>
            <a
              href={mascot.mediaKit.objPath}
              download={`deda-${mascot.id}.obj`}
              className="text-[10.5px] font-semibold text-[#00D2FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon n="cube" size={11} />
              <span>3D OBJ</span>
            </a>
          </div>
        </div>
        <div className="mb-5 p-4 rounded-xl bg-[#1f1f1f] border border-[#2e2e2e]">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#2a2a2a] flex items-center justify-center text-[#EAEAEA]">
                <Icon n="zap" size={12} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#EAEAEA]">
                Estilo de Resolução de Problemas
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#292929] border border-[#3d3d3d] text-[#C2C2C2]">
              {style.badge}
            </span>
          </div>

          <div className="text-sm font-bold text-[#EAEAEA] mt-1">{style.headline}</div>
          <p className="text-xs text-[#C2C2C2] leading-relaxed mt-1.5">{style.description}</p>

          <div className="mt-3 pt-2.5 border-t border-[#2a2a2a] flex items-start gap-2">
            <Icon n="terminal" size={13} />
            <div className="text-[11px] text-[#9B9B9B]">
              <span className="font-semibold text-[#EAEAEA]">Abordagem: </span>
              {style.approach}
            </div>
          </div>

          <div className="mt-2 text-[11px] text-[#767676] italic font-mono bg-[#161616] p-2 rounded-lg border border-[#262626]">
            "{style.keyMotto}"
          </div>
        </div>

        {/* Section 2: Especialidades Únicas */}
        <div className="mb-5 p-4 rounded-xl bg-[#1f1f1f] border border-[#2e2e2e]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-[#2a2a2a] flex items-center justify-center text-[#EAEAEA]">
              <Icon n="star" size={12} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#EAEAEA]">
              Especialidades Únicas
            </span>
          </div>

          <div className="space-y-2">
            {mascot.uniqueSpecialties.map((spec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-[#181818] border border-[#262626]"
              >
                <div className="w-4 h-4 rounded-full bg-[#282828] border border-[#383838] flex items-center justify-center text-[#EAEAEA] shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                </div>
                <span className="text-xs text-[#C2C2C2] leading-snug">{spec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-[#2e2e2e]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onTestPrompt(mascot.suggestedSkillId, mascot.samplePrompts[0]);
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#EAEAEA] hover:bg-white text-[#151515] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
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
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] text-[#C2C2C2] hover:text-[#EAEAEA] border border-[#383838] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Ver ficha completa com ferramentas e colega de equipe"
          >
            <Icon n="file-text" size={13} />
            <span>Ficha Completa</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] text-[#9B9B9B] hover:text-[#C2C2C2] border border-[#2e2e2e] text-xs font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
