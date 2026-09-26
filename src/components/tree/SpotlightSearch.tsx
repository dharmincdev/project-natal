'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Person, TreeData } from '@/types/tree';
import { getPersonFullName, getPersonDisplayName, isDeceased, getAge } from '@/lib/tree-utils';
import { 
  Search, 
  X, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  Flame, 
  Calendar, 
  ArrowRight, 
  CornerDownLeft, 
  Layers 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type SpotlightSearchProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  treeData: TreeData;
  onSelectPerson: (person: Person) => void;
};

export default function SpotlightSearch({
  isOpen,
  onClose,
  onOpen,
  treeData,
  onSelectPerson,
}: SpotlightSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K / '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else if (onOpen) {
          onOpen();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onOpen]);

  // Filter people based on search query
  const filteredPeople = useMemo(() => {
    if (!query.trim()) {
      // If query is empty, return initial list sorted alphabetically
      return [...treeData.people].sort((a, b) => a.firstName.localeCompare(b.firstName)).slice(0, 12);
    }

    const q = query.toLowerCase().trim();

    return treeData.people
      .filter(p => {
        const fullName = getPersonFullName(p).toLowerCase();
        const nickname = (p.nickname || '').toLowerCase();
        const birthPlace = (p.birthPlace || '').toLowerCase();
        const bio = (p.bio || '').toLowerCase();
        const occupation = (p.customFields?.occupation || p.customFields?.Occupation || p.customFields?.title || p.customFields?.Title || '').toLowerCase();
        const dragon = (p.customFields?.dragon || p.customFields?.Dragon || '').toLowerCase();

        return (
          fullName.includes(q) ||
          nickname.includes(q) ||
          birthPlace.includes(q) ||
          occupation.includes(q) ||
          dragon.includes(q) ||
          bio.includes(q)
        );
      })
      .slice(0, 15);
  }, [treeData.people, query]);

  // Handle keyboard navigation inside results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredPeople.length - 1 ? prev + 1 : 0));
      scrollActiveIntoView(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredPeople.length - 1));
      scrollActiveIntoView(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPeople[selectedIndex]) {
        handleSelect(filteredPeople[selectedIndex]);
      }
    }
  };

  const scrollActiveIntoView = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.children;
      if (items[index]) {
        (items[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const handleSelect = (person: Person) => {
    onSelectPerson(person);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-14 sm:pt-24 px-3 sm:px-4 animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-muted/20">
          <Search className="w-5 h-5 text-primary shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Jump to relative by name, nickname, dragon, birthplace..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 outline-none text-sm sm:text-base text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded border bg-muted text-[10px] font-mono text-muted-foreground font-semibold">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredPeople.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-medium text-foreground">No family members found</p>
              <p className="text-xs text-muted-foreground">
                No match for &quot;{query}&quot;. Try searching by first name, occupation, or location.
              </p>
            </div>
          ) : (
            filteredPeople.map((person, idx) => {
              const isSelected = idx === selectedIndex;
              const dead = isDeceased(person);
              const age = getAge(person);
              const occupation = person.customFields?.occupation || person.customFields?.Occupation || person.customFields?.title || person.customFields?.Title;
              const dragon = person.customFields?.dragon || person.customFields?.Dragon;

              return (
                <div
                  key={person.id}
                  onClick={() => handleSelect(person)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary/30 text-foreground shadow-xs'
                      : 'hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className={`h-10 w-10 shrink-0 ${dead ? 'grayscale contrast-125 ring-1 ring-slate-400' : 'ring-1 ring-primary/30'}`}>
                      <AvatarImage src={person.photoUrl || undefined} alt={person.firstName} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {person.firstName?.[0]}{person.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">
                          {getPersonDisplayName(person)}
                        </span>
                        {dead ? (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            🪦 Deceased
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 shrink-0">
                            🟢 Living
                          </Badge>
                        )}
                      </div>

                      {/* Meta Subtitle */}
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground flex-wrap">
                        {person.birthDate && (
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-muted-foreground/70" />
                            {person.birthDate.split('-')[0]}
                            {person.deathDate ? ` – ${person.deathDate.split('-')[0]}` : ''}
                            {age !== null ? ` (${age}y)` : ''}
                          </span>
                        )}

                        {person.birthPlace && (
                          <span className="flex items-center gap-1 truncate max-w-[140px]">
                            <MapPin className="w-3 h-3 text-muted-foreground/70" />
                            {person.birthPlace}
                          </span>
                        )}

                        {dragon && (
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                            <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
                            {dragon}
                          </span>
                        )}

                        {occupation && !dragon && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Briefcase className="w-3 h-3" />
                            {occupation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick-Jump Action Pill */}
                  <div className="flex items-center gap-1 text-primary shrink-0 ml-2">
                    <span className="text-xs font-medium hidden sm:inline">Jump</span>
                    <CornerDownLeft className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Guide */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono font-bold">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono font-bold">↵</kbd> jump to node</span>
            <span><kbd className="font-mono font-bold">esc</kbd> close</span>
          </div>
          <span className="font-medium text-foreground hidden xs:inline">
            Project Natal Spotlight
          </span>
        </div>
      </div>
    </div>
  );
}
