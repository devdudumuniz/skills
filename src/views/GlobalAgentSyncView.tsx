import React, { useState } from "react";
import { Icon } from "../components/Icons";
import { AgentSkill } from "../types";

interface GlobalAgentSyncViewProps {
  skills: AgentSkill[];
  onSelectSkill: (skill: AgentSkill) => void;
  onBackToCatalog: () => void;
}

export const GlobalAgentSyncView: React.FC<GlobalAgentSyncViewProps> = ({
  skills,
  onSelectSkill,
  onBackToCatalog,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("synced");
  const [lastSyncTime, setLastSyncTime] = useState<string>("Agora mesmo");

  const agentLocations = [
    {
      agent: "Claude Code (Anthropic)",
      dir: "~/.claude/skills/",
      description: "Carregamento automático de playbooks de engenharia no Claude Code CLI.",
      status: "Ativo & Vinculado",
    },
    {
      agent: "OpenAI Codex / ChatGPT CLI",
      dir: "~/.codex/skills/",
      description: "Suporte global para invocações de engenharia e scripts em sessões do Codex.",
      status: "Ativo & Vinculado",
    },
    {
      agent: "Universal Agent / Manus / Antigravity",
      dir: "~/.agent/skills/",
      description: "Diretório padrão de agentes autônomos para ferramentas e automações.",
      status: "Ativo & Vinculado",
    },
    {
      agent: "Cursor IDE",
      dir: "~/.cursor/skills/",
      description: "Regras e habilidades integradas ao workspace do editor Cursor.",
      status: "Ativo & Vinculado",
    },
    {
      agent: "Hermes / OpenCode / Linux XDG",
      dir: "~/.config/agents/skills/",
      description: "Padrão de configuração de ambiente Linux/macOS para agentes de terminal.",
      status: "Ativo & Vinculado",
    },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleSimulateSync = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("synced");
      setLastSyncTime("Agora mesmo");
    }, 1200);
  };

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "24px 20px 60px 20px",
        color: "#EAEAEA",
      }}
    >
      {/* Header com Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button
          type="button"
          onClick={onBackToCatalog}
          style={{
            background: "transparent",
            border: "none",
            color: "#9B9B9B",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            padding: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#EAEAEA")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9B9B9B")}
        >
          <Icon n="chevron" size={14} />
          <span>Voltar ao Catálogo</span>
        </button>

        <span
          style={{
            fontSize: 12,
            backgroundColor: "#202020",
            border: "1px solid #333333",
            padding: "4px 10px",
            borderRadius: 6,
            color: "#C2C2C2",
          }}
        >
          Última sincronização: <b>{lastSyncTime}</b>
        </span>
      </div>

      {/* Hero Banner */}
      <div
        style={{
          backgroundColor: "#202020",
          border: "1px solid #333333",
          borderRadius: 14,
          padding: "28px 24px",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: "#292929",
              border: "1px solid #545454",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#EAEAEA",
              flexShrink: 0,
            }}
          >
            <Icon n="terminal" size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#EAEAEA" }}>
                Ativação Global de Skills para Todos os Agentes
              </h1>
              <span
                style={{
                  fontSize: 11.5,
                  padding: "2px 8px",
                  borderRadius: 12,
                  backgroundColor: "#2d3748",
                  border: "1px solid #4a5568",
                  color: "#EAEAEA",
                  fontWeight: 600,
                }}
              >
                9 Skills Prontas
              </span>
            </div>

            <p style={{ fontSize: 13.5, color: "#C2C2C2", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Todas as habilidades localizadas na pasta oficial <code>./skills/</code> deste repositório
              são mapeadas para os diretórios globais padrão utilizados pelos agentes autônomos no seu sistema.
              Dessa forma, qualquer agente iniciado em qualquer diretório da sua máquina reconhece e pode invocar as skills automaticamente.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleSimulateSync}
                disabled={syncStatus === "syncing"}
                style={{
                  backgroundColor: "#EAEAEA",
                  color: "#151515",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: syncStatus === "syncing" ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (syncStatus !== "syncing") e.currentTarget.style.backgroundColor = "#C2C2C2";
                }}
                onMouseLeave={(e) => {
                  if (syncStatus !== "syncing") e.currentTarget.style.backgroundColor = "#EAEAEA";
                }}
              >
                <Icon n={syncStatus === "syncing" ? "clock" : "check"} size={14} />
                {syncStatus === "syncing" ? "Sincronizando Skills..." : "Sincronizar Globalmente Agora"}
              </button>

              <button
                type="button"
                onClick={() => handleCopy("npm run skills:global", "npm-btn")}
                style={{
                  backgroundColor: "#292929",
                  color: "#EAEAEA",
                  border: "1px solid #545454",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 12.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon n="copy" size={13} />
                {copiedCmd === "npm-btn" ? "Copiado!" : "Copiar comando: npm run skills:global"}
              </button>

              <button
                type="button"
                onClick={() => handleCopy("dm-skills list", "cli-btn")}
                style={{
                  backgroundColor: "#292929",
                  color: "#C2C2C2",
                  border: "1px solid #383838",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: 12.5,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon n="terminal" size={13} />
                {copiedCmd === "cli-btn" ? "Copiado!" : "CLI: dm-skills list"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 2 Colunas: Diretórios Globais & Como Usar no Prompt */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 20, marginBottom: 28 }}>
        {/* Card 1: Locais de Agentes Vinculados */}
        <div
          style={{
            backgroundColor: "#202020",
            border: "1px solid #333333",
            borderRadius: 14,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon n="layers" size={16} />
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#EAEAEA" }}>
              Diretórios Globais Configurados
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {agentLocations.map((loc, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#181818",
                  border: "1px solid #2d2d2d",
                  borderRadius: 8,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#EAEAEA", marginBottom: 2 }}>
                    {loc.agent}
                  </div>
                  <code style={{ fontSize: 11.5, color: "#9B9B9B", fontFamily: "monospace" }}>
                    {loc.dir}
                  </code>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    backgroundColor: "#243224",
                    border: "1px solid #395239",
                    color: "#A3D9A5",
                    padding: "3px 8px",
                    borderRadius: 12,
                    fontWeight: 600,
                  }}
                >
                  {loc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Instruções para o Terminal e Prompts */}
        <div
          style={{
            backgroundColor: "#202020",
            border: "1px solid #333333",
            borderRadius: 14,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon n="code" size={16} />
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#EAEAEA" }}>
              Como Usar as Skills com seus Agentes
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13, color: "#C2C2C2", lineHeight: 1.5 }}>
            <div style={{ backgroundColor: "#181818", border: "1px solid #2d2d2d", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontWeight: 600, color: "#EAEAEA", marginBottom: 4 }}>
                1. No Claude Code ou Cursor
              </div>
              <p style={{ margin: "0 0 8px 0", fontSize: 12.5, color: "#9B9B9B" }}>
                Basta pedir no prompt para seguir a skill desejada:
              </p>
              <div
                style={{
                  backgroundColor: "#111111",
                  border: "1px solid #333333",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#EAEAEA",
                }}
              >
                "Siga as diretrizes da skill @devops-delivery para planejar a entrega do microsserviço."
              </div>
            </div>

            <div style={{ backgroundColor: "#181818", border: "1px solid #2d2d2d", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontWeight: 600, color: "#EAEAEA", marginBottom: 4 }}>
                2. No Terminal com a CLI Universal
              </div>
              <p style={{ margin: "0 0 8px 0", fontSize: 12.5, color: "#9B9B9B" }}>
                Use o comando global criado pelo instalador:
              </p>
              <div
                style={{
                  backgroundColor: "#111111",
                  border: "1px solid #333333",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#EAEAEA",
                }}
              >
                dm-skills list &nbsp;&nbsp;&nbsp;&nbsp;# lista as skills ativas<br />
                dm-skills info vibecode-builder
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela / Lista das 9 Skills no Diretório Oficial ./skills/ */}
      <div
        style={{
          backgroundColor: "#202020",
          border: "1px solid #333333",
          borderRadius: 14,
          padding: "20px 22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#EAEAEA" }}>
              Skills Gerenciadas em ./skills/
            </h2>
            <span style={{ fontSize: 12, color: "#9B9B9B" }}>
              Separadas da interface da plataforma e prontas para consumo por agentes
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopy("python3 scripts/install_global_skills.py", "py-btn")}
            style={{
              backgroundColor: "#292929",
              color: "#C2C2C2",
              border: "1px solid #444444",
              borderRadius: 6,
              padding: "5px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {copiedCmd === "py-btn" ? "Copiado!" : "Copiar python3 script"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {skills.map((skill) => (
            <div
              key={skill.id}
              onClick={() => onSelectSkill(skill)}
              style={{
                backgroundColor: "#181818",
                border: "1px solid #2d2d2d",
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#242424";
                e.currentTarget.style.borderColor = "#545454";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#181818";
                e.currentTarget.style.borderColor = "#2d2d2d";
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#EAEAEA" }}>
                    {skill.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      backgroundColor: "#292929",
                      border: "1px solid #444444",
                      padding: "1px 6px",
                      borderRadius: 4,
                      color: "#9B9B9B",
                      fontFamily: "monospace",
                    }}
                  >
                    skills/{skill.id}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "#9B9B9B",
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {skill.description}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: 11.5,
                    backgroundColor: "#243224",
                    border: "1px solid #395239",
                    color: "#A3D9A5",
                    padding: "3px 8px",
                    borderRadius: 12,
                    fontWeight: 600,
                  }}
                >
                  Global
                </span>
                <span style={{ fontSize: 12, color: "#767676" }}>Ver detalhes &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
