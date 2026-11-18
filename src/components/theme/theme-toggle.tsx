"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm";
}) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === "sm" ? "icon-sm" : "icon"}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      onClick={toggleTheme}
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
