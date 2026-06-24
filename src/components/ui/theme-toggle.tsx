"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import type { Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-muted p-1",
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 rounded-full px-2.5 text-xs font-semibold",
            theme === value && "bg-card text-foreground shadow-soft",
          )}
          onClick={() => setTheme(value)}
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only">{label}</span>
        </Button>
      ))}
    </div>
  );
}

export function ThemeToggleIcon({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
