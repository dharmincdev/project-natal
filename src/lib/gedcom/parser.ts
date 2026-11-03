import { v4 as uuidv4 } from 'uuid';
import { Person, Relationship, FamilyTree, TreeData, Gender, Milestone } from '../../types/tree';

export interface GedcomParseResult {
  treeData: TreeData;
  stats: {
    individualCount: number;
    familyCount: number;
    relationshipCount: number;
    gedcomVersion?: string;
    warnings: string[];
  };
}

interface GedcomLine {
  level: number;
  xref?: string;
  tag: string;
  value?: string;
}

const MONTHS_MAP: Record<string, string> = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
};

/**
 * Parses raw GEDCOM text (supporting 5.5.1 and 7.0 standards) into individual line tokens.
 */
function parseGedcomLines(text: string): GedcomLine[] {
  // Remove byte order mark (BOM) if present
  const cleanedText = text.replace(/^\uFEFF/, '');
  const rawLines = cleanedText.split(/\r?\n/);
  const result: GedcomLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i].trim();
    if (!raw) continue;

    // Standard GEDCOM line format: LEVEL [XREF] TAG [VALUE]
    // Example 1: 0 @I1@ INDI
    // Example 2: 1 NAME John /Doe/
    // Example 3: 2 DATE 12 MAY 1980
    const match = raw.match(/^(\d+)\s+(@[^@]+@\s+)?([A-Za-z0-9_]+)(?:\s+(.*))?$/);
    if (!match) continue;

    const level = parseInt(match[1], 10);
    const xref = match[2] ? match[2].trim() : undefined;
    const tag = match[3].toUpperCase();
    const value = match[4] ? match[4].trim() : undefined;

    result.push({ level, xref, tag, value });
  }

  return result;
}

/**
 * Normalizes genealogical date representations (e.g., "12 MAY 1980", "ABT 1950", "BET 1910 AND 1915")
 * into a clean ISO YYYY-MM-DD or readable date string.
 */
function cleanGedcomDate(rawDate?: string): string | null {
  if (!rawDate) return null;
  let d = rawDate.trim();
  // Strip standard genealogical modifiers
  d = d.replace(/^(ABT|CAL|EST|AFT|BEF|FROM|TO|BET)\s+/i, '');
  d = d.split(/\s+AND\s+/i)[0].trim();
  if (!d) return null;

  // Convert exact "DD MMM YYYY" (e.g. "12 MAY 1945") into ISO "1945-05-12"
  const dmyMatch = d.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const mon = MONTHS_MAP[dmyMatch[2].toUpperCase()];
    const yr = dmyMatch[3];
    if (mon) {
      return `${yr}-${mon}-${day}`;
    }
  }

  return d;
}

/**
 * Extracts first name, last name, and optional maiden name from standard GEDCOM "FirstName /LastName/" format.
 */
function parseGedcomName(nameVal?: string): { firstName: string; lastName: string; maidenName?: string } {
  if (!nameVal) {
    return { firstName: 'Unknown', lastName: '' };
  }

  const slashMatch = nameVal.match(/^(.*?)\s*\/([^/]*)\/(.*)$/);
  if (slashMatch) {
    const firstName = slashMatch[1].trim() || 'Unknown';
    const lastName = slashMatch[2].trim();
    return { firstName, lastName };
  }

  const parts = nameVal.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

/**
 * Main parser: takes GEDCOM string and returns a valid TreeData structure.
 */
export function parseGedcom(gedcomText: string, options?: { treeName?: string; ownerId?: string }): GedcomParseResult {
  const lines = parseGedcomLines(gedcomText);
  const warnings: string[] = [];

  const now = new Date().toISOString();
  const treeId = `tree-${uuidv4().slice(0, 8)}`;
  let treeName = options?.treeName || 'Imported GEDCOM Tree';
  let gedcomVersion = '7.0';

  // State trackers
  const indiMap = new Map<string, {
    xref: string;
    firstName: string;
    lastName: string;
    maidenName?: string;
    nickname?: string;
    gender?: Gender;
    birthDate?: string | null;
    deathDate?: string | null;
    birthPlace?: string | null;
    bio?: string | null;
    customFields: Record<string, string>;
    milestones: Milestone[];
  }>();

  const famMap = new Map<string, {
    xref: string;
    husb?: string;
    wife?: string;
    parents: string[];
    children: string[];
    unmarried?: boolean;
    marriageDate?: string | null;
    marriagePlace?: string | null;
  }>();

  let currentIndi: ReturnType<typeof indiMap.get> | null = null;
  let currentFam: ReturnType<typeof famMap.get> | null = null;
  let currentContext: 'INDI' | 'FAM' | 'HEAD' | null = null;
  let subContext: 'BIRT' | 'DEAT' | 'MARR' | 'NAME' | 'NOTE' | 'GEDC' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.level === 0) {
      currentIndi = null;
      currentFam = null;
      subContext = null;

      const isIndi = line.tag === 'INDI' || line.value === 'INDI';
      const isFam = line.tag === 'FAM' || line.value === 'FAM';

      if (line.tag === 'HEAD') {
        currentContext = 'HEAD';
      } else if (isIndi && (line.xref || line.value)) {
        const xref = line.xref || (line.tag === 'INDI' ? line.value! : `@I${indiMap.size + 1}@`);
        currentContext = 'INDI';
        currentIndi = {
          xref,
          firstName: 'Unknown',
          lastName: '',
          customFields: {},
          milestones: [],
        };
        indiMap.set(xref, currentIndi);
      } else if (isFam && (line.xref || line.value)) {
        const xref = line.xref || (line.tag === 'FAM' ? line.value! : `@F${famMap.size + 1}@`);
        currentContext = 'FAM';
        currentFam = {
          xref,
          parents: [],
          children: [],
        };
        famMap.set(xref, currentFam);
      } else {
        currentContext = null;
      }
      continue;
    }

    // Inside HEAD
    if (currentContext === 'HEAD') {
      if (line.level === 1) {
        subContext = line.tag === 'GEDC' ? 'GEDC' : null;
        if (line.tag === 'NOTE' && line.value && !options?.treeName) {
          const exportedMatch = line.value.match(/^(.*?)\s+exported from Project Natal$/i);
          if (exportedMatch && exportedMatch[1].trim()) {
            treeName = exportedMatch[1].trim();
          }
        } else if ((line.tag === 'TITL' || line.tag === 'FILE') && line.value && !options?.treeName) {
          if (treeName === 'Imported GEDCOM Tree') {
            treeName = line.value.replace(/\.ged$/i, '').trim();
          }
        }
      } else if (line.level === 2 && subContext === 'GEDC' && line.tag === 'VERS' && line.value) {
        gedcomVersion = line.value.trim();
      }
      continue;
    }

    // Inside Individual Record (INDI)
    if (currentContext === 'INDI' && currentIndi) {
      if (line.level === 1) {
        subContext = null;
        if (line.tag === 'NAME') {
          const { firstName, lastName, maidenName } = parseGedcomName(line.value);
          currentIndi.firstName = firstName;
          currentIndi.lastName = lastName;
          if (maidenName) currentIndi.maidenName = maidenName;
          subContext = 'NAME';
        } else if (line.tag === 'NICK' && line.value) {
          currentIndi.nickname = line.value;
        } else if (line.tag === 'SEX') {
          const s = line.value?.toUpperCase();
          if (s === 'M') currentIndi.gender = 'male';
          else if (s === 'F') currentIndi.gender = 'female';
          else currentIndi.gender = 'other';
        } else if (line.tag === 'BIRT') {
          subContext = 'BIRT';
        } else if (line.tag === 'DEAT') {
          subContext = 'DEAT';
          if (line.value?.toUpperCase() === 'Y' && !currentIndi.deathDate) {
            currentIndi.deathDate = 'Unknown';
          }
        } else if (line.tag === 'OCCU' && line.value) {
          currentIndi.customFields.occupation = line.value;
        } else if (line.tag === 'NOTE') {
          subContext = 'NOTE';
          if (line.value) {
            currentIndi.bio = (currentIndi.bio ? currentIndi.bio + '\n' : '') + line.value;
          }
        }
      } else if (line.level === 2) {
        if (subContext === 'NAME') {
          if (line.tag === 'GIVN' && line.value) {
            currentIndi.firstName = line.value;
          } else if (line.tag === 'SURN' && line.value) {
            currentIndi.lastName = line.value;
          } else if ((line.tag === '_MARNM' || line.tag === '_MAIDEN') && line.value) {
            currentIndi.maidenName = line.value;
          } else if (line.tag === 'NICK' && line.value) {
            currentIndi.nickname = line.value;
          }
        } else if (subContext === 'BIRT') {
          if (line.tag === 'DATE') {
            currentIndi.birthDate = cleanGedcomDate(line.value);
          } else if (line.tag === 'PLAC') {
            currentIndi.birthPlace = line.value || null;
          }
        } else if (subContext === 'DEAT') {
          if (line.tag === 'DATE') {
            currentIndi.deathDate = cleanGedcomDate(line.value);
          }
        } else if (subContext === 'NOTE') {
          if (line.tag === 'CONT') {
            currentIndi.bio = (currentIndi.bio || '') + '\n' + (line.value || '');
          } else if (line.tag === 'CONC') {
            currentIndi.bio = (currentIndi.bio || '') + (line.value || '');
          }
        }
      }
      continue;
    }

    // Inside Family Record (FAM)
    if (currentContext === 'FAM' && currentFam) {
      if (line.level === 1) {
        subContext = null;
        if (line.tag === 'HUSB' && line.value) {
          if (!currentFam.husb) currentFam.husb = line.value;
          if (!currentFam.parents.includes(line.value)) {
            currentFam.parents.push(line.value);
          }
        } else if (line.tag === 'WIFE' && line.value) {
          if (!currentFam.wife) currentFam.wife = line.value;
          if (!currentFam.parents.includes(line.value)) {
            currentFam.parents.push(line.value);
          }
        } else if (line.tag === 'CHIL' && line.value) {
          if (!currentFam.children.includes(line.value)) {
            currentFam.children.push(line.value);
          }
        } else if (line.tag === 'MARR') {
          subContext = 'MARR';
        } else if (line.tag === '_UNMARRIED' && line.value?.toUpperCase() === 'Y') {
          currentFam.unmarried = true;
        }
      } else if (line.level === 2 && subContext === 'MARR') {
        if (line.tag === 'DATE') {
          currentFam.marriageDate = cleanGedcomDate(line.value);
        } else if (line.tag === 'PLAC') {
          currentFam.marriagePlace = line.value || null;
        }
      }
      continue;
    }
  }

  // Map GEDCOM XREFs to Project Natal UUIDs
  const xrefToNatalId = new Map<string, string>();
  const people: Person[] = [];

  // Convert Individuals
  let idx = 0;
  for (const [xref, indi] of Array.from(indiMap.entries())) {
    const personId = `p-${idx + 1}-${uuidv4().slice(0, 6)}`;
    xrefToNatalId.set(xref, personId);
    idx++;

    const personMilestones: Milestone[] = [];
    if (indi.birthDate) {
      personMilestones.push({
        id: uuidv4(),
        type: 'birth',
        date: indi.birthDate,
        description: `Born${indi.birthPlace ? ' in ' + indi.birthPlace : ''}`,
        location: indi.birthPlace || undefined,
        submittedBy: 'self',
      });
    }

    if (indi.deathDate) {
      personMilestones.push({
        id: uuidv4(),
        type: 'memorial',
        date: indi.deathDate,
        description: 'Passed away',
        submittedBy: 'self',
      });
    }

    people.push({
      id: personId,
      treeId,
      firstName: indi.firstName,
      lastName: indi.lastName,
      maidenName: indi.maidenName || null,
      nickname: indi.nickname || null,
      gender: indi.gender || null,
      birthDate: indi.birthDate || null,
      deathDate: indi.deathDate || null,
      birthPlace: indi.birthPlace || null,
      photoUrl: null,
      bio: indi.bio || null,
      customFields: indi.customFields,
      milestones: personMilestones,
      positionX: 0,
      positionY: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Convert Family Relationships
  const relationships: Relationship[] = [];
  const processedSpousePairs = new Set<string>();
  const processedParentChildPairs = new Set<string>();
  const processedSiblingPairs = new Set<string>();

  for (const fam of Array.from(famMap.values())) {
    const parentIds = fam.parents
      .map((xref) => xrefToNatalId.get(xref))
      .filter((id): id is string => Boolean(id));

    // 1. Spouse connection (when two parents form a married couple in this FAM)
    if (parentIds.length >= 2 && !fam.unmarried) {
      const p1Id = parentIds[0];
      const p2Id = parentIds[1];
      const pairKey = [p1Id, p2Id].sort().join(':');
      if (!processedSpousePairs.has(pairKey)) {
        processedSpousePairs.add(pairKey);
        relationships.push({
          id: uuidv4(),
          treeId,
          personAId: p1Id,
          personBId: p2Id,
          type: 'spouse',
          subtype: 'biological',
          startDate: fam.marriageDate || null,
          endDate: null,
          createdAt: now,
        });

        // Add marriage milestone to spouses if present
        if (fam.marriageDate) {
          const mMilestone: Milestone = {
            id: uuidv4(),
            type: 'marriage',
            date: fam.marriageDate,
            description: `Married${fam.marriagePlace ? ' in ' + fam.marriagePlace : ''}`,
            location: fam.marriagePlace || undefined,
            submittedBy: 'self',
          };
          const p1 = people.find((p) => p.id === p1Id);
          const p2 = people.find((p) => p.id === p2Id);
          if (p1) p1.milestones.push(mMilestone);
          if (p2) p2.milestones.push({ ...mMilestone, id: uuidv4() });
        }
      }
    }

    // 2. Parent-child connections (supports married couples, co-parents, and single parents)
    const childIds = fam.children
      .map((xref) => xrefToNatalId.get(xref))
      .filter((id): id is string => Boolean(id));

    for (const childId of childIds) {
      for (const parentId of parentIds) {
        if (parentId === childId) continue;
        const pcKey = `${parentId}->${childId}`;
        if (!processedParentChildPairs.has(pcKey)) {
          processedParentChildPairs.add(pcKey);
          relationships.push({
            id: uuidv4(),
            treeId,
            personAId: parentId,
            personBId: childId,
            type: 'parent_child',
            subtype: 'biological',
            startDate: null,
            endDate: null,
            createdAt: now,
          });
        }
      }
    }

    // 3. Standalone sibling connections (when a FAM groups siblings without parent records)
    if (parentIds.length === 0 && childIds.length >= 2) {
      for (let i = 0; i < childIds.length; i++) {
        for (let j = i + 1; j < childIds.length; j++) {
          const sibA = childIds[i];
          const sibB = childIds[j];
          if (sibA === sibB) continue;
          const sibKey = [sibA, sibB].sort().join(':');
          if (!processedSiblingPairs.has(sibKey)) {
            processedSiblingPairs.add(sibKey);
            relationships.push({
              id: uuidv4(),
              treeId,
              personAId: sibA,
              personBId: sibB,
              type: 'sibling',
              subtype: 'biological',
              startDate: null,
              endDate: null,
              createdAt: now,
            });
          }
        }
      }
    }
  }

  // Create tree entity
  const slug = treeName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `tree-${Date.now()}`;

  const familyTree: FamilyTree = {
    id: treeId,
    ownerId: options?.ownerId || 'imported-user',
    name: treeName,
    slug: `${slug}-${Date.now().toString().slice(-4)}`,
    description: `Imported from GEDCOM file with ${people.length} individuals and ${relationships.length} connections.`,
    settings: {
      isPublic: true,
      allowClaiming: false,
      theme: 'default',
    },
    createdAt: now,
    updatedAt: now,
  };

  return {
    treeData: {
      tree: familyTree,
      people,
      relationships,
    },
    stats: {
      individualCount: people.length,
      familyCount: famMap.size,
      relationshipCount: relationships.length,
      gedcomVersion,
      warnings,
    },
  };
}
