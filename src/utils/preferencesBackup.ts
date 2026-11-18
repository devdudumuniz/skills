import { AgentSkillSuite } from "../../skills/types";

export const PREFERENCES_BACKUP_SCHEMA = "deda-skills-preferences" as const;
export const PREFERENCES_BACKUP_VERSION = "1.0.0" as const;

export interface DedaSkillsPreferencesBackup {
  schema: typeof PREFERENCES_BACKUP_SCHEMA;
  version: typeof PREFERENCES_BACKUP_VERSION;
  exportedAt: string;
  app: {
    name: "Deda Skills";
    appVersion: "1.0.0";
  };
  preferences: {
    installedSkillIds: string[];
    favoriteSkillIds: string[];
  };
  summary: {
    installedCount: number;
    favoriteCount: number;
    totalCatalogCount: number;
  };
}

export type ParseBackupResult =
  | {
      ok: true;
      installedIds: string[];
      favoriteIds: string[];
      ignoredIds: string[];
      exportedAt?: string;
    }
  | {
      ok: false;
      error: string;
    };

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

export function buildPreferencesBackup(
  suites: Pick<AgentSkillSuite, "id" | "installed" | "isFavorite">[],
  exportedAt: string = new Date().toISOString()
): DedaSkillsPreferencesBackup {
  const installedSkillIds = uniqueStrings(
    suites.filter((s) => Boolean(s.installed)).map((s) => s.id)
  );
  const favoriteSkillIds = uniqueStrings(
    suites.filter((s) => Boolean(s.isFavorite)).map((s) => s.id)
  );

  return {
    schema: PREFERENCES_BACKUP_SCHEMA,
    version: PREFERENCES_BACKUP_VERSION,
    exportedAt,
    app: {
      name: "Deda Skills",
      appVersion: "1.0.0",
    },
    preferences: {
      installedSkillIds,
      favoriteSkillIds,
    },
    summary: {
      installedCount: installedSkillIds.length,
      favoriteCount: favoriteSkillIds.length,
      totalCatalogCount: suites.length,
    },
  };
}

export function serializePreferencesBackup(
  backup: DedaSkillsPreferencesBackup
): string {
  return JSON.stringify(backup, null, 2);
}

export function getBackupFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `deda-skills-preferences-${year}-${month}-${day}.json`;
}

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((item) => typeof item === "string");
}

export function parsePreferencesBackup(
  rawJson: string,
  validIds?: Set<string>
): ParseBackupResult {
  if (!rawJson || !rawJson.trim()) {
    return { ok: false, error: "O conteúdo JSON está vazio." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      ok: false,
      error: "JSON inválido. Verifique a sintaxe do arquivo ou texto colado.",
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      error: "Formato de backup inválido: esperado um objeto JSON.",
    };
  }

  const obj = parsed as Record<string, unknown>;
  if (
    obj.schema !== undefined &&
    obj.schema !== PREFERENCES_BACKUP_SCHEMA
  ) {
    return {
      ok: false,
      error: `Schema incompatível ("${String(obj.schema)}"). Esperado "${PREFERENCES_BACKUP_SCHEMA}".`,
    };
  }

  const prefsSource =
    obj.preferences &&
    typeof obj.preferences === "object" &&
    !Array.isArray(obj.preferences)
      ? (obj.preferences as Record<string, unknown>)
      : obj;

  const rawInstalled =
    prefsSource.installedSkillIds ?? prefsSource.installed;
  const rawFavorites =
    prefsSource.favoriteSkillIds ?? prefsSource.favorites;

  if (!isStringArray(rawInstalled) || !isStringArray(rawFavorites)) {
    return {
      ok: false,
      error:
        "Estrutura inválida: 'preferences.installedSkillIds' e 'preferences.favoriteSkillIds' devem ser listas de IDs.",
    };
  }

  const dedupInstalled = uniqueStrings(rawInstalled);
  const dedupFavorites = uniqueStrings(rawFavorites);

  const ignoredIds: string[] = [];
  let installedIds = dedupInstalled;
  let favoriteIds = dedupFavorites;

  if (validIds) {
    installedIds = dedupInstalled.filter((id) => {
      const exists = validIds.has(id);
      if (!exists) ignoredIds.push(id);
      return exists;
    });
    favoriteIds = dedupFavorites.filter((id) => {
      const exists = validIds.has(id);
      if (!exists && !ignoredIds.includes(id)) ignoredIds.push(id);
      return exists;
    });
  }

  return {
    ok: true,
    installedIds,
    favoriteIds,
    ignoredIds,
    exportedAt:
      typeof obj.exportedAt === "string" ? obj.exportedAt : undefined,
  };
}

export function applyPreferencesToSuites(
  suites: AgentSkillSuite[],
  installedIds: string[],
  favoriteIds: string[]
): AgentSkillSuite[] {
  const installedSet = new Set(installedIds);
  const favoriteSet = new Set(favoriteIds);

  return suites.map((suite) => ({
    ...suite,
    installed: installedSet.has(suite.id),
    isFavorite: favoriteSet.has(suite.id),
  }));
}
