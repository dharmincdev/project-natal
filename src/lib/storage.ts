'use client';

import { v4 as uuidv4 } from 'uuid';
import { FamilyTree, Person, Relationship, TreeData } from '@/types/tree';
import { getInitialSmithTreeData } from '@/data/fixtures/smith-family';
import { getInitialRiveraChenTreeData } from '@/data/fixtures/rivera-chen';
import { getInitialHouseTargaryenTreeData } from '@/data/fixtures/house-targaryen';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { saveTreeDataToSupabase } from '@/lib/supabase/db';

const CUSTOM_TREES_KEY = 'project_natal_custom_trees_v1';
const TREE_DATA_PREFIX = 'project_natal_tree_data_v1_';

export type TreeSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  memberCount: number;
  connectionCount: number;
  updatedAt: string;
  isCustom: boolean;
  emoji: string;
  tag: string;
};

// Built-in fixture definitions
export const SAMPLE_TREES: {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  tag: string;
  getData: () => TreeData;
}[] = [
  {
    slug: 'smith-family',
    name: 'The Smith Family',
    description: '3 generations of grandparents, parents, and children.',
    emoji: '🌳',
    tag: 'Nuclear',
    getData: getInitialSmithTreeData,
  },
  {
    slug: 'rivera-chen',
    name: 'Rivera-Chen Family',
    description: '4 generations with step-parents, twins, and adoption.',
    emoji: '🌿',
    tag: 'Blended',
    getData: getInitialRiveraChenTreeData,
  },
  {
    slug: 'house-targaryen',
    name: 'House Targaryen',
    description: '7 generations from Aegon the Conqueror to Daenerys.',
    emoji: '🐉',
    tag: 'Royal Dynasty',
    getData: getInitialHouseTargaryenTreeData,
  },
];

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Retrieves all tree summaries (custom user trees + built-in sample trees).
 */
export function getAllTreeSummaries(): TreeSummary[] {
  const result: TreeSummary[] = [];

  // 1. Add user custom trees from localStorage
  if (isClient()) {
    try {
      const rawCustom = localStorage.getItem(CUSTOM_TREES_KEY);
      if (rawCustom) {
        const customTrees: FamilyTree[] = JSON.parse(rawCustom);
        for (const t of customTrees) {
          const treeData = getTreeData(t.id);
          result.push({
            id: t.id,
            slug: t.slug,
            name: t.name,
            description: t.description,
            memberCount: treeData ? treeData.people.length : 1,
            connectionCount: treeData ? treeData.relationships.length : 0,
            updatedAt: t.updatedAt,
            isCustom: true,
            emoji: '🏡',
            tag: 'My Tree',
          });
        }
      }
    } catch (e) {
      console.error('Error loading custom trees from localStorage:', e);
    }
  }

  // 2. Add built-in sample trees
  for (const sample of SAMPLE_TREES) {
    const data = getTreeData(sample.slug);
    result.push({
      id: data.tree.id,
      slug: sample.slug,
      name: sample.name,
      description: sample.description,
      memberCount: data.people.length,
      connectionCount: data.relationships.length,
      updatedAt: data.tree.updatedAt,
      isCustom: false,
      emoji: sample.emoji,
      tag: sample.tag,
    });
  }

  return result;
}

/**
 * Loads complete TreeData for a given tree slug or ID.
 * Checks localStorage first; falls back to factory fixtures if unmodified.
 */
export function getTreeData(slugOrId: string): TreeData {
  if (isClient()) {
    try {
      // Check localStorage for saved edits
      const stored = localStorage.getItem(`${TREE_DATA_PREFIX}${slugOrId}`);
      if (stored) {
        return JSON.parse(stored) as TreeData;
      }
    } catch (e) {
      console.error('Error reading tree from localStorage:', e);
    }
  }

  // Check if it's one of our built-in sample fixtures
  const sample = SAMPLE_TREES.find((s) => s.slug === slugOrId || s.getData().tree.id === slugOrId);
  if (sample) {
    return sample.getData();
  }

  // Default fallback to Smith Family
  return getInitialSmithTreeData();
}

/**
 * Saves tree data to localStorage.
 */
export function saveTreeData(treeData: TreeData): void {
  if (!isClient()) return;

  try {
    const updatedTreeData: TreeData = {
      ...treeData,
      tree: {
        ...treeData.tree,
        updatedAt: new Date().toISOString(),
      },
    };

    const serialized = JSON.stringify(updatedTreeData);
    // Store by both slug and ID for robust lookup
    localStorage.setItem(`${TREE_DATA_PREFIX}${treeData.tree.slug}`, serialized);
    localStorage.setItem(`${TREE_DATA_PREFIX}${treeData.tree.id}`, serialized);

    // If custom tree, ensure it's recorded in the custom trees index
    const isSample = SAMPLE_TREES.some((s) => s.slug === treeData.tree.slug);
    if (!isSample) {
      const rawCustom = localStorage.getItem(CUSTOM_TREES_KEY);
      let customTrees: FamilyTree[] = rawCustom ? JSON.parse(rawCustom) : [];
      const existingIdx = customTrees.findIndex((t) => t.id === treeData.tree.id || t.slug === treeData.tree.slug);

      if (existingIdx >= 0) {
        customTrees[existingIdx] = updatedTreeData.tree;
      } else {
        customTrees.unshift(updatedTreeData.tree);
      }

      localStorage.setItem(CUSTOM_TREES_KEY, JSON.stringify(customTrees));
    }

    // If authenticated with Supabase, sync changes directly to cloud PostgreSQL
    const client = getSupabaseBrowserClient();
    if (client) {
      client.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          saveTreeDataToSupabase(updatedTreeData, user.id).catch((err) => {
            console.error('Background cloud sync failed:', err);
          });
        }
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Error saving tree to localStorage:', e);
  }
}

/**
 * Creates a brand new custom user tree and persists it to storage.
 */
export function createNewUserTree(options: {
  name: string;
  description?: string;
  startingPersonFirstName: string;
  startingPersonLastName?: string;
  startingPersonBirthDate?: string;
  startingPersonBirthPlace?: string;
  startingPersonBio?: string;
  template?: 'blank' | 'nuclear' | 'blended';
}): TreeData {
  const treeId = `tree-${uuidv4().slice(0, 8)}`;
  let baseSlug = slugify(options.name) || 'my-family-tree';
  
  // Ensure slug uniqueness
  if (isClient()) {
    const existing = getAllTreeSummaries();
    if (existing.some((t) => t.slug === baseSlug)) {
      baseSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const now = new Date().toISOString();

  const tree: FamilyTree = {
    id: treeId,
    ownerId: 'current-user',
    name: options.name.trim(),
    slug: baseSlug,
    description: options.description?.trim() || null,
    settings: { isPublic: true, allowClaiming: false, theme: 'light' },
    createdAt: now,
    updatedAt: now,
  };

  let people: Person[] = [];
  let relationships: Relationship[] = [];

  if (options.template === 'nuclear') {
    // Clone Smith nuclear template with user's starting person as root
    const templateData = getInitialSmithTreeData();
    people = templateData.people.map((p, idx) => ({
      ...p,
      id: `p-${idx + 1}-${uuidv4().slice(0, 6)}`,
      treeId,
      createdAt: now,
      updatedAt: now,
    }));
    // Override the root patriarch with the user's starting person info
    if (people[0]) {
      people[0].firstName = options.startingPersonFirstName.trim();
      if (options.startingPersonLastName) people[0].lastName = options.startingPersonLastName.trim();
      if (options.startingPersonBirthDate) people[0].birthDate = options.startingPersonBirthDate;
      if (options.startingPersonBirthPlace) people[0].birthPlace = options.startingPersonBirthPlace;
      if (options.startingPersonBio) people[0].bio = options.startingPersonBio;
    }
    // Re-map relationship IDs
    const oldToNew = new Map<string, string>();
    templateData.people.forEach((p, idx) => oldToNew.set(p.id, people[idx].id));
    relationships = templateData.relationships.map((r, idx) => ({
      ...r,
      id: `rel-${idx + 1}-${uuidv4().slice(0, 6)}`,
      treeId,
      personAId: oldToNew.get(r.personAId) || r.personAId,
      personBId: oldToNew.get(r.personBId) || r.personBId,
      createdAt: now,
    }));
  } else {
    // Blank canvas starting with the user's primary person
    const rootPersonId = `person-${uuidv4().slice(0, 8)}`;
    const rootPerson: Person = {
      id: rootPersonId,
      treeId,
      firstName: options.startingPersonFirstName.trim(),
      lastName: options.startingPersonLastName?.trim() || '',
      nickname: null,
      birthDate: options.startingPersonBirthDate || null,
      deathDate: null,
      birthPlace: options.startingPersonBirthPlace?.trim() || null,
      photoUrl: null,
      bio: options.startingPersonBio?.trim() || null,
      customFields: {},
      milestones: [],
      positionX: 0,
      positionY: 0,
      createdAt: now,
      updatedAt: now,
    };

    people = [rootPerson];
    relationships = [];
  }

  const newTreeData: TreeData = { tree, people, relationships };
  saveTreeData(newTreeData);
  return newTreeData;
}

/**
 * Deletes a custom tree from localStorage.
 */
export function deleteStoredTree(treeId: string): void {
  if (!isClient()) return;

  try {
    const rawCustom = localStorage.getItem(CUSTOM_TREES_KEY);
    if (rawCustom) {
      const customTrees: FamilyTree[] = JSON.parse(rawCustom);
      const target = customTrees.find((t) => t.id === treeId);
      const filtered = customTrees.filter((t) => t.id !== treeId);
      localStorage.setItem(CUSTOM_TREES_KEY, JSON.stringify(filtered));

      if (target) {
        localStorage.removeItem(`${TREE_DATA_PREFIX}${target.slug}`);
        localStorage.removeItem(`${TREE_DATA_PREFIX}${target.id}`);
      }
    }
  } catch (e) {
    console.error('Error deleting tree from localStorage:', e);
  }
}

/**
 * Resets a sample tree to factory fixture data.
 */
export function resetStoredTree(slug: string): TreeData {
  if (isClient()) {
    try {
      localStorage.removeItem(`${TREE_DATA_PREFIX}${slug}`);
    } catch (e) {
      console.error('Error resetting tree:', e);
    }
  }
  return getTreeData(slug);
}

/**
 * Imports a parsed TreeData from GEDCOM into localStorage and returns the saved TreeData.
 */
export function importGedcomTree(importedData: TreeData): TreeData {
  if (!isClient()) return importedData;

  saveTreeData(importedData);
  return importedData;
}
