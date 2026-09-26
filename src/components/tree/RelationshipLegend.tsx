'use client';

import { useState, useEffect } from 'react';
import { Layers, ChevronDown, ChevronUp, Sparkles, Heart, Users, ArrowDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function RelationshipLegend() {
  const [isOpen, setIsOpen] = useState(false);

  // Default to open on desktop screens with adequate height, closed on mobile screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && window.innerHeight >= 650) {
      setIsOpen(true);
    }
  }, []);

  return (
    <div className="absolute bottom-4 right-4 z-20 select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/95 hover:bg-background text-foreground border border-border shadow-lg backdrop-blur-md text-xs font-medium transition-all hover:scale-105 active:scale-95"
          title="Open Relationship Legend"
        >
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>Legend</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-semibold">
            Lines
          </span>
        </button>
      ) : (
        <div className="w-72 rounded-xl bg-background/95 backdrop-blur-md border border-border shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div 
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-between px-3.5 py-2.5 bg-muted/40 border-b border-border cursor-pointer hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="font-semibold text-xs text-foreground">Relationship Legend</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors"
              title="Collapse Legend"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Legend Items */}
          <div className="p-3 space-y-2.5 text-xs">
            {/* Parent to Child (Biological) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center w-9 shrink-0">
                  <div className="h-0.5 flex-1 bg-slate-500 dark:bg-slate-400" />
                  <div className="w-0 h-0 border-y-[3.5px] border-y-transparent border-l-[6px] border-l-slate-500 dark:border-l-slate-400" />
                </div>
                <div className="truncate">
                  <p className="font-medium text-foreground leading-tight">Parent ➔ Child</p>
                  <p className="text-[10px] text-muted-foreground">Biological lineage</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 text-slate-600 dark:text-slate-300">
                Solid
              </Badge>
            </div>

            {/* Step or Adoptive Parent */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center w-9 shrink-0">
                  <div className="h-0.5 flex-1 border-t-2 border-dashed border-sky-500" />
                  <div className="w-0 h-0 border-y-[3.5px] border-y-transparent border-l-[6px] border-l-sky-500" />
                </div>
                <div className="truncate">
                  <p className="font-medium text-sky-600 dark:text-sky-400 leading-tight">Step / Adoptive</p>
                  <p className="text-[10px] text-muted-foreground">Adopted or step-parent</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 border-sky-300 text-sky-600 dark:text-sky-400">
                Dashed Blue
              </Badge>
            </div>

            {/* Spouse / Marriage */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 border-t-2 border-rose-500 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-rose-600 dark:text-rose-400 leading-tight">Spouse / Partner</p>
                  <p className="text-[10px] text-muted-foreground">Marriage or union</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 border-rose-300 text-rose-600 dark:text-rose-400">
                Solid Rose
              </Badge>
            </div>

            {/* Sibling */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 border-t-2 border-dotted border-violet-500 shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-violet-600 dark:text-violet-400 leading-tight">Sibling</p>
                  <p className="text-[10px] text-muted-foreground">Brother or sister</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 border-violet-300 text-violet-600 dark:text-violet-400">
                Dotted Purple
              </Badge>
            </div>

            {/* Sub-section: Badges & Details */}
            <div className="pt-2 border-t border-border/80 space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Deceased tag
                </span>
                <span className="text-[10px] font-mono opacity-80">Passed away</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Hover cards
                </span>
                <span className="text-[10px] font-mono opacity-80">Quick preview</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
