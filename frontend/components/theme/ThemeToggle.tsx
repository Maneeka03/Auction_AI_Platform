"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_KEY = "auction-ai-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => setIsDark(document.documentElement.classList.contains("dark")), []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    setIsDark(next);
  }

  return <button type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? "light" : "dark"} theme`} title={`Switch to ${isDark ? "light" : "dark"} theme`} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10", className)}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</button>;
}
