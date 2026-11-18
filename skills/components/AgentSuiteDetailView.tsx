import { useState } from "react";
import { AgentSkillSuite, BundledSkill } from "../types";
import { Icon } from "../../src/components/Icons";
import { calculateSkillTokenProfile } from "../../src/utils/tokenUtils";

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
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showArtModal, setShowArtModal] = useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2500);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 16px 60px" }}>
      {/* Toast */}
      {showCopiedToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#2A241F",
            border: "1px solid #483E34",
            color: "#F5F2EB",
            padding: "10px 18px",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
          }}
        >
          <Icon n="check" size={16} />
          <span>Link da habilidade copiado para a área de transferência!</span>
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
          color: "#A39889",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={onBackToCatalog}
          style={{
            background: "none",
            border: "none",
            color: "#A39889",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F2EB")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#A39889")}
        >
          <span>Habilidades</span>
        </button>
        <span style={{ color: "#50463B" }}>&gt;</span>
        <span style={{ color: "#F5F2EB", fontWeight: 500 }}>{suite.name}</span>
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
              background: suite.coverTheme.bg || "#1c1c1c",
              border: "1px solid #3d3d3d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
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
                  filter: "contrast(1.08)",
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
                  fontWeight: 650,
                  color: "#EAEAEA",
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
                style={{
                  background: suite.isFavorite ? "#333333" : "transparent",
                  border: `1px solid ${suite.isFavorite ? "#767676" : "#383838"}`,
                  color: suite.isFavorite ? "#EAEAEA" : "#767676",
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
                  e.currentTarget.style.color = "#EAEAEA";
                  e.currentTarget.style.borderColor = "#767676";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = suite.isFavorite ? "#EAEAEA" : "#767676";
                  e.currentTarget.style.borderColor = suite.isFavorite ? "#767676" : "#383838";
                }}
              >
                <Icon n="star" size={16} />
              </button>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#9B9B9B",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>Por {suite.author}</span>
              <span>•</span>
              <span style={{ color: "#C2C2C2", fontWeight: 500 }}>
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
                background: "#27221E",
                border: "1px solid #3D352D",
                color: "#D4CDC3",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#302A24")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#27221E")}
            >
              <Icon n="eye" size={15} />
              <span>Ver Xilogravura</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            title="Compartilhar habilidade"
            style={{
              background: "#27221E",
              border: "1px solid #3D352D",
              color: "#D4CDC3",
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
            style={{
              background: "#27221E",
              border: "1px solid #3D352D",
              color: "#D4CDC3",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#302A24")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#27221E")}
          >
            <Icon n="code" size={15} />
          </button>

          <button
            type="button"
            onClick={() => onToggleInstall(suite.id)}
            style={{
              background: suite.installed ? "#2A241F" : "#D97757",
              border: `1px solid ${suite.installed ? "#483E34" : "#D97757"}`,
              color: suite.installed ? "#F5F2EB" : "#FFFFFF",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: suite.installed ? "none" : "0 2px 10px rgba(217,119,87,0.35)",
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
                  background: "#D97757",
                  border: "1px solid #D97757",
                  color: "#FFFFFF",
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 10px rgba(217,119,87,0.35)",
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
              background: "#302A24",
              border: "1px solid #483E34",
              color: "#F5F2EB",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#3B332D")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#302A24")}
          >
            <Icon n="message-square" size={15} />
            <span>Testar no chat</span>
          </button>
        </div>
      </div>

      {/* Hero Banner with Prompt Pills */}
      <div
        style={{
          background: "linear-gradient(180deg, #24201D 0%, #2A241F 100%)",
          border: "1px solid #383129",
          borderRadius: 16,
          padding: "20px",
          marginBottom: 24,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.3)",
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
                background: "rgba(30, 26, 23, 0.78)",
                backdropFilter: "blur(4px)",
                border: "1px solid #3D352D",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                color: "#F5F2EB",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#332B25";
                e.currentTarget.style.borderColor = "#D97757";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(30, 26, 23, 0.78)";
                e.currentTarget.style.borderColor = "#3D352D";
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
                    background: "#302A24",
                    color: "#D97757",
                    flexShrink: 0,
                  }}
                >
                  <Icon n="message-square" size={13} />
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    color: "#D4CDC3",
                    lineHeight: 1.4,
                  }}
                >
                  <strong style={{ color: "#F5F2EB", marginRight: 6 }}>{suite.name}:</strong>
                  {promptText}
                </span>
              </div>
              <div
                style={{
                  color: "#A39889",
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
          color: "#C2C2C2",
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
              backgroundColor: "#24201D",
              border: "1px solid #383129",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: "#2F2823",
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F5F2EB" }}>
                    Pegada de Contexto & Tokens da Habilidade
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "1px 7px",
                      borderRadius: 4,
                      backgroundColor: "rgba(217, 119, 87, 0.14)",
                      border: `1px solid ${tokenProfile.categoryColor}40`,
                      color: tokenProfile.categoryColor,
                      fontWeight: 700,
                    }}
                  >
                    {tokenProfile.categoryLabel}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#A39889", marginTop: 2 }}>
                  Consumo estimado de memória na janela de contexto de agentes de IA
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10.5, color: "#766B5E", textTransform: "uppercase", fontWeight: 700 }}>
                  Tokens Totais
                </div>
                <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 800, color: "#D97757" }}>
                  {tokenProfile.formatted}
                </div>
              </div>

              <div style={{ width: 1, height: 28, backgroundColor: "#383129" }} />

              <div>
                <div style={{ fontSize: 10.5, color: "#766B5E", textTransform: "uppercase", fontWeight: 700 }}>
                  Janela 128k (GPT/Gemini)
                </div>
                <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 800, color: "#F5F2EB" }}>
                  {tokenProfile.percent128k}%
                </div>
              </div>

              <div style={{ width: 1, height: 28, backgroundColor: "#383129" }} />

              <div>
                <div style={{ fontSize: 10.5, color: "#766B5E", textTransform: "uppercase", fontWeight: 700 }}>
                  Janela 200k (Claude)
                </div>
                <div style={{ fontSize: 15, fontFamily: "monospace", fontWeight: 800, color: "#E28768" }}>
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
          borderBottom: "1px solid #383129",
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
              fontWeight: 650,
              color: "#F5F2EB",
              margin: 0,
            }}
          >
            Habilidades
          </h2>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#A39889",
            }}
          >
            {suite.skills.length}
          </span>
        </div>

        <span style={{ fontSize: 12, color: "#A39889" }}>
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
              background: "#24201D",
              border: "1px solid #383129",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2C2520";
              e.currentTarget.style.borderColor = "#483E34";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#24201D";
              e.currentTarget.style.borderColor = "#383129";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 220, flex: 1 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#2F2823",
                  border: "1px solid #483E34",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D97757",
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
                    color: "#F5F2EB",
                    margin: "0 0 4px",
                  }}
                >
                  {skill.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "#D4CDC3",
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
                          color: "#D4CDC3",
                          background: "#2E2722",
                          border: "1px solid #443A30",
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
                  background: "#2A241F",
                  border: "1px solid #3D352D",
                  color: "#D4CDC3",
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
                  e.currentTarget.style.background = "#332B25";
                  e.currentTarget.style.color = "#F5F2EB";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2A241F";
                  e.currentTarget.style.color = "#D4CDC3";
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
                  background: "#D97757",
                  border: "1px solid #D97757",
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "#E28768")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#D97757")}
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
            background: "rgba(18, 15, 13, 0.88)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#24201D",
              border: "1px solid #483E34",
              borderRadius: 16,
              maxWidth: 580,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.9)",
              color: "#F5F2EB",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #383129",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#D97757", fontWeight: 700 }}>
                  Xilogravura Nordestina • Literatura de Cordel
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#F5F2EB" }}>
                  {suite.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArtModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#A39889",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <Icon n="x" size={18} />
              </button>
            </div>

            <div style={{ padding: 20, textAlign: "center", background: "#191613" }}>
              <img
                src={suite.coverTheme.imageUrl}
                alt={suite.name}
                style={{
                  width: "100%",
                  maxHeight: 460,
                  objectFit: "contain",
                  borderRadius: 8,
                  border: "2px solid #383129",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
                }}
              />
              <p
                style={{
                  fontSize: 12.5,
                  color: "#A39889",
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
                borderTop: "1px solid #383129",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "#766B5E" }}>
                Referência visual: Xilogravura de Cordel
              </span>
              <button
                type="button"
                onClick={() => setShowArtModal(false)}
                style={{
                  background: "#2A241F",
                  border: "1px solid #483E34",
                  color: "#F5F2EB",
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
    </div>
  );
}
