import type { ThemeColor } from "./types";

interface ThemeVars {
  primary: string;
  hover: string;
  soft: string;
}

interface ThemePreset {
  light: ThemeVars;
  dark: ThemeVars;
}

/**
 * Paletas disponibles en Ajustes. Los valores son tripletas "R G B"
 * que alimentan las variables CSS --c-primary*, de modo que cambiar
 * el color de toda la app es editar un solo objeto aquí (o un clic en Ajustes).
 */
export const THEMES: Record<ThemeColor, ThemePreset> = {
  verde: {
    light: { primary: "5 150 105", hover: "4 120 87", soft: "209 250 229" },
    dark: { primary: "16 185 129", hover: "52 211 153", soft: "6 78 59" },
  },
  azul: {
    light: { primary: "37 99 235", hover: "29 78 216", soft: "219 234 254" },
    dark: { primary: "59 130 246", hover: "96 165 250", soft: "30 58 138" },
  },
  morado: {
    light: { primary: "124 58 237", hover: "109 40 217", soft: "237 233 254" },
    dark: { primary: "139 92 246", hover: "167 139 250", soft: "76 29 149" },
  },
  naranja: {
    light: { primary: "234 88 12", hover: "194 65 12", soft: "255 237 213" },
    dark: { primary: "249 115 22", hover: "251 146 60", soft: "124 45 18" },
  },
  rosa: {
    light: { primary: "219 39 119", hover: "190 24 93", soft: "252 231 243" },
    dark: { primary: "236 72 153", hover: "244 114 182", soft: "131 24 67" },
  },
};

export function applyTheme(color: ThemeColor, dark: boolean): void {
  const vars = THEMES[color][dark ? "dark" : "light"];
  const root = document.documentElement;
  root.style.setProperty("--c-primary", vars.primary);
  root.style.setProperty("--c-primary-hover", vars.hover);
  root.style.setProperty("--c-primary-soft", vars.soft);
}
