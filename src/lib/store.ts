import { v4 as uuidv4 } from 'uuid';
import { FamilyTree, Person, Relationship, TreeData } from '@/types/tree';

// In-memory store singletons
const trees = new Map<string, FamilyTree>();
const people = new Map<string, Person>();
const relationships = new Map<string, Relationship>();

export async function createTree(ownerId: string, name: string, slug: string, description?: string): Promise<FamilyTree> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const tree: FamilyTree = {
    id,
    ownerId,
    name,
    slug,
    description: description || null,
    settings: {
      isPublic: false,
      allowClaiming: false,
      theme: 'default'
    },
    createdAt: now,
    updatedAt: now
  };
  
  trees.set(id, tree);
  return tree;
}

export async function getTree(treeId: string): Promise<FamilyTree | null> {
  return trees.get(treeId) || null;
}

export async function getTreeBySlug(slug: string): Promise<FamilyTree | null> {
  for (const tree of trees.values()) {
    if (tree.slug === slug) {
      return tree;
    }
  }
  return null;
}

export async function getTreeDataBySlug(slug: string): Promise<TreeData | null> {
  const tree = await getTreeBySlug(slug);
  if (tree) {
    return getTreeData(tree.id);
  }
  if (slug === 'smith-family') {
    const { getInitialSmithTreeData } = await import('@/data/fixtures/smith-family');
    return getInitialSmithTreeData();
  }
  if (slug === 'rivera-chen') {
    const { getInitialRiveraChenTreeData } = await import('@/data/fixtures/rivera-chen');
    return getInitialRiveraChenTreeData();
  }
  if (slug === 'house-targaryen' || slug === 'targaryen') {
    const { getInitialHouseTargaryenTreeData } = await import('@/data/fixtures/house-targaryen');
    return getInitialHouseTargaryenTreeData();
  }
  return null;
}

export async function getTreeData(treeId: string): Promise<TreeData | null> {
  const tree = trees.get(treeId);
  if (!tree) return null;
  
  const treePeople = Array.from(people.values()).filter(p => p.treeId === treeId);
  const treeRelationships = Array.from(relationships.values()).filter(r => r.treeId === treeId);
  
  return {
    tree,
    people: treePeople,
    relationships: treeRelationships
  };
}

export async function updateTree(treeId: string, updates: Partial<FamilyTree>): Promise<FamilyTree> {
  const tree = trees.get(treeId);
  if (!tree) throw new Error('Tree not found');
  
  const updatedTree = {
    ...tree,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  trees.set(treeId, updatedTree);
  return updatedTree;
}

export async function deleteTree(treeId: string): Promise<void> {
  trees.delete(treeId);
  
  // Cascade delete
  for (const person of people.values()) {
    if (person.treeId === treeId) {
      people.delete(person.id);
    }
  }
  
  for (const rel of relationships.values()) {
    if (rel.treeId === treeId) {
      relationships.delete(rel.id);
    }
  }
}

export async function addPerson(treeId: string, personData: Omit<Person, 'id' | 'treeId' | 'createdAt' | 'updatedAt'>): Promise<Person> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const person: Person = {
    ...personData,
    id,
    treeId,
    createdAt: now,
    updatedAt: now
  };
  
  people.set(id, person);
  return person;
}

export async function updatePerson(personId: string, updates: Partial<Person>): Promise<Person> {
  const person = people.get(personId);
  if (!person) throw new Error('Person not found');
  
  const updatedPerson = {
    ...person,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  people.set(personId, updatedPerson);
  return updatedPerson;
}

export async function deletePerson(personId: string): Promise<void> {
  people.delete(personId);
  
  // Delete associated relationships
  for (const rel of relationships.values()) {
    if (rel.personAId === personId || rel.personBId === personId) {
      relationships.delete(rel.id);
    }
  }
}

export async function getPeople(treeId: string): Promise<Person[]> {
  return Array.from(people.values()).filter(p => p.treeId === treeId);
}

export async function addRelationship(treeId: string, relData: Omit<Relationship, 'id' | 'treeId' | 'createdAt'>): Promise<Relationship> {
  const id = uuidv4();
  
  const relationship: Relationship = {
    ...relData,
    id,
    treeId,
    createdAt: new Date().toISOString(),
  };
  
  relationships.set(id, relationship);
  return relationship;
}

export async function updateRelationship(relId: string, updates: Partial<Relationship>): Promise<Relationship> {
  const rel = relationships.get(relId);
  if (!rel) throw new Error('Relationship not found');
  
  const updatedRel = {
    ...rel,
    ...updates
  };
  
  relationships.set(relId, updatedRel);
  return updatedRel;
}

export async function deleteRelationship(relId: string): Promise<void> {
  relationships.delete(relId);
}

export async function getRelationships(treeId: string): Promise<Relationship[]> {
  return Array.from(relationships.values()).filter(r => r.treeId === treeId);
}

export async function getUserTrees(userId: string): Promise<FamilyTree[]> {
  return Array.from(trees.values()).filter(t => t.ownerId === userId);
}
