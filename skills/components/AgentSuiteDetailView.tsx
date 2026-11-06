import { useState } from "react";
import { AgentSkillSuite, BundledSkill } from "../types";
import { Icon } from "../../src/components/Icons";

interface AgentSuiteDetailViewProps {
  suite: AgentSkillSuite;
  onBackToCatalog: () => void;
  onToggleInstall: (suiteId: string) => void;
  onToggleFavorite: (suiteId: string) => void;
  onTestPrompt: (suiteId: string, promptText: string) => void;
  onInspectSkillFiles: (suite: AgentSkillSuite, skill?: BundledSkill) => void;
}

export function AgentSuiteDetailView({
  suite,
  onBackToCatalog,
  onToggleInstall,
  onToggleFavorite,
  onTestPrompt,
  onInspectSkillFiles,
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
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "10px 0 60px" }}>
      {/* Toast */}
      {showCopiedToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#202020",
            border: "1px solid #545454",
            color: "#EAEAEA",
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

      {/* Breadcrumb Navigation (Matching ChatGPT plugins layout) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "#9B9B9B",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={onBackToCatalog}
          style={{
            background: "none",
            border: "none",
            color: "#9B9B9B",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#EAEAEA")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9B9B9B")}
        >
          <span>Habilidades</span>
        </button>
        <span style={{ color: "#545454" }}>&gt;</span>
        <span style={{ color: "#EAEAEA", fontWeight: 500 }}>{suite.name}</span>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {suite.coverTheme.imageUrl && (
            <button
              type="button"
              onClick={() => setShowArtModal(true)}
              title="Ver xilogravura de cordel em alta resolução"
              style={{
                background: "#222222",
                border: "1px solid #383838",
                color: "#C2C2C2",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#222222")}
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
              background: "#222222",
              border: "1px solid #383838",
              color: "#C2C2C2",
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
              background: "#222222",
              border: "1px solid #383838",
              color: "#C2C2C2",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#222222")}
          >
            <Icon n="code" size={15} />
          </button>

          <button
            type="button"
            onClick={() => onToggleInstall(suite.id)}
            style={{
              background: suite.installed ? "#282828" : "#EAEAEA",
              border: `1px solid ${suite.installed ? "#545454" : "#EAEAEA"}`,
              color: suite.installed ? "#EAEAEA" : "#151515",
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <Icon n={suite.installed ? "check" : "plus"} size={15} />
            <span>{suite.installed ? "Gerenciar" : "Adicionar às minhas habilidades"}</span>
          </button>

          <button
            type="button"
            onClick={() => onTestPrompt(suite.id, suite.prompts[0] || "")}
            style={{
              background: "#333333",
              border: "1px solid #545454",
              color: "#EAEAEA",
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
            onMouseEnter={(e) => (e.currentTarget.style.background = "#3c3c3c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#333333")}
          >
            <Icon n="message-square" size={15} />
            <span>Testar no chat</span>
          </button>
        </div>
      </div>

      {/* Hero Banner with Prompt Pills (Matching ChatGPT Plugins screen) */}
      <div
        style={{
          background: "linear-gradient(180deg, #1f1f1f 0%, #262626 100%)",
          border: "1px solid #383838",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 24,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {suite.prompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onTestPrompt(suite.id, promptText)}
              style={{
                width: "100%",
                background: "rgba(32, 32, 32, 0.75)",
                backdropFilter: "blur(4px)",
                border: "1px solid #3c3c3c",
                borderRadius: 12,
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                color: "#EAEAEA",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#333333";
                e.currentTarget.style.borderColor = "#545454";
                e.currentTarget.style.transform = "translateX(2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(32, 32, 32, 0.75)";
                e.currentTarget.style.borderColor = "#3c3c3c";
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
                    background: "#2a2a2a",
                    color: "#C2C2C2",
                    flexShrink: 0,
                  }}
                >
                  <Icon n="message-square" size={13} />
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    color: "#EAEAEA",
                    lineHeight: 1.4,
                  }}
                >
                  <strong style={{ color: "#FFFFFF", marginRight: 6 }}>{suite.name}:</strong>
                  {promptText}
                </span>
              </div>
              <div
                style={{
                  color: "#9B9B9B",
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
          marginBottom: 36,
          padding: "0 4px",
        }}
      >
        <p style={{ margin: 0 }}>{suite.description}</p>
      </div>

      {/* Habilidades Section Heading (Matching screenshot: "Habilidades 10" or "Habilidades 4") */}
      <div
        style={{
          borderBottom: "1px solid #333333",
          paddingBottom: 14,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 650,
              color: "#EAEAEA",
              margin: 0,
            }}
          >
            Habilidades
          </h2>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#9B9B9B",
            }}
          >
            {suite.skills.length}
          </span>
        </div>

        <span style={{ fontSize: 12, color: "#767676" }}>
          Todas as capacidades ativadas juntas neste agente
        </span>
      </div>

      {/* Bundled Sub-Skills List (Clean vertical list with icons, titles and descriptions) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {suite.skills.map((skill, index) => (
          <div
            key={skill.id || index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 18px",
              borderRadius: 10,
              background: "#1c1c1c",
              border: "1px solid #2e2e2e",
              transition: "background 0.15s ease, border-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#232323";
              e.currentTarget.style.borderColor = "#3d3d3d";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#1c1c1c";
              e.currentTarget.style.borderColor = "#2e2e2e";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#282828",
                  border: "1px solid #383838",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#EAEAEA",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <Icon n={skill.icon || "check-circle"} size={18} />
              </div>

              <div>
                <h3
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "#EAEAEA",
                    margin: "0 0 4px",
                  }}
                >
                  {skill.name}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "#9B9B9B",
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
                          color: "#C2C2C2",
                          background: "#282828",
                          border: "1px solid #383838",
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

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => onInspectSkillFiles(suite, skill)}
                title="Ver documentação e código desta habilidade"
                style={{
                  background: "#282828",
                  border: "1px solid #383838",
                  color: "#C2C2C2",
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
                  e.currentTarget.style.background = "#333333";
                  e.currentTarget.style.color = "#EAEAEA";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#282828";
                  e.currentTarget.style.color = "#C2C2C2";
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
                  background: "#333333",
                  border: "1px solid #545454",
                  color: "#EAEAEA",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#3e3e3e")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#333333")}
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
            background: "rgba(0, 0, 0, 0.88)",
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
              background: "#181818",
              border: "1px solid #3d3d3d",
              borderRadius: 16,
              maxWidth: 580,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.9)",
              color: "#EAEAEA",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #2e2e2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B9B9B", fontWeight: 700 }}>
                  Xilogravura Nordestina • Literatura de Cordel
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#EAEAEA" }}>
                  {suite.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowArtModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9B9B9B",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <Icon n="x" size={18} />
              </button>
            </div>

            <div style={{ padding: 20, textAlign: "center", background: "#141414" }}>
              <img
                src={suite.coverTheme.imageUrl}
                alt={suite.name}
                style={{
                  width: "100%",
                  maxHeight: 460,
                  objectFit: "contain",
                  borderRadius: 8,
                  border: "2px solid #333333",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
                }}
              />
              <p
                style={{
                  fontSize: 12.5,
                  color: "#9B9B9B",
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
                borderTop: "1px solid #2e2e2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "#767676" }}>
                Referência visual: Xilogravura de Cordel
              </span>
              <button
                type="button"
                onClick={() => setShowArtModal(false)}
                style={{
                  background: "#333333",
                  border: "1px solid #545454",
                  color: "#EAEAEA",
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
