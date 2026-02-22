"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Theme, useTheme } from "@/hooks/use-theme";

const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
];

export default function AppSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your Claw Control preferences.</p>
      </div>

      <div className="divide-y rounded-lg border">
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-muted-foreground text-sm">Choose your preferred color scheme.</p>
          </div>
          <div className="bg-secondary flex shrink-0 gap-1 rounded-md border p-1">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  theme === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
