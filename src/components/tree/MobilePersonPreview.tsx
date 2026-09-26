'use client';

import React from 'react';
import { Person } from '@/types/tree';
import { getAge } from '@/lib/tree-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, MapPin, Briefcase, Calendar, Sparkles, User, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type MobilePersonPreviewProps = {
  person: Person | null;
  onClose: () => void;
  onOpenFullProfile: (person: Person) => void;
  onConnect?: (personId: string) => void;
  isEditable?: boolean;
};

export default function MobilePersonPreview({
  person,
  onClose,
  onOpenFullProfile,
  onConnect,
  isEditable = true,
}: MobilePersonPreviewProps) {
  if (!person) return null;

  const isDeceased = !!person.deathDate;
  const initials = `${person.firstName[0] || ''}${person.lastName[0] || ''}`.toUpperCase() || '?';
  const age = getAge(person);

  const occupation =
    person.customFields?.occupation ||
    person.customFields?.Occupation ||
    person.customFields?.Title ||
    person.customFields?.title;

  const dragon = person.customFields?.dragon || person.customFields?.Dragon;

  return (
    <div className="sm:hidden fixed bottom-3 inset-x-3 z-30 animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
      <div className={cn(
        "rounded-2xl border shadow-2xl p-3.5 bg-card/95 backdrop-blur-md text-card-foreground border-border/80",
        isDeceased && "border-t-2 border-t-slate-500 bg-slate-50/95 dark:bg-slate-900/95"
      )}>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className={cn(
              "h-12 w-12 border-2 shadow-xs shrink-0",
              isDeceased
                ? "grayscale contrast-125 border-slate-400 ring-2 ring-slate-300 dark:ring-slate-700"
                : "border-border"
            )}>
              <AvatarImage src={person.photoUrl || undefined} alt={person.firstName} />
              <AvatarFallback className={cn(
                "font-bold text-sm",
                isDeceased ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-primary/10 text-primary"
              )}>
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-sm leading-tight text-foreground truncate">
                  {person.firstName} {person.lastName}
                </h4>
                {isDeceased ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-100 dark:bg-slate-200 dark:text-slate-900 uppercase">
                    🪦 Deceased
                  </span>
                ) : (
                  age !== null && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                      Age {age}
                    </Badge>
                  )
                )}
              </div>

              {person.nickname && (
                <p className="text-xs text-muted-foreground italic truncate">
                  "{person.nickname}"
                </p>
              )}

              {person.birthDate && (
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {person.birthDate} {person.deathDate ? `➔ ${person.deathDate}` : '(Living)'}
                  {isDeceased && age !== null ? ` • Age ${age}` : ''}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 -mt-1 -mr-1"
            title="Dismiss preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Pills */}
        <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {person.birthPlace && (
            <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md truncate max-w-[180px]">
              <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
              <span className="truncate">{person.birthPlace}</span>
            </div>
          )}

          {occupation && (
            <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md truncate max-w-[180px]">
              <Briefcase className="w-3 h-3 text-primary/70 shrink-0" />
              <span className="truncate font-medium text-foreground">{occupation}</span>
            </div>
          )}

          {dragon && (
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md truncate max-w-[180px] font-medium">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">Mount: {dragon}</span>
            </div>
          )}
        </div>

        {person.bio && (
          <p className="text-[11px] text-muted-foreground italic line-clamp-2 mt-2 leading-relaxed bg-muted/30 p-1.5 rounded-md">
            "{person.bio}"
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onOpenFullProfile(person)}
            className="flex-1 h-8 text-xs font-medium gap-1.5 shadow-xs"
          >
            <User className="w-3.5 h-3.5" />
            <span>{isEditable ? 'View & Edit Profile' : 'View Full Profile'}</span>
          </Button>

          {isEditable && onConnect && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConnect(person.id)}
              className="h-8 text-xs px-2.5 gap-1"
              title="Connect relatives to this person"
            >
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <span>Connect</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
