export const THEME_STORAGE_KEY = "eqourse-theme";

export type Theme = "light" | "dark";

export interface ThemeResolutionInput {
  isServer: boolean;
  storedTheme: string | null;
  systemPrefersDark: boolean;
}

export interface ThemeStorageWriter {
  setItem(key: string, value: string): void;
}

export function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme({
  isServer,
  storedTheme,
  systemPrefersDark,
}: ThemeResolutionInput): Theme {
  if (isServer) {
    return "light";
  }

  if (isTheme(storedTheme)) {
    return storedTheme;
  }

  return systemPrefersDark ? "dark" : "light";
}

export function persistTheme(
  storage: ThemeStorageWriter,
  theme: Theme,
): void {
  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyTheme(root: HTMLElement, theme: Theme): void {
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}
