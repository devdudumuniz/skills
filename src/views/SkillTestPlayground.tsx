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
    <section className="panel">
      <SectionHead icon="play" title="Playground & Laboratório de Testes de Skills" />
      <p className="faint lead">
        Simule a ativação, enforcement de segurança, geração de plano operacional e gates de autorização em tempo real para qualquer skill.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr)", gap: 20 }}>
        {/* Painel de Configuração do Teste */}
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: 16, display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon n="target" size={16} />
              Configuração da Sessão de Teste
            </h3>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)" }}>
              Skill a Testar
              <select
                value={selectedSkillId}
                onChange={(e) => handleSkillChange(e.target.value)}
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.isOfficial ? "Oficial" : "Custom"} · {s.execution_mode})
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={`badge ${currentSkill.isOfficial ? "info" : "ok"}`}>
                {currentSkill.isOfficial ? "Oficial Deda Skills" : "Custom Lab"}
              </span>
              <span className="badge neutral">Modo: {currentSkill.execution_mode}</span>
              <span className="badge neutral">Categoria: {currentSkill.category}</span>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)" }}>
              Runtime Simulado
              <select
                value={selectedRuntime}
                onChange={(e) => setSelectedRuntime(e.target.value)}
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

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--muted)" }}>
              Prompt / Instrução de Entrada para o Agente
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva o comando ou demanda do usuário..."
              />
            </label>

            {/* Simulação de incidentes de segurança */}
            <div style={{ background: "#222222", border: "1px solid #545454", borderRadius: 6, padding: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#EAEAEA", cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={simulateSecurityIncident}
                  onChange={(e) => setSimulateSecurityIncident(e.target.checked)}
                />
                Simular violação de segurança (ex: vazamento de secret em texto plano)
              </label>
              <div className="faint" style={{ fontSize: 11, marginTop: 4, color: "#9B9B9B" }}>
                Testa a capacidade da skill de ativar guardrails de recusa (fail-closed) e bloquear a execução.
              </div>
            </div>

            <button
              type="button"
              disabled={isRunning}
              onClick={runSimulation}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "8px 16px" }}
            >
              <Icon n="play" size={16} />
              {isRunning ? "Simulando Execução..." : "Executar Teste no Laboratório"}
            </button>
          </div>
        </div>

        {/* Console de Execução & Resultados */}
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ background: "#151515", border: "1px solid #383838", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#EAEAEA", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon n="terminal" size={16} />
                Console de Execução do Agente
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
              <div style={{ display: "grid", gap: 8 }}>
                {testResult.logs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontSize: 12,
                      display: "grid",
                      gridTemplateColumns: "68px auto 1fr",
                      gap: 8,
                      alignItems: "start",
                      padding: "4px 0",
                      borderBottom: "1px solid #262626",
                      color:
                        log.level === "success"
                          ? "#EAEAEA"
                          : log.level === "warn"
                          ? "#C2C2C2"
                          : log.level === "error"
                          ? "#EAEAEA"
                          : "#9B9B9B",
                    }}
                  >
                    <span className="faint">{log.timestamp}</span>
                    <b style={{ color: "#767676" }}>[{log.step}]</b>
                    <span>{log.detail}</span>
                  </div>
                ))}

                {/* Gate Interativo de Autorização */}
                {pendingGate && (
                  <div
                    style={{
                      marginTop: 12,
                      background: "#222222",
                      border: "1px solid #545454",
                      borderRadius: 6,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#EAEAEA", fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon n="hourglass" size={16} />
                      Gate de Autorização Humana Requerido (Plan-First)
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#C2C2C2" }}>
                      A skill gerou o plano com sucesso. Como a operação requer governança, você autoriza a emissão do artefato?
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleApproveGate}
                        style={{ fontSize: 12, padding: "5px 12px" }}
                      >
                        Aprovar Execução
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={handleRejectGate}
                        style={{ fontSize: 12, padding: "5px 12px" }}
                      >
                        Recusar / Abortar
                      </button>
                    </div>
                  </div>
                )}

                {/* Plano e Evidências */}
                {testResult.plan && (
                  <div style={{ marginTop: 12, background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 6, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>
                      Plano Estruturado Emitido:
                    </div>
                    <pre style={{ margin: 0, fontSize: 11.5, maxHeight: 180 }}>{testResult.plan}</pre>
                  </div>
                )}

                {testResult.evidence && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--ok)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon n="check-circle" size={14} />
                    <b>Evidência Auditável:</b> <code>{testResult.evidence}</code>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                Selecione uma skill e clique em <b>"Executar Teste no Laboratório"</b> para simular a esteira completa de execução do agente.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
