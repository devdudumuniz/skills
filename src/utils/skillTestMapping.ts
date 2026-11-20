export const SUITE_TO_PLAYGROUND_SKILL_ID: Record<string, string> = {
  "web-design": "exact-ui-extraction-transfer",
  "security-diagnostics": "security-baseline",
  "creative-production": "html-video-production",
  "vibecode-engineering": "vibecode-builder",
  "status-governance": "status-portal",
  "copywriting-marketing": "marketing-copywriter",
};

export function resolvePlaygroundSkillId(
  requestedId: string | null | undefined,
  availableSkillIds: string[],
  fallbackId = "devops-delivery"
): string {
  const clean = requestedId?.trim();
  if (clean) {
    if (availableSkillIds.includes(clean)) {
      return clean;
    }
    const mapped = SUITE_TO_PLAYGROUND_SKILL_ID[clean];
    if (mapped && availableSkillIds.includes(mapped)) {
      return mapped;
    }
  }
  if (availableSkillIds.includes(fallbackId)) {
    return fallbackId;
  }
  return availableSkillIds[0] || fallbackId;
}
