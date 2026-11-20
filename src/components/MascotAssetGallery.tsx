import React, { useState } from "react";
import { MASCOT_AGENTS, MascotAgent } from "../data/mascotsData";
import { Icon } from "./Icons";
import { DedaLogo } from "./DedaLogo";

interface MascotAssetGalleryProps {
  onOpenQuickInfo?: (mascot: MascotAgent) => void;
  onOpen3DStudio?: (mascotId: string) => void;
}

type FormatFilter = "all" | "png" | "svg" | "obj" | "tokens";

export const MascotAssetGallery: React.FC<MascotAssetGalleryProps> = ({
  onOpenQuickInfo,
  onOpen3DStudio,
}) => {
  const [selectedMascotId, setSelectedMascotId] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCodeModal, setActiveCodeModal] = useState<{
    title: string;
    content: string;
    language: string;
    downloadFilename: string;
  } | null>(null);
  const [showTransparencyGrid, setShowTransparencyGrid] = useState(false);
  const [bundleDownloading, setBundleDownloading] = useState<string | null>(null);

  const filteredMascots =
    selectedMascotId === "all"
      ? MASCOT_AGENTS
      : MASCOT_AGENTS.filter((m) => m.id === selectedMascotId);

  // Trigger file download
  const handleDownloadFile = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy text to clipboard
  const handleCopyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Inspect SVG Code
  const handleInspectSvg = async (mascot: MascotAgent) => {
    try {
      const res = await fetch(mascot.mediaKit.svgPath);
      const svgCode = await res.text();
      setActiveCodeModal({
        title: `Código Vetorial SVG • ${mascot.name}`,
        content: svgCode,
        language: "xml",
        downloadFilename: `deda-mascote-${mascot.id}.svg`,
      });
    } catch {
      handleDownloadFile(mascot.mediaKit.svgPath, `deda-mascote-${mascot.id}.svg`);
    }
  };

  // Inspect OBJ Code
  const handleInspectObj = async (mascot: MascotAgent) => {
    try {
      const res = await fetch(mascot.mediaKit.objPath);
      const objCode = await res.text();
      setActiveCodeModal({
        title: `Modelo 3D Wavefront OBJ • ${mascot.name}`,
        content: objCode,
        language: "obj",
        downloadFilename: `deda-mascote-${mascot.id}.obj`,
      });
    } catch {
      handleDownloadFile(mascot.mediaKit.objPath, `deda-mascote-${mascot.id}.obj`);
    }
  };

  // Generate Transparent Circular Avatar PNG using Canvas
  const handleGenerateTransparentAvatar = (mascot: MascotAgent) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mascot.mediaKit.pngTransparent || mascot.avatar;
    img.onload = () => {
      ctx.clearRect(0, 0, 512, 512);

      // Circular clip
      ctx.beginPath();
      ctx.arc(256, 256, 238, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, 0, 0, 512, 512);

      // Neon accent border
      ctx.strokeStyle = mascot.mediaKit.themeColors.primary;
      ctx.lineWidth = 12;
      ctx.stroke();

      const dataUrl = canvas.toDataURL("image/png");
      handleDownloadFile(dataUrl, `deda-${mascot.id}-avatar-transparente-512x512.png`);
    };
  };

  // Download Manifest JSON
  const handleDownloadJson = (mascot: MascotAgent) => {
    const manifest = {
      mascot: mascot.name,
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
      assets: {
        png_hd: mascot.mediaKit.pngTransparent,
        svg_vector: mascot.mediaKit.svgPath,
        obj_3d: mascot.mediaKit.objPath,
        theme_colors: mascot.mediaKit.themeColors,
        dimension_3d: mascot.mediaKit.dimension3D,
      },
      specVersion: "1.0.0",
      generator: "Deda Skills Asset Pipeline",
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    handleDownloadFile(url, `deda-mascote-${mascot.id}-manifest.json`);
    URL.revokeObjectURL(url);
  };

  // Download Complete Mascot Bundle
  const handleDownloadBundle = (mascot: MascotAgent) => {
    setBundleDownloading(mascot.id);

    // Sequence download of PNG, SVG, OBJ, and JSON
    setTimeout(() => {
      handleDownloadFile(mascot.mediaKit.pngTransparent, `deda-mascote-${mascot.id}-hd.png`);
    }, 100);

    setTimeout(() => {
      handleDownloadFile(mascot.mediaKit.svgPath, `deda-mascote-${mascot.id}.svg`);
    }, 400);

    setTimeout(() => {
      handleDownloadFile(mascot.mediaKit.objPath, `deda-mascote-${mascot.id}.obj`);
    }, 700);

    setTimeout(() => {
      handleDownloadJson(mascot);
      setBundleDownloading(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Filters */}
      <div className="bg-gradient-to-b from-[#FFFDF9] to-[#F4EBDD] border border-[#E2D1BC] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E2D1BC]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <DedaLogo size={18} color="#C45730" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#755B4B]">
                Galeria Multimídia de Ativos • Deda Skills
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#2E190F] tracking-tight">
              Mascot Asset Gallery (PNG, SVG & 3D OBJ)
            </h2>
            <p className="text-xs text-[#5A4032] mt-1 max-w-2xl leading-relaxed">
              Exibição unificada dos {MASCOT_AGENTS.length} mascotes da fauna brasileira em todos os formatos visuais: PNG transparente em alta definição, Vetor SVG escalável e modelo 3D conceitual Wavefront (.OBJ).
            </p>
          </div>

          {/* Transparency Grid Toggle */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setShowTransparencyGrid(!showTransparencyGrid)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showTransparencyGrid
                  ? "bg-[#FCEEE6] text-[#A8421E] border-[#E5A992]"
                  : "bg-[#F7EFE4] text-[#5A4032] border-[#CEB79A] hover:text-[#2E190F]"
              }`}
              title="Alternar fundo quadriculado de transparência"
            >
              <Icon n="eye" size={13} />
              <span>Grid de Transparência</span>
            </button>
          </div>
        </div>

        {/* Filter Rows: Mascots & Formats */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Mascot Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#755B4B] mr-1">
              Mascote:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMascotId("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedMascotId === "all"
                  ? "bg-[#C45730] text-white shadow-sm"
                  : "bg-[#FFFDF9] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A]"
              }`}
            >
              Todos ({MASCOT_AGENTS.length})
            </button>
            {MASCOT_AGENTS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMascotId(m.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedMascotId === m.id
                    ? "bg-[#C45730] text-white shadow-sm"
                    : "bg-[#FFFDF9] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: m.mediaKit.themeColors.primary }}
                />
                <span>{m.name}</span>
              </button>
            ))}
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#755B4B] mr-1">
              Formato:
            </span>
            {(
              [
                { id: "all", label: "Todos", icon: "layers" },
                { id: "png", label: "PNG", icon: "image" },
                { id: "svg", label: "SVG", icon: "code" },
                { id: "obj", label: "3D OBJ", icon: "cube" },
                { id: "tokens", label: "Tokens/JSON", icon: "file-text" },
              ] as const
            ).map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setFormatFilter(fmt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  formatFilter === fmt.id
                    ? "bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992]"
                    : "bg-[#FFFDF9] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A]"
                }`}
              >
                <Icon n={fmt.icon} size={11} />
                <span>{fmt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMascots.map((mascot) => {
          return (
            <div
              key={mascot.id}
              className="bg-[#FFFDF9] border border-[#E2D1BC] hover:border-[#CEB79A] rounded-2xl p-5 sm:p-6 transition-all duration-300 shadow-sm flex flex-col justify-between min-w-0"
            >
              <div>
                {/* Header: Mascot Identity */}
                <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-[#E2D1BC]">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#CEB79A] shadow-sm shrink-0 bg-[#F4EBDD]">
                      <img
                        src={mascot.mediaKit.pngTransparent}
                        alt={mascot.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-[#2E190F]">{mascot.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992] font-semibold">
                          {mascot.nickname}
                        </span>
                      </div>
                      <div className="text-xs text-[#5A4032] font-semibold mt-0.5">
                        {mascot.title}
                      </div>
                      <div className="text-[11px] text-[#755B4B] truncate">{mascot.species}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenQuickInfo && (
                      <button
                        type="button"
                        onClick={() => onOpenQuickInfo(mascot)}
                        className="p-2 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A] transition-colors cursor-pointer"
                        title="Ver especialidades e estilo de resolução"
                      >
                        <Icon n="zap" size={14} />
                      </button>
                    )}
                    {onOpen3DStudio && (
                      <button
                        type="button"
                        onClick={() => onOpen3DStudio(mascot.id)}
                        className="p-2 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#B44B25] hover:text-[#2E190F] border border-[#CEB79A] transition-colors cursor-pointer"
                        title="Abrir no Estúdio 3D WebGL"
                      >
                        <Icon n="cube" size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges Strip */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {mascot.mediaKit.formatBadges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#F4EBDD] border border-[#E2D1BC] text-[#5A4032]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Multi-Format Assets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {/* Format 1: PNG Transparente HD */}
                  {(formatFilter === "all" || formatFilter === "png") && (
                    <div className="p-3 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A4032]">
                            PNG Transparente
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FFFDF9] text-[#2E190F] border border-[#CEB79A] font-semibold">
                            1024px
                          </span>
                        </div>

                        <div
                          className={`w-full h-28 rounded-lg overflow-hidden border border-[#E2D1BC] flex items-center justify-center p-1 relative my-1 ${
                            showTransparencyGrid
                              ? "bg-[repeating-conic-gradient(#E8DAC6_0%_25%,#FFFDF9_0%_50%)] bg-[length:16px_16px]"
                              : "bg-[#FFFDF9]"
                          }`}
                        >
                          <img
                            src={mascot.mediaKit.pngTransparent}
                            alt={`${mascot.name} PNG`}
                            className="w-full h-full object-contain filter contrast-105"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadFile(
                              mascot.mediaKit.pngTransparent,
                              `deda-mascote-${mascot.id}-hd.png`
                            )
                          }
                          className="w-full py-1.5 px-2 rounded-lg bg-[#FFFDF9] hover:bg-[#EFE1CE] text-[#2E190F] text-[10.5px] font-semibold border border-[#CEB79A] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Icon n="download" size={11} />
                          <span>Baixar PNG</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateTransparentAvatar(mascot)}
                          className="w-full py-1 px-2 rounded-lg bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#2E190F] text-[10px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title="Gerar avatar circular transparente em 512x512"
                        >
                          <Icon n="users" size={10} />
                          <span>Avatar Circular</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Format 2: Vetor SVG Oficial */}
                  {(formatFilter === "all" || formatFilter === "svg") && (
                    <div className="p-3 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A4032]">
                            Vetor SVG
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992] font-semibold">
                            Escalável
                          </span>
                        </div>

                        <div className="w-full h-28 rounded-lg overflow-hidden border border-[#E2D1BC] bg-[#FFFDF9] flex items-center justify-center p-2 my-1">
                          <img
                            src={mascot.mediaKit.svgPath}
                            alt={`${mascot.name} SVG`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadFile(
                              mascot.mediaKit.svgPath,
                              `deda-mascote-${mascot.id}.svg`
                            )
                          }
                          className="w-full py-1.5 px-2 rounded-lg bg-[#FFFDF9] hover:bg-[#EFE1CE] text-[#2E190F] text-[10.5px] font-semibold border border-[#CEB79A] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Icon n="download" size={11} />
                          <span>Baixar SVG</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectSvg(mascot)}
                          className="w-full py-1 px-2 rounded-lg bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#2E190F] text-[10px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title="Inspecionar código XML do SVG"
                        >
                          <Icon n="code" size={10} />
                          <span>Ver Código SVG</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Format 3: Modelo 3D Conceitual OBJ */}
                  {(formatFilter === "all" || formatFilter === "obj") && (
                    <div className="p-3 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A4032]">
                            Modelo 3D OBJ
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FCEEE6] text-[#A8421E] border border-[#E5A992] font-semibold">
                            Wavefront
                          </span>
                        </div>

                        {/* 3D Wireframe / Mesh Stylized Preview */}
                        <div className="w-full h-28 rounded-lg overflow-hidden border border-[#E2D1BC] bg-[#FFFDF9] flex flex-col items-center justify-center p-2 my-1 relative group/obj">
                          <div className="w-12 h-12 rounded-xl bg-[#FCEEE6] border border-[#E5A992] flex items-center justify-center text-[#B44B25] shadow-sm mb-1.5 group-hover/obj:scale-110 transition-transform">
                            <Icon n="cube" size={24} />
                          </div>
                          <span className="text-[10px] font-mono text-[#2E190F] font-semibold">
                            {mascot.id}.obj
                          </span>
                          <span className="text-[9px] text-[#755B4B]">Geometria Poligonal</span>
                        </div>
                      </div>

                      <div className="space-y-1 mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadFile(
                              mascot.mediaKit.objPath,
                              `deda-mascote-${mascot.id}.obj`
                            )
                          }
                          className="w-full py-1.5 px-2 rounded-lg bg-[#FFFDF9] hover:bg-[#EFE1CE] text-[#2E190F] text-[10.5px] font-semibold border border-[#CEB79A] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Icon n="download" size={11} />
                          <span>Baixar .OBJ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectObj(mascot)}
                          className="w-full py-1 px-2 rounded-lg bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#5A4032] hover:text-[#2E190F] text-[10px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                          title="Inspecionar dados e vértices do arquivo OBJ"
                        >
                          <Icon n="file-text" size={10} />
                          <span>Ver Geometria</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Color Tokens Chips */}
                {(formatFilter === "all" || formatFilter === "tokens") && (
                  <div className="p-3 rounded-xl bg-[#F4EBDD] border border-[#E2D1BC] mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-[#5A4032] mb-2">
                      <span>Tokens & Paleta Hex</span>
                      <span className="text-[10px] text-[#755B4B] font-normal">
                        Clique para copiar
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "Primária", val: mascot.mediaKit.themeColors.primary, k: `p-${mascot.id}` },
                        { label: "Secundária", val: mascot.mediaKit.themeColors.secondary, k: `s-${mascot.id}` },
                        { label: "Accent", val: mascot.mediaKit.themeColors.accent, k: `a-${mascot.id}` },
                        { label: "Glow Rim", val: mascot.mediaKit.themeColors.glow, k: `g-${mascot.id}` },
                      ].map((t) => (
                        <div
                          key={t.k}
                          onClick={() => handleCopyText(t.val, t.k)}
                          className="p-1.5 rounded-lg bg-[#FFFDF9] border border-[#E2D1BC] hover:border-[#C45730]/60 transition-colors cursor-pointer flex flex-col items-center"
                          title={`Copiar ${t.val}`}
                        >
                          <div
                            className="w-full h-4 rounded mb-1 shadow-sm border border-[#E2D1BC]"
                            style={{ backgroundColor: t.val }}
                          />
                          <span className="text-[9px] text-[#755B4B]">{t.label}</span>
                          <span className="text-[10px] font-mono text-[#2E190F] font-bold">
                            {copiedKey === t.k ? "✓ Copiado" : t.val.slice(0, 7)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Bar: Complete Bundle & JSON Export */}
              <div className="pt-3.5 border-t border-[#E2D1BC] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadBundle(mascot)}
                  disabled={bundleDownloading === mascot.id}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
                  title="Baixar pacote completo com PNG, SVG, OBJ e Manifest JSON"
                >
                  <Icon n="download" size={13} />
                  <span>
                    {bundleDownloading === mascot.id
                      ? "Baixando Pacote..."
                      : "Baixar Pacote Completo (PNG, SVG, OBJ)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadJson(mascot)}
                  className="py-2.5 px-3.5 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] text-xs font-semibold border border-[#CEB79A] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title="Exportar manifesto técnico em JSON"
                >
                  <Icon n="file-text" size={13} />
                  <span>Manifest JSON</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Code / 3D Geometry Inspection Modal */}
      {activeCodeModal && (
        <div
          className="modal-overlay fixed inset-0 z-50 bg-[#2E190F]/45 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setActiveCodeModal(null)}
        >
          <div
            className="modal-content w-full max-w-3xl max-h-[85vh] bg-[#FFFDF9] border border-[#CEB79A] rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col justify-between text-[#2E190F]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2D1BC]">
              <div className="flex items-center gap-2.5 min-w-0">
                <DedaLogo size={18} color="#C45730" />
                <h3 className="text-sm font-bold text-[#2E190F] truncate">{activeCodeModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCodeModal(null)}
                className="text-[#755B4B] hover:text-[#2E190F] p-1.5 rounded-lg hover:bg-[#F6ECE0] transition-colors cursor-pointer shrink-0"
              >
                <Icon n="x" size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#F4EBDD] border border-[#E2D1BC] rounded-xl p-4 font-mono text-xs text-[#2E190F] leading-relaxed max-h-[50vh] select-text">
              <pre className="whitespace-pre-wrap">{activeCodeModal.content}</pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t border-[#E2D1BC]">
              <span className="text-[11px] text-[#755B4B]">
                Formato: {activeCodeModal.language.toUpperCase()} • Padrão Universal
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(activeCodeModal.content, "modal-code")}
                  className="py-2 px-3 rounded-xl bg-[#F7EFE4] hover:bg-[#EFE1CE] text-[#2E190F] text-xs font-semibold border border-[#CEB79A] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Icon n={copiedKey === "modal-code" ? "check" : "copy"} size={13} />
                  <span>{copiedKey === "modal-code" ? "Copiado!" : "Copiar Código"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([activeCodeModal.content], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    handleDownloadFile(url, activeCodeModal.downloadFilename);
                    URL.revokeObjectURL(url);
                  }}
                  className="py-2 px-4 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Icon n="download" size={13} />
                  <span>Baixar Arquivo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
