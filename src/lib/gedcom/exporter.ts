import { TreeData } from '../../types/tree';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Formats a Date object or ISO date string into standard GEDCOM date format (e.g., "14 FEB 1990").
 */
function toGedcomDate(rawDate?: string | null): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();
  if (!trimmed) return null;

  // Preserve year-only strings (e.g., "1980")
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Exact ISO YYYY-MM-DD (avoid timezone offset issues)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const yr = parseInt(isoMatch[1], 10);
    const monIdx = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    if (monIdx >= 0 && monIdx < 12 && day >= 1 && day <= 31) {
      return `${day} ${MONTHS[monIdx]} ${yr}`;
    }
  }

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) {
    return trimmed;
  }

  const day = d.getUTCDate();
  const mon = MONTHS[d.getUTCMonth()];
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
      if (p.deathDate !== 'Unknown') {
        lines.push(`2 DATE ${toGedcomDate(p.deathDate)}`);
      }
    }

    // Occupation
    if (p.customFields?.occupation) {
      lines.push(`1 OCCU ${p.customFields.occupation}`);
    }

    // Bio / Notes
    if (p.bio) {
      const bioClean = p.bio.replace(/\r?\n/g, ' ');
      lines.push(`1 NOTE ${bioClean}`);
    }
  }

  // 3. Group Relationships into Families (FAM)
  const spouseRelationships = treeData.relationships.filter((r) => r.type === 'spouse');
  const parentChildRelationships = treeData.relationships.filter((r) => r.type === 'parent_child');
  const siblingRelationships = treeData.relationships.filter((r) => r.type === 'sibling');

  type FamilyRecord = {
    xref: string;
    husb?: string;
    wife?: string;
    children: Set<string>;
    unmarried?: boolean;
    marriageDate?: string | null;
  };

  const families: FamilyRecord[] = [];
  let famIdx = 1;
  const emittedParentChildPairs = new Set<string>();

  // 3A. Married couples and their shared children
  const handledCouplePairs = new Set<string>();
  for (const sp of spouseRelationships) {
    const pA = treeData.people.find((p) => p.id === sp.personAId);
    const pB = treeData.people.find((p) => p.id === sp.personBId);
    if (!pA || !pB) continue;

    const pairKey = [pA.id, pB.id].sort().join(':');
    if (handledCouplePairs.has(pairKey)) continue;
    handledCouplePairs.add(pairKey);

    const husb = pA.gender === 'female' ? pB : pA;
    const wife = pA.gender === 'female' ? pA : pB;

    const famXref = `@F${famIdx++}@`;

    const childrenOfA = new Set(
      parentChildRelationships.filter((r) => r.personAId === pA.id).map((r) => r.personBId)
    );
    const childrenOfB = new Set(
      parentChildRelationships.filter((r) => r.personAId === pB.id).map((r) => r.personBId)
    );

    const sharedChildren = new Set<string>();
    for (const cId of Array.from(childrenOfA)) {
      if (childrenOfB.has(cId)) {
        sharedChildren.add(cId);
        emittedParentChildPairs.add(`${pA.id}->${cId}`);
        emittedParentChildPairs.add(`${pB.id}->${cId}`);
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

  // 3B. Unmarried co-parents who share a child (without an explicit spouse edge)
  const parentsByChild = new Map<string, string[]>();
  for (const r of parentChildRelationships) {
    const key = `${r.personAId}->${r.personBId}`;
    if (emittedParentChildPairs.has(key)) continue;
    if (!personToXref.has(r.personAId) || !personToXref.has(r.personBId)) continue;
    const list = parentsByChild.get(r.personBId) || [];
    if (!list.includes(r.personAId)) list.push(r.personAId);
    parentsByChild.set(r.personBId, list);
  }

  const coParentFamilies = new Map<string, { p1: string; p2: string; children: Set<string> }>();
  for (const [childId, parentIds] of Array.from(parentsByChild.entries())) {
    if (parentIds.length >= 2) {
      const [p1, p2] = [parentIds[0], parentIds[1]];
      const pairKey = [p1, p2].sort().join(':');
      if (!coParentFamilies.has(pairKey)) {
        coParentFamilies.set(pairKey, { p1, p2, children: new Set() });
      }
      coParentFamilies.get(pairKey)!.children.add(childId);
      emittedParentChildPairs.add(`${p1}->${childId}`);
      emittedParentChildPairs.add(`${p2}->${childId}`);
    }
  }

  for (const coFam of Array.from(coParentFamilies.values())) {
    const pA = treeData.people.find((p) => p.id === coFam.p1);
    const pB = treeData.people.find((p) => p.id === coFam.p2);
    if (!pA || !pB) continue;
    const husb = pA.gender === 'female' ? pB : pA;
    const wife = pA.gender === 'female' ? pA : pB;
    families.push({
      xref: `@F${famIdx++}@`,
      husb: husb.id,
      wife: wife.id,
      children: coFam.children,
      unmarried: true,
    });
  }

  // 3C. Single-parent families (any remaining parent_child edges not yet emitted)
  const singleParentChildren = new Map<string, Set<string>>();
  for (const r of parentChildRelationships) {
    const key = `${r.personAId}->${r.personBId}`;
    if (emittedParentChildPairs.has(key)) continue;
    if (!personToXref.has(r.personAId) || !personToXref.has(r.personBId)) continue;
    if (!singleParentChildren.has(r.personAId)) {
      singleParentChildren.set(r.personAId, new Set());
    }
    singleParentChildren.get(r.personAId)!.add(r.personBId);
    emittedParentChildPairs.add(key);
  }

  for (const [parentId, childrenSet] of Array.from(singleParentChildren.entries())) {
    const parent = treeData.people.find((p) => p.id === parentId);
    if (!parent) continue;
    const isFemale = parent.gender === 'female';
    families.push({
      xref: `@F${famIdx++}@`,
      husb: isFemale ? undefined : parent.id,
      wife: isFemale ? parent.id : undefined,
      children: childrenSet,
    });
  }

  // 3D. Standalone sibling groups (siblings that do not share any parent in parentChildRelationships)
  const allParentsByChild = new Map<string, Set<string>>();
  for (const r of parentChildRelationships) {
    if (!allParentsByChild.has(r.personBId)) {
      allParentsByChild.set(r.personBId, new Set());
    }
    allParentsByChild.get(r.personBId)!.add(r.personAId);
  }

  const shareParent = (aId: string, bId: string): boolean => {
    const pA = allParentsByChild.get(aId);
    const pB = allParentsByChild.get(bId);
    if (!pA || !pB) return false;
    for (const p of Array.from(pA)) {
      if (pB.has(p)) return true;
    }
    return false;
  };

  const standaloneSibAdj = new Map<string, Set<string>>();
  for (const sRel of siblingRelationships) {
    const a = sRel.personAId;
    const b = sRel.personBId;
    if (!personToXref.has(a) || !personToXref.has(b)) continue;
    if (shareParent(a, b)) continue;
    if (!standaloneSibAdj.has(a)) standaloneSibAdj.set(a, new Set());
    if (!standaloneSibAdj.has(b)) standaloneSibAdj.set(b, new Set());
    standaloneSibAdj.get(a)!.add(b);
    standaloneSibAdj.get(b)!.add(a);
  }

  const visitedSibs = new Set<string>();
  for (const sibId of Array.from(standaloneSibAdj.keys())) {
    if (visitedSibs.has(sibId)) continue;
    const group = new Set<string>();
    const queue = [sibId];
    visitedSibs.add(sibId);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      group.add(curr);
      for (const next of Array.from(standaloneSibAdj.get(curr) || [])) {
        if (!visitedSibs.has(next)) {
          visitedSibs.add(next);
          queue.push(next);
        }
      }
    }
    if (group.size >= 2) {
      families.push({
        xref: `@F${famIdx++}@`,
        children: group,
      });
    }
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
    if (fam.unmarried) {
      lines.push('1 _UNMARRIED Y');
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
