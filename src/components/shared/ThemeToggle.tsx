'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={`h-8 w-8 text-muted-foreground hover:text-foreground transition-colors ${className || ''}`}
      title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform duration-200 rotate-0 hover:-rotate-12" />
      )}
    </Button>
  );
}
