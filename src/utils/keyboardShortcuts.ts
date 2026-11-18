export type GlobalShortcutAction = "catalog" | "excalidraw" | "test";

export interface KeyboardShortcutBinding {
  id: GlobalShortcutAction;
  key: "k" | "d" | "t";
  combo: string;
  label: string;
  description: string;
}

export const GLOBAL_SHORTCUTS: KeyboardShortcutBinding[] = [
  {
    id: "catalog",
    key: "k",
    combo: "Ctrl+K",
    label: "Catálogo",
    description: "Abrir o catálogo de habilidades",
  },
  {
    id: "excalidraw",
    key: "d",
    combo: "Ctrl+D",
    label: "Diagramas",
    description: "Abrir o estúdio de diagramas Excalidraw",
  },
  {
    id: "test",
    key: "t",
    combo: "Ctrl+T",
    label: "Playground",
    description: "Abrir o playground de testes",
  },
];

export interface ShortcutKeyEventLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  targetIsContentEditable?: boolean;
}

export function matchGlobalShortcut(
  eventLike: ShortcutKeyEventLike
): GlobalShortcutAction | null {
  if (eventLike.targetIsContentEditable) return null;
  if (!(eventLike.ctrlKey || eventLike.metaKey)) return null;
  if (eventLike.altKey || eventLike.shiftKey) return null;

  const normalizedKey = (eventLike.key || "").toLowerCase();
  const match = GLOBAL_SHORTCUTS.find((shortcut) => shortcut.key === normalizedKey);
  return match ? match.id : null;
}

export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as { isContentEditable?: boolean; getAttribute?: (name: string) => string | null };
  if (el.isContentEditable) return true;
  if (typeof el.getAttribute === "function") {
    const ce = el.getAttribute("contenteditable");
    if (ce === "" || ce === "true" || ce === "plaintext-only") return true;
  }
  return false;
}
