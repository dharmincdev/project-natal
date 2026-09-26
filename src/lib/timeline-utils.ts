import { Person, Relationship, Milestone, TreeData } from '@/types/tree';
import { getPersonFullName, isDeceased, getAge } from '@/lib/tree-utils';

export type TimelineEventType = 'birth' | 'death' | 'marriage' | 'milestone';

export type TimelineEvent = {
  id: string;
  year: number;
  date: string | null;
  type: TimelineEventType;
  title: string;
  description: string | null;
  person: Person;
  relatedPerson?: Person | null;
  badgeText?: string;
};

export type PersonLifespan = {
  person: Person;
  birthYear: number;
  deathYear: number;
  isLiving: boolean;
  age: number;
  generation?: number;
};

export type TimelineDecadeGroup = {
  decadeLabel: string;
  decadeStart: number;
  events: TimelineEvent[];
};

/**
 * Extracts numeric year from a date string (handles standard ISO and fantasy AC years like '0107-04-18').
 */
export function extractYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{1,4})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Formats year for display (e.g. "1972" or "0107 AC" for fantasy dynasties).
 */
export function formatYearDisplay(year: number, isHistoricalDynasty = false): string {
  if (isHistoricalDynasty || year < 500) {
    const padded = String(year).padStart(4, '0');
    return `${padded} AC`;
  }
  return String(year);
}

/**
 * Extracts and sorts all chronological events from the family tree.
 */
export function buildTimelineEvents(treeData: TreeData): {
  events: TimelineEvent[];
  lifespans: PersonLifespan[];
  minYear: number;
  maxYear: number;
  isHistoricalDynasty: boolean;
} {
  const { people, relationships } = treeData;
  const events: TimelineEvent[] = [];
  const peopleMap = new Map<string, Person>(people.map(p => [p.id, p]));

  // Check if dates are fantasy/early dynasty (e.g. Targaryen < 500 AC)
  const isHistoricalDynasty = people.some(p => {
    const y = extractYear(p.birthDate);
    return y !== null && y < 500;
  });

  const currentReferenceYear = isHistoricalDynasty ? 305 : new Date().getFullYear();

  // 1. Birth & Death Events
  people.forEach(p => {
    const bYear = extractYear(p.birthDate);
    if (bYear !== null) {
      events.push({
        id: `birth-${p.id}`,
        year: bYear,
        date: p.birthDate,
        type: 'birth',
        title: `Birth of ${getPersonFullName(p)}`,
        description: p.birthPlace ? `Born in ${p.birthPlace}` : null,
        person: p,
        badgeText: '👶 Born',
      });
    }

    const dYear = extractYear(p.deathDate);
    if (dYear !== null && isDeceased(p)) {
      const ageLived = bYear !== null ? dYear - bYear : getAge(p);
      events.push({
        id: `death-${p.id}`,
        year: dYear,
        date: p.deathDate,
        type: 'death',
        title: `Passing of ${getPersonFullName(p)}`,
        description: ageLived !== null ? `Passed away at age ${ageLived}` : 'Passed away',
        person: p,
        badgeText: '🪦 Memorial',
      });
    }

    // Individual Milestones
    (p.milestones || []).forEach(m => {
      const mYear = extractYear(m.date);
      if (mYear !== null) {
        events.push({
          id: `milestone-${m.id}`,
          year: mYear,
          date: m.date,
          type: 'milestone',
          title: `${p.firstName}: ${m.description}`,
          description: `Category: ${m.type.toUpperCase()}`,
          person: p,
          badgeText: `🏆 ${m.type.charAt(0).toUpperCase() + m.type.slice(1)}`,
        });
      }
    });
  });

  // 2. Marriage / Union Events
  relationships.forEach(rel => {
    if (rel.type === 'spouse') {
      const pA = peopleMap.get(rel.personAId);
      const pB = peopleMap.get(rel.personBId);
      if (pA && pB) {
        let mYear = extractYear(rel.startDate);
        // If no explicit startDate, estimate from later birth year + 22
        if (mYear === null) {
          const yA = extractYear(pA.birthDate);
          const yB = extractYear(pB.birthDate);
          if (yA && yB) {
            mYear = Math.max(yA, yB) + 22;
          } else if (yA) {
            mYear = yA + 22;
          } else if (yB) {
            mYear = yB + 22;
          }
        }

        if (mYear !== null) {
          events.push({
            id: `marriage-${rel.id}`,
            year: mYear,
            date: rel.startDate,
            type: 'marriage',
            title: `Marriage of ${pA.firstName} & ${pB.firstName}`,
            description: `${pA.firstName} ${pA.lastName || ''} and ${pB.firstName} ${pB.lastName || ''}`,
            person: pA,
            relatedPerson: pB,
            badgeText: '💍 Marriage',
          });
        }
      }
    }
  });

  // Sort events chronologically (earliest first)
  events.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    // Births first in same year, then milestones, marriages, deaths
    const order = { birth: 0, milestone: 1, marriage: 2, death: 3 };
    return order[a.type] - order[b.type];
  });

  // 3. Compute Lifespans for Track / Gantt View
  const lifespans: PersonLifespan[] = [];
  people.forEach(p => {
    let bYear = extractYear(p.birthDate);
    if (bYear === null) {
      // If missing, estimate from related generations or skip
      bYear = isHistoricalDynasty ? 100 : 1970;
    }

    const dead = isDeceased(p);
    let dYear = extractYear(p.deathDate);
    if (!dead || dYear === null) {
      dYear = currentReferenceYear;
    }

    const age = Math.max(0, dYear - bYear);

    lifespans.push({
      person: p,
      birthYear: bYear,
      deathYear: dYear,
      isLiving: !dead,
      age,
    });
  });

  // Sort lifespans by birth year
  lifespans.sort((a, b) => a.birthYear - b.birthYear);

  // Compute boundaries
  const allYears = events.map(e => e.year).concat(lifespans.map(l => l.birthYear));
  const minYear = allYears.length > 0 ? Math.min(...allYears) : 1940;
  const maxYear = allYears.length > 0 ? Math.max(...allYears, currentReferenceYear) : currentReferenceYear;

  return {
    events,
    lifespans,
    minYear,
    maxYear,
    isHistoricalDynasty,
  };
}

/**
 * Groups chronological events into decade/era buckets for clean vertical navigation.
 */
export function groupEventsByDecade(
  events: TimelineEvent[],
  isHistoricalDynasty = false
): TimelineDecadeGroup[] {
  const groupsMap = new Map<number, TimelineEvent[]>();

  events.forEach(event => {
    // Decade bucket: e.g. 1972 -> 1970, 107 -> 100
    const decadeStart = Math.floor(event.year / 10) * 10;
    if (!groupsMap.has(decadeStart)) {
      groupsMap.set(decadeStart, []);
    }
    groupsMap.get(decadeStart)!.push(event);
  });

  const sortedDecades = Array.from(groupsMap.keys()).sort((a, b) => a - b);

  return sortedDecades.map(decadeStart => {
    const decadeLabel = isHistoricalDynasty || decadeStart < 500
      ? `${String(decadeStart).padStart(4, '0')}s AC`
      : `${decadeStart}s`;

    return {
      decadeLabel,
      decadeStart,
      events: groupsMap.get(decadeStart)!,
    };
  });
}

/**
 * Finds all people alive during a specific target year (Contemporaries).
 */
export function getContemporariesInYear(
  lifespans: PersonLifespan[],
  year: number
): Person[] {
  return lifespans
    .filter(l => l.birthYear <= year && l.deathYear >= year)
    .map(l => l.person);
}
