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
      specVersion: "2.4.0",
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
      <div className="bg-gradient-to-b from-[#1f1f1f] to-[#161616] border border-[#333333] rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#2c2c2c]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <DedaLogo size={18} color="#EAEAEA" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#9B9B9B]">
                Galeria Multimídia de Ativos • Deda Skills
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#EAEAEA] tracking-tight">
              Mascot Asset Gallery (PNG, SVG & 3D OBJ)
            </h2>
            <p className="text-xs text-[#C2C2C2] mt-1 max-w-2xl leading-relaxed">
              Exibição unificada dos 4 mascotes da fauna brasileira em todos os formatos visuais: PNG transparente em alta definição, Vetor SVG escalável e modelo 3D conceitual Wavefront (.OBJ).
            </p>
          </div>

          {/* Transparency Grid Toggle */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setShowTransparencyGrid(!showTransparencyGrid)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showTransparencyGrid
                  ? "bg-[#2c2c2c] text-[#00FFA3] border-[#00FFA3]/50"
                  : "bg-[#202020] text-[#9B9B9B] border-[#333333] hover:text-[#EAEAEA]"
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#767676] mr-1">
              Mascote:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMascotId("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedMascotId === "all"
                  ? "bg-[#EAEAEA] text-[#151515] shadow-sm"
                  : "bg-[#222222] text-[#9B9B9B] hover:text-[#EAEAEA] border border-[#333333]"
              }`}
            >
              Todos (4)
            </button>
            {MASCOT_AGENTS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMascotId(m.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedMascotId === m.id
                    ? "bg-[#EAEAEA] text-[#151515] shadow-sm"
                    : "bg-[#222222] text-[#9B9B9B] hover:text-[#EAEAEA] border border-[#333333]"
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#767676] mr-1">
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
                    ? "bg-[#333333] text-[#EAEAEA] border border-[#555555]"
                    : "bg-[#1c1c1c] text-[#888888] hover:text-[#C2C2C2] border border-[#2a2a2a]"
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
              className="bg-[#181818] border border-[#2c2c2c] hover:border-[#444444] rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Header: Mascot Identity */}
                <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-[#282828]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#383838] shadow-md shrink-0">
                      <img
                        src={mascot.mediaKit.pngTransparent}
                        alt={mascot.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#EAEAEA]">{mascot.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#242424] text-[#9B9B9B] border border-[#383838]">
                          {mascot.nickname}
                        </span>
                      </div>
                      <div className="text-xs text-[#C2C2C2] font-semibold mt-0.5">
                        {mascot.title}
                      </div>
                      <div className="text-[11px] text-[#767676]">{mascot.species}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenQuickInfo && (
                      <button
                        type="button"
                        onClick={() => onOpenQuickInfo(mascot)}
                        className="p-2 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] text-[#C2C2C2] hover:text-[#EAEAEA] border border-[#383838] transition-colors cursor-pointer"
                        title="Ver especialidades e estilo de resolução"
                      >
                        <Icon n="zap" size={14} />
                      </button>
                    )}
                    {onOpen3DStudio && (
                      <button
                        type="button"
                        onClick={() => onOpen3DStudio(mascot.id)}
                        className="p-2 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] text-[#00FFA3] hover:text-white border border-[#383838] transition-colors cursor-pointer"
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
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#202020] border border-[#2d2d2d] text-[#9B9B9B]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Multi-Format Assets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  {/* Format 1: PNG Transparente HD */}
                  {(formatFilter === "all" || formatFilter === "png") && (
                    <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#767676]">
                            PNG Transparente
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#202020] text-[#EAEAEA] border border-[#333333]">
                            1024px
                          </span>
                        </div>

                        <div
                          className={`w-full h-28 rounded-lg overflow-hidden border border-[#2d2d2d] flex items-center justify-center p-1 relative my-1 ${
                            showTransparencyGrid
                              ? "bg-[repeating-conic-gradient(#202020_0%_25%,#161616_0%_50%)] bg-[length:16px_16px]"
                              : "bg-[#111111]"
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
                          className="w-full py-1.5 px-2 rounded-lg bg-[#222222] hover:bg-[#2b2b2b] text-[#C2C2C2] hover:text-[#EAEAEA] text-[10.5px] font-semibold border border-[#333333] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Icon n="download" size={11} />
                          <span>Baixar PNG</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateTransparentAvatar(mascot)}
                          className="w-full py-1 px-2 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] text-[#888888] hover:text-[#C2C2C2] text-[10px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
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
                    <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#767676]">
                            Vetor SVG
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#202020] text-[#00FFA3] border border-[#333333]">
                            Escalável
                          </span>
                        </div>

                        <div className="w-full h-28 rounded-lg overflow-hidden border border-[#2d2d2d] bg-[#111111] flex items-center justify-center p-2 my-1">
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
                          className="w-full py-1.5 px-2 rounded-lg bg-[#222222] hover:bg-[#2b2b2b] text-[#C2C2C2] hover:text-[#EAEAEA] text-[10.5px] font-semibold border border-[#333333] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Icon n="download" size={11} />
                          <span>Baixar SVG</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectSvg(mascot)}
                          className="w-full py-1 px-2 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] text-[#888888] hover:text-[#C2C2C2] text-[10px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
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
                    <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#767676]">
                            Modelo 3D OBJ
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#202020] text-[#00D2FF] border border-[#333333]">
                            Wavefront
                          </span>
                        </div>

                        {/* 3D Wireframe / Mesh Stylized Preview */}
                        <div className="w-full h-28 rounded-lg overflow-hidden border border-[#2d2d2d] bg-[#111111] flex flex-col items-center justify-center p-2 my-1 relative group/obj">
                          <div className="w-12 h-12 rounded-xl bg-[#1e1e1e] border border-[#383838] flex items-center justify-center text-[#00D2FF] shadow-inner mb-1.5 group-hover/obj:scale-110 transition-transform">
                            <Icon n="cube" size={24} />
                          </div>
                          <span className="text-[10px] font-mono text-[#9B9B9B]">
                            {mascot.id}.obj
                          </span>
                          <span className="text-[9px] text-[#555555]">Geometria Poligonal</span>
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
                          className="w-full py-1.5 px-2 rounded-lg bg-[#222222] hover:bg-[#2b2b2b] text-[#C2C2C2] hover:text-[#EAEAEA] text-[10.5px] font-semibold border border-[#333333] transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Icon n="download" size={11} />
                          <span>Baixar .OBJ</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInspectObj(mascot)}
                          className="w-full py-1 px-2 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] text-[#888888] hover:text-[#C2C2C2] text-[10px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
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
                  <div className="p-3 rounded-xl bg-[#141414] border border-[#242424] mb-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#767676] mb-2">
                      <span>Tokens & Paleta Hex</span>
                      <span className="text-[10px] text-[#9B9B9B] font-normal">
                        Clique para copiar
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Primária", val: mascot.mediaKit.themeColors.primary, k: `p-${mascot.id}` },
                        { label: "Secundária", val: mascot.mediaKit.themeColors.secondary, k: `s-${mascot.id}` },
                        { label: "Accent", val: mascot.mediaKit.themeColors.accent, k: `a-${mascot.id}` },
                        { label: "Glow Rim", val: mascot.mediaKit.themeColors.glow, k: `g-${mascot.id}` },
                      ].map((t) => (
                        <div
                          key={t.k}
                          onClick={() => handleCopyText(t.val, t.k)}
                          className="p-1.5 rounded-lg bg-[#1e1e1e] border border-[#2e2e2e] hover:border-[#555] transition-colors cursor-pointer flex flex-col items-center"
                          title={`Copiar ${t.val}`}
                        >
                          <div
                            className="w-full h-4 rounded mb-1 shadow-sm"
                            style={{ backgroundColor: t.val }}
                          />
                          <span className="text-[9px] text-[#888888]">{t.label}</span>
                          <span className="text-[10px] font-mono text-[#EAEAEA] font-bold">
                            {copiedKey === t.k ? "✓ Copiado" : t.val.slice(0, 7)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Bar: Complete Bundle & JSON Export */}
              <div className="pt-3.5 border-t border-[#262626] flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => handleDownloadBundle(mascot)}
                  disabled={bundleDownloading === mascot.id}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#EAEAEA] hover:bg-white text-[#151515] text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
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
                  className="py-2.5 px-3.5 rounded-xl bg-[#222222] hover:bg-[#2b2b2b] text-[#C2C2C2] hover:text-[#EAEAEA] text-xs font-semibold border border-[#333333] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveCodeModal(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] bg-[#181818] border border-[#383838] rounded-2xl shadow-2xl p-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2.5">
                <DedaLogo size={18} color="#EAEAEA" />
                <h3 className="text-sm font-bold text-[#EAEAEA]">{activeCodeModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCodeModal(null)}
                className="text-[#9B9B9B] hover:text-[#EAEAEA] p-1.5 rounded-lg hover:bg-[#252525] transition-colors cursor-pointer"
              >
                <Icon n="x" size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#111111] border border-[#262626] rounded-xl p-4 font-mono text-xs text-[#C2C2C2] leading-relaxed max-h-[50vh] select-text">
              <pre className="whitespace-pre-wrap">{activeCodeModal.content}</pre>
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#2e2e2e]">
              <span className="text-[11px] text-[#767676]">
                Formato: {activeCodeModal.language.toUpperCase()} • Padrão Universal
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(activeCodeModal.content, "modal-code")}
                  className="py-2 px-3 rounded-xl bg-[#242424] hover:bg-[#2c2c2c] text-[#C2C2C2] hover:text-[#EAEAEA] text-xs font-semibold border border-[#383838] transition-colors cursor-pointer flex items-center gap-1.5"
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
                  className="py-2 px-4 rounded-xl bg-[#EAEAEA] hover:bg-white text-[#151515] text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
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
