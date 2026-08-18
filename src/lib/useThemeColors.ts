import { useEffect, useState } from "react";
import { useApp } from "./store";

export interface ThemeColors {
  primary: string;
  primarySoft: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  muted: string;
  fg: string;
  surface: string;
  borderColor: string;
}

function readColors(): ThemeColors {
  const root = document.documentElement;
  const get = (name: string): string => {
    const inline = root.style.getPropertyValue(name).trim();
    const value = inline || getComputedStyle(root).getPropertyValue(name).trim();
    // Las variables guardan tripletas "R G B"; normaliza a rgb(r, g, b) para
    // máxima compatibilidad con los parsers de color de recharts/d3.
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length === 3 && parts.every((n) => /^\d+(\.\d+)?$/.test(n))) {
      return `rgb(${parts.join(", ")})`;
    }
    return value;
  };
  return {
    primary: get("--c-primary"),
    primarySoft: get("--c-primary-soft"),
    success: get("--c-success"),
    warning: get("--c-warning"),
    danger: get("--c-danger"),
    info: get("--c-info"),
    muted: get("--c-muted"),
    fg: get("--c-fg"),
    surface: get("--c-surface"),
    borderColor: get("--c-border"),
  };
}

/** Lee los colores del tema actual para poder usarlos en las gráficas. */
export function useThemeColors(): ThemeColors {
  const themeColor = useApp((s) => s.settings.themeColor);
  const darkMode = useApp((s) => s.settings.darkMode);
  const [colors, setColors] = useState<ThemeColors>(readColors);

  useEffect(() => {
    const t = setTimeout(() => setColors(readColors()), 0);
    return () => clearTimeout(t);
  }, [themeColor, darkMode]);

  return colors;
}
