import { TreeData, Person } from '../../types/tree';

/**
 * Formats a Date object or ISO date string into standard GEDCOM date format (e.g., "14 FEB 1990").
 */
function toGedcomDate(rawDate?: string | null): string | null {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) {
    // If it's already a text date like "1980" or "MAY 1980", return as is
    return rawDate.trim();
  }

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = d.getUTCDate();
  const mon = months[d.getUTCMonth()];
  const yr = d.getUTCFullYear();

  return `${day} ${mon} ${yr}`;
}

/**
 * Serializes Project Natal TreeData into valid GEDCOM 7.0 / 5.5.1 text format.
 */
export function exportToGedcom(treeData: TreeData): string {
  const lines: string[] = [];
  const now = new Date();
  const dateStr = toGedcomDate(now.toISOString());

  // 1. Header (HEAD)
  lines.push('0 HEAD');
  lines.push('1 GEDC');
  lines.push('2 VERS 7.0');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');
  lines.push('1 SOUR PROJECT_NATAL');
  lines.push('2 NAME Project Natal Family Tree');
  lines.push('2 VERS 1.0.0');
  lines.push(`1 DATE ${dateStr}`);
  lines.push(`1 FILE ${treeData.tree.slug}.ged`);
  lines.push(`1 NOTE ${treeData.tree.name} exported from Project Natal`);

  // Map person UUIDs to sequential XREFs (@I1@, @I2@, etc.)
  const personToXref = new Map<string, string>();
  treeData.people.forEach((p, idx) => {
    personToXref.set(p.id, `@I${idx + 1}@`);
  });

  // 2. Individuals (INDI)
  for (let i = 0; i < treeData.people.length; i++) {
    const p = treeData.people[i];
    const xref = personToXref.get(p.id)!;

    lines.push(`0 ${xref} INDI`);
    
    // Name
    const lastName = p.lastName ? `/${p.lastName}/` : '';
    lines.push(`1 NAME ${p.firstName} ${lastName}`.trim());
    lines.push(`2 GIVN ${p.firstName}`);
    if (p.lastName) {
      lines.push(`2 SURN ${p.lastName}`);
    }
    if (p.maidenName) {
      lines.push(`2 _MARNM ${p.maidenName}`);
    }
    if (p.nickname) {
      lines.push(`2 NICK ${p.nickname}`);
    }

    // Sex
    if (p.gender === 'male') {
      lines.push('1 SEX M');
    } else if (p.gender === 'female') {
      lines.push('1 SEX F');
    } else if (p.gender === 'other') {
      lines.push('1 SEX U');
    }

    // Birth
    if (p.birthDate || p.birthPlace) {
      lines.push('1 BIRT');
      if (p.birthDate) {
        lines.push(`2 DATE ${toGedcomDate(p.birthDate)}`);
      }
      if (p.birthPlace) {
        lines.push(`2 PLAC ${p.birthPlace}`);
      }
    }

    // Death
    if (p.deathDate) {
      lines.push('1 DEAT');
      lines.push(`2 DATE ${toGedcomDate(p.deathDate)}`);
    }

    // Bio / Notes
    if (p.bio) {
      const bioClean = p.bio.replace(/\r?\n/g, ' ');
      lines.push(`1 NOTE ${bioClean}`);
    }
  }

  // 3. Group Relationships into Families (FAM)
  // Find all married couples
  const spouseRelationships = treeData.relationships.filter((r) => r.type === 'spouse');
  const parentChildRelationships = treeData.relationships.filter((r) => r.type === 'parent_child');

  // Map parents to children
  // A family unit can be defined by:
  // - A couple (spouse pair) + their shared children
  // - A single parent + their children
  type FamilyRecord = {
    xref: string;
    husb?: string;
    wife?: string;
    children: Set<string>;
    marriageDate?: string | null;
  };

  const families: FamilyRecord[] = [];
  let famIdx = 1;

  // Process couples first
  const handledCouplePairs = new Set<string>();
  for (const sp of spouseRelationships) {
    const pA = treeData.people.find((p) => p.id === sp.personAId);
    const pB = treeData.people.find((p) => p.id === sp.personBId);
    if (!pA || !pB) continue;

    const pairKey = [pA.id, pB.id].sort().join(':');
    if (handledCouplePairs.has(pairKey)) continue;
    handledCouplePairs.add(pairKey);

    // Identify husband vs wife if gender is known
    let husb = pA.gender === 'female' ? pB : pA;
    let wife = pA.gender === 'female' ? pA : pB;

    const famXref = `@F${famIdx++}@`;

    // Find children born to this couple
    const childrenOfA = new Set(
      parentChildRelationships.filter((r) => r.personAId === pA.id).map((r) => r.personBId)
    );
    const childrenOfB = new Set(
      parentChildRelationships.filter((r) => r.personAId === pB.id).map((r) => r.personBId)
    );

    // Shared children
    const sharedChildren = new Set<string>();
    for (const cId of Array.from(childrenOfA)) {
      if (childrenOfB.has(cId)) {
        sharedChildren.add(cId);
      }
    }

    families.push({
      xref: famXref,
      husb: husb.id,
      wife: wife.id,
      children: sharedChildren,
      marriageDate: sp.startDate,
    });
  }

  // 4. Output FAM records
  for (const fam of families) {
    lines.push(`0 ${fam.xref} FAM`);
    if (fam.husb && personToXref.has(fam.husb)) {
      lines.push(`1 HUSB ${personToXref.get(fam.husb)}`);
    }
    if (fam.wife && personToXref.has(fam.wife)) {
      lines.push(`1 WIFE ${personToXref.get(fam.wife)}`);
    }
    for (const cId of Array.from(fam.children)) {
      if (personToXref.has(cId)) {
        lines.push(`1 CHIL ${personToXref.get(cId)}`);
      }
    }
    if (fam.marriageDate) {
      lines.push('1 MARR');
      lines.push(`2 DATE ${toGedcomDate(fam.marriageDate)}`);
    }
  }

  // 5. Trailer
  lines.push('0 TRLR');

  return lines.join('\n') + '\n';
}
