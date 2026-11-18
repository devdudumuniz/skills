import React, { useMemo, useRef, useState } from "react";
import { AgentSkillSuite } from "../../skills/types";
import { Icon } from "./Icons";
import {
  buildPreferencesBackup,
  getBackupFilename,
  parsePreferencesBackup,
  serializePreferencesBackup,
} from "../utils/preferencesBackup";

interface PreferencesBackupModalProps {
  isOpen: boolean;
  suites: AgentSkillSuite[];
  onClose: () => void;
  onImportPreferences: (
    installedIds: string[],
    favoriteIds: string[],
    ignoredIds: string[]
  ) => void;
  onExportSuccess?: (filename: string) => void;
}

export const PreferencesBackupModal: React.FC<PreferencesBackupModalProps> = ({
  isOpen,
  suites,
  onClose,
  onImportPreferences,
  onExportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [copiedJson, setCopiedJson] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const backup = useMemo(() => buildPreferencesBackup(suites), [suites]);
  const serializedBackup = useMemo(
    () => serializePreferencesBackup(backup),
    [backup]
  );

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const filename = getBackupFilename();
    const blob = new Blob([serializedBackup], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    if (onExportSuccess) {
      onExportSuccess(filename);
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(serializedBackup);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2500);
    } catch {
      // Fallback if clipboard API is unavailable
      setCopiedJson(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    try {
      const content = await file.text();
      setImportText(content);
    } catch {
      setImportError("Não foi possível ler o arquivo selecionado.");
    } finally {
      e.target.value = "";
    }
  };

  const handleApplyImport = () => {
    setImportError(null);
    setImportSuccess(null);
    const validIds = new Set(suites.map((s) => s.id));
    const parsed = parsePreferencesBackup(importText, validIds);

    if (!parsed.ok) {
      setImportError(parsed.error);
      return;
    }

    onImportPreferences(
      parsed.installedIds,
      parsed.favoriteIds,
      parsed.ignoredIds
    );

    const ignoredNote =
      parsed.ignoredIds.length > 0
        ? ` (${parsed.ignoredIds.length} ID(s) desconhecido(s) ignorado(s))`
        : "";
    setImportSuccess(
      `Preferências aplicadas: ${parsed.installedIds.length} instalada(s) e ${parsed.favoriteIds.length} favorita(s)${ignoredNote}.`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preferences-backup-title"
    >
      <div
        className="w-full max-w-2xl bg-[#24201D] border border-[#483E34] rounded-2xl shadow-2xl text-[#F5F2EB] flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#383129] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#32231C] border border-[#D97757]/40 flex items-center justify-center text-[#D97757] shrink-0">
              <Icon n="download" size={18} />
            </div>
            <div className="min-w-0">
              <h2
                id="preferences-backup-title"
                className="text-base font-bold text-[#F5F2EB] m-0 truncate"
              >
                Backup & Migração de Preferências (JSON)
              </h2>
              <p className="text-xs text-[#A39889] m-0">
                Exporte ou restaure suas habilidades instaladas e favoritas entre dispositivos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de backup"
            className="w-8 h-8 rounded-lg bg-[#2A241F] hover:bg-[#332B25] text-[#A39889] hover:text-[#F5F2EB] border border-[#383129] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Icon n="x" size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-[#383129] flex items-center gap-2 bg-[#1E1A17]">
          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              activeTab === "export"
                ? "border-[#D97757] text-[#F5F2EB] bg-[#24201D]"
                : "border-transparent text-[#A39889] hover:text-[#D4CDC3]"
            }`}
          >
            <Icon n="download" size={14} />
            <span>Exportar JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              activeTab === "import"
                ? "border-[#D97757] text-[#F5F2EB] bg-[#24201D]"
                : "border-transparent text-[#A39889] hover:text-[#D4CDC3]"
            }`}
          >
            <Icon n="upload" size={14} />
            <span>Importar / Migrar</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === "export" ? (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A39889]">
                      Habilidades Instaladas
                    </span>
                    <Icon n="check-circle" size={14} className="text-[#D97757]" />
                  </div>
                  <div className="text-xl font-black text-[#F5F2EB]">
                    {backup.summary.installedCount}{" "}
                    <span className="text-xs font-medium text-[#A39889]">
                      de {backup.summary.totalCatalogCount}
                    </span>
                  </div>
                </div>

                <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A39889]">
                      Habilidades Favoritas
                    </span>
                    <Icon n="star" size={14} className="text-[#E09F3E]" />
                  </div>
                  <div className="text-xl font-black text-[#F5F2EB]">
                    {backup.summary.favoriteCount}{" "}
                    <span className="text-xs font-medium text-[#A39889]">
                      de {backup.summary.totalCatalogCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* JSON Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#D4CDC3]">
                    Prévia da Configuração Exportável
                  </span>
                  <span className="text-[11px] text-[#A39889] font-mono">
                    {getBackupFilename()}
                  </span>
                </div>
                <pre className="m-0 max-h-56 overflow-auto bg-[#171412] border border-[#383129] rounded-xl p-3.5 text-xs text-[#D4CDC3] font-mono leading-relaxed">
                  {serializedBackup}
                </pre>
              </div>

              {/* Export Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-4 py-2.5 rounded-xl bg-[#2A241F] hover:bg-[#332B25] text-[#F5F2EB] border border-[#483E34] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Icon n={copiedJson ? "check" : "copy"} size={15} />
                  <span>{copiedJson ? "JSON Copiado!" : "Copiar JSON"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-4 py-2.5 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white border border-[#D97757] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_10px_rgba(217,119,87,0.35)]"
                >
                  <Icon n="download" size={15} />
                  <span>Baixar Backup (.json)</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#1E1A17] border border-[#383129] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="text-sm font-bold text-[#F5F2EB]">
                      Restaurar de arquivo ou colar JSON
                    </div>
                    <p className="text-xs text-[#A39889] m-0 mt-0.5">
                      Carregue um arquivo <code className="text-[#E28768]">.json</code> exportado anteriormente para sincronizar suas habilidades neste dispositivo.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Selecionar arquivo JSON de backup"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-[#2A241F] hover:bg-[#332B25] text-[#F5F2EB] border border-[#483E34] text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Icon n="upload" size={14} />
                    <span>Selecionar Arquivo .json</span>
                  </button>
                </div>

                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    if (importError) setImportError(null);
                    if (importSuccess) setImportSuccess(null);
                  }}
                  rows={7}
                  placeholder={`{\n  "schema": "deda-skills-preferences",\n  "version": "1.0.0",\n  "preferences": {\n    "installedSkillIds": ["web-design"],\n    "favoriteSkillIds": ["web-design"]\n  }\n}`}
                  aria-label="Conteúdo JSON de preferências"
                  className="w-full bg-[#171412] border border-[#383129] focus:border-[#D97757] rounded-xl p-3 text-xs font-mono text-[#F5F2EB] resize-y"
                />

                {importError && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-[#402820] border border-[#D97757]/50 text-[#F5F2EB] text-xs flex items-start gap-2"
                  >
                    <Icon n="alert" size={15} className="text-[#E28768] shrink-0 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div
                    role="status"
                    className="p-3 rounded-xl bg-[#302720] border border-[#D97757]/60 text-[#F5F2EB] text-xs flex items-start gap-2"
                  >
                    <Icon n="check-circle" size={15} className="text-[#D97757] shrink-0 mt-0.5" />
                    <span>{importSuccess}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setImportText("");
                    setImportError(null);
                    setImportSuccess(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#2A241F] hover:bg-[#332B25] text-[#D4CDC3] border border-[#383129] text-xs sm:text-sm font-medium cursor-pointer"
                >
                  Limpar
                </button>

                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="px-4 py-2.5 rounded-xl bg-[#D97757] hover:bg-[#E28768] text-white border border-[#D97757] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_10px_rgba(217,119,87,0.35)]"
                >
                  <Icon n="check" size={15} />
                  <span>Aplicar Preferências</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
