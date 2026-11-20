import React, { useState } from "react";
import { AgentSkill } from "../types";
import { BookCover } from "./BookCover";
import { Icon } from "./Icons";

interface SkillPreviewModalProps {
  skill: AgentSkill | null;
  onClose: () => void;
  onOpenDetails: (skill: AgentSkill) => void;
  onToggleInstall?: (skillId: string) => void;
  onToggleFavorite?: (skillId: string) => void;
  onTestPrompt?: (skillId: string, prompt: string) => void;
}

export const SkillPreviewModal: React.FC<SkillPreviewModalProps> = ({
  skill,
  onClose,
  onOpenDetails,
  onToggleInstall,
  onToggleFavorite,
  onTestPrompt,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!skill) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + "/#/skills?id=" + skill.id);
    setToast("Link da habilidade copiado para a área de transferência!");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(skill, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${skill.id}.skill.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToast(`Pacote ${skill.id}.skill baixado!`);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePromptClick = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(prompt);
    setToast("Prompt copiado!");
    setTimeout(() => {
      setCopiedPrompt(null);
      setToast(null);
    }, 2500);

    if (onTestPrompt) {
      onTestPrompt(skill.id, prompt);
    }
  };

  // Map category to localized badge display
  const getCategoryTags = () => {
    const list: string[] = [];
    const cat = (skill.category || "").toString();
    if (cat === "negocios" || cat === "governance") list.push("Negócios", "Aplicativos");
    else if (cat === "midia") list.push("Mídia", "Aplicativos");
    else if (cat === "design") list.push("Design", "Aplicativos");
    else if (cat === "conteudo") list.push("Conteúdo", "Negócios");
    else if (cat === "programacao" || cat === "engineering" || cat === "devops" || cat === "frontend") list.push("Programação", "Automação");
    else if (cat === "dados" || cat === "data" || cat === "security" || cat === "diagnostics") list.push("Dados", "Segurança");
    else if (cat === "automacao" || cat === "automation") list.push("Automação", "Dados");
    else if (cat === "aplicativos") list.push("Negócios", "Aplicativos");
    else list.push("Laboratório", "IA");
    return list;
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(46, 25, 15, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className="hc-toast"
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#FFFDF9",
            color: "#2E190F",
            border: "1px solid #CEB79A",
            padding: "8px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(46, 25, 15, 0.18)",
            zIndex: 10000,
          }}
        >
          {toast}
        </div>
      )}

      {/* Main Dialog Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 780,
          backgroundColor: "#FFFDF9",
          borderRadius: 16,
          border: "1px solid #CEB79A",
          boxShadow: "0 24px 60px rgba(46, 25, 15, 0.22)",
          color: "#2E190F",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        className="modal-content skill-preview-dialog p-5 sm:p-7"
      >
        {/* Top Right Action Buttons: Share, Download, Close */}
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 24,
            display: "flex",
            alignItems: "center",
            gap: 14,
            zIndex: 30,
          }}
        >
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(skill.id)}
              title={skill.isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
              style={{
                background: "transparent",
                border: "none",
                color: skill.isFavorite ? "#9A6008" : "#5A4032",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
                transition: "color 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = skill.isFavorite ? "#9A6008" : "#2E190F";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = skill.isFavorite ? "#9A6008" : "#5A4032";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Icon n={skill.isFavorite ? "star-filled" : "star"} size={19} />
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            title="Compartilhar habilidade"
            style={{
              background: "transparent",
              border: "none",
              color: "#5A4032",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#2E190F")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5A4032")}
          >
            {/* Share curved arrow */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Baixar pacote de habilidade (.skill)"
            style={{
              background: "transparent",
              border: "none",
              color: "#5A4032",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#2E190F")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5A4032")}
          >
            {/* Download tray icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Fechar"
            style={{
              background: "transparent",
              border: "none",
              color: "#5A4032",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#2E190F")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#5A4032")}
          >
            {/* Close 'X' */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Header Section: Left info + Right 3D Book */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-8 sm:pt-0">
          <div className="flex-1 min-w-0 sm:pr-2">
            {/* Category Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {getCategoryTags().map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: "#F4EBDD",
                    border: "1px solid #E2D1BC",
                    color: "#5A4032",
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 6,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#2E190F",
                margin: "0 0 10px 0",
                lineHeight: 1.25,
              }}
            >
              {skill.name}
            </h1>

            {/* Metadata Line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                color: "#755B4B",
                fontSize: 12.5,
                marginBottom: 20,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#5A4032", fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
                </svg>
                {skill.author || "Deda Skills"}
              </span>

              <span>|</span>
              <span>Atualizado em {skill.updatedAt || "28 de set. de 2026"}</span>

              <span>|</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Usado {skill.usageCount || "2.5k"}
              </span>
            </div>

            {/* Actions: + Adicionar às minhas habilidades & Ver detalhes */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => onToggleInstall && onToggleInstall(skill.id)}
                style={{
                  backgroundColor: skill.installed ? "#F7EFE4" : "#C45730",
                  color: skill.installed ? "#2E190F" : "#FFFFFF",
                  border: skill.installed ? "1px solid #CEB79A" : "1px solid #C45730",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "opacity 0.15s, background-color 0.15s",
                }}
              >
                {skill.installed ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Adicionado às minhas habilidades
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Adicionar às minhas habilidades
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onOpenDetails(skill)}
                style={{
                  backgroundColor: "#F7EFE4",
                  color: "#2E190F",
                  border: "1px solid #CEB79A",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EFE1CE")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F7EFE4")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Ver detalhes
              </button>
            </div>
          </div>

          {/* Right side: 3D perspective book cover */}
          <div className="shrink-0 sm:pr-2 sm:pt-8 self-center sm:self-start">
            <BookCover
              title={skill.name}
              theme={skill.coverTheme}
              variant="tilted-3d"
            />
          </div>
        </div>

        {/* Divider line */}
        <div
          style={{
            height: 1,
            backgroundColor: "#E2D1BC",
            margin: "24px 0 20px 0",
          }}
        />

        {/* Description Section */}
        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.6,
            color: "#5A4032",
            margin: "0 0 20px 0",
          }}
        >
          {skill.description}
        </p>

        {/* Prompt Suggestions List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {skill.promptSuggestions && skill.promptSuggestions.length > 0 ? (
            skill.promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  backgroundColor: "#F4EBDD",
                  border: "1px solid #E2D1BC",
                  borderRadius: 12,
                  padding: "13px 18px",
                  color: copiedPrompt === prompt ? "#2E190F" : "#5A4032",
                  fontSize: 13.5,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "background 0.15s, border-color 0.15s, transform 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#EFE1CE";
                  e.currentTarget.style.borderColor = "#C45730";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F4EBDD";
                  e.currentTarget.style.borderColor = "#E2D1BC";
                }}
              >
                {/* Speech Bubble Icon */}
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#755B4B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>

                <span style={{ flex: 1, lineHeight: 1.4 }}>{prompt}</span>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: copiedPrompt === prompt ? "#B44B25" : "#755B4B",
                    marginLeft: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {copiedPrompt === prompt ? "Copiado!" : "Testar prompt ↵"}
                </span>
              </button>
            ))
          ) : (
            <div
              style={{
                backgroundColor: "#F4EBDD",
                border: "1px solid #E2D1BC",
                borderRadius: 12,
                padding: "14px 18px",
                color: "#5A4032",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{skill.sampleTestPrompt || "Execute comandos ou prompts para esta habilidade."}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
