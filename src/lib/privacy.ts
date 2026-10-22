import { Person, TreeData } from '@/types/tree';

/**
 * Genealogy privacy threshold per SPEC.md §6.1:
 * An individual is considered living if deathDate is null and estimated age is < 100 years.
 */
export const CENTENARIAN_AGE_THRESHOLD = 100;

/**
 * Checks whether an individual is deemed a living person under genealogical privacy rules.
 * @param person The individual record to evaluate.
 * @param referenceYear Optional reference year for deterministic testing (defaults to current year).
 */
export function isLivingPerson(
  person: Pick<Person, 'birthDate' | 'deathDate'>,
  referenceYear: number = new Date().getFullYear()
): boolean {
  // If a death date is explicitly recorded, they are deceased.
  if (person.deathDate) {
    return false;
  }

  // If birth date is known, check if age exceeds the 100-year threshold.
  if (person.birthDate) {
    const birthYearMatch = person.birthDate.match(/^(\d{4})/);
    if (birthYearMatch) {
      const birthYear = parseInt(birthYearMatch[1], 10);
      if (!isNaN(birthYear) && referenceYear - birthYear >= CENTENARIAN_AGE_THRESHOLD) {
        return false; // Deceased by centenarian rule
      }
    }
  }

  // Without a death date or evidence of centenarian status, assume living for privacy protection.
  return true;
}

/**
 * Redacts a living person according to SPEC.md §6.1:
 * - Name masked as "Living Relative"
 * - Birth date, birth place, maiden name, nickname, bio, custom fields, and photos hidden
 * - Milestones and attachments removed
 * - Structural layout attributes (id, treeId, positionX, positionY) preserved for graph continuity
 */
export function redactLivingPerson(person: Person): Person {
  if (!isLivingPerson(person)) {
    return person;
  }

  return {
    ...person,
    firstName: 'Living',
    lastName: 'Relative',
    maidenName: null,
    nickname: null,
    photoUrl: null,
    birthDate: null,
    birthPlace: null,
    deathDate: null,
    bio: null,
    customFields: {},
    milestones: [],
    attachments: [],
  };
}

/**
 * Redacts all living individuals in a tree dataset for public, unauthenticated viewing.
 * SPEC.md §6.1: Public routes (/t/[slug]) must never leak living persons' private identities.
 */
export function redactTreeForPublic(treeData: TreeData): TreeData {
  return {
    ...treeData,
    people: treeData.people.map(redactLivingPerson),
    relationships: [...treeData.relationships],
  };
}
