import React, { useEffect, useMemo, useRef, useState } from "react";
import { Excalidraw, exportToSvg, serializeAsJSON } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Icon } from "../components/Icons";
import {
  ArchitectureBlueprint,
  compileBlueprintToExcalidraw,
  DIAGRAM_PRESETS,
  DiagramTheme,
  DiagramTopology,
  ExcalidrawScene,
  synthesizeBlueprintFromPrompt,
  validateExcalidrawScene,
} from "../utils/excalidrawGenerator";

type ExcalidrawApi = Parameters<
  NonNullable<React.ComponentProps<typeof Excalidraw>["excalidrawAPI"]>
>[0];

interface ExcalidrawStudioViewProps {
  initialPrompt?: string;
  onBackToCatalog: () => void;
}

const TOPOLOGY_OPTIONS: { id: DiagramTopology; label: string }[] = [
  { id: "architecture", label: "Arquitetura" },
  { id: "microservices", label: "Microsserviços" },
  { id: "dataflow", label: "Fluxo de Dados" },
  { id: "flowchart", label: "Fluxograma" },
];

export function ExcalidrawStudioView({
  initialPrompt,
  onBackToCatalog,
}: ExcalidrawStudioViewProps) {
  const defaultPreset = DIAGRAM_PRESETS[0];
  const startingPrompt = initialPrompt?.trim() || defaultPreset.prompt;

  const [prompt, setPrompt] = useState<string>(startingPrompt);
  const [topology, setTopology] = useState<DiagramTopology>(defaultPreset.topology);
  const [diagramTheme, setDiagramTheme] = useState<DiagramTheme>("dark");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(false);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);
  const [engineUsed, setEngineUsed] = useState<"gemini" | "local-synthesizer">("local-synthesizer");

  const initialComputed = useMemo(() => {
    const bp = synthesizeBlueprintFromPrompt(startingPrompt, defaultPreset.topology);
    const sc = compileBlueprintToExcalidraw(bp, "dark");
    return { blueprint: bp, scene: sc };
  }, [startingPrompt, defaultPreset.topology]);

  const [blueprint, setBlueprint] = useState<ArchitectureBlueprint>(initialComputed.blueprint);
  const [scene, setScene] = useState<ExcalidrawScene>(initialComputed.scene);

  const excalidrawApiRef = useRef<ExcalidrawApi | null>(null);

  const validation = useMemo(() => validateExcalidrawScene(scene), [scene]);

  const pushSceneToCanvas = (nextScene: ExcalidrawScene) => {
    const api = excalidrawApiRef.current;
    if (!api) return;
    api.updateScene({
      elements: nextScene.elements as unknown as Parameters<ExcalidrawApi["updateScene"]>[0]["elements"],
      appState: {
        viewBackgroundColor: nextScene.appState.viewBackgroundColor,
        theme: nextScene.appState.theme,
      },
    });
    setTimeout(() => {
      try {
        api.scrollToContent(
          nextScene.elements as unknown as Parameters<ExcalidrawApi["scrollToContent"]>[0],
          { fitToContent: true, animate: true }
        );
      } catch {
        // Ignore viewport timing errors on unmount
      }
    }, 80);
  };

  // Sync if initialPrompt changes from external navigation (e.g., clicking a suite prompt)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setPrompt(initialPrompt.trim());
      void handleGenerate(initialPrompt.trim(), topology, diagramTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const handleGenerate = async (
    targetPrompt = prompt,
    targetTopology = topology,
    targetTheme = diagramTheme
  ) => {
    const cleanPrompt = targetPrompt.trim();
    if (!cleanPrompt) {
      setErrorMsg("Descreva a arquitetura ou fluxo de sistema antes de gerar o diagrama.");
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/diagrams/excalidraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          topology: targetTopology,
          theme: targetTheme,
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || "Falha ao processar o prompt no servidor.");
      }

      const data = await response.json();
      setBlueprint(data.blueprint);
      setScene(data.scene);
      setEngineUsed(data.engine === "gemini" ? "gemini" : "local-synthesizer");
      pushSceneToCanvas(data.scene);
    } catch {
      // Deterministic client-side synthesis fallback
      const localBp = synthesizeBlueprintFromPrompt(cleanPrompt, targetTopology);
      const localScene = compileBlueprintToExcalidraw(localBp, targetTheme);
      setBlueprint(localBp);
      setScene(localScene);
      setEngineUsed("local-synthesizer");
      pushSceneToCanvas(localScene);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTheme = (nextTheme: DiagramTheme) => {
    setDiagramTheme(nextTheme);
    const recompiled = compileBlueprintToExcalidraw(blueprint, nextTheme);
    setScene(recompiled);
    pushSceneToCanvas(recompiled);
  };

  const handleSelectTopology = (nextTopology: DiagramTopology) => {
    setTopology(nextTopology);
    const updatedBp = { ...blueprint, topology: nextTopology };
    const recompiled = compileBlueprintToExcalidraw(updatedBp, diagramTheme);
    setBlueprint(updatedBp);
    setScene(recompiled);
    pushSceneToCanvas(recompiled);
  };

  const handleApplyPreset = (presetPrompt: string, presetTopology: DiagramTopology) => {
    setPrompt(presetPrompt);
    setTopology(presetTopology);
    void handleGenerate(presetPrompt, presetTopology, diagramTheme);
  };

  const handleFitCanvas = () => {
    const api = excalidrawApiRef.current;
    if (!api) return;
    const currentElements = api.getSceneElements();
    api.scrollToContent(currentElements, { fitToContent: true, animate: true });
  };

  const getCurrentSerializedJson = (): string => {
    const api = excalidrawApiRef.current;
    if (api) {
      return serializeAsJSON(
        api.getSceneElements(),
        api.getAppState(),
        api.getFiles(),
        "local"
      );
    }
    return JSON.stringify(scene, null, 2);
  };

  const handleDownloadExcalidraw = () => {
    const content = getCurrentSerializedJson();
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = blueprint.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);
    a.href = url;
    a.download = `${slug || "arquitetura"}.excalidraw`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSvg = async () => {
    const api = excalidrawApiRef.current;
    const elementsToExport = api
      ? api.getSceneElements()
      : (scene.elements as unknown as Parameters<typeof exportToSvg>[0]["elements"]);
    const appStateToExport = api
      ? api.getAppState()
      : {
          viewBackgroundColor: scene.appState.viewBackgroundColor,
          exportWithDarkMode: diagramTheme === "dark",
        };
    const svg = await exportToSvg({
      elements: elementsToExport,
      appState: {
        ...appStateToExport,
        exportWithDarkMode: diagramTheme === "dark",
        exportBackground: true,
      },
      files: api ? api.getFiles() : {},
    });
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagrama-excalidraw.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(getCurrentSerializedJson());
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  return (
    <section className="w-full max-w-[1160px] mx-auto px-4 py-4 pb-24 lg:pb-14 min-w-0">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="px-3 py-1.5 rounded-lg bg-[#26211D] hover:bg-[#302A24] border border-[#3D352D] text-[#D4CDC3] hover:text-[#F5F2EB] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Icon n="arrow-right" size={13} className="rotate-180" />
            <span>Voltar ao Catálogo</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[#F5F2EB] m-0 leading-tight">
              Gerador de Diagramas Excalidraw
            </h1>
            <p className="text-xs text-[#A39889] m-0 mt-0.5">
              Sintetize arquiteturas e fluxos de sistemas via prompt e edite ao vivo no canvas
            </p>
          </div>
        </div>

        {/* Theme & Export Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto max-w-full">
          <div
            role="group"
            aria-label="Tema do canvas Excalidraw"
            className="inline-flex items-center bg-[#201B18] border border-[#383129] rounded-lg p-1 gap-1"
          >
            <button
              type="button"
              onClick={() => handleToggleTheme("dark")}
              aria-pressed={diagramTheme === "dark"}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap border transition-colors ${
                diagramTheme === "dark"
                  ? "bg-[#312720] text-[#D97757] border-[#D97757]/50"
                  : "bg-transparent text-[#A39889] hover:text-[#F5F2EB] border-transparent"
              }`}
            >
              Escuro
            </button>
            <button
              type="button"
              onClick={() => handleToggleTheme("light")}
              aria-pressed={diagramTheme === "light"}
              className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap border transition-colors ${
                diagramTheme === "light"
                  ? "bg-[#312720] text-[#D97757] border-[#D97757]/50"
                  : "bg-transparent text-[#A39889] hover:text-[#F5F2EB] border-transparent"
              }`}
            >
              Claro
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitCanvas}
            className="px-3 py-1.5 rounded-lg bg-[#26211D] hover:bg-[#302A24] border border-[#3D352D] text-[#D4CDC3] hover:text-[#F5F2EB] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Icon n="target" size={13} />
            <span>Ajustar Zoom</span>
          </button>

          <button
            type="button"
            onClick={handleExportSvg}
            className="px-3 py-1.5 rounded-lg bg-[#26211D] hover:bg-[#302A24] border border-[#3D352D] text-[#D4CDC3] hover:text-[#F5F2EB] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Icon n="image" size={13} />
            <span>Exportar SVG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadExcalidraw}
            className="px-3 py-1.5 rounded-lg bg-[#26211D] hover:bg-[#302A24] border border-[#3D352D] text-[#F5F2EB] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Icon n="download" size={13} />
            <span>Baixar .excalidraw</span>
          </button>
        </div>
      </div>

      {/* Prompt & Controls Panel */}
      <div className="bg-[#24201D] border border-[#383129] rounded-xl p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="excalidraw-prompt-input"
                className="text-xs font-semibold text-[#F5F2EB]"
              >
                Prompt de Arquitetura ou Fluxo do Sistema
              </label>

              <div
                role="group"
                aria-label="Topologia do diagrama"
                className="inline-flex flex-wrap items-center bg-[#1E1A17] border border-[#383129] rounded-lg p-1 gap-1"
              >
                {TOPOLOGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectTopology(opt.id)}
                    aria-pressed={topology === opt.id}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer whitespace-nowrap border transition-colors ${
                      topology === opt.id
                        ? "bg-[#312720] text-[#D97757] border-[#D97757]/50"
                        : "bg-transparent text-[#A39889] hover:text-[#F5F2EB] border-transparent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="excalidraw-prompt-input"
              rows={2}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
              placeholder="Ex: Cliente Web -> API Gateway -> Auth JWT -> Order Service -> Kafka -> PostgreSQL & Redis"
              className="w-full bg-[#191613] border border-[#3D352D] focus:border-[#D97757] rounded-lg px-3 py-2.5 text-sm text-[#F5F2EB] placeholder-[#766B5E] outline-none resize-y"
            />

            {errorMsg && (
              <div
                role="alert"
                className="text-xs text-[#F5F2EB] bg-[#402820] border border-[#D97757]/60 rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <Icon n="alert" size={14} className="text-[#D97757] shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="flex lg:flex-col justify-end gap-2 shrink-0">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => void handleGenerate()}
              className="px-5 py-2.5 rounded-lg bg-[#D97757] hover:bg-[#E28768] disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-[0_2px_10px_rgba(217,119,87,0.35)] transition-colors"
            >
              <Icon n="sparkles" size={15} />
              <span>{isGenerating ? "Gerando Diagrama..." : "Gerar Diagrama"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowJsonPanel((v) => !v)}
              aria-expanded={showJsonPanel}
              className="px-4 py-2 rounded-lg bg-[#1E1A17] hover:bg-[#2A241F] border border-[#3D352D] text-[#D4CDC3] hover:text-[#F5F2EB] text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Icon n="code" size={14} />
              <span>{showJsonPanel ? "Ocultar JSON v2" : "Ver JSON v2"}</span>
            </button>
          </div>
        </div>

        {/* Presets Row */}
        <div className="mt-3 pt-3 border-t border-[#342D26] flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#A39889] mr-1">Exemplos rápidos:</span>
          {DIAGRAM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset.prompt, preset.topology)}
              className="px-2.5 py-1 rounded-md bg-[#1E1A17] hover:bg-[#2F2823] border border-[#383129] hover:border-[#D97757]/50 text-xs text-[#D4CDC3] hover:text-[#F5F2EB] cursor-pointer whitespace-nowrap transition-colors"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* Metadata Summary Strip (Unboxed typographic separators) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-3 text-xs text-[#A39889] tabular-nums">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-[#F5F2EB]">{blueprint.title}</span>
          <span aria-hidden="true">·</span>
          <span>{blueprint.nodes.length} nós</span>
          <span aria-hidden="true">·</span>
          <span>{blueprint.edges.length} conexões</span>
          <span aria-hidden="true">·</span>
          <span>{validation.stats.totalElements} elementos Excalidraw v2</span>
          <span aria-hidden="true">·</span>
          <span className={validation.valid ? "text-[#D97757] font-medium" : "text-[#E09F3E]"}>
            {validation.valid ? "Schema válido" : `${validation.errors.length} alertas`}
          </span>
        </div>

        <span className="text-[#8C8172]">
          {engineUsed === "gemini" ? "Motor: Gemini 4 + Layout v2" : "Motor: Sintetizador Estrutural + Layout v2"}
        </span>
      </div>

      {/* Live Interactive Excalidraw Canvas */}
      <div
        data-testid="excalidraw-canvas-container"
        className="w-full max-w-full h-[460px] sm:h-[580px] rounded-xl overflow-hidden border border-[#383129] bg-[#191613] relative"
      >
        <Excalidraw
          excalidrawAPI={(api) => {
            if (!api || excalidrawApiRef.current === api) return;
            excalidrawApiRef.current = api;
            requestAnimationFrame(() => {
              setTimeout(() => {
                try {
                  api.scrollToContent(api.getSceneElements(), {
                    fitToContent: true,
                    animate: false,
                  });
                } catch {
                  // ignore unmount race
                }
              }, 160);
            });
          }}
          initialData={{
            elements: scene.elements as unknown as NonNullable<
              React.ComponentProps<typeof Excalidraw>["initialData"]
            > extends infer T
              ? T extends { elements?: infer E }
                ? E
                : never
              : never,
            appState: {
              viewBackgroundColor: scene.appState.viewBackgroundColor,
              theme: scene.appState.theme,
              gridSize: 20,
            },
          }}
          theme={diagramTheme}
          langCode="pt-BR"
          UIOptions={{
            canvasActions: {
              loadScene: true,
              export: { saveFileToDisk: true },
              saveAsImage: true,
              toggleTheme: false,
            },
          }}
        />
      </div>

      {/* Optional JSON v2 Inspection Drawer */}
      {showJsonPanel && (
        <div className="mt-4 bg-[#191613] border border-[#383129] rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#F5F2EB] m-0">
                Payload Excalidraw JSON v2 Validado
              </h2>
              <p className="text-xs text-[#A39889] m-0 mt-0.5">
                {validation.stats.shapes} formas · {validation.stats.arrows} setas ancoradas ·{" "}
                {validation.stats.boundTexts} rótulos vinculados (containerId)
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyJson()}
              className="px-3 py-1.5 rounded-lg bg-[#26211D] hover:bg-[#302A24] border border-[#3D352D] text-[#F5F2EB] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Icon n={copiedFeedback ? "check" : "copy"} size={13} />
              <span>{copiedFeedback ? "JSON Copiado" : "Copiar JSON"}</span>
            </button>
          </div>
          <pre className="max-h-72 overflow-auto text-xs font-mono text-[#D4CDC3] m-0">
            {getCurrentSerializedJson()}
          </pre>
        </div>
      )}
    </section>
  );
}
