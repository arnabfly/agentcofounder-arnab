// Theme: accent palette + document decoration (tab title, favicon).
// Domain-neutral; values come from src/config.ts. The AI never edits this file.

import type { AccentName } from "./types";

export const ACCENTS: Record<AccentName, { main: string; dark: string; soft: string }> = {
  blue:   { main: "#2f6fed", dark: "#1d4fc0", soft: "#e8effd" },
  green:  { main: "#1e9e6a", dark: "#147a50", soft: "#e6f6ef" },
  violet: { main: "#7048e8", dark: "#5433b8", soft: "#f0ebfd" },
  orange: { main: "#e8590c", dark: "#bc4409", soft: "#fdeee4" },
  rose:   { main: "#d6336c", dark: "#a82454", soft: "#fce9f0" },
  teal:   { main: "#0c8599", dark: "#086575", soft: "#e5f4f7" },
};

export function applyTheme(icon: string, accent: AccentName, title: string, mode: "light" | "dark" = "light"): void {
  const palette = ACCENTS[accent] ?? ACCENTS.blue;
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.setProperty("--accent", palette.main);
  root.style.setProperty("--accent-dark", palette.dark);
  root.style.setProperty("--accent-soft", palette.soft);
  document.title = title;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="${palette.main}"/><text x="50" y="66" font-size="52" text-anchor="middle">${icon}</text></svg>`;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
