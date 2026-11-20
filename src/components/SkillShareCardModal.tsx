import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { AgentSkillSuite } from "../../skills/types";
import { Icon } from "./Icons";
import {
  buildShareCardPayload,
  ShareCardTheme,
} from "../utils/shareCardUtils";

interface SkillShareCardModalProps {
  suite: AgentSkillSuite;
  onClose: () => void;
  onNotify?: (message: string) => void;
}

const CARD_PALETTES: Record<
  ShareCardTheme,
  {
    outerBg: string;
    cardBg: string;
    surfaceBg: string;
    border: string;
    borderStrong: string;
    ink: string;
    inkSecondary: string;
    muted: string;
    accent: string;
    accentSoftBg: string;
    accentSoftBorder: string;
    accentSoftText: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  light: {
    outerBg: "#FAF3E8",
    cardBg: "#FFFDF9",
    surfaceBg: "#F4EBDD",
    border: "#E2D1BC",
    borderStrong: "#CEB79A",
    ink: "#2E190F",
    inkSecondary: "#5A4032",
    muted: "#755B4B",
    accent: "#C45730",
    accentSoftBg: "#FCEEE6",
    accentSoftBorder: "#E5A992",
    accentSoftText: "#A8421E",
    badgeBg: "#F2E6D5",
    badgeText: "#5A4032",
  },
  dark: {
    outerBg: "#1A1512",
    cardBg: "#241E1A",
    surfaceBg: "#2E2620",
    border: "#3E332B",
    borderStrong: "#544539",
    ink: "#FAF3E8",
    inkSecondary: "#DDD0C1",
    muted: "#B4A391",
    accent: "#E07A52",
    accentSoftBg: "#3A261E",
    accentSoftBorder: "#7C4530",
    accentSoftText: "#F5B89E",
    badgeBg: "#312822",
    badgeText: "#E8DDD0",
  },
};

export function SkillShareCardModal({
  suite,
  onClose,
  onNotify,
}: SkillShareCardModalProps) {
  const [cardTheme, setCardTheme] = useState<ShareCardTheme>("light");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);
  const [pngDimensions, setPngDimensions] = useState<{ width: number; height: number } | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const captureRef = useRef<HTMLDivElement | null>(null);

  const payload = useMemo(
    () => buildShareCardPayload(suite, cardTheme),
    [suite, cardTheme]
  );
  const palette = CARD_PALETTES[cardTheme];

  const generateShareCardPng = useCallback(async () => {
    const target = captureRef.current;
    if (!target) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setCopySuccess(false);

    try {
      // Wait for any images inside the card to finish decoding before capturing
      const images = Array.from(target.querySelectorAll("img"));
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
                return;
              }
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
              setTimeout(done, 2500);
            })
        )
      );

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: palette.outerBg,
        logging: false,
        onclone: (clonedDoc) => {
          // Ensure html2canvas never inherits high-contrast overrides or unsupported color functions
          clonedDoc.documentElement.removeAttribute("data-accessibility-contrast");
          clonedDoc.documentElement.style.backgroundColor = palette.outerBg;
          clonedDoc.documentElement.style.color = palette.ink;
          clonedDoc.body.style.backgroundColor = palette.outerBg;
          clonedDoc.body.style.color = palette.ink;

          // Strip stylesheets that may contain Tailwind v4 oklch()/color-mix() declarations
          // because the share card target uses 100% explicit inline hex/rgba styles.
          const styleNodes = Array.from(
            clonedDoc.querySelectorAll("style, link[rel='stylesheet']")
          );
          for (const node of styleNodes) {
            node.remove();
          }
        },
      });

      const dataUrl = canvas.toDataURL("image/png");
      setPngDataUrl(dataUrl);
      setPngDimensions({ width: canvas.width, height: canvas.height });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Erro desconhecido ao renderizar imagem.";
      setErrorMsg(`Não foi possível gerar o PNG com html2canvas: ${detail}`);
      setPngDataUrl(null);
    } finally {
      setIsGenerating(false);
    }
  }, [palette.ink, palette.outerBg]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void generateShareCardPng();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [generateShareCardPng]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    const link = document.createElement("a");
    link.href = pngDataUrl;
    link.download = payload.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify?.(`Cartão PNG "${payload.filename}" baixado com sucesso!`);
  };

  const handleCopyPngToClipboard = async () => {
    if (!pngDataUrl) return;
    try {
      const response = await fetch(pngDataUrl);
      const blob = await response.blob();
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopySuccess(true);
        onNotify?.("Imagem PNG copiada para a área de transferência!");
        window.setTimeout(() => setCopySuccess(false), 2500);
      } else {
        handleDownloadPng();
      }
    } catch {
      handleDownloadPng();
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-modal-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(46, 25, 15, 0.52)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 16,
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFDF9",
          border: "1px solid #CEB79A",
          borderRadius: 16,
          maxWidth: 920,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(46, 25, 15, 0.28)",
          color: "#2E190F",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #E2D1BC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#B44B25",
                fontWeight: 700,
              }}
            >
              Exportação Editorial • html2canvas PNG
            </div>
            <h2
              id="share-card-modal-title"
              style={{ fontSize: 17, fontWeight: 700, color: "#2E190F", margin: "2px 0 0" }}
            >
              Cartão de Compartilhamento — {suite.name}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Theme Switcher for Card */}
            <div
              role="group"
              aria-label="Tema do cartão de compartilhamento"
              style={{
                display: "inline-flex",
                background: "#F2E6D5",
                border: "1px solid #CEB79A",
                borderRadius: 8,
                padding: 2,
                gap: 2,
              }}
            >
              <button
                type="button"
                aria-pressed={cardTheme === "light"}
                onClick={() => setCardTheme("light")}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: cardTheme === "light" ? "#FFFDF9" : "transparent",
                  color: cardTheme === "light" ? "#2E190F" : "#755B4B",
                  border: cardTheme === "light" ? "1px solid #CEB79A" : "1px solid transparent",
                  cursor: "pointer",
                }}
              >
                Pergaminho Claro
              </button>
              <button
                type="button"
                aria-pressed={cardTheme === "dark"}
                onClick={() => setCardTheme("dark")}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: cardTheme === "dark" ? "#FFFDF9" : "transparent",
                  color: cardTheme === "dark" ? "#2E190F" : "#755B4B",
                  border: cardTheme === "dark" ? "1px solid #CEB79A" : "1px solid transparent",
                  cursor: "pointer",
                }}
              >
                Xilogravura Escuro
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal de cartão de compartilhamento"
              style={{
                background: "transparent",
                border: "1px solid #E2D1BC",
                borderRadius: 8,
                color: "#5A4032",
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon n="x" size={16} />
            </button>
          </div>
        </div>

        {/* Preview Stage */}
        <div
          style={{
            padding: "20px",
            background: "#F4EBDD",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Status / Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              style={{
                width: "100%",
                maxWidth: 800,
                background: "#FDECE9",
                border: "1px solid #E5A992",
                color: "#9E2A1C",
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Live Rendered Share Card (Captured via html2canvas) */}
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              display: "flex",
              justifyContent: "center",
              paddingBottom: 4,
            }}
          >
            <div
              ref={captureRef}
              data-testid="share-card-capture-target"
              style={{
                width: 800,
                minWidth: 800,
                backgroundColor: palette.outerBg,
                padding: 28,
                borderRadius: 18,
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                color: palette.ink,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  backgroundColor: palette.cardBg,
                  border: `2px solid ${palette.borderStrong}`,
                  borderRadius: 16,
                  padding: 28,
                  boxSizing: "border-box",
                }}
              >
                {/* Card Top Brand Strip */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: `1px solid ${palette.border}`,
                    paddingBottom: 14,
                    marginBottom: 22,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: palette.accent,
                        color: "#FFFFFF",
                        display: "block",
                        textAlign: "center",
                        lineHeight: "32px",
                        fontWeight: 800,
                        fontSize: 13,
                        letterSpacing: "-0.02em",
                        boxSizing: "border-box",
                      }}
                    >
                      DS
                    </div>
                    <div style={{ lineHeight: 1.25 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: palette.ink,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          lineHeight: "16px",
                        }}
                      >
                        Deda Skills
                      </div>
                      <div style={{ fontSize: 10.5, color: palette.muted, lineHeight: "14px", marginTop: 2 }}>
                        Catálogo Universal de Habilidades para Agentes de IA
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: palette.accentSoftBg,
                        border: `1px solid ${palette.accentSoftBorder}`,
                        color: palette.accentSoftText,
                        fontSize: 11,
                        fontWeight: 700,
                        height: 26,
                        lineHeight: "24px",
                        padding: "0 11px",
                        borderRadius: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        boxSizing: "border-box",
                      }}
                    >
                      {payload.categoryLabel}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: palette.badgeBg,
                        border: `1px solid ${palette.borderStrong}`,
                        color: palette.badgeText,
                        fontSize: 11,
                        fontWeight: 700,
                        height: 26,
                        lineHeight: "24px",
                        padding: "0 10px",
                        borderRadius: 6,
                        fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
                        boxSizing: "border-box",
                      }}
                    >
                      v{payload.version}
                    </span>
                  </div>
                </div>

                {/* Card Main Grid */}
                <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
                  {/* Left Column: Xilogravura Cover Art */}
                  <div
                    style={{
                      width: 210,
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 210,
                        height: 210,
                        borderRadius: 12,
                        overflow: "hidden",
                        border: `2px solid ${palette.borderStrong}`,
                        backgroundColor: palette.surfaceBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                      }}
                    >
                      {payload.coverImageUrl ? (
                        <img
                          src={payload.coverImageUrl}
                          alt={payload.name}
                          crossOrigin="anonymous"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div style={{ color: palette.accent, fontWeight: 800, fontSize: 28 }}>
                          {payload.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        backgroundColor: palette.surfaceBg,
                        border: `1px solid ${palette.border}`,
                        borderRadius: 10,
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11.5,
                          lineHeight: "16px",
                        }}
                      >
                        <span style={{ color: palette.muted }}>Contexto</span>
                        <strong
                          style={{
                            color: palette.accent,
                            fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
                          }}
                        >
                          {payload.tokensFormatted}
                        </strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11.5,
                          lineHeight: "16px",
                        }}
                      >
                        <span style={{ color: palette.muted }}>Janela 128k</span>
                        <strong style={{ color: palette.ink }}>{payload.percent128k}%</strong>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11.5,
                          lineHeight: "16px",
                        }}
                      >
                        <span style={{ color: palette.muted }}>Execuções</span>
                        <strong style={{ color: palette.ink }}>{payload.usageCount}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Title, Description, Sub-skills */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: palette.accent,
                          lineHeight: "16px",
                          marginBottom: 6,
                        }}
                      >
                        Por {payload.author} • {payload.tokenCategoryLabel}
                      </div>

                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          color: palette.ink,
                          lineHeight: 1.2,
                          letterSpacing: "-0.02em",
                          marginBottom: 10,
                        }}
                      >
                        {payload.name}
                      </div>

                      <div
                        style={{
                          fontSize: 13.5,
                          lineHeight: 1.55,
                          color: palette.inkSecondary,
                          marginBottom: 16,
                        }}
                      >
                        {payload.description}
                      </div>
                    </div>

                    {/* Sub-skills List */}
                    <div
                      style={{
                        backgroundColor: palette.surfaceBg,
                        border: `1px solid ${palette.border}`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        boxSizing: "border-box",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: palette.muted,
                          lineHeight: "14px",
                          marginBottom: 8,
                        }}
                      >
                        Capacidades Incluídas ({payload.totalSubSkills})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {payload.subSkills.map((skillName, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: palette.ink,
                              lineHeight: "18px",
                            }}
                          >
                            <span
                              style={{
                                color: palette.accent,
                                fontWeight: 900,
                                marginRight: 8,
                              }}
                            >
                              •
                            </span>
                            <span>{skillName}</span>
                          </div>
                        ))}
                        {payload.extraSubSkillsCount > 0 && (
                          <div
                            style={{
                              fontSize: 11.5,
                              color: palette.muted,
                              paddingLeft: 14,
                              lineHeight: "16px",
                            }}
                          >
                            + {payload.extraSubSkillsCount} capacidade(s) adicional(is)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 12,
                    borderTop: `1px solid ${palette.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: palette.muted,
                  }}
                >
                  <span>
                    Compatível com Claude Code • Codex • Cursor • Manus • Agentes Locais
                  </span>
                  <strong
                    style={{
                      color: palette.inkSecondary,
                      fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
                    }}
                  >
                    skills/{payload.id}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Generated PNG Confirmation Strip */}
          <div
            data-testid="share-card-png-status"
            style={{
              width: "100%",
              maxWidth: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              background: "#FFFDF9",
              border: "1px solid #E2D1BC",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 12.5,
              color: "#5A4032",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon
                n={isGenerating ? "refresh-cw" : pngDataUrl ? "check-circle" : "alert"}
                size={15}
                className="text-[#B44B25]"
              />
              <span>
                {isGenerating
                  ? "Renderizando imagem PNG em alta resolução via html2canvas..."
                  : pngDataUrl && pngDimensions
                    ? `PNG pronto para download (${pngDimensions.width} × ${pngDimensions.height}px • ${payload.filename})`
                    : "Aguardando geração da imagem PNG."}
              </span>
            </div>

            {pngDataUrl && (
              <img
                src={pngDataUrl}
                alt={`Prévia PNG gerada para ${suite.name}`}
                data-testid="share-card-generated-png"
                style={{
                  height: 36,
                  borderRadius: 4,
                  border: "1px solid #CEB79A",
                  display: "block",
                }}
              />
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #E2D1BC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={() => void generateShareCardPng()}
            disabled={isGenerating}
            style={{
              background: "#F7EFE4",
              border: "1px solid #CEB79A",
              color: "#2E190F",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: isGenerating ? "not-allowed" : "pointer",
            }}
          >
            <Icon n="refresh-cw" size={14} />
            <span>{isGenerating ? "Gerando..." : "Regerar PNG"}</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => void handleCopyPngToClipboard()}
              disabled={!pngDataUrl || isGenerating}
              style={{
                background: "#F7EFE4",
                border: "1px solid #CEB79A",
                color: "#2E190F",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: !pngDataUrl || isGenerating ? "not-allowed" : "pointer",
              }}
            >
              <Icon n={copySuccess ? "check" : "copy"} size={14} />
              <span>{copySuccess ? "Imagem Copiada!" : "Copiar PNG"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={!pngDataUrl || isGenerating}
              style={{
                background: "#C45730",
                border: "1px solid #C45730",
                color: "#FFFFFF",
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: !pngDataUrl || isGenerating ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(196, 87, 48, 0.25)",
              }}
            >
              <Icon n="download" size={15} />
              <span>Baixar PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
