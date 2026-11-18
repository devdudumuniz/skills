export type AccessibilityContrastMode = "default" | "high";

export const ACCESSIBILITY_STORAGE_KEY = "deda_skills_accessibility_contrast";

export function parseStoredAccessibilityMode(
  rawValue: string | null | undefined
): AccessibilityContrastMode {
  return rawValue === "high" ? "high" : "default";
}

export function toggleAccessibilityMode(
  current: AccessibilityContrastMode
): AccessibilityContrastMode {
  return current === "high" ? "default" : "high";
}

export function getAccessibilityToggleMeta(mode: AccessibilityContrastMode) {
  const isHighContrast = mode === "high";
  return {
    isHighContrast,
    label: isHighContrast ? "Alto Contraste: Ativo" : "Alto Contraste",
    shortStatus: isHighContrast ? "Fundo preto • Verde neon" : "Ativar baixa visão",
    ariaLabel: isHighContrast
      ? "Desativar modo de acessibilidade de alto contraste e restaurar tema Sertão"
      : "Ativar modo de acessibilidade de alto contraste para baixa visão",
  };
}
