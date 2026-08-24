'use client';

import { Moon, Sun } from 'lucide-react';
import { useUiStore } from '@/lib/store/uiStore';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle text-muted transition-colors hover:border-border-strong hover:text-secondary ${className ?? ''}`}
    >
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
