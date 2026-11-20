import React, { useState } from "react";
import { AgentSkill, SkillFileNode } from "../types";

interface SkillFileDetailModalProps {
  skill: AgentSkill | null;
  onClose: () => void;
  onBack: () => void;
}

export const SkillFileDetailModal: React.FC<SkillFileDetailModalProps> = ({
  skill,
  onClose,
  onBack,
}) => {
  const [selectedPath, setSelectedPath] = useState<string>("SKILL.md");
  const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>({});
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!skill) return null;

  // Extract or build YAML frontmatter & markdown body
  const getYamlAndMarkdown = (fileContent: string) => {
    const yamlMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
    if (yamlMatch) {
      const yaml = yamlMatch[1].trim();
      const body = fileContent.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
      return { yaml, body };
    }

    // Default fallback yaml
    const fallbackYaml = `name: ${skill.id}\ndescription: "${skill.description}"`;
    return { yaml: fallbackYaml, body: fileContent };
  };

  // Find file content from tree
  const findFileNode = (nodes: SkillFileNode[] | undefined, path: string): SkillFileNode | null => {
    if (!nodes) return null;
    for (const node of nodes) {
      if (node.path === path || node.name === path) return node;
      if (node.children) {
        const found = findFileNode(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  // Resolve current active file content
  const activeNode = findFileNode(skill.files, selectedPath);
  const rawContent = activeNode?.content || skill.markdown || `# ${skill.name}\n\n${skill.description}`;
  const { yaml, body } = getYamlAndMarkdown(rawContent);

  const toggleFolder = (path: string) => {
    setCollapsedPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yaml);
    setCopiedYaml(true);
    setToast("YAML copiado para a área de transferência!");
    setTimeout(() => {
      setCopiedYaml(false);
      setToast(null);
    }, 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + "/#/skills?id=" + skill.id);
    setToast("Link da habilidade copiado!");
    setTimeout(() => setToast(null), 2500);
  };

  const handleDownload = () => {
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(rawContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${selectedPath.split("/").pop() || "SKILL.md"}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToast(`Arquivo baixado!`);
    setTimeout(() => setToast(null), 2500);
  };

  // Render file tree recursively
  const renderTree = (nodes: SkillFileNode[] | undefined, depth = 0): React.ReactNode => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <ul style={{ listStyle: "none", margin: 0, paddingLeft: depth === 0 ? 0 : 14 }}>
        {nodes.map((node) => {
          const isCollapsed = collapsedPaths[node.path];
          const isSelected = selectedPath === node.path || (depth === 0 && selectedPath === "SKILL.md" && node.name === "SKILL.md");

          if (node.isDir) {
            return (
              <li key={node.path} style={{ marginTop: 2 }}>
                <div
                  onClick={() => toggleFolder(node.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "#2E190F",
                    fontSize: 12.5,
                    userSelect: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(46,25,15,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {/* Chevron arrow */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                      transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                      transition: "transform 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>

                  {/* Folder icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#755B4B" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>

                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: depth === 0 ? 600 : 500,
                    }}
                  >
                    {node.name}
                  </span>
                </div>

                {!isCollapsed && renderTree(node.children, depth + 1)}
              </li>
            );
          }

          // File item
          return (
            <li key={node.path} style={{ marginTop: 2 }}>
              <div
                onClick={() => setSelectedPath(node.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  backgroundColor: isSelected ? "#FCEEE6" : "transparent",
                  color: isSelected ? "#A8421E" : "#5A4032",
                  border: isSelected ? "1px solid #E5A992" : "1px solid transparent",
                  fontSize: 12.5,
                  fontWeight: isSelected ? 600 : 400,
                  transition: "background 0.1s, color 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(46,25,15,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {/* File icon */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>

                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {node.name}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  // Simple Markdown Renderer
  const renderMarkdownFormatted = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("# ")) {
        return (
          <h1
            key={idx}
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#2E190F",
              margin: "16px 0 12px 0",
              lineHeight: 1.3,
            }}
          >
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2
            key={idx}
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#2E190F",
              margin: "20px 0 10px 0",
              lineHeight: 1.35,
            }}
          >
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3
            key={idx}
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#5A4032",
              margin: "14px 0 8px 0",
            }}
          >
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div
            key={idx}
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "#2E190F",
              paddingLeft: 12,
              marginBottom: 8,
              display: "flex",
              gap: 8,
            }}
          >
            <span style={{ color: "#B44B25", fontWeight: 700 }}>{line.split(" ")[0]}</span>
            <span>{line.replace(/^\d+\.\s/, "")}</span>
          </div>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <div
            key={idx}
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "#2E190F",
              paddingLeft: 14,
              marginBottom: 6,
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <span style={{ color: "#C45730", marginTop: 2 }}>•</span>
            <span>{line.replace("- ", "")}</span>
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} style={{ height: 8 }} />;
      }
      return (
        <p
          key={idx}
          style={{
            fontSize: 13.5,
            lineHeight: 1.65,
            color: "#5A4032",
            margin: "0 0 10px 0",
          }}
        >
          {line}
        </p>
      );
    });
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

      {/* Main Dialog */}
      <div
        className="modal-content skill-file-detail-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 940,
          backgroundColor: "#FFFDF9",
          borderRadius: 16,
          border: "1px solid #CEB79A",
          boxShadow: "0 24px 60px rgba(46, 25, 15, 0.22)",
          color: "#2E190F",
          display: "flex",
          flexDirection: "column",
          maxHeight: "88vh",
          overflow: "hidden",
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #E2D1BC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Back button `< Detalhes da habilidade` */}
          <button
            type="button"
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              color: "#2E190F",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 8px 4px 0",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Detalhes da habilidade</span>
          </button>

          {/* Right Header Icons: Share, Download, Close */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              onClick={handleShare}
              title="Compartilhar"
              style={{
                background: "transparent",
                border: "none",
                color: "#5A4032",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2E190F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5A4032")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Baixar arquivo selecionado"
              style={{
                background: "transparent",
                border: "none",
                color: "#5A4032",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2E190F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5A4032")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2E190F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#5A4032")}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 2-Column Body Layout (stacks on mobile) */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Arquivos / File Tree */}
          <div
            className="w-full md:w-[220px] shrink-0 border-b md:border-b-0 md:border-r border-[#E2D1BC] p-3.5 overflow-y-auto max-h-40 md:max-h-none bg-[#F2E6D5]"
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#755B4B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
                paddingLeft: 4,
              }}
            >
              Arquivos
            </div>

            {skill.files && skill.files.length > 0 ? (
              renderTree(skill.files)
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                <li>
                  <div
                    onClick={() => setSelectedPath("SKILL.md")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 6,
                      backgroundColor: "#FCEEE6",
                      color: "#A8421E",
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid #E5A992",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>SKILL.md</span>
                  </div>
                </li>
              </ul>
            )}
          </div>

          {/* Right Column: YAML frontmatter box + Rendered content */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto">
            {/* YAML Code Box */}
            {yaml && (
              <div
                style={{
                  backgroundColor: "#F4EBDD",
                  border: "1px solid #CEB79A",
                  borderRadius: 10,
                  padding: "14px 18px",
                  marginBottom: 24,
                  position: "relative",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  overflowX: "auto",
                }}
              >
                {/* YAML top label and Copy button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    borderBottom: "1px solid #E2D1BC",
                    paddingBottom: 6,
                  }}
                >
                  <span style={{ color: "#B44B25", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                    YAML
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyYaml}
                    title="Copiar YAML"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: copiedYaml ? "#B44B25" : "#5A4032",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    {copiedYaml && <span>Copiado!</span>}
                  </button>
                </div>

                {/* YAML Syntax highlighted lines */}
                <div>
                  {yaml.split("\n").map((line, idx) => {
                    const colonIdx = line.indexOf(":");
                    if (colonIdx !== -1) {
                      const key = line.substring(0, colonIdx);
                      const val = line.substring(colonIdx + 1);
                      return (
                        <div key={idx}>
                          <span style={{ color: "#2E190F", fontWeight: 700 }}>{key}</span>
                          <span style={{ color: "#755B4B" }}>:</span>
                          <span style={{ color: "#5A4032" }}>{val}</span>
                        </div>
                      );
                    }
                    return <div key={idx} style={{ color: "#5A4032" }}>{line}</div>;
                  })}
                </div>
              </div>
            )}

            {/* Markdown rendered body */}
            <div className="skill-markdown-content">
              {renderMarkdownFormatted(body)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
