'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Sparkles, Plus, Home, TreePine, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllTreeSummaries, TreeSummary, SAMPLE_TREES } from '@/lib/storage';

type TreeSwitcherProps = {
  currentSlug: string;
  onSelectTree: (slug: string) => void;
  onOpenCreateTree?: () => void;
  onOpenImportGedcom?: () => void;
};

export default function TreeSwitcher({
  currentSlug,
  onSelectTree,
  onOpenCreateTree,
  onOpenImportGedcom,
}: TreeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [allTrees, setAllTrees] = useState<TreeSummary[]>([]);

  // Refresh tree list whenever dropdown opens
  useEffect(() => {
    if (isOpen || allTrees.length === 0) {
      setAllTrees(getAllTreeSummaries());
    }
  }, [isOpen, allTrees.length]);

  const currentTree = useMemo(() => {
    return (
      allTrees.find((t) => t.slug === currentSlug || t.id === currentSlug) ||
      allTrees[0] || {
        id: currentSlug,
        slug: currentSlug,
        name: 'Family Tree',
        emoji: '🌳',
        tag: 'Tree',
        memberCount: 0,
        connectionCount: 0,
        description: null,
        isCustom: false,
        updatedAt: '',
      }
    );
  }, [allTrees, currentSlug]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (slug: string) => {
    onSelectTree(slug);
    setIsOpen(false);
  };

  const customTrees = allTrees.filter((t) => t.isCustom);
  const sampleTrees = allTrees.filter((t) => !t.isCustom);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-accent/50 text-foreground text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs shrink-0"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none shrink-0">{currentTree.emoji}</span>
        <span className="truncate max-w-[100px] sm:max-w-[125px] xl:max-w-[170px]">
          {currentTree.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 sm:hidden animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-3.5 top-14 sm:top-auto sm:inset-x-auto sm:absolute sm:left-0 sm:mt-1.5 sm:w-88 max-w-sm mx-auto rounded-2xl sm:rounded-xl bg-popover text-popover-foreground border border-border shadow-2xl z-50 p-2 sm:p-2.5 max-h-[82vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150">
            {/* My Custom Trees Section */}
            {customTrees.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b pb-1 mb-1">
                  <span>My Family Trees</span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-background">
                    {customTrees.length}
                  </Badge>
                </div>

                <div className="space-y-1">
                  {customTrees.map((tree) => {
                    const isSelected = tree.slug === currentSlug || tree.id === currentSlug;
                    return (
                      <button
                        key={tree.id}
                        type="button"
                        onClick={() => handleSelect(tree.slug)}
                        className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-medium ring-1 ring-primary/20'
                            : 'hover:bg-muted/60 text-foreground'
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{tree.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-foreground truncate">
                              {tree.name}
                            </span>
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0 font-semibold">
                              {tree.memberCount} members
                            </Badge>
                          </div>
                          {tree.description && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-normal">
                              {tree.description}
                            </p>
                          )}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 self-center" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Built-in Sample Trees */}
            <div>
              <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b pb-1 mb-1">
                <span>Sample Templates</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>

              <div className="space-y-1">
                {sampleTrees.map((sample) => {
                  const isSelected = sample.slug === currentSlug;
                  return (
                    <button
                      key={sample.slug}
                      type="button"
                      onClick={() => handleSelect(sample.slug)}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium ring-1 ring-primary/20'
                          : 'hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{sample.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-foreground truncate">
                            {sample.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-border font-medium">
                              {sample.tag}
                            </Badge>
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-semibold">
                              {sample.memberCount}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-normal">
                          {sample.description}
                        </p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 self-center" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Action Buttons */}
            {(onOpenCreateTree || onOpenImportGedcom) && (
              <div className="mt-2 pt-2 border-t space-y-1.5">
                {onOpenCreateTree && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenCreateTree();
                    }}
                    className="w-full h-8 text-xs font-semibold gap-1.5 justify-center bg-primary/5 hover:bg-primary/10 border-dashed border-primary/40 text-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start New Family Tree</span>
                  </Button>
                )}

                {onOpenImportGedcom && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenImportGedcom();
                    }}
                    className="w-full h-7 text-[11px] font-medium gap-1.5 justify-center text-muted-foreground hover:text-foreground"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Import GEDCOM (.ged)</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
