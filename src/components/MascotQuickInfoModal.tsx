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
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2E190F]/45 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#FFFDF9] border border-[#CEB79A] rounded-2xl shadow-2xl text-[#2E190F] p-5 sm:p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#755B4B] hover:text-[#2E190F] p-2 rounded-lg hover:bg-[#F6ECE0] transition-colors cursor-pointer"
          title="Fechar"
        >
          <Icon n="x" size={16} />
        </button>

        {/* Brand bar */}
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E2D1BC] text-[#5A4032]">
          <DedaLogo size={16} color="#C45730" />
          <span className="font-semibold uppercase tracking-wider text-[10.5px] text-[#5A4032]">
            Deda Skills • Ficha de Estilo do Mascote
          </span>
        </div>

        {/* Mascot Quick Header */}
        <div className="flex items-start gap-4 pb-4 mb-5 border-b border-[#E2D1BC]">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#CEB79A] shadow-md shrink-0 bg-[#F4EBDD]">
            <img
              src={mascot.avatar}
              alt={mascot.name}
              className="w-full h-full object-cover filter contrast-105"
            />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#C45730] border border-[#FFFDF9] animate-pulse"></span>
          </div>

          <div className="overflow-hidden flex-1 pr-6 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-extrabold text-[#2E190F]">{mascot.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FCEEE6] border border-[#E5A992] text-[#A8421E] font-semibold">
                {mascot.nickname}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4EBDD] text-[#5A4032] border border-[#E2D1BC]">
                {mascot.species.split("•")[0].trim()}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#5A4032] mt-0.5">{mascot.role}</div>
            <div className="text-[11px] text-[#755B4B] italic mt-1">"{mascot.tagline}"</div>
          </div>
        </div>

        {/* Media Formats Strip */}
        <div className="mb-4 p-2.5 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-[#5A4032]">
            <Icon n="cube" size={12} />
            <span className="font-semibold text-[#2E190F]">Mídias:</span>
            <span>PNG HD • SVG • 3D OBJ • WebGL</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={mascot.mediaKit.svgPath}
              download={`deda-${mascot.id}.svg`}
              className="text-[10.5px] font-semibold text-[#B44B25] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon n="download" size={11} />
              <span>SVG</span>
            </a>
            <span className="text-[#CEB79A]">•</span>
            <a
              href={mascot.mediaKit.objPath}
              download={`deda-${mascot.id}.obj`}
              className="text-[10.5px] font-semibold text-[#A8421E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Icon n="cube" size={11} />
              <span>3D OBJ</span>
            </a>
          </div>
        </div>

        <div className="mb-5 p-4 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC]">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25]">
                <Icon n="zap" size={12} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2E190F]">
                Estilo de Resolução de Problemas
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FCEEE6] border border-[#E5A992] text-[#A8421E]">
              {style.badge}
            </span>
          </div>

          <div className="text-sm font-bold text-[#2E190F] mt-1">{style.headline}</div>
          <p className="text-xs text-[#5A4032] leading-relaxed mt-1.5">{style.description}</p>

          <div className="mt-3 pt-2.5 border-t border-[#E2D1BC] flex items-start gap-2">
            <Icon n="terminal" size={13} className="text-[#B44B25] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#5A4032]">
              <span className="font-semibold text-[#2E190F]">Abordagem: </span>
              {style.approach}
            </div>
          </div>

          <div className="mt-2 text-[11px] text-[#2E190F] italic font-mono bg-[#FFFDF9] p-2.5 rounded-lg border border-[#E2D1BC]">
            "{style.keyMotto}"
          </div>
        </div>

        {/* Section 2: Especialidades Únicas */}
        <div className="mb-5 p-4 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25]">
              <Icon n="star" size={12} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2E190F]">
              Especialidades Únicas
            </span>
          </div>

          <div className="space-y-2">
            {mascot.uniqueSpecialties.map((spec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-[#FFFDF9] border border-[#E2D1BC]"
              >
                <div className="w-4 h-4 rounded-full bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#A8421E] shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                </div>
                <span className="text-xs text-[#2E190F] leading-snug">{spec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-[#E2D1BC]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onTestPrompt(mascot.suggestedSkillId, mascot.samplePrompts[0]);
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
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
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] border border-[#CEB79A] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Ver ficha completa com ferramentas e colega de equipe"
          >
            <Icon n="file-text" size={13} />
            <span>Ficha Completa</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-[#FFFDF9] hover:bg-[#F6ECE0] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A] text-xs font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
