export const THEME_STORAGE_KEY = "fairsplit-theme";

export type Theme = "light" | "dark" | "system";

export function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  const resolved = getResolvedTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=s==="light"||s==="dark"?s:(d?"dark":"light");document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})();`;
