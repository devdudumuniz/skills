import React, { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { AgentSkill } from "../types";
import { BookCover } from "../components/BookCover";

interface CreateSkillViewProps {
  onSuccess: (skillId: string) => void;
  onCancel: () => void;
  initialData?: {
    name?: string;
    id?: string;
    category?: AgentSkill["category"] | string;
    description?: string;
    promptSuggestions?: string[];
    initialSteps?: string[];
    whyNeeded?: string;
  } | null;
}

export function CreateSkillView({ onSuccess, onCancel, initialData }: CreateSkillViewProps) {
  const { addSkill } = useProject();

  const [name, setName] = useState(initialData?.name || "");
  const [id, setId] = useState(initialData?.id || "");
  const [idTouched, setIdTouched] = useState(Boolean(initialData?.id));
  const [category, setCategory] = useState<AgentSkill["category"]>(
    (initialData?.category as AgentSkill["category"]) || "programacao"
  );
  const [executionMode, setExecutionMode] = useState<AgentSkill["execution_mode"]>("plan-first");
  const [author, setAuthor] = useState("Manus Lab");
  const [version, setVersion] = useState("1.0.0");
  const [tagsInput, setTagsInput] = useState("automacao, produtividade, agente");
  const [description, setDescription] = useState(initialData?.description || "");
  const [whenToUse, setWhenToUse] = useState(initialData?.whyNeeded || "");
  const [whenNotToUse, setWhenNotToUse] = useState("");
  const [preconditions, setPreconditions] = useState("Exige identificação clara do ambiente e permissões.");
  
  // Prompt Suggestions for Preview modal
  const [prompt1, setPrompt1] = useState(initialData?.promptSuggestions?.[0] || "");
  const [prompt2, setPrompt2] = useState(initialData?.promptSuggestions?.[1] || "");
  const [prompt3, setPrompt3] = useState(initialData?.promptSuggestions?.[2] || "");

  // Cover customization
  const [coverColor, setCoverColor] = useState<string>("monochrome-dark");
  const [coverIcon, setCoverIcon] = useState<string>("code");

  const [steps, setSteps] = useState<string[]>(
    initialData?.initialSteps && initialData.initialSteps.length > 0
      ? initialData.initialSteps
      : [
          "1. Inspecionar o contexto e identificar artefatos.",
          "2. Elaborar plano determinístico de execução com gates de segurança.",
          "3. Executar apenas passos autorizados e validar resultados.",
        ]
  );
  const [newStep, setNewStep] = useState("");
  const [sampleTestPrompt, setSampleTestPrompt] = useState("");

  const getCoverTheme = () => {
    switch (coverColor) {
      case "monochrome-dark":
        return { bg: "linear-gradient(155deg, #333333 0%, #242424 60%, #151515 100%)", accent: "#EAEAEA", icon: coverIcon };
      case "monochrome-silver":
        return { bg: "linear-gradient(155deg, #545454 0%, #383838 60%, #1c1c1c 100%)", accent: "#C2C2C2", icon: coverIcon };
      case "monochrome-charcoal":
        return { bg: "linear-gradient(155deg, #262626 0%, #1e1e1e 60%, #151515 100%)", accent: "#9B9B9B", icon: coverIcon };
      case "indigo":
        return { bg: "linear-gradient(155deg, #303038 0%, #24242c 60%, #151518 100%)", accent: "#C2C2C2", icon: coverIcon };
      case "emerald":
        return { bg: "linear-gradient(155deg, #26332c 0%, #1b2620 60%, #151515 100%)", accent: "#C2C2C2", icon: coverIcon };
      case "amber":
        return { bg: "linear-gradient(155deg, #383024 0%, #29231a 60%, #151515 100%)", accent: "#EAEAEA", icon: coverIcon };
      default:
        return { bg: "linear-gradient(155deg, #333333 0%, #242424 60%, #151515 100%)", accent: "#EAEAEA", icon: coverIcon };
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!idTouched) {
      const slug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setId(slug);
    }
  };

  const addProcedureStep = () => {
    if (newStep.trim()) {
      setSteps([...steps, `${steps.length + 1}. ${newStep.trim()}`]);
      setNewStep("");
    }
  };

  const removeProcedureStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const generatedMarkdown = `---
name: ${id || "nova-skill"}
description: "${description || "Descrição resumida da competência do agente."}"
version: ${version}
author: ${author}
execution_mode: ${executionMode}
---

# ${name || "Nova Skill"}

## Objetivo
${description || "Defina o que esta skill soluciona."}

## Quando usar
${whenToUse || "Descreva os gatilhos para ativação desta skill."}

## Quando NÃO usar
${whenNotToUse || "Descreva contraindicações e recusas automáticas."}

## Pré-condições
${preconditions}

## Procedimento
${steps.join("\n")}
`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim() || !description.trim()) {
      alert("Por favor preencha Nome, Identificador (Slug) e Descrição.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t.length > 0);

    const prompts = [prompt1, prompt2, prompt3]
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const newSkill: AgentSkill = {
      id: id.trim(),
      name: name.trim(),
      category,
      description: description.trim(),
      path: id.trim(),
      entrypoint: "SKILL.md",
      package: `packages/${id.trim()}.skill`,
      execution_mode: executionMode,
      tags: tags.length ? tags : ["agente", "custom"],
      markdown: generatedMarkdown,
      isOfficial: false,
      author: author.trim() || "Lab Contributor",
      version: version.trim() || "1.0.0",
      supportedRuntimes: ["claude", "codex", "manus", "antigravity", "cursor", "local"],
      whenToUse: whenToUse.trim(),
      whenNotToUse: whenNotToUse.trim(),
      preconditions: preconditions.trim(),
      procedure: steps,
      updatedAt: "Hoje",
      usageCount: "1",
      installed: true,
      coverTheme: getCoverTheme(),
      promptSuggestions: prompts.length > 0 ? prompts : [
        `Planeje a execução de ${name} para o meu projeto.`,
        `Gere um modelo inicial de configuração para ${name}.`,
        `Audite os dados e emita um relatório estruturado.`,
      ],
      sampleTestPrompt:
        sampleTestPrompt.trim() ||
        `Executar e testar a habilidade ${name} com segurança.`,
      createdAt: new Date().toISOString().split("T")[0],
      files: [
        {
          name: id.trim(),
          path: id.trim(),
          isDir: true,
          children: [
            {
              name: "SKILL.md",
              path: `${id.trim()}/SKILL.md`,
              type: "markdown",
              content: generatedMarkdown,
            },
          ],
        },
      ],
    };

    addSkill(newSkill);
    onSuccess(newSkill.id);
  };

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "24px 20px 60px 20px",
        color: "#e2e8f0",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", color: "#ffffff" }}>
            Criar Nova Habilidade para Agentes
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "#94a3b8" }}>
            Defina uma competência no padrão universal de skills com livro 3D, sugestões de prompt interativas e arquivo SKILL.md.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#cbd5e1",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Voltar ao Catálogo
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 28 }}>
          {/* Form Fields Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Box 1: Identificação Básica */}
            <div
              style={{
                backgroundColor: "#161922",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                1. Identificação Básica
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginBottom: 6 }}>
                    Nome da Habilidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manus para Notion"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0d0f14",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#ffffff",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginBottom: 6 }}>
                    Slug Identificador (ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: notion-workflows"
                    value={id}
                    onChange={(e) => {
                      setIdTouched(true);
                      setId(e.target.value);
                    }}
                    style={{
                      width: "100%",
                      backgroundColor: "#0d0f14",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#ffffff",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginBottom: 6 }}>
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AgentSkill["category"])}
                    style={{
                      width: "100%",
                      backgroundColor: "#0d0f14",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#ffffff",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="programacao">Programação</option>
                    <option value="dados">Dados</option>
                    <option value="automacao">Automação</option>
                    <option value="negocios">Negócios</option>
                    <option value="design">Design</option>
                    <option value="midia">Mídia</option>
                    <option value="conteudo">Conteúdo</option>
                    <option value="aplicativos">Aplicativos</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginBottom: 6 }}>
                    Modo de Execução
                  </label>
                  <select
                    value={executionMode}
                    onChange={(e) => setExecutionMode(e.target.value as AgentSkill["execution_mode"])}
                    style={{
                      width: "100%",
                      backgroundColor: "#0d0f14",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#ffffff",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="plan-first">Plan-First (Plano auditável antes de agir)</option>
                    <option value="agent-loop">Agent-Loop (Diálogo e automação iterativa)</option>
                    <option value="non-destructive">Non-Destructive (Somente leitura e simulação)</option>
                    <option value="iterative-tdd">Iterative-TDD (Com testes unitários)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginBottom: 6 }}>
                  Descrição Resumida (Exibida no Card) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Planeje e gerencie bases de dados, templates e automações no Notion."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "9px 12px",
                    color: "#ffffff",
                    fontSize: 13.5,
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginBottom: 6 }}>
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="notion, produtividade, documentos, wikis"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "9px 12px",
                    color: "#ffffff",
                    fontSize: 13.5,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Box 2: Sugestões de Prompt para o Modal */}
            <div
              style={{
                backgroundColor: "#161922",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                2. Sugestões de Prompts para o Usuário
              </h2>
              <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>
                Essas frases aparecem como botões interativos no modal de detalhes da habilidade.
              </p>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  Prompt Sugerido 1:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Crie um modelo de gerenciamento de tarefas para minha equipe."
                  value={prompt1}
                  onChange={(e) => setPrompt1(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  Prompt Sugerido 2:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Estruture uma wiki de documentação técnica com páginas interligadas."
                  value={prompt2}
                  onChange={(e) => setPrompt2(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  Prompt Sugerido 3:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Audite as propriedades da base de dados e sugira otimizações de fórmulas."
                  value={prompt3}
                  onChange={(e) => setPrompt3(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Box 3: Personalização Visual do Livro 3D */}
            <div
              style={{
                backgroundColor: "#161922",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                3. Capa do Livreto (Livreto 3D & Miniatura)
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginBottom: 6 }}>
                    Paleta de Cores
                  </label>
                  <select
                    value={coverColor}
                    onChange={(e) => setCoverColor(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0d0f14",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#ffffff",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="discord-blue">Azul Discord (#5865F2)</option>
                    <option value="sky">Azul Céu (Lightroom)</option>
                    <option value="indigo">Índigo Tecnológico</option>
                    <option value="emerald">Verde Esmeralda (Segurança)</option>
                    <option value="amber">Âmbar Dourado (Vídeo/Design)</option>
                    <option value="rose">Rosa / Escarlate</option>
                    <option value="purple">Roxo Automação</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12.5, color: "#94a3b8", marginBottom: 6 }}>
                    Ícone da Capa
                  </label>
                  <select
                    value={coverIcon}
                    onChange={(e) => setCoverIcon(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0d0f14",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      color: "#ffffff",
                      fontSize: 13.5,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="sparkles">Estrela / IA Geral</option>
                    <option value="discord">Discord</option>
                    <option value="audacity">Audacity (Fones/Ondas)</option>
                    <option value="video">Vídeo / Película</option>
                    <option value="lightroom">Lightroom (Lr)</option>
                    <option value="illustrator">Illustrator (Ai)</option>
                    <option value="copywriter">Pena / Redação</option>
                    <option value="code">Código / Terminal</option>
                    <option value="shield">Escudo / Segurança</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Box 4: Procedimento do Agente */}
            <div
              style={{
                backgroundColor: "#161922",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                4. Passos de Execução do Agente
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {steps.map((st, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      backgroundColor: "#0d0f14",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 13,
                    }}
                  >
                    <span>{st}</span>
                    <button
                      type="button"
                      onClick={() => removeProcedureStep(i)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Novo passo (ex: Validar tokens de autenticação)"
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addProcedureStep();
                    }
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={addProcedureStep}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    color: "#ffffff",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Box 5: Opções Avançadas & Gatilhos */}
            <div
              style={{
                backgroundColor: "#161922",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                5. Opções Avançadas & Gatilhos do Agente
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                    Autor / Criador
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0d0f14",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "#ffffff",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                    Versão
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "#0d0f14",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "#ffffff",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  Gatilho: Quando usar esta skill?
                </label>
                <input
                  type="text"
                  placeholder="Ex: Use quando o usuário solicitar automação de tarefas no Notion."
                  value={whenToUse}
                  onChange={(e) => setWhenToUse(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  Contraindicação: Quando NÃO usar?
                </label>
                <input
                  type="text"
                  placeholder="Ex: Não use para excluir workspaces ou dados sem autorização explícita."
                  value={whenNotToUse}
                  onChange={(e) => setWhenNotToUse(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  Pré-condições e Permissões
                </label>
                <input
                  type="text"
                  value={preconditions}
                  onChange={(e) => setPreconditions(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  Prompt de Teste Padrão para o Playground
                </label>
                <input
                  type="text"
                  placeholder="Ex: Elaborar plano de configuração inicial e validar permissões da API."
                  value={sampleTestPrompt}
                  onChange={(e) => setSampleTestPrompt(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "#0d0f14",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Actions: Salvar & Cancelar */}
            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
              <button
                type="submit"
                style={{
                  backgroundColor: "#EAEAEA",
                  color: "#151515",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C2C2C2")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#EAEAEA")}
              >
                Salvar Habilidade no Laboratório
              </button>

              <button
                type="button"
                onClick={onCancel}
                style={{
                  backgroundColor: "transparent",
                  color: "#94a3b8",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* Right Live Preview Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Live 3D Cover Preview */}
            <div
              style={{
                backgroundColor: "#161922",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 16,
                }}
              >
                Prévia do Livreto 3D
              </div>

              <div style={{ margin: "20px 0" }}>
                <BookCover
                  title={name || "Título da Habilidade"}
                  theme={getCoverTheme()}
                  variant="tilted-3d"
                />
              </div>

              <div style={{ marginTop: 14, fontSize: 12, color: "#64748b" }}>
                Miniatura no Catálogo:
              </div>
              <div style={{ marginTop: 8 }}>
                <BookCover
                  title={name || "Título"}
                  theme={getCoverTheme()}
                  variant="thumbnail"
                />
              </div>
            </div>

            {/* Live SKILL.md Inspector */}
            <div
              style={{
                backgroundColor: "#161922",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  SKILL.md Gerado
                </span>
                <span style={{ fontSize: 11, color: "#C2C2C2" }}>Open Standard</span>
              </div>

              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  backgroundColor: "#0d0f14",
                  borderRadius: 8,
                  fontSize: 11,
                  lineHeight: 1.45,
                  color: "#cbd5e1",
                  maxHeight: 320,
                  overflowY: "auto",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                {generatedMarkdown}
              </pre>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
