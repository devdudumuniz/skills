import { useState } from "react";
import { AgentSkillSuite, BundledSkill } from "../types";
import { Icon } from "../../src/components/Icons";
import { calculateSkillTokenProfile } from "../../src/utils/tokenUtils";
import { SkillShareCardModal } from "../../src/components/SkillShareCardModal";

interface AgentSuiteDetailViewProps {
  suite: AgentSkillSuite;
  onBackToCatalog: () => void;
  onToggleInstall: (suiteId: string) => void;
  onToggleFavorite: (suiteId: string) => void;
  onTestPrompt: (suiteId: string, promptText: string) => void;
  onInspectSkillFiles: (suite: AgentSkillSuite, skill?: BundledSkill) => void;
  onOpenDiagramStudio?: (promptText?: string) => void;
}

export function AgentSuiteDetailView({
  suite,
  onBackToCatalog,
  onToggleInstall,
  onToggleFavorite,
  onTestPrompt,
  onInspectSkillFiles,
  onOpenDiagramStudio,
}: AgentSuiteDetailViewProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showArtModal, setShowArtModal] = useState(false);
  const [showShareCardModal, setShowShareCardModal] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2800);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link da habilidade copiado para a área de transferência!");
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 16px 60px" }}>
      {/* Toast */}
      {toastMessage && (
        <div
          className="hc-toast"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#FFFDF9",
            border: "1px solid #CEB79A",
            color: "#2E190F",
            padding: "10px 18px",
            borderRadius: 8,
            boxShadow: "0 12px 28px rgba(46, 25, 15, 0.14)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <Icon n="check" size={16} className="text-[#B44B25]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          fontSize: 13,
          color: "#755B4B",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={onBackToCatalog}
          style={{
            background: "none",
            border: "none",
            color: "#755B4B",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#2E190F")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#755B4B")}
        >
          <span>Habilidades</span>
        </button>
        <span style={{ color: "#CEB79A" }}>&gt;</span>
        <span style={{ color: "#2E190F", fontWeight: 600 }}>{suite.name}</span>
      </div>

      {/* Top Header Card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Left: Avatar + Title + Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            onClick={() => suite.coverTheme.imageUrl && setShowArtModal(true)}
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              overflow: "hidden",
              background: suite.coverTheme.bg || "#F2E6D5",
              border: "1px solid #CEB79A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 6px 18px rgba(46, 25, 15, 0.16)",
              cursor: suite.coverTheme.imageUrl ? "pointer" : "default",
              position: "relative",
              transition: "transform 0.15s ease",
            }}
            title={suite.coverTheme.imageUrl ? "Clique para ampliar a xilogravura de cordel" : suite.name}
            onMouseEnter={(e) => {
              if (suite.coverTheme.imageUrl) e.currentTarget.style.transform = "scale(1.04)";
            }}
            onMouseLeave={(e) => {
              if (suite.coverTheme.imageUrl) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {suite.coverTheme.imageUrl ? (
              <img
                src={suite.coverTheme.imageUrl}
                alt={suite.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter: "contrast(1.06)",
                }}
              />
            ) : (
              <Icon n={suite.coverTheme.icon || "layers"} size={28} />
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#2E190F",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                {suite.name}
              </h1>
              <button
                type="button"
                onClick={() => onToggleFavorite(suite.id)}
                title={suite.isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
                aria-label={suite.isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
                style={{
                  background: suite.isFavorite ? "#FFF6E3" : "#FFFDF9",
                  border: `1px solid ${suite.isFavorite ? "#D99B38" : "#CEB79A"}`,
                  color: suite.isFavorite ? "#9A6008" : "#755B4B",
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = suite.isFavorite ? "#9A6008" : "#2E190F";
                  e.currentTarget.style.borderColor = suite.isFavorite ? "#D99B38" : "#B59C7E";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = suite.isFavorite ? "#9A6008" : "#755B4B";
                  e.currentTarget.style.borderColor = suite.isFavorite ? "#D99B38" : "#CEB79A";
                }}
              >
                <Icon n="star" size={16} />
              </button>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#755B4B",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span>Por {suite.author}</span>
              <span>•</span>
              <span style={{ color: "#5A4032", fontWeight: 500 }}>
                {suite.coverTheme.subtitle || suite.tagline}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Gerenciar, Testar no Chat, Share, More) */}
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          {suite.coverTheme.imageUrl && (
            <button
              type="button"
              onClick={() => setShowArtModal(true)}
              title="Ver xilogravura de cordel em alta resolução"
              style={{
                background: "#FFFDF9",
                border: "1px solid #CEB79A",
                color: "#2E190F",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F6ECE0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFDF9")}
            >
              <Icon n="eye" size={15} />
              <span>Ver Xilogravura</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowShareCardModal(true)}
            title="Gerar cartão visual em PNG com as informações principais da skill"
            style={{
              background: "#FFFDF9",
              border: "1px solid #CEB79A",
              color: "#2E190F",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F6ECE0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFDF9")}
          >
            <Icon n="image" size={15} />
            <span>Gerar Cartão de Compartilhamento</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            title="Compartilhar habilidade"
            aria-label="Compartilhar habilidade"
            style={{
              background: "#FFFDF9",
              border: "1px solid #CEB79A",
              color: "#2E190F",
              width: 38,
              height: 38,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon n="share" size={16} />
          </button>

          <button
            type="button"
            onClick={() => onInspectSkillFiles(suite)}
            title="Inspecionar código e arquivos da skill"
            aria-label="Inspecionar código e arquivos da skill"
            style={{
              background: "#FFFDF9",
              border: "1px solid #CEB79A",
              color: "#2E190F",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F6ECE0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFDF9")}
          >
            <Icon n="code" size={15} />
          </button>

          <button
            type="button"
            onClick={() => onToggleInstall(suite.id)}
            style={{
              background: suite.installed ? "#FCEEE6" : "#C45730",
              border: `1px solid ${suite.installed ? "#C45730" : "#C45730"}`,
              color: suite.installed ? "#A8421E" : "#FFFFFF",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: suite.installed ? "none" : "0 4px 12px rgba(196, 87, 48, 0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <Icon n={suite.installed ? "check" : "plus"} size={15} />
            <span>{suite.installed ? "Gerenciar" : "Adicionar às minhas habilidades"}</span>
          </button>

          {(suite.id === "excalidraw-diagram-generator" || suite.id === "canvas-diagram-studio") &&
            onOpenDiagramStudio && (
              <button
                type="button"
                onClick={() => onOpenDiagramStudio(suite.prompts[0] || "")}
                style={{
                  background: "#C45730",
                  border: "1px solid #C45730",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(196, 87, 48, 0.25)",
                }}
              >
                <Icon n="pen-tool" size={15} />
                <span>Abrir Estúdio Excalidraw</span>
              </button>
            )}

          <button
            type="button"
            onClick={() => onTestPrompt(suite.id, suite.prompts[0] || "")}
            style={{
              background: "#F7EFE4",
              border: "1px solid #CEB79A",
              color: "#2E190F",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 6px rgba(46, 25, 15, 0.06)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#EFE1CE")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#F7EFE4")}
          >
            <Icon n="message-square" size={15} />
            <span>Testar no chat</span>
          </button>
        </div>
      </div>

      {/* Hero Banner with Prompt Pills */}
      <div
        style={{
          background: "linear-gradient(180deg, #F4EBDD 0%, #F9F2E7 100%)",
          border: "1px solid #E2D1BC",
          borderRadius: 16,
          padding: "20px",
          marginBottom: 24,
          boxShadow: "0 6px 18px rgba(46, 25, 15, 0.05)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {suite.prompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() =>
                suite.id === "excalidraw-diagram-generator" && onOpenDiagramStudio
                  ? onOpenDiagramStudio(promptText)
                  : onTestPrompt(suite.id, promptText)
              }
              style={{
                width: "100%",
                background: "#FFFDF9",
                border: "1px solid #CEB79A",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                color: "#2E190F",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FCEEE6";
                e.currentTarget.style.borderColor = "#C45730";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFFDF9";
                e.currentTarget.style.borderColor = "#CEB79A";
                e.currentTarget.style.transform = "translateX(0px)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "#FCEEE6",
                    color: "#B44B25",
                    flexShrink: 0,
                  }}
                >
                  <Icon n="message-square" size={13} />
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    color: "#5A4032",
                    lineHeight: 1.4,
                  }}
                >
                  <strong style={{ color: "#2E190F", marginRight: 6 }}>{suite.name}:</strong>
                  {promptText}
                </span>
              </div>
              <div
                style={{
                  color: "#755B4B",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Icon n="arrow-right" size={15} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Description Paragraph */}
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.65,
          color: "#5A4032",
          marginBottom: 20,
          padding: "0 4px",
        }}
      >
        <p style={{ margin: 0 }}>{suite.description}</p>
      </div>

      {/* Context Footprint & Token Counter Card */}
      {(() => {
        const tokenProfile = calculateSkillTokenProfile(suite);
        return (
          <div
            style={{
              backgroundColor: "#FFFDF9",
              border: "1px solid #E2D1BC",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              boxShadow: "0 2px 8px rgba(46, 25, 15, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: "#FCEEE6",
                  border: `1px solid ${tokenProfile.categoryColor}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: tokenProfile.categoryColor,
                }}
              >
                <Icon n="zap" size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#2E190F" }}>
                    Pegada de Contexto & Tokens da Habilidade
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 7px",
                      borderRadius: 4,
                      backgroundColor: "#FCEEE6",
                      border: `1px solid ${tokenProfile.categoryColor}40`,
                      color: tokenProfile.categoryColor,
                      fontWeight: 700,
                    }}
                  >
                    {tokenProfile.categoryLabel}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#755B4B", marginTop: 2 }}>
                  Consumo estimado de memória na janela de contexto de agentes de IA
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10.5, color: "#755B4B", textTransform: "uppercase", fontWeight: 700 }}>
                  Tokens Totais
                </div>
                <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 800, color: "#B44B25" }}>
                  {tokenProfile.formatted}
                </div>
              </div>

              <div style={{ width: 1, height: 28, backgroundColor: "#E2D1BC" }} />

              <div>
                <div style={{ fontSize: 10.5, color: "#755B4B", textTransform: "uppercase", fontWeight: 700 }}>
                  Janela 128k (GPT/Gemini)
                </div>
                <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 800, color: "#2E190F" }}>
                  {tokenProfile.percent128k}%
                </div>
              </div>

              <div style={{ width: 1, height: 28, backgroundColor: "#E2D1BC" }} />

              <div>
                <div style={{ fontSize: 10.5, color: "#755B4B", textTransform: "uppercase", fontWeight: 700 }}>
                  Janela 200k (Claude)
                </div>
                <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 800, color: "#A8421E" }}>
                  {tokenProfile.percentClaude200k}%
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Habilidades Section Heading */}
      <div
        style={{
          borderBottom: "1px solid #E2D1BC",
          paddingBottom: 14,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#2E190F",
              margin: 0,
            }}
          >
            Habilidades
          </h2>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#755B4B",
            }}
          >
            {suite.skills.length}
          </span>
        </div>

        <span style={{ fontSize: 12, color: "#755B4B" }}>
          Todas as capacidades ativadas juntas neste agente
        </span>
      </div>

      {/* Bundled Sub-Skills List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {suite.skills.map((skill, index) => (
          <div
            key={skill.id || index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
              padding: "16px 18px",
              borderRadius: 10,
              background: "#FFFDF9",
              border: "1px solid #E2D1BC",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F6ECE0";
              e.currentTarget.style.borderColor = "#CEB79A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#FFFDF9";
              e.currentTarget.style.borderColor = "#E2D1BC";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 220, flex: 1 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#FCEEE6",
                  border: "1px solid #E5A992",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#B44B25",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <Icon n={skill.icon || "check-circle"} size={18} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "#2E190F",
                    margin: "0 0 4px",
                  }}
                >
                  {skill.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "#5A4032",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {skill.description}
                </p>

                {skill.procedure && skill.procedure.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {skill.procedure.slice(0, 3).map((step, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: 11,
                          color: "#5A4032",
                          background: "#F4EBDD",
                          border: "1px solid #E2D1BC",
                          borderRadius: 4,
                          padding: "2px 8px",
                        }}
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: "auto" }}>
              <button
                type="button"
                onClick={() => onInspectSkillFiles(suite, skill)}
                title="Ver documentação e código desta habilidade"
                style={{
                  background: "#F7EFE4",
                  border: "1px solid #CEB79A",
                  color: "#2E190F",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#EFE1CE";
                  e.currentTarget.style.color = "#2E190F";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F7EFE4";
                  e.currentTarget.style.color = "#2E190F";
                }}
              >
                <Icon n="file-text" size={13} />
                <span>Ver Código</span>
              </button>

              <button
                type="button"
                onClick={() => onTestPrompt(suite.id, `Executar habilidade: ${skill.name}`)}
                title="Testar esta habilidade no playground"
                style={{
                  background: "#C45730",
                  border: "1px solid #C45730",
                  color: "#FFFFFF",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#AE4823")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#C45730")}
              >
                <Icon n="play" size={13} />
                <span>Testar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Exibição da Xilogravura de Cordel */}
      {showArtModal && suite.coverTheme.imageUrl && (
        <div
          className="modal-overlay"
          onClick={() => setShowArtModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(46, 25, 15, 0.48)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 20,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#FFFDF9",
              border: "1px solid #CEB79A",
              borderRadius: 16,
              maxWidth: 580,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(46, 25, 15, 0.25)",
              color: "#2E190F",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E2D1BC",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#B44B25", fontWeight: 700 }}>
                  Xilogravura Nordestina • Literatura de Cordel
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2E190F" }}>
                  {suite.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArtModal(false)}
                aria-label="Fechar modal"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#755B4B",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <Icon n="x" size={18} />
              </button>
            </div>

            <div style={{ padding: 20, textAlign: "center", background: "#F4EBDD" }}>
              <img
                src={suite.coverTheme.imageUrl}
                alt={suite.name}
                style={{
                  width: "100%",
                  maxHeight: 460,
                  objectFit: "contain",
                  borderRadius: 8,
                  border: "2px solid #CEB79A",
                  boxShadow: "0 8px 24px rgba(46, 25, 15, 0.18)",
                }}
              />
              <p
                style={{
                  fontSize: 12.5,
                  color: "#5A4032",
                  lineHeight: 1.5,
                  margin: "14px auto 0",
                  maxWidth: 500,
                }}
              >
                Gravura em relevo no estilo xilogravura tradicional do sertão nordestino. Incorpora elementos culturais típicos (mandacaru, carcará, sanfona, sol com espirais e casario) integrados aos conceitos técnicos da habilidade.
              </p>
            </div>

            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #E2D1BC",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "#755B4B" }}>
                Referência visual: Xilogravura de Cordel
              </span>
              <button
                type="button"
                onClick={() => setShowArtModal(false)}
                style={{
                  background: "#F7EFE4",
                  border: "1px solid #CEB79A",
                  color: "#2E190F",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Geração de Cartão de Compartilhamento (PNG via html2canvas) */}
      {showShareCardModal && (
        <SkillShareCardModal
          suite={suite}
          onClose={() => setShowShareCardModal(false)}
          onNotify={showToast}
        />
      )}
    </div>
  );
}
