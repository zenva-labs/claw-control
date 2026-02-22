"use client";

import { useState, useEffect } from "react";

export type Theme = "system" | "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "dark" || saved === "light" || saved === "system") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(saved);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);

    const d = document.documentElement;
    if (newTheme === "dark") {
      d.classList.add("dark");
    } else if (newTheme === "light") {
      d.classList.remove("dark");
    } else {
      const m = window.matchMedia("(prefers-color-scheme: dark)");
      d.classList.toggle("dark", m.matches);
    }
  };

  return { theme, setTheme };
}
