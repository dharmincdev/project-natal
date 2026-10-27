import { describe, it, expect } from 'vitest';
import { Person, Relationship, TreeData } from '@/types/tree';
import { layoutFamilyTree } from '@/lib/layout';
import { isDescendantOf, validateRelationship, calculateKinship } from '@/lib/tree-utils';
import { generateTreeSvg } from '@/lib/tree-export';

// Helper to generate a large synthetic hierarchical family tree
function generateLargeTree(targetCount = 500): TreeData {
  const people: Person[] = [];
  const relationships: Relationship[] = [];
  let currentId = 1;

  // Root generation (Gen 0): Adam & Eve
  const rootM: Person = {
    id: `person-${currentId++}`,
    treeId: 'stress-tree',
    firstName: 'Adam',
    lastName: 'Patriarch',
    maidenName: null,
    nickname: 'Gen0',
    gender: 'male',
    birthDate: '1800-01-01',
    deathDate: '1880-01-01',
    birthPlace: 'London, UK',
    photoUrl: null,
    bio: 'Root ancestor for large-scale stress testing',
    customFields: {},
    milestones: [],
    attachments: [],
    positionX: 0,
    positionY: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const rootF: Person = {
    id: `person-${currentId++}`,
    treeId: 'stress-tree',
    firstName: 'Eve',
    lastName: 'Matriarch',
    maidenName: 'Eden',
    nickname: 'Gen0',
    gender: 'female',
    birthDate: '1802-05-15',
    deathDate: '1885-05-15',
    birthPlace: 'London, UK',
    photoUrl: null,
    bio: 'Root ancestress for large-scale stress testing',
    customFields: {},
    milestones: [],
    attachments: [],
    positionX: 1,
    positionY: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  people.push(rootM, rootF);
  relationships.push({
    id: `rel-${relationships.length + 1}`,
    treeId: 'stress-tree',
    personAId: rootM.id,
    personBId: rootF.id,
    type: 'spouse',
    subtype: 'biological',
    startDate: null,
    endDate: null,
    createdAt: new Date().toISOString(),
  });

  // Generational expansion: expand generation by generation until targetCount reached
  let currentGenCouples: Array<{ husband: Person; wife: Person }> = [{ husband: rootM, wife: rootF }];
  let genIndex = 1;

  while (people.length < targetCount && currentGenCouples.length > 0) {
    const nextGenCouples: Array<{ husband: Person; wife: Person }> = [];
    const birthYear = 1800 + genIndex * 25;

    for (const couple of currentGenCouples) {
      if (people.length >= targetCount) break;

      const childCount = Math.min(3, Math.max(1, Math.floor((targetCount - people.length) / currentGenCouples.length)));

      for (let c = 0; c < childCount; c++) {
        if (people.length >= targetCount) break;

        const isMale = c % 2 === 0;
        const child: Person = {
          id: `person-${currentId++}`,
          treeId: 'stress-tree',
          firstName: `Child_${genIndex}_${c}_${people.length}`,
          lastName: 'Patriarch',
          maidenName: null,
          nickname: `Gen${genIndex}`,
          gender: isMale ? 'male' : 'female',
          birthDate: `${birthYear}-03-10`,
          deathDate: null,
          birthPlace: 'London, UK',
          photoUrl: null,
          bio: `Generation ${genIndex} descendant`,
          customFields: {},
          milestones: [],
          attachments: [],
          positionX: c,
          positionY: genIndex,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        people.push(child);

        // Parent-child relationships (father and mother)
        relationships.push({
          id: `rel-${relationships.length + 1}`,
          treeId: 'stress-tree',
          personAId: couple.husband.id,
          personBId: child.id,
          type: 'parent_child',
          subtype: 'biological',
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        relationships.push({
          id: `rel-${relationships.length + 1}`,
          treeId: 'stress-tree',
          personAId: couple.wife.id,
          personBId: child.id,
          type: 'parent_child',
          subtype: 'biological',
          startDate: null,
          endDate: null,
          createdAt: new Date().toISOString(),
        });

        // Add spouse for child if room permits
        if (people.length < targetCount) {
          const spouse: Person = {
            id: `person-${currentId++}`,
            treeId: 'stress-tree',
            firstName: `Spouse_${genIndex}_${people.length}`,
            lastName: isMale ? `Inlaw_${genIndex}` : 'Patriarch',
            maidenName: isMale ? `Maiden_${genIndex}` : null,
            nickname: null,
            gender: isMale ? 'female' : 'male',
            birthDate: `${birthYear + 1}-07-20`,
            deathDate: null,
            birthPlace: 'York, UK',
            photoUrl: null,
            bio: 'Spouse by marriage',
            customFields: {},
            milestones: [],
            attachments: [],
            positionX: c + 1,
            positionY: genIndex,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          people.push(spouse);

          relationships.push({
            id: `rel-${relationships.length + 1}`,
            treeId: 'stress-tree',
            personAId: child.id,
            personBId: spouse.id,
            type: 'spouse',
            subtype: 'biological',
            startDate: null,
            endDate: null,
            createdAt: new Date().toISOString(),
          });

          nextGenCouples.push({
            husband: isMale ? child : spouse,
            wife: isMale ? spouse : child,
          });
        }
      }
    }

    currentGenCouples = nextGenCouples;
    genIndex++;
  }

  return {
    tree: {
      id: 'stress-tree',
      ownerId: 'stress-owner',
      name: 'High-Scale Stress Tree',
      slug: 'stress-tree',
      description: 'Synthetic benchmark tree with 500+ individuals',
      settings: { isPublic: true, allowClaiming: false, theme: 'slate', livingPrivacyRedaction: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    people,
    relationships,
  };
}

describe('High-Scale Tree Stress & Performance Suite (TS-1 / TS-5)', () => {
  const treeData = generateLargeTree(500);
  const { people, relationships } = treeData;

  it('generates a verified synthetic tree with >= 500 people and dense relationships', () => {
    expect(people.length).toBeGreaterThanOrEqual(500);
    expect(relationships.length).toBeGreaterThanOrEqual(500);
  });

  it('executes hierarchical layout in < 60ms without NaN coordinates', () => {
    const startTime = performance.now();
    const { nodes, edges } = layoutFamilyTree(people, relationships);
    const durationMs = performance.now() - startTime;

    expect(durationMs).toBeLessThan(60); // Must be sub-60ms even for 500 nodes
    const personNodes = nodes.filter(n => n.type === 'person');
    expect(personNodes.length).toBe(people.length);
    expect(edges.length).toBeGreaterThan(0);

    // Verify all node coordinates are valid finite numbers
    for (const node of nodes) {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
      expect(isNaN(node.position.x)).toBe(false);
      expect(isNaN(node.position.y)).toBe(false);
    }
  });

  it('executes 1,000 DAG cycle checks in < 30ms on 500-person tree', () => {
    const rootPerson = people[0]; // Adam
    // Find a guaranteed biological descendant
    const biologicalChild = people.find(p => p.firstName.startsWith('Child_1_'));
    expect(biologicalChild).toBeDefined();

    if (biologicalChild) {
      expect(isDescendantOf(biologicalChild.id, rootPerson.id, relationships)).toBe(true);

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        // Test inverted relationship: making root a child of their descendant (cycle!)
        const result = validateRelationship(
          {
            personAId: biologicalChild.id,
            personBId: rootPerson.id,
            type: 'parent_child',
          },
          relationships
        );
        expect(result.isValid).toBe(false);
        if (!result.isValid) {
          expect(result.code).toBe('CYCLE_DETECTED');
        }
      }
      const durationMs = performance.now() - startTime;
      expect(durationMs).toBeLessThan(30); // 1,000 cycle checks in < 30ms
    }
  });

  it('calculates LCA kinship across distant generations accurately and rapidly', () => {
    const rootPerson = people[0]; // Adam
    const child = people[2]; // Child_1_0_2

    const startTime = performance.now();
    const kinship = calculateKinship(child.id, rootPerson.id, treeData);
    const durationMs = performance.now() - startTime;

    expect(durationMs).toBeLessThan(15);
    expect(kinship).not.toBeNull();
    expect(kinship.isDirectDescendant).toBe(true);
    expect(kinship.relationship).toBe('Son');
  });

  it('renders vector SVG string of 500-person tree in < 50ms', () => {
    const startTime = performance.now();
    const svgString = generateTreeSvg(treeData, { themeMode: 'dark', includeHeader: true });
    const durationMs = performance.now() - startTime;

    expect(durationMs).toBeLessThan(50);
    expect(svgString).toContain('<svg');
    expect(svgString).toContain('High-Scale Stress Tree');
    expect(svgString.length).toBeGreaterThan(10000);
  });
});
