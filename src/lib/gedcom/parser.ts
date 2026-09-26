import { v4 as uuidv4 } from 'uuid';
import { Person, Relationship, FamilyTree, TreeData, Gender, Milestone } from '../../types/tree';

export interface GedcomParseResult {
  treeData: TreeData;
  stats: {
    individualCount: number;
    familyCount: number;
    relationshipCount: number;
    warnings: string[];
  };
}

interface GedcomLine {
  level: number;
  xref?: string;
  tag: string;
  value?: string;
}

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
 * into a clean ISO-like or readable string.
 */
function cleanGedcomDate(rawDate?: string): string | null {
  if (!rawDate) return null;
  let d = rawDate.trim();
  // Strip standard genealogical modifiers if simple year extract is preferred or format nicely
  d = d.replace(/^(ABT|CAL|EST|AFT|BEF|FROM|TO|BET)\s+/i, '');
  return d || null;
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

  // State trackers
  const indiMap = new Map<string, {
    xref: string;
    firstName: string;
    lastName: string;
    maidenName?: string;
    gender?: Gender;
    birthDate?: string | null;
    deathDate?: string | null;
    birthPlace?: string | null;
    bio?: string | null;
    milestones: Milestone[];
  }>();

  const famMap = new Map<string, {
    xref: string;
    husb?: string;
    wife?: string;
    children: string[];
    marriageDate?: string | null;
    marriagePlace?: string | null;
  }>();

  let currentIndi: ReturnType<typeof indiMap.get> | null = null;
  let currentFam: ReturnType<typeof famMap.get> | null = null;
  let currentContext: 'INDI' | 'FAM' | 'HEAD' | null = null;
  let subContext: 'BIRT' | 'DEAT' | 'MARR' | 'NAME' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.level === 0) {
      currentIndi = null;
      currentFam = null;
      subContext = null;

      if (line.tag === 'HEAD') {
        currentContext = 'HEAD';
      } else if (line.value === 'INDI' && line.xref) {
        currentContext = 'INDI';
        currentIndi = {
          xref: line.xref,
          firstName: 'Unknown',
          lastName: '',
          milestones: [],
        };
        indiMap.set(line.xref, currentIndi);
      } else if (line.value === 'FAM' && line.xref) {
        currentContext = 'FAM';
        currentFam = {
          xref: line.xref,
          children: [],
        };
        famMap.set(line.xref, currentFam);
      } else {
        currentContext = null;
      }
      continue;
    }

    // Inside HEAD
    if (currentContext === 'HEAD') {
      if (line.tag === 'NAME' || line.tag === 'TITL' || line.tag === 'FILE') {
        if (line.value && !options?.treeName) {
          treeName = line.value.replace(/\.ged$/i, '').trim();
        }
      }
      continue;
    }

    // Inside Individual Record (INDI)
    if (currentContext === 'INDI' && currentIndi) {
      if (line.level === 1) {
        subContext = null;
        if (line.tag === 'NAME') {
          const { firstName, lastName } = parseGedcomName(line.value);
          currentIndi.firstName = firstName;
          currentIndi.lastName = lastName;
          subContext = 'NAME';
        } else if (line.tag === 'SEX') {
          const s = line.value?.toUpperCase();
          if (s === 'M') currentIndi.gender = 'male';
          else if (s === 'F') currentIndi.gender = 'female';
          else currentIndi.gender = 'other';
        } else if (line.tag === 'BIRT') {
          subContext = 'BIRT';
        } else if (line.tag === 'DEAT') {
          subContext = 'DEAT';
        } else if (line.tag === 'NOTE') {
          currentIndi.bio = (currentIndi.bio ? currentIndi.bio + '\n' : '') + (line.value || '');
        }
      } else if (line.level === 2) {
        if (subContext === 'NAME' && line.tag === '_MARNM') {
          // Some software marks married name or maiden name
          currentIndi.maidenName = line.value;
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
        }
      }
      continue;
    }

    // Inside Family Record (FAM)
    if (currentContext === 'FAM' && currentFam) {
      if (line.level === 1) {
        subContext = null;
        if (line.tag === 'HUSB' && line.value) {
          currentFam.husb = line.value;
        } else if (line.tag === 'WIFE' && line.value) {
          currentFam.wife = line.value;
        } else if (line.tag === 'CHIL' && line.value) {
          currentFam.children.push(line.value);
        } else if (line.tag === 'MARR') {
          subContext = 'MARR';
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
      nickname: null,
      gender: indi.gender || null,
      birthDate: indi.birthDate || null,
      deathDate: indi.deathDate || null,
      birthPlace: indi.birthPlace || null,
      photoUrl: null,
      bio: indi.bio || null,
      customFields: {},
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

  for (const fam of Array.from(famMap.values())) {
    const husbId = fam.husb ? xrefToNatalId.get(fam.husb) : undefined;
    const wifeId = fam.wife ? xrefToNatalId.get(fam.wife) : undefined;

    // 1. Spouse connection
    if (husbId && wifeId) {
      const pairKey = [husbId, wifeId].sort().join(':');
      if (!processedSpousePairs.has(pairKey)) {
        processedSpousePairs.add(pairKey);
        relationships.push({
          id: uuidv4(),
          treeId,
          personAId: husbId,
          personBId: wifeId,
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
          const p1 = people.find((p) => p.id === husbId);
          const p2 = people.find((p) => p.id === wifeId);
          if (p1) p1.milestones.push(mMilestone);
          if (p2) p2.milestones.push(mMilestone);
        }
      }
    }

    // 2. Parent-child connections
    for (const childXref of fam.children) {
      const childId = xrefToNatalId.get(childXref);
      if (!childId) continue;

      if (husbId) {
        relationships.push({
          id: uuidv4(),
          treeId,
          personAId: husbId,
          personBId: childId,
          type: 'parent_child',
          subtype: 'biological',
          startDate: null,
          endDate: null,
          createdAt: now,
        });
      }

      if (wifeId) {
        relationships.push({
          id: uuidv4(),
          treeId,
          personAId: wifeId,
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
      warnings,
    },
  };
}
