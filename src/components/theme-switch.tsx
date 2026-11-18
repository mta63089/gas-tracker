import { useEffect, useState } from "react";

import { Label } from "#components/ui/label";
import { Switch } from "#components/ui/switch";

type Theme = "light" | "dark";

const STORAGE_KEY = "gas-tracker-theme";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = theme;

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, isDark]);

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='theme-switch' className='cursor-pointer'>
        Dark mode
      </Label>

      <Switch
        id='theme-switch'
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
}
