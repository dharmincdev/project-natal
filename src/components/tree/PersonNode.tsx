'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Person } from '@/types/tree';
import { cn } from '@/lib/utils';
import { getAge } from '@/lib/tree-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Calendar, Sparkles } from 'lucide-react';

type PersonNodeProps = {
  data: {
    person: Person;
    onClick?: (person: Person) => void;
    selected?: boolean;
    isHighlighted?: boolean;
  };
  isConnectable?: boolean;
};

export default function PersonNode({ data, isConnectable = true }: PersonNodeProps) {
  const { person, onClick, selected, isHighlighted } = data;
  const [isHovered, setIsHovered] = useState(false);
  const isDeceased = !!person.deathDate;

  const initials = `${person.firstName[0] || ''}${person.lastName[0] || ''}`.toUpperCase() || '?';
  const age = getAge(person);

  const renderYears = () => {
    const birthYear = person.birthDate ? person.birthDate.split('-')[0] : null;
    const deathYear = person.deathDate ? person.deathDate.split('-')[0] : null;
    if (birthYear && deathYear) {
      return `${birthYear} – ${deathYear}`;
    }
    if (birthYear) {
      return `b. ${birthYear}`;
    }
    if (deathYear) {
      return `d. ${deathYear}`;
    }
    return null;
  };

  const years = renderYears();

  // Extract occupation or key custom field
  const occupation = person.customFields?.occupation || person.customFields?.Occupation || person.customFields?.Title || person.customFields?.title;
  const dragon = person.customFields?.dragon || person.customFields?.Dragon;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 p-3.5 w-64 rounded-xl border shadow-sm transition-all select-none hover:shadow-md cursor-pointer",
        selected && "ring-2 ring-primary border-primary",
        isHighlighted && "ring-4 ring-primary border-primary shadow-2xl scale-105 animate-pulse z-30",
        isDeceased 
          ? "bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700/80 border-t-2 border-t-slate-500 dark:border-t-slate-400 text-slate-800 dark:text-slate-200" 
          : "bg-card text-card-foreground hover:border-primary/50"
      )}
      onClick={() => onClick?.(person)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Handle: For receiving connection from parent */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-slate-400 border-2 !border-white hover:!bg-primary transition-colors"
      />

      {/* Left Handle: For spouse connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-target"
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-rose-400 border-2 !border-white hover:!bg-rose-500 transition-colors"
      />

      <Avatar className={cn(
        "h-12 w-12 border-2 shadow-xs shrink-0 transition-all",
        isDeceased 
          ? "grayscale contrast-125 opacity-80 border-slate-400 ring-2 ring-slate-300/80 dark:ring-slate-700" 
          : "border-border"
      )}>
        <AvatarImage src={person.photoUrl || undefined} alt={person.firstName} />
        <AvatarFallback className={cn(
          "font-semibold text-sm",
          isDeceased 
            ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" 
            : person.gender === 'male'
            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300"
            : person.gender === 'female'
            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
            : "bg-primary/10 text-primary"
        )}>
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col flex-1 min-w-0">
        <span className={cn(
          "font-semibold text-sm leading-tight truncate flex items-center gap-1",
          isDeceased ? "text-slate-900 dark:text-slate-100 font-medium" : "text-foreground"
        )}>
          <span className="truncate">{person.firstName} {person.lastName}</span>
          {person.gender === 'male' && <span className="text-blue-500 text-xs font-bold shrink-0" title="Male">♂</span>}
          {person.gender === 'female' && <span className="text-rose-500 text-xs font-bold shrink-0" title="Female">♀</span>}
        </span>
        {person.maidenName && (
          <span className="text-[11px] text-muted-foreground italic truncate leading-none mt-0.5">
            née {person.maidenName}
          </span>
        )}
        {person.nickname && (
          <span className="text-xs text-muted-foreground italic truncate">
            "{person.nickname}"
          </span>
        )}
        {years && (
          <span className={cn(
            "text-xs mt-0.5 font-mono",
            isDeceased ? "text-slate-600 dark:text-slate-400 font-medium" : "text-muted-foreground"
          )}>
            {years} {isDeceased && age !== null ? `(age ${age})` : ''}
          </span>
        )}
      </div>

      {isDeceased && (
        <div className="absolute -top-2.5 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-100 dark:bg-slate-200 dark:text-slate-900 shadow-md border border-slate-700 dark:border-slate-300 tracking-wide uppercase">
          <span className="text-[9px] leading-none">🪦</span>
          <span>Deceased</span>
        </div>
      )}

      {/* Hover Detail Card - Desktop Only */}
      {isHovered && (
        <div 
          className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border/80 z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150 backdrop-blur-md"
          style={{ transformOrigin: 'bottom center' }}
        >
          <div className="flex items-start gap-2.5">
            <Avatar className="h-9 w-9 border shrink-0">
              <AvatarImage src={person.photoUrl || undefined} alt={person.firstName} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-bold text-xs truncate leading-tight flex items-center gap-1">
                  <span className="truncate">{person.firstName} {person.lastName} {person.maidenName ? `(née ${person.maidenName})` : ''}</span>
                  {person.gender === 'male' && <span className="text-blue-500 text-xs font-bold shrink-0">♂</span>}
                  {person.gender === 'female' && <span className="text-rose-500 text-xs font-bold shrink-0">♀</span>}
                </p>
                {age !== null && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-normal">
                    {isDeceased ? `Lived to ${age}` : `Age ${age}`}
                  </Badge>
                )}
              </div>
              {person.nickname && (
                <p className="text-[11px] text-muted-foreground italic truncate">
                  "{person.nickname}"
                </p>
              )}
            </div>
          </div>

          <div className="mt-2.5 space-y-1.5 border-t pt-2 text-[11px] text-muted-foreground">
            {person.birthDate && (
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3 h-3 text-primary/70 shrink-0" />
                <span>
                  {person.birthDate} {person.deathDate ? `➔ ${person.deathDate}` : '(Living)'}
                </span>
              </div>
            )}

            {person.birthPlace && (
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                <span className="truncate">{person.birthPlace}</span>
              </div>
            )}

            {occupation && (
              <div className="flex items-center gap-1.5 truncate">
                <Briefcase className="w-3 h-3 text-primary/70 shrink-0" />
                <span className="truncate font-medium text-foreground">{occupation}</span>
              </div>
            )}

            {dragon && (
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate text-amber-700 dark:text-amber-400 font-medium">Mount: {dragon}</span>
              </div>
            )}

            {person.bio && (
              <p className="line-clamp-2 text-[10px] text-foreground/80 italic mt-1 leading-relaxed pt-1 border-t border-dashed">
                "{person.bio}"
              </p>
            )}
          </div>

          <div className="mt-2 text-[9px] text-primary/80 font-medium text-center uppercase tracking-wider">
            Click node to view full profile & relationships
          </div>
        </div>
      )}

      {/* Right Handle: For spouse connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-source"
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-rose-400 border-2 !border-white hover:!bg-rose-500 transition-colors"
      />

      {/* Bottom Handle: For connecting to children */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-slate-400 border-2 !border-white hover:!bg-primary transition-colors"
      />
    </div>
  );
}
