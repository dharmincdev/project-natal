'use client';

import React from 'react';

export type ViewMode = 'flat' | 'timeline' | 'world';

type ViewModeSwitcherProps = {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
};

export default function ViewModeSwitcher({
  currentMode,
  onSelectMode,
}: ViewModeSwitcherProps) {
  const handleModeClick = (mode: ViewMode) => {
    onSelectMode(mode);
  };

  return (
    <div
      className="flex items-center rounded-lg border bg-muted/50 p-0.5 text-xs shadow-2xs shrink-0"
      role="tablist"
      aria-label="Tree visualization modes"
    >
      <button
        type="button"
        role="tab"
        aria-selected={currentMode === 'flat'}
        onClick={() => handleModeClick('flat')}
        className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all cursor-pointer ${
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
        type="button"
        role="tab"
        aria-selected={currentMode === 'timeline'}
        onClick={() => handleModeClick('timeline')}
        className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all cursor-pointer ${
          currentMode === 'timeline'
            ? 'bg-background shadow-xs text-amber-600 dark:text-amber-400 font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Unified Chronological Timeline, Lifespan Tracks & Time Traveler View"
      >
        <span>⏳</span>
        <span>Timeline</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={currentMode === 'world'}
        onClick={() => handleModeClick('world')}
        className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all cursor-pointer ${
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
