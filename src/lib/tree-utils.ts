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
