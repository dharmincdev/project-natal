'use client';

import React from 'react';
import { Layers, Globe2, Clock } from 'lucide-react';
import { useTier } from '@/context/TierContext';

export type ViewMode = 'flat' | '3d' | 'timeline' | 'world';

type ViewModeSwitcherProps = {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
};

export default function ViewModeSwitcher({
  currentMode,
  onSelectMode,
}: ViewModeSwitcherProps) {
  const { tier, openUpgradeModal } = useTier();

  const handleModeClick = (mode: ViewMode) => {
    // 3D & World modes are available in demo for evaluation
    onSelectMode(mode);
  };

  return (
    <div className="flex items-center rounded-lg border bg-muted/50 p-0.5 text-xs shadow-2xs">
      <button
        onClick={() => handleModeClick('flat')}
        className={`flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          currentMode === 'flat'
            ? 'bg-background shadow-xs text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="2D Hierarchical Tree View"
      >
        <span>🗺️</span>
        <span>Flat</span>
      </button>

      <button
        onClick={() => handleModeClick('3d')}
        className={`flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          currentMode === '3d'
            ? 'bg-background shadow-xs text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="3D Orbital Constellation View"
      >
        <span>🪐</span>
        <span>3D</span>
      </button>

      <button
        onClick={() => handleModeClick('timeline')}
        className={`flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          currentMode === 'timeline'
            ? 'bg-background shadow-xs text-amber-600 dark:text-amber-400 font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Chronological Timeline View"
      >
        <span>⏳</span>
        <span>Timeline</span>
      </button>

      <button
        onClick={() => handleModeClick('world')}
        className={`flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
          currentMode === 'world'
            ? 'bg-background shadow-xs text-emerald-600 dark:text-emerald-400 font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Interactive 3D World Globe & Migration View"
      >
        <span>🌍</span>
        <span>Globe</span>
      </button>
    </div>
  );
}
