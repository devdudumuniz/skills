import { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { Icon } from "../components/Icons";
import { SectionHead } from "../components/UIPrimitives";
import { SkillTestRunResult } from "../types";

interface SkillTestPlaygroundProps {
  initialSkillId?: string | null;
  initialPrompt?: string;
}

export function SkillTestPlayground({ initialSkillId, initialPrompt }: SkillTestPlaygroundProps) {
  const { skills } = useProject();

  const [selectedSkillId, setSelectedSkillId] = useState<string>(
    initialSkillId || skills[0]?.id || "devops-delivery"
  );
  const [selectedRuntime, setSelectedRuntime] = useState<string>("claude");
  const [prompt, setPrompt] = useState<string>(
    initialPrompt ||
      skills.find((s) => s.id === (initialSkillId || skills[0]?.id))?.sampleTestPrompt ||
      "Auditar este repositório e preparar plano de entrega com rollback testado."
  );
  const [simulateSecurityIncident, setSimulateSecurityIncident] = useState(false);
  const [testResult, setTestResult] = useState<SkillTestRunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pendingGate, setPendingGate] = useState<boolean>(false);

  const currentSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  const handleSkillChange = (id: string) => {
    setSelectedSkillId(id);
    const sk = skills.find((s) => s.id === id);
    if (sk?.sampleTestPrompt) {
      setPrompt(sk.sampleTestPrompt);
    }
    setTestResult(null);
    setPendingGate(false);
  };

  const runSimulation = () => {
    setIsRunning(true);
    setPendingGate(false);

    const logs: SkillTestRunResult["logs"] = [
      {
        timestamp: new Date().toLocaleTimeString(),
        step: "Pre-flight Check",
        detail: `Validando manifesto e arquivo SKILL.md de '${currentSkill.id}'...`,
        level: "info",
      },
      {
        timestamp: new Date().toLocaleTimeString(),
        step: "Frontmatter YAML",
        detail: `Modo de execução '${currentSkill.execution_mode}' verificado com sucesso.`,
        level: "success",
      },
    ];

    setTestResult({
      skillId: currentSkill.id,
      status: "running",
      logs: [...logs],
      securityChecksPassed: true,
    });

    setTimeout(() => {
      logs.push({
        timestamp: new Date().toLocaleTimeString(),
        step: "Context & Trigger Matching",
        detail: `Ativação de skill confirmada para runtime '${selectedRuntime}'.`,
        level: "info",
      });

      if (simulateSecurityIncident) {
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          step: "Security Heuristic Check",
          detail: "ALERTA: Detectada tentativa de manipulação de segredo em texto plano (violação da política DM_SECRET_*).",
          level: "error",
        });
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          step: "Fail-Closed Gate",
          detail: "Operação bloqueada pelo guardrail de segurança da skill. Nenhuma alteração aplicada.",
          level: "warn",
        });

        setIsRunning(false);
        setTestResult({
          skillId: currentSkill.id,
          status: "blocked",
          logs: [...logs],
          securityChecksPassed: false,
        });
        return;
      }

      logs.push({
        timestamp: new Date().toLocaleTimeString(),
        step: "Security Heuristic Check",
        detail: "Princípios Plan-First e Zero Exfiltração respeitados.",
        level: "success",
      });

      logs.push({
        timestamp: new Date().toLocaleTimeString(),
        step: "Plan-First Synthesis",
        detail: "Elaborando plano operacional detalhado sem comandos mutáveis...",
        level: "info",
      });

      const planText = `### Plano Operacional Gerado por '${currentSkill.name}'
1. Alvo de Execução: Repositório identificado em modo seguro.
2. Análise de Risco: Matriz de risco classificada como P1.
3. Passos Propostos:
   - Validar dependências e SBOM de produção.
   - Executar verificações defensivas de integridade.
   - Preparar estratégia de rollback automático.
4. Critérios de Sucesso: Testes de unidade 100% OK e sem credenciais expostas.`;

      if (currentSkill.execution_mode === "plan-first" || currentSkill.securityRules?.explicitGates) {
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          step: "Human-in-the-Loop Gate",
          detail: "Aguardando autorização humana para prosseguir com os critérios de aceite.",
          level: "warn",
        });

        setIsRunning(false);
        setPendingGate(true);
        setTestResult({
          skillId: currentSkill.id,
          status: "needs_approval",
          logs: [...logs],
          plan: planText,
          securityChecksPassed: true,
        });
      } else {
        logs.push({
          timestamp: new Date().toLocaleTimeString(),
          step: "Evidence Artifact",
          detail: "Artefato de evidência gerado em conformidade com o padrão aberto.",
          level: "success",
        });

        setIsRunning(false);
        setTestResult({
          skillId: currentSkill.id,
          status: "success",
          logs: [...logs],
          plan: planText,
          evidence: "evidence/test-run-audit.log (SHA256: 4f8b9e...)",
          securityChecksPassed: true,
        });
      }
    }, 1200);
  };

  const handleApproveGate = () => {
    if (!testResult) return;
    const logs = [
      ...testResult.logs,
      {
        timestamp: new Date().toLocaleTimeString(),
        step: "Human Gate Approved",
        detail: "Aprovação concedida pelo operador humano no laboratório.",
        level: "success" as const,
      },
      {
        timestamp: new Date().toLocaleTimeString(),
        step: "Completion & Evidence",
        detail: "Tarefa concluída com sucesso e audit trail assinado criptograficamente.",
        level: "success" as const,
      },
    ];

    setPendingGate(false);
    setTestResult({
      ...testResult,
      status: "success",
      logs,
      evidence: "evidence/test-run-audit.log (Assinatura criptográfica válida)",
    });
  };

  const handleRejectGate = () => {
    if (!testResult) return;
    const logs = [
      ...testResult.logs,
      {
        timestamp: new Date().toLocaleTimeString(),
        step: "Human Gate Denied",
        detail: "Operação recusada pelo operador humano no laboratório. Execução abortada de forma segura.",
        level: "warn" as const,
      },
    ];

    setPendingGate(false);
    setTestResult({
      ...testResult,
      status: "blocked",
      logs,
    });
  };

  return (
    <section className="panel min-w-0 w-full max-w-6xl mx-auto">
      <SectionHead icon="play" title="Playground & Laboratório de Testes de Skills" />
      <p className="faint lead" style={{ color: "#A39889", marginTop: 4, marginBottom: 20 }}>
        Simule a ativação, enforcement de segurança, geração de plano operacional e gates de autorização em tempo real para qualquer skill.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start min-w-0">
        {/* Painel de Configuração do Teste */}
        <div className="xl:col-span-5 flex flex-col gap-3.5 min-w-0 w-full">
          <div
            className="min-w-0 w-full overflow-hidden"
            style={{
              background: "#24201D",
              border: "1px solid #383129",
              borderRadius: 12,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 14, color: "#F5F2EB", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon n="target" size={16} />
              <span>Configuração da Sessão de Teste</span>
            </h3>

            <label className="flex flex-col gap-1.5 text-xs min-w-0 w-full" style={{ color: "#A39889" }}>
              <span>Skill a Testar</span>
              <select
                value={selectedSkillId}
                onChange={(e) => handleSkillChange(e.target.value)}
                className="w-full max-w-full min-w-0"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.isOfficial ? "Oficial" : "Custom"} · {s.execution_mode})
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2 flex-wrap">
              <span className={`badge ${currentSkill.isOfficial ? "info" : "ok"}`}>
                {currentSkill.isOfficial ? "Oficial Deda Skills" : "Custom Lab"}
              </span>
              <span className="badge neutral">Modo: {currentSkill.execution_mode}</span>
              <span className="badge neutral">Categoria: {currentSkill.category}</span>
            </div>

            <label className="flex flex-col gap-1.5 text-xs min-w-0 w-full" style={{ color: "#A39889" }}>
              <span>Runtime Simulado</span>
              <select
                value={selectedRuntime}
                onChange={(e) => setSelectedRuntime(e.target.value)}
                className="w-full max-w-full min-w-0"
              >
                <option value="claude">Claude Code (Anthropic)</option>
                <option value="codex">OpenAI Codex</option>
                <option value="antigravity">Antigravity (Google DeepMind)</option>
                <option value="manus">Manus</option>
                <option value="hermes">Hermes Agent</option>
                <option value="opencode">OpenCode</option>
                <option value="cursor">Cursor</option>
                <option value="local">Ambiente Local</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-xs min-w-0 w-full" style={{ color: "#A39889" }}>
              <span>Prompt / Instrução de Entrada para o Agente</span>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva o comando ou demanda do usuário..."
                className="w-full max-w-full min-w-0"
              />
            </label>

            {/* Simulação de incidentes de segurança */}
            <div style={{ background: "#1E1A17", border: "1px solid #383129", borderRadius: 10, padding: 12 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#F5F2EB", cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={simulateSecurityIncident}
                  onChange={(e) => setSimulateSecurityIncident(e.target.checked)}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <span>Simular violação de segurança (ex: vazamento de secret em texto plano)</span>
              </label>
              <div className="faint" style={{ fontSize: 11, marginTop: 6, color: "#A39889", lineHeight: 1.45 }}>
                Testa a capacidade da skill de ativar guardrails de recusa (fail-closed) e bloquear a execução.
              </div>
            </div>

            <button
              type="button"
              disabled={isRunning}
              onClick={runSimulation}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                backgroundColor: "#D97757",
                color: "#FFFFFF",
                fontWeight: 700,
                borderRadius: 8,
                border: "1px solid #D97757",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(217, 119, 87, 0.35)",
                width: "100%",
              }}
            >
              <Icon n="play" size={16} />
              <span>{isRunning ? "Simulando Execução..." : "Executar Teste no Laboratório"}</span>
            </button>
          </div>
        </div>

        {/* Console de Execução & Resultados */}
        <div className="xl:col-span-7 flex flex-col gap-3.5 min-w-0 w-full">
          <div style={{ background: "#191613", border: "1px solid #383129", borderRadius: 12, padding: 18 }} className="min-w-0 w-full">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-2.5 border-b border-[#322B24]">
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#F5F2EB", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon n="terminal" size={16} />
                <span>Console de Execução do Agente</span>
              </span>
              {testResult && (
                <span
                  className={`badge ${
                    testResult.status === "success"
                      ? "ok"
                      : testResult.status === "needs_approval"
                      ? "warn"
                      : testResult.status === "blocked"
                      ? "bad"
                      : "info"
                  }`}
                >
                  {testResult.status === "success" && "Sucesso / Aprovado"}
                  {testResult.status === "needs_approval" && "Aguardando Gate Humano"}
                  {testResult.status === "blocked" && "Bloqueado por Segurança"}
                  {testResult.status === "running" && "Executando..."}
                </span>
              )}
            </div>

            {testResult ? (
              <div style={{ display: "grid", gap: 8 }} className="min-w-0">
                {testResult.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="font-mono text-xs flex flex-col sm:grid sm:grid-cols-[72px_auto_1fr] gap-1 sm:gap-2 items-start py-1.5 border-b border-[#2C2620] min-w-0 break-words"
                    style={{
                      color:
                        log.level === "success"
                          ? "#F5F2EB"
                          : log.level === "warn"
                          ? "#E09F3E"
                          : log.level === "error"
                          ? "#D97757"
                          : "#A39889",
                    }}
                  >
                    <span className="text-[11px] text-[#766B5E] shrink-0">{log.timestamp}</span>
                    <b className="text-[#D97757] shrink-0">[{log.step}]</b>
                    <span className="min-w-0 break-words">{log.detail}</span>
                  </div>
                ))}

                {/* Gate Interativo de Autorização */}
                {pendingGate && (
                  <div
                    style={{
                      marginTop: 12,
                      background: "#27221E",
                      border: "1px solid #D97757",
                      borderRadius: 10,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#F5F2EB", fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon n="hourglass" size={16} />
                      <span>Gate de Autorização Humana Requerido (Plan-First)</span>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "#D4CDC3" }}>
                      A skill gerou o plano com sucesso. Como a operação requer governança, você autoriza a emissão do artefato?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleApproveGate}
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          backgroundColor: "#D97757",
                          color: "#FFFFFF",
                          border: "1px solid #D97757",
                          borderRadius: 8,
                        }}
                      >
                        Aprovar Execução
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={handleRejectGate}
                        style={{
                          fontSize: 12,
                          padding: "6px 14px",
                          backgroundColor: "#2A241F",
                          color: "#F5F2EB",
                          border: "1px solid #443A30",
                          borderRadius: 8,
                        }}
                      >
                        Recusar / Abortar
                      </button>
                    </div>
                  </div>
                )}

                {/* Plano e Evidências */}
                {testResult.plan && (
                  <div style={{ marginTop: 12, background: "#24201D", border: "1px solid #383129", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#D97757", marginBottom: 6 }}>
                      Plano Estruturado Emitido:
                    </div>
                    <pre style={{ margin: 0, fontSize: 11.5, maxHeight: 200 }}>{testResult.plan}</pre>
                  </div>
                )}

                {testResult.evidence && (
                  <div className="mt-2 text-xs text-[#D4CDC3] flex flex-wrap items-center gap-1.5">
                    <Icon n="check-circle" size={14} />
                    <b>Evidência Auditável:</b> <code className="text-[#D97757] break-all">{testResult.evidence}</code>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "36px 12px", textAlign: "center", color: "#A39889", fontSize: 13 }}>
                Selecione uma skill e clique em <b style={{ color: "#F5F2EB" }}>"Executar Teste no Laboratório"</b> para simular a esteira completa de execução do agente.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
