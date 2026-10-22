'use client';

import { Person } from '@/types/tree';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, GitBranch } from 'lucide-react';
import { KinshipResult } from '@/lib/tree-utils';

type PersonHeaderBannerProps = {
  person: Person;
  rootPerson?: Person;
  kinshipToRoot: KinshipResult | null;
};

export default function PersonHeaderBanner({
  person,
  rootPerson,
  kinshipToRoot,
}: PersonHeaderBannerProps) {
  const initials = `${person.firstName[0] || ''}${person.lastName[0] || ''}`.toUpperCase() || '?';

  return (
    <div className="bg-muted/40 border-b p-6 pb-5">
      <SheetHeader className="p-0 mb-4">
        <SheetTitle className="text-xl font-bold tracking-tight">
          {person.firstName} {person.lastName} {person.maidenName ? `(née ${person.maidenName})` : ''}
        </SheetTitle>
      </SheetHeader>

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-background shadow-md shrink-0">
          <AvatarImage src={person.photoUrl || undefined} />
          <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base truncate">
              {person.firstName} {person.lastName}
            </span>
            {person.maidenName && (
              <span className="text-xs text-muted-foreground font-normal italic">
                (née {person.maidenName})
              </span>
            )}
            {person.nickname && (
              <Badge variant="secondary" className="font-normal text-xs">
                &quot;{person.nickname}&quot;
              </Badge>
            )}
            {person.deathDate ? (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Deceased
              </Badge>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Living
              </span>
            )}
            {person.gender === 'male' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                <span className="text-xs font-bold leading-none">♂</span> Male
              </span>
            )}
            {person.gender === 'female' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                <span className="text-xs font-bold leading-none">♀</span> Female
              </span>
            )}
            {person.gender === 'other' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                <span>⚧</span> Other
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {person.birthDate ? person.birthDate : 'Birth date unknown'}
            {person.deathDate ? ` – ${person.deathDate}` : ''}
          </p>
          {person.birthPlace && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {person.birthPlace}
            </p>
          )}
          {kinshipToRoot && kinshipToRoot.relationship !== 'Unrelated' && kinshipToRoot.relationship !== 'Self' && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <GitBranch className="h-3 w-3 shrink-0" />
                <span>
                  {kinshipToRoot.relationship} of {rootPerson?.firstName} {rootPerson?.lastName}
                  {kinshipToRoot.degree && ` (${kinshipToRoot.degree})`}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
