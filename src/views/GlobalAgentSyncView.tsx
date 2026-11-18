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
    <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-20 text-[#F5F2EB] min-w-0">
      {/* Header com Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129] text-xs font-medium transition-colors cursor-pointer"
        >
          <Icon n="chevron" size={14} />
          <span>Voltar ao Catálogo</span>
        </button>

        <span className="text-xs bg-[#24201D] border border-[#383129] px-3 py-1.5 rounded-lg text-[#D4CDC3]">
          Última sincronização: <b className="text-[#F5F2EB]">{lastSyncTime}</b>
        </span>
      </div>

      {/* Hero Banner */}
      <div className="bg-[#27221E] border border-[#383129] rounded-2xl p-5 sm:p-7 mb-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757] shrink-0">
            <Icon n="terminal" size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#F5F2EB] m-0">
                Ativação Global de Skills para Todos os Agentes
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#32231C] border border-[#D97757]/45 text-[#E28768] font-semibold whitespace-nowrap">
                {skills.length} Skills Prontas
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#D4CDC3] mb-4 leading-relaxed">
              Todas as habilidades localizadas na pasta oficial{" "}
              <code className="px-1.5 py-0.5 rounded bg-[#191613] border border-[#383129] text-[#E28768]">
                ./skills/
              </code>{" "}
              deste repositório são mapeadas para os diretórios globais padrão utilizados pelos agentes autônomos no seu sistema.
              Dessa forma, qualquer agente iniciado em qualquer diretório da sua máquina reconhece e pode invocar as skills automaticamente.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSimulateSync}
                disabled={syncStatus === "syncing"}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white text-xs sm:text-[13px] font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_2px_10px_rgba(217,119,87,0.35)] disabled:opacity-60"
              >
                <Icon n={syncStatus === "syncing" ? "clock" : "check"} size={14} />
                <span>
                  {syncStatus === "syncing" ? "Sincronizando Skills..." : "Sincronizar Globalmente Agora"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy("npm run skills:global", "npm-btn")}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#2A241F] hover:bg-[#332C26] text-[#F5F2EB] border border-[#483E34] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Icon n="copy" size={13} />
                <span className="truncate">
                  {copiedCmd === "npm-btn" ? "Copiado!" : "Copiar: npm run skills:global"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy("deda-skills list", "cli-btn")}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#1E1A17] hover:bg-[#2A241F] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#383129] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Icon n="terminal" size={13} />
                <span>{copiedCmd === "cli-btn" ? "Copiado!" : "CLI: deda-skills list"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 2 Colunas: Diretórios Globais & Como Usar no Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7 min-w-0">
        {/* Card 1: Locais de Agentes Vinculados */}
        <div className="bg-[#24201D] border border-[#383129] rounded-2xl p-5 min-w-0">
          <div className="flex items-center gap-2 mb-3.5 text-[#D97757]">
            <Icon n="layers" size={16} />
            <h2 className="text-[15px] font-bold m-0 text-[#F5F2EB]">
              Diretórios Globais Configurados
            </h2>
          </div>

          <div className="flex flex-col gap-2.5">
            {agentLocations.map((loc, idx) => (
              <div
                key={idx}
                className="bg-[#1E1A17] border border-[#332C26] rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[#F5F2EB] mb-0.5 break-words">
                    {loc.agent}
                  </div>
                  <code className="text-[11.5px] text-[#A39889] font-mono break-all">
                    {loc.dir}
                  </code>
                </div>
                <span className="text-[11px] bg-[#32231C] border border-[#D97757]/40 text-[#E28768] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0">
                  {loc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Instruções para o Terminal e Prompts */}
        <div className="bg-[#24201D] border border-[#383129] rounded-2xl p-5 min-w-0">
          <div className="flex items-center gap-2 mb-3.5 text-[#D97757]">
            <Icon n="code" size={16} />
            <h2 className="text-[15px] font-bold m-0 text-[#F5F2EB]">
              Como Usar as Skills com seus Agentes
            </h2>
          </div>

          <div className="flex flex-col gap-3 text-[13px] text-[#D4CDC3] leading-relaxed">
            <div className="bg-[#1E1A17] border border-[#332C26] rounded-xl p-3.5">
              <div className="font-semibold text-[#F5F2EB] mb-1">
                1. No Claude Code ou Cursor
              </div>
              <p className="m-0 mb-2 text-xs text-[#A39889]">
                Basta pedir no prompt para seguir a skill desejada:
              </p>
              <div className="bg-[#191613] border border-[#383129] rounded-lg px-3 py-2 font-mono text-xs text-[#F5F2EB] break-words">
                "Siga as diretrizes da skill @devops-delivery para planejar a entrega do microsserviço."
              </div>
            </div>

            <div className="bg-[#1E1A17] border border-[#332C26] rounded-xl p-3.5">
              <div className="font-semibold text-[#F5F2EB] mb-1">
                2. No Terminal com a CLI Universal
              </div>
              <p className="m-0 mb-2 text-xs text-[#A39889]">
                Use o comando global criado pelo instalador:
              </p>
              <div className="bg-[#191613] border border-[#383129] rounded-lg px-3 py-2 font-mono text-xs text-[#F5F2EB] overflow-x-auto">
                <div>deda-skills list &nbsp;&nbsp;# lista as skills ativas</div>
                <div>deda-skills info vibecode-builder</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela / Lista das Skills no Diretório Oficial ./skills/ */}
      <div className="bg-[#24201D] border border-[#383129] rounded-2xl p-5 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold m-0 text-[#F5F2EB]">
              Skills Gerenciadas em ./skills/
            </h2>
            <span className="text-xs text-[#A39889]">
              Separadas da interface da plataforma e prontas para consumo por agentes
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopy("python3 scripts/install_global_skills.py", "py-btn")}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#2A241F] hover:bg-[#332C26] text-[#D4CDC3] hover:text-[#F5F2EB] border border-[#483E34] text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            {copiedCmd === "py-btn" ? "Copiado!" : "Copiar python3 script"}
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {skills.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => onSelectSkill(skill)}
              className="w-full text-left bg-[#1E1A17] hover:bg-[#2A241F] border border-[#332C26] hover:border-[#D97757]/50 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#F5F2EB]">
                    {skill.name}
                  </span>
                  <span className="text-[11px] bg-[#2A241F] border border-[#483E34] px-2 py-0.5 rounded text-[#D4CDC3] font-mono">
                    skills/{skill.id}
                  </span>
                </div>
                <p className="text-xs text-[#A39889] m-0 line-clamp-2 sm:truncate">
                  {skill.description}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                <span className="text-[11px] bg-[#32231C] border border-[#D97757]/40 text-[#E28768] px-2.5 py-0.5 rounded-full font-semibold">
                  Global
                </span>
                <span className="text-xs text-[#A39889] font-medium">
                  Ver detalhes &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
