import React, { useState } from "react";
import { MASCOT_AGENTS, MascotAgent } from "../data/mascotsData";
import { Icon } from "./Icons";

interface MascotMediaHubProps {
  onOpenQuickInfo: (mascot: MascotAgent) => void;
  onOpen3DStudioForMascot: (mascotId: string) => void;
}

export const MascotMediaHub: React.FC<MascotMediaHubProps> = ({
  onOpenQuickInfo,
  onOpen3DStudioForMascot,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredMascots =
    selectedFilter === "all"
      ? MASCOT_AGENTS
      : MASCOT_AGENTS.filter((m) => m.id === selectedFilter);

  // Copy SVG Code to Clipboard
  const handleCopySvg = async (mascot: MascotAgent) => {
    try {
      const response = await fetch(mascot.mediaKit.svgPath);
      const svgText = await response.text();
      await navigator.clipboard.writeText(svgText);
      setCopiedId(`svg-${mascot.id}`);
      setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Fallback
      setCopiedId(null);
    }
  };

  // Copy Color Hex
  const handleCopyColor = async (hex: string, key: string) => {
    await navigator.clipboard.writeText(hex);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Download File Directly
  const handleDownloadFile = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generate and Download Circular Avatar PNG using Canvas
  const handleDownloadAvatarPng = (mascot: MascotAgent) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mascot.avatar;
    img.onload = () => {
      // Clear canvas with transparency
      ctx.clearRect(0, 0, 512, 512);

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(256, 256, 240, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      // Draw mascot image
      ctx.drawImage(img, 0, 0, 512, 512);

      // Draw border ring
      ctx.strokeStyle = mascot.mediaKit.themeColors.primary;
      ctx.lineWidth = 14;
      ctx.stroke();

      // Download PNG
      const dataUrl = canvas.toDataURL("image/png");
      handleDownloadFile(dataUrl, `deda-mascote-${mascot.id}-avatar-512x512.png`);
    };
  };

  // Download Mascot Spec JSON
  const handleDownloadSpecJson = (mascot: MascotAgent) => {
    const spec = {
      name: mascot.name,
      nickname: mascot.nickname,
      species: mascot.species,
      role: mascot.role,
      title: mascot.title,
      tagline: mascot.tagline,
      problemSolvingStyle: mascot.problemSolvingStyle,
      uniqueSpecialties: mascot.uniqueSpecialties,
      expertises: mascot.expertises,
      tools: mascot.tools,
      samplePrompts: mascot.samplePrompts,
      mediaKit: {
        svg: mascot.mediaKit.svgPath,
        render3D: mascot.mediaKit.pngRender,
        themeColors: mascot.mediaKit.themeColors,
      },
      exportTimestamp: new Date().toISOString(),
      platform: "Deda Skills v1.0",
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    handleDownloadFile(url, `deda-mascote-${mascot.id}-spec.json`);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter Controls */}
      <div className="bg-[#24201D] border border-[#383129] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#383129]">
          <div className="min-w-0">
            <span className="text-xs uppercase font-bold tracking-wider text-[#A39889]">
              Central de Mídias & Assets Oficiais
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F2EB] mt-0.5">
              Kit Completo de Mídias (PNG, SVG, 3D, JSON)
            </h2>
            <p className="text-xs text-[#D4CDC3] mt-1 max-w-2xl">
              Arquivos de alta resolução e vetoriais prontos para uso em interfaces, apresentações, avatares e modelos 3D dos {MASCOT_AGENTS.length} mascotes da fauna brasileira.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === "all"
                  ? "bg-[#D97757] text-white"
                  : "bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129]"
              }`}
            >
              Todos ({MASCOT_AGENTS.length})
            </button>
            {MASCOT_AGENTS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedFilter(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === m.id
                    ? "bg-[#D97757] text-white"
                    : "bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129]"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mascot Asset Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {filteredMascots.map((mascot) => (
            <div
              key={mascot.id}
              className="bg-[#1E1A17] border border-[#383129] hover:border-[#483E34] rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-xl flex flex-col justify-between min-w-0"
            >
              <div>
                {/* Header: Mascot Name + Spec */}
                <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-[#383129]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#483E34] shadow-md shrink-0 bg-[#191613]">
                      <img
                        src={mascot.avatar}
                        alt={mascot.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-[#F5F2EB]">{mascot.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#32231C] text-[#E28768] border border-[#D97757]/40">
                          {mascot.nickname}
                        </span>
                      </div>
                      <div className="text-xs text-[#D4CDC3] font-medium mt-0.5">
                        {mascot.title}
                      </div>
                      <div className="text-[11px] text-[#A39889] truncate">{mascot.species}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenQuickInfo(mascot)}
                    className="p-2 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#483E34] text-xs transition-colors cursor-pointer shrink-0"
                    title="Ver estilo e especialidades"
                  >
                    <Icon n="zap" size={14} />
                  </button>
                </div>

                {/* 2-Column Visual Media Preview (3D Render vs Vector SVG) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                  {/* Left: 3D Render HD */}
                  <div className="rounded-xl bg-[#24201D] border border-[#332C26] p-3 text-center flex flex-col items-center justify-between">
                    <div className="w-full text-left flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#A39889]">
                        Render 3D HD
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A241F] text-[#D4CDC3] border border-[#383129]">
                        1024x1024
                      </span>
                    </div>

                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-[#383129] my-1 shadow-inner relative group/img bg-[#191613]">
                      <img
                        src={mascot.mediaKit.pngRender}
                        alt={`${mascot.name} 3D Render`}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadFile(
                          mascot.mediaKit.pngRender,
                          `deda-mascote-${mascot.id}-3d-hd.jpg`
                        )
                      }
                      className="w-full mt-2 py-1.5 px-2 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] text-[11px] font-semibold border border-[#483E34] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Icon n="download" size={12} />
                      <span>Baixar Imagem 3D</span>
                    </button>
                  </div>

                  {/* Right: Scalable Vector SVG */}
                  <div className="rounded-xl bg-[#24201D] border border-[#332C26] p-3 text-center flex flex-col items-center justify-between">
                    <div className="w-full text-left flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#A39889]">
                        Vetor SVG Oficial
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#32231C] text-[#E28768] border border-[#D97757]/40">
                        Escalável
                      </span>
                    </div>

                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-[#383129] my-1 bg-[#191613] flex items-center justify-center p-1.5 shadow-inner">
                      <img
                        src={mascot.mediaKit.svgPath}
                        alt={`${mascot.name} Vector SVG`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadFile(
                            mascot.mediaKit.svgPath,
                            `deda-mascote-${mascot.id}.svg`
                          )
                        }
                        className="py-1.5 px-2 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] text-[10.5px] font-semibold border border-[#483E34] transition-colors cursor-pointer flex items-center justify-center gap-1 truncate"
                        title="Baixar arquivo SVG vetorial"
                      >
                        <Icon n="download" size={11} />
                        <span>Baixar SVG</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopySvg(mascot)}
                        className="py-1.5 px-2 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] text-[10.5px] font-semibold border border-[#483E34] transition-colors cursor-pointer flex items-center justify-center gap-1 truncate"
                        title="Copiar código SVG para colar no Figma ou código"
                      >
                        <Icon n={copiedId === `svg-${mascot.id}` ? "check" : "copy"} size={11} />
                        <span>{copiedId === `svg-${mascot.id}` ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Tokens & Design Palette */}
                <div className="mb-5 p-3 rounded-xl bg-[#24201D] border border-[#332C26]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#A39889] mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span>Paleta de Cores & Tokens Hex</span>
                    <span className="text-[10px] text-[#D4CDC3] font-normal">Clique para copiar Hex</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: "Primária", color: mascot.mediaKit.themeColors.primary, key: `col1-${mascot.id}` },
                      { label: "Secundária", color: mascot.mediaKit.themeColors.secondary, key: `col2-${mascot.id}` },
                      { label: "Destaque", color: mascot.mediaKit.themeColors.accent, key: `col3-${mascot.id}` },
                      { label: "Glow Rim", color: mascot.mediaKit.themeColors.glow, key: `col4-${mascot.id}` },
                    ].map((c) => (
                      <div
                        key={c.key}
                        onClick={() => handleCopyColor(c.color, c.key)}
                        className="p-1.5 rounded-lg bg-[#1E1A17] border border-[#383129] hover:border-[#D97757]/60 transition-colors cursor-pointer flex flex-col items-center"
                        title={`Copiar ${c.color}`}
                      >
                        <div
                          className="w-full h-5 rounded-md mb-1 shadow-sm"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="text-[9.5px] text-[#A39889] font-medium">{c.label}</span>
                        <span className="text-[10px] font-mono text-[#F5F2EB] font-bold">
                          {copiedId === c.key ? "✓ Copiado" : c.color.slice(0, 7)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Multi-Format Actions */}
              <div className="pt-3 border-t border-[#383129] flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Launch 3D Studio */}
                <button
                  type="button"
                  onClick={() => onOpen3DStudioForMascot(mascot.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] text-xs font-bold transition-all border border-[#483E34] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                  title="Abrir no Estúdio 3D Interativo"
                >
                  <Icon n="cube" size={13} />
                  <span>Inspecionar em 3D</span>
                </button>

                {/* Download 3D OBJ File */}
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFile(
                      mascot.mediaKit.objPath,
                      `deda-mascote-${mascot.id}.obj`
                    )
                  }
                  className="py-2 px-3 rounded-xl bg-[#24201D] hover:bg-[#2F2721] text-[#E28768] hover:text-white text-xs font-semibold transition-all border border-[#383129] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title="Baixar modelo 3D Wavefront .OBJ"
                >
                  <Icon n="cube" size={13} />
                  <span>3D .OBJ</span>
                </button>

                {/* Generate Circular Avatar PNG */}
                <button
                  type="button"
                  onClick={() => handleDownloadAvatarPng(mascot)}
                  className="py-2 px-3 rounded-xl bg-[#24201D] hover:bg-[#2F2721] text-[#D4CDC3] hover:text-[#F5F2EB] text-xs font-semibold transition-all border border-[#383129] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title="Gerar e baixar avatar circular transparente em PNG"
                >
                  <Icon n="users" size={13} />
                  <span>Avatar PNG</span>
                </button>

                {/* Download Spec JSON */}
                <button
                  type="button"
                  onClick={() => handleDownloadSpecJson(mascot)}
                  className="py-2 px-3 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title="Baixar especificação técnica em JSON"
                >
                  <Icon n="file-text" size={13} />
                  <span>JSON</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
