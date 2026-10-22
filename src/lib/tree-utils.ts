import { Person, Relationship, TreeData } from '@/types/tree';
import { differenceInYears, parseISO, isValid } from 'date-fns';

export function getPersonFullName(person: Person): string {
  if (person.lastName) {
    return `${person.firstName} ${person.lastName}`.trim();
  }
  return person.firstName.trim();
}

export function getPersonDisplayName(person: Person): string {
  if (person.nickname) {
    if (person.lastName) {
      return `${person.firstName} "${person.nickname}" ${person.lastName}`.trim();
    }
    return `${person.firstName} "${person.nickname}"`.trim();
  }
  return getPersonFullName(person);
}

export function getChildren(personId: string, people: Person[], relationships: Relationship[]): Person[] {
  const childRelationships = relationships.filter(
    (rel) => rel.type === 'parent_child' && rel.personAId === personId
  );
  const childIds = childRelationships.map((rel) => rel.personBId);
  return people.filter((p) => childIds.includes(p.id));
}

export function getParents(personId: string, people: Person[], relationships: Relationship[]): Person[] {
  const parentRelationships = relationships.filter(
    (rel) => rel.type === 'parent_child' && rel.personBId === personId
  );
  const parentIds = parentRelationships.map((rel) => rel.personAId);
  return people.filter((p) => parentIds.includes(p.id));
}

export function getSpouses(personId: string, people: Person[], relationships: Relationship[]): Person[] {
  const spouseRelationships = relationships.filter(
    (rel) => rel.type === 'spouse' && (rel.personAId === personId || rel.personBId === personId)
  );
  
  const spouseIds = spouseRelationships.map((rel) => 
    rel.personAId === personId ? rel.personBId : rel.personAId
  );
  return people.filter((p) => spouseIds.includes(p.id));
}

export function getSiblings(personId: string, people: Person[], relationships: Relationship[]): Person[] {
  const parents = getParents(personId, people, relationships);
  if (parents.length === 0) return [];
  
  // Get all children of all parents
  const siblingIds = new Set<string>();
  
  parents.forEach(parent => {
    const children = getChildren(parent.id, people, relationships);
    children.forEach(child => {
      if (child.id !== personId) {
        siblingIds.add(child.id);
      }
    });
  });
  
  // Also add relationships explicitly marked as siblings
  const siblingRels = relationships.filter(
    (rel) => rel.type === 'sibling' && (rel.personAId === personId || rel.personBId === personId)
  );
  
  siblingRels.forEach(rel => {
    siblingIds.add(rel.personAId === personId ? rel.personBId : rel.personAId);
  });
  
  return people.filter((p) => siblingIds.has(p.id));
}

export function isDeceased(person: Person): boolean {
  return person.deathDate !== null && person.deathDate !== '';
}

export function getAge(person: Person): number | null {
  if (!person.birthDate) return null;
  
  const birthDate = parseISO(person.birthDate);
  if (!isValid(birthDate)) return null;
  
  if (isDeceased(person) && person.deathDate) {
    const deathDate = parseISO(person.deathDate);
    if (!isValid(deathDate)) return null;
    return differenceInYears(deathDate, birthDate);
  }
  
  return differenceInYears(new Date(), birthDate);
}

export function serializeTreeForAI(treeData: TreeData): string {
  const { tree, people, relationships } = treeData;
  
  let output = `Family Tree: ${tree.name}\n`;
  if (tree.description) {
    output += `Description: ${tree.description}\n`;
  }
  output += `\n=== PEOPLE ===\n\n`;
  
  people.forEach(person => {
    output += `[ID: ${person.id}] ${getPersonDisplayName(person)}\n`;
    
    if (person.birthDate) {
      output += `- Born: ${person.birthDate}`;
      if (person.birthPlace) {
        output += ` in ${person.birthPlace}`;
      }
      output += '\n';
    }
    
    if (person.maidenName) {
      output += `- Maiden Name: ${person.maidenName}\n`;
    }
    
    if (person.gender) {
      output += `- Gender: ${person.gender}\n`;
    }
    
    if (person.deathDate) {
      output += `- Died: ${person.deathDate}\n`;
    }
    
    const age = getAge(person);
    if (age !== null) {
      output += `- Age: ${age}${isDeceased(person) ? ' (at death)' : ''}\n`;
    }
    
    if (person.bio) {
      output += `- Bio: ${person.bio}\n`;
    }
    
    if (Object.keys(person.customFields).length > 0) {
      output += `- Attributes:\n`;
      for (const [key, value] of Object.entries(person.customFields)) {
        output += `  * ${key}: ${value}\n`;
      }
    }
    
    if (person.milestones && person.milestones.length > 0) {
      output += `- Milestones:\n`;
      person.milestones.forEach(m => {
        output += `  * ${m.date}: [${m.type}] ${m.description}\n`;
      });
    }
    
    output += '\n';
  });
  
  output += `=== RELATIONSHIPS ===\n\n`;
  
  relationships.forEach(rel => {
    const personA = people.find(p => p.id === rel.personAId);
    const personB = people.find(p => p.id === rel.personBId);
    
    if (!personA || !personB) return;
    
    const nameA = getPersonFullName(personA);
    const nameB = getPersonFullName(personB);
    
    switch (rel.type) {
      case 'parent_child':
        output += `- ${nameA} is the parent of ${nameB} (${rel.subtype})\n`;
        break;
      case 'spouse':
        output += `- ${nameA} and ${nameB} are spouses\n`;
        break;
      case 'sibling':
        output += `- ${nameA} and ${nameB} are siblings (${rel.subtype})\n`;
        break;
    }
  });
  
  return output;
}

// ============================================================================
// DAG CYCLE DETECTION & GRAPH INVARIANTS (SPEC.md §4.1)
// ============================================================================

export type CycleCheckResult =
  | { isValid: true }
  | { isValid: false; error: string; code: 'CYCLE_DETECTED' | 'INVALID_RELATIONSHIP' };

/**
 * Checks if candidateDescendantId is reachable from ancestorId by following parent_child edges.
 * Traversal direction: Parent -> Child.
 */
export function isDescendantOf(
  candidateDescendantId: string,
  ancestorId: string,
  relationships: Relationship[],
  visited: Set<string> = new Set()
): boolean {
  if (!candidateDescendantId || !ancestorId) return false;
  if (candidateDescendantId === ancestorId) return true;
  if (visited.has(ancestorId)) return false;
  visited.add(ancestorId);

  const directChildRels = relationships.filter(
    (r) => r.type === 'parent_child' && r.personAId === ancestorId
  );

  for (const rel of directChildRels) {
    if (rel.personBId === candidateDescendantId) return true;
    if (isDescendantOf(candidateDescendantId, rel.personBId, relationships, visited)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a relationship before adding to prevent self-edges, cycles, and duplicates.
 * SPEC.md §4.1: "The 'I'm My Own Grandpa' Paradox Prevention: An individual cannot be their own ancestor."
 */
export function validateRelationship(
  rel: {
    personAId: string;
    personBId: string;
    type: 'parent_child' | 'spouse' | 'sibling';
    subtype?: 'biological' | 'step' | 'adoptive' | 'half';
  },
  existingRelationships: Relationship[]
): CycleCheckResult {
  if (!rel.personAId || !rel.personBId) {
    return {
      isValid: false,
      error: 'Both family members must be selected.',
      code: 'INVALID_RELATIONSHIP',
    };
  }

  if (rel.personAId === rel.personBId) {
    return {
      isValid: false,
      error: 'CYCLE_DETECTED: Person cannot be ancestor or relative of themselves.',
      code: 'CYCLE_DETECTED',
    };
  }

  // Parent-child directed cycle check
  if (rel.type === 'parent_child') {
    // personAId is parent, personBId is child.
    // If personAId is already a descendant of personBId, adding this edge creates a cycle.
    if (isDescendantOf(rel.personAId, rel.personBId, existingRelationships)) {
      return {
        isValid: false,
        error: 'CYCLE_DETECTED: Person cannot be an ancestor of themselves.',
        code: 'CYCLE_DETECTED',
      };
    }
  }

  // Duplicate relationship check
  const isDuplicate = existingRelationships.some((r) => {
    if (r.type !== rel.type) return false;
    if (rel.type === 'parent_child') {
      return r.personAId === rel.personAId && r.personBId === rel.personBId;
    }
    // Symmetrical relationships (spouse, sibling)
    return (
      (r.personAId === rel.personAId && r.personBId === rel.personBId) ||
      (r.personAId === rel.personBId && r.personBId === rel.personAId)
    );
  });

  if (isDuplicate) {
    return {
      isValid: false,
      error: 'This relationship already exists between these individuals.',
      code: 'INVALID_RELATIONSHIP',
    };
  }

  return { isValid: true };
}

// ============================================================================
// DYNAMIC KINSHIP COMPUTING ENGINE (SPEC.md §4.3)
// ============================================================================

export type KinshipResult = {
  relationship: string;
  degree?: string;
  generationalOffset: number; // e.g. +1: A is 1 gen older than B; -1: A is 1 gen younger
  isDirectAncestor: boolean;
  isDirectDescendant: boolean;
  commonAncestorIds: string[];
  description: string;
};

/**
 * Computes all ancestors of a person along with their minimum depth (generations up).
 * depth 0 = person, depth 1 = parents, depth 2 = grandparents, etc.
 */
export function getAncestorDepths(
  personId: string,
  relationships: Relationship[]
): Map<string, number> {
  const depths = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = [{ id: personId, depth: 0 }];
  depths.set(personId, 0);

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const parentRels = relationships.filter(
      (r) => r.type === 'parent_child' && r.personBId === id
    );

    for (const rel of parentRels) {
      const parentId = rel.personAId;
      const nextDepth = depth + 1;
      if (!depths.has(parentId) || depths.get(parentId)! > nextDepth) {
        depths.set(parentId, nextDepth);
        queue.push({ id: parentId, depth: nextDepth });
      }
    }
  }

  return depths;
}

function getPrefix(count: number, base: string): string {
  if (count <= 0) return base;
  if (count === 1) return `Great-${base}`;
  return `${'Great-'.repeat(count)}${base}`;
}

function getCousinDegreeName(degree: number): string {
  switch (degree) {
    case 1:
      return 'First Cousin';
    case 2:
      return 'Second Cousin';
    case 3:
      return 'Third Cousin';
    case 4:
      return 'Fourth Cousin';
    default:
      return `${degree}th Cousin`;
  }
}

/**
 * Calculates exact consanguinity and affinity relationship describing Person A relative to Person B:
 * "Person A is the [Relationship] of Person B".
 */
export function calculateKinship(
  personAId: string,
  personBId: string,
  treeData: TreeData,
  visitedAffinity: boolean = false
): KinshipResult {
  const { people, relationships } = treeData;
  const personA = people.find((p) => p.id === personAId);
  const personB = people.find((p) => p.id === personBId);

  if (!personA || !personB) {
    return {
      relationship: 'Unknown',
      generationalOffset: 0,
      isDirectAncestor: false,
      isDirectDescendant: false,
      commonAncestorIds: [],
      description: 'One or both individuals not found in tree.',
    };
  }

  if (personAId === personBId) {
    return {
      relationship: 'Self',
      generationalOffset: 0,
      isDirectAncestor: false,
      isDirectDescendant: false,
      commonAncestorIds: [personAId],
      description: 'Same individual',
    };
  }

  const genderA = personA.gender;

  // 1. Direct Spouse
  const isSpouse = relationships.some(
    (r) =>
      r.type === 'spouse' &&
      ((r.personAId === personAId && r.personBId === personBId) ||
        (r.personAId === personBId && r.personBId === personAId))
  );

  if (isSpouse) {
    const relName = genderA === 'male' ? 'Husband' : genderA === 'female' ? 'Wife' : 'Spouse / Partner';
    return {
      relationship: relName,
      degree: 'Spouse',
      generationalOffset: 0,
      isDirectAncestor: false,
      isDirectDescendant: false,
      commonAncestorIds: [],
      description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
    };
  }

  // 2. Ancestor depth maps (Lowest Common Ancestor search)
  const ancestorsA = getAncestorDepths(personAId, relationships);
  const ancestorsB = getAncestorDepths(personBId, relationships);

  // Find shared ancestors
  const commonAncestors: Array<{ id: string; depthA: number; depthB: number; totalDepth: number }> = [];
  for (const [ancestorId, depthA] of ancestorsA.entries()) {
    if (ancestorsB.has(ancestorId)) {
      const depthB = ancestorsB.get(ancestorId)!;
      commonAncestors.push({ id: ancestorId, depthA, depthB, totalDepth: depthA + depthB });
    }
  }

  // Sort by smallest total generational path to identify LCA
  commonAncestors.sort((a, b) => a.totalDepth - b.totalDepth);

  if (commonAncestors.length > 0) {
    const lca = commonAncestors[0];
    const dA = lca.depthA;
    const dB = lca.depthB;
    const genOffset = dB - dA; // Positive if A is in an older generation than B

    const lcaIds = commonAncestors
      .filter((ca) => ca.totalDepth === lca.totalDepth)
      .map((ca) => ca.id);

    // Direct Parent / Child
    if (dA === 0 && dB === 1) {
      // A is parent of B
      const relName = genderA === 'male' ? 'Father' : genderA === 'female' ? 'Mother' : 'Parent';
      return {
        relationship: relName,
        degree: '1st Degree (Direct)',
        generationalOffset: 1,
        isDirectAncestor: true,
        isDirectDescendant: false,
        commonAncestorIds: lcaIds,
        description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
      };
    }

    if (dA === 1 && dB === 0) {
      // A is child of B
      const relName = genderA === 'male' ? 'Son' : genderA === 'female' ? 'Daughter' : 'Child';
      return {
        relationship: relName,
        degree: '1st Degree (Direct)',
        generationalOffset: -1,
        isDirectAncestor: false,
        isDirectDescendant: true,
        commonAncestorIds: lcaIds,
        description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
      };
    }

    // Direct Grandparent / Grandchild
    if (dA === 0 && dB >= 2) {
      // A is ancestor of B
      const greats = dB - 2;
      const base = genderA === 'male' ? 'Grandfather' : genderA === 'female' ? 'Grandmother' : 'Grandparent';
      const relName = getPrefix(greats, base);
      return {
        relationship: relName,
        degree: `${dB}th Degree Ancestor`,
        generationalOffset: dB,
        isDirectAncestor: true,
        isDirectDescendant: false,
        commonAncestorIds: lcaIds,
        description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
      };
    }

    if (dA >= 2 && dB === 0) {
      // A is descendant of B
      const greats = dA - 2;
      const base = genderA === 'male' ? 'Grandson' : genderA === 'female' ? 'Granddaughter' : 'Grandchild';
      const relName = getPrefix(greats, base);
      return {
        relationship: relName,
        degree: `${dA}th Degree Descendant`,
        generationalOffset: -dA,
        isDirectAncestor: false,
        isDirectDescendant: true,
        commonAncestorIds: lcaIds,
        description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
      };
    }

    // Siblings (dA === 1 && dB === 1)
    if (dA === 1 && dB === 1) {
      const parentsA = getParents(personAId, people, relationships).map((p) => p.id);
      const parentsB = getParents(personBId, people, relationships).map((p) => p.id);
      const sharedParents = parentsA.filter((id) => parentsB.includes(id));

      const isHalf = sharedParents.length === 1 && (parentsA.length > 1 || parentsB.length > 1);
      const base = genderA === 'male' ? 'Brother' : genderA === 'female' ? 'Sister' : 'Sibling';
      const relName = isHalf ? `Half-${base}` : base;

      return {
        relationship: relName,
        degree: isHalf ? 'Half-Sibling' : 'Full Sibling',
        generationalOffset: 0,
        isDirectAncestor: false,
        isDirectDescendant: false,
        commonAncestorIds: lcaIds,
        description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
      };
    }

    // Aunt / Uncle (dA === 1 && dB >= 2)
    if (dA === 1 && dB >= 2) {
      const greats = dB - 2;
      const base = genderA === 'male' ? 'Uncle' : genderA === 'female' ? 'Aunt' : 'Aunt / Uncle';
      const relName = getPrefix(greats, base);
      return {
        relationship: relName,
        degree: 'Aunt / Uncle',
        generationalOffset: dB - dA,
        isDirectAncestor: false,
        isDirectDescendant: false,
        commonAncestorIds: lcaIds,
        description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
      };
    }

    // Niece / Nephew (dA >= 2 && dB === 1)
    if (dA >= 2 && dB === 1) {
      const greats = dA - 2;
      const base = genderA === 'male' ? 'Nephew' : genderA === 'female' ? 'Niece' : 'Niece / Nephew';
      const relName = getPrefix(greats, base);
      return {
        relationship: relName,
        degree: 'Niece / Nephew',
        generationalOffset: dB - dA,
        isDirectAncestor: false,
        isDirectDescendant: false,
        commonAncestorIds: lcaIds,
        description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
      };
    }

    // Cousins (dA >= 2 && dB >= 2)
    if (dA >= 2 && dB >= 2) {
      const minDepth = Math.min(dA, dB);
      const cousinDegree = minDepth - 1;
      const degreeName = getCousinDegreeName(cousinDegree);
      const removedCount = Math.abs(dA - dB);

      let relName = degreeName;
      if (removedCount === 1) {
        relName += ' once removed';
      } else if (removedCount === 2) {
        relName += ' twice removed';
      } else if (removedCount > 2) {
        relName += ` ${removedCount} times removed`;
      }

      return {
        relationship: relName,
        degree: degreeName,
        generationalOffset: genOffset,
        isDirectAncestor: false,
        isDirectDescendant: false,
        commonAncestorIds: lcaIds,
        description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
      };
    }
  }

  // 3. Affinity / In-Laws
  if (!visitedAffinity) {
    const spousesB = getSpouses(personBId, people, relationships);
    for (const spouse of spousesB) {
      const kinToSpouse = calculateKinship(personAId, spouse.id, treeData, true);
      if (kinToSpouse.relationship === 'Father' || kinToSpouse.relationship === 'Mother') {
        const relName = genderA === 'male' ? 'Father-in-law' : genderA === 'female' ? 'Mother-in-law' : 'Parent-in-law';
        return {
          relationship: relName,
          generationalOffset: 1,
          isDirectAncestor: false,
          isDirectDescendant: false,
          commonAncestorIds: [],
          description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
        };
      }
      if (kinToSpouse.relationship === 'Brother' || kinToSpouse.relationship === 'Sister') {
        const relName = genderA === 'male' ? 'Brother-in-law' : genderA === 'female' ? 'Sister-in-law' : 'Sibling-in-law';
        return {
          relationship: relName,
          generationalOffset: 0,
          isDirectAncestor: false,
          isDirectDescendant: false,
          commonAncestorIds: [],
          description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
        };
      }
    }

    // Check if A is spouse of B's child (Son-in-law / Daughter-in-law)
    const spousesA = getSpouses(personAId, people, relationships);
    for (const spouse of spousesA) {
      const kinSpouseToB = calculateKinship(spouse.id, personBId, treeData, true);
      if (kinSpouseToB.relationship === 'Son' || kinSpouseToB.relationship === 'Daughter') {
        const relName = genderA === 'male' ? 'Son-in-law' : genderA === 'female' ? 'Daughter-in-law' : 'Child-in-law';
        return {
          relationship: relName,
          generationalOffset: -1,
          isDirectAncestor: false,
          isDirectDescendant: false,
          commonAncestorIds: [],
          description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
        };
      }
    }

    // Check if A is spouse of B's sibling
    const siblingsB = getSiblings(personBId, people, relationships);
    for (const sibling of siblingsB) {
      const isSpouseOfSibling = relationships.some(
        (r) =>
          r.type === 'spouse' &&
          ((r.personAId === personAId && r.personBId === sibling.id) ||
            (r.personAId === sibling.id && r.personBId === personAId))
      );
      if (isSpouseOfSibling) {
        const relName = genderA === 'male' ? 'Brother-in-law' : genderA === 'female' ? 'Sister-in-law' : 'Sibling-in-law';
        return {
          relationship: relName,
          generationalOffset: 0,
          isDirectAncestor: false,
          isDirectDescendant: false,
          commonAncestorIds: [],
          description: `${getPersonDisplayName(personA)} is the ${relName.toLowerCase()} of ${getPersonDisplayName(personB)}.`,
        };
      }
    }
  }

  return {
    relationship: 'Unrelated',
    generationalOffset: 0,
    isDirectAncestor: false,
    isDirectDescendant: false,
    commonAncestorIds: [],
    description: `No direct consanguineous or affinity connection detected between ${getPersonDisplayName(personA)} and ${getPersonDisplayName(personB)}.`,
  };
}
