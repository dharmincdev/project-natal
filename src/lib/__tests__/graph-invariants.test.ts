import { describe, it, expect } from 'vitest';
import { getInitialSmithTreeData } from '@/data/fixtures/smith-family';
import { 
  validateRelationship, 
  isDescendantOf, 
  calculateKinship, 
  getAncestorDepths 
} from '@/lib/tree-utils';
import { Relationship } from '@/types/tree';

describe('DAG Cycle Invariant & Paradox Prevention (SPEC §4.1)', () => {
  it('should reject a self-relationship with CYCLE_DETECTED', () => {
    const result = validateRelationship(
      { personAId: 'p1', personBId: 'p1', type: 'parent_child' },
      []
    );
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe('CYCLE_DETECTED');
      expect(result.error).toContain('CYCLE_DETECTED');
    }
  });

  it('should reject direct cycles (A is parent of B, cannot make B parent of A)', () => {
    const existing: Relationship[] = [
      {
        id: 'r1',
        treeId: 'tree-1',
        personAId: 'parent-1',
        personBId: 'child-1',
        type: 'parent_child',
        subtype: 'biological',
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
      },
    ];

    const result = validateRelationship(
      { personAId: 'child-1', personBId: 'parent-1', type: 'parent_child' },
      existing
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe('CYCLE_DETECTED');
      expect(result.error).toContain('CYCLE_DETECTED');
    }
  });

  it('should reject multi-generational transitive cycles (Grandchild cannot be parent of Grandparent)', () => {
    const existing: Relationship[] = [
      {
        id: 'r1',
        treeId: 'tree-1',
        personAId: 'grandparent',
        personBId: 'parent',
        type: 'parent_child',
        subtype: 'biological',
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'r2',
        treeId: 'tree-1',
        personAId: 'parent',
        personBId: 'grandchild',
        type: 'parent_child',
        subtype: 'biological',
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
      },
    ];

    // Attempt to make grandchild parent of grandparent ("I'm My Own Grandpa" paradox)
    const result = validateRelationship(
      { personAId: 'grandchild', personBId: 'grandparent', type: 'parent_child' },
      existing
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe('CYCLE_DETECTED');
      expect(result.error).toContain('CYCLE_DETECTED');
    }
  });

  it('should allow valid new parent-child relations that do not create cycles', () => {
    const existing: Relationship[] = [
      {
        id: 'r1',
        treeId: 'tree-1',
        personAId: 'parent-1',
        personBId: 'child-1',
        type: 'parent_child',
        subtype: 'biological',
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
      },
    ];

    const result = validateRelationship(
      { personAId: 'child-1', personBId: 'new-grandchild', type: 'parent_child' },
      existing
    );

    expect(result.isValid).toBe(true);
  });

  it('should reject duplicate relationships', () => {
    const existing: Relationship[] = [
      {
        id: 'r1',
        treeId: 'tree-1',
        personAId: 'person-a',
        personBId: 'person-b',
        type: 'spouse',
        subtype: 'biological',
        startDate: null,
        endDate: null,
        createdAt: new Date().toISOString(),
      },
    ];

    // Symmetric spouse duplicate check
    const result = validateRelationship(
      { personAId: 'person-b', personBId: 'person-a', type: 'spouse' },
      existing
    );

    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.code).toBe('INVALID_RELATIONSHIP');
    }
  });

  it('correctly tracks isDescendantOf across deep tree depths', () => {
    const data = getInitialSmithTreeData();
    const robertId = data.people.find((p) => p.firstName === 'Robert')!.id;
    const emilyId = data.people.find((p) => p.firstName === 'Emily')!.id;
    const davidId = data.people.find((p) => p.firstName === 'David')!.id;
    const oliviaId = data.people.find((p) => p.firstName === 'Olivia')!.id;

    expect(isDescendantOf(emilyId, robertId, data.relationships)).toBe(true);
    expect(isDescendantOf(davidId, robertId, data.relationships)).toBe(true);
    expect(isDescendantOf(oliviaId, robertId, data.relationships)).toBe(true);

    // Reverse must NOT be descendants
    expect(isDescendantOf(robertId, emilyId, data.relationships)).toBe(false);
    expect(isDescendantOf(robertId, oliviaId, data.relationships)).toBe(false);
  });

  it('correctly calculates ancestor depths with getAncestorDepths', () => {
    const data = getInitialSmithTreeData();
    const getId = (firstName: string) => data.people.find((p) => p.firstName === firstName)!.id;
    const emilyId = getId('Emily');
    const robertId = getId('Robert');
    const jamesId = getId('James');

    const depths = getAncestorDepths(emilyId, data.relationships);
    expect(depths.get(emilyId)).toBe(0);
    expect(depths.get(jamesId)).toBe(1);
    expect(depths.get(robertId)).toBe(2);
  });
});

describe('Dynamic Kinship Computing Engine (SPEC §4.3)', () => {
  const data = getInitialSmithTreeData();
  const getId = (firstName: string) => data.people.find((p) => p.firstName === firstName)!.id;

  it('evaluates Self correctly', () => {
    const robertId = getId('Robert');
    const kin = calculateKinship(robertId, robertId, data);
    expect(kin.relationship).toBe('Self');
    expect(kin.generationalOffset).toBe(0);
  });

  it('evaluates direct Spouses', () => {
    const robertId = getId('Robert');
    const margaretId = getId('Margaret');

    const robert = calculateKinship(robertId, margaretId, data);
    expect(robert.relationship).toBe('Husband');

    const margaret = calculateKinship(margaretId, robertId, data);
    expect(margaret.relationship).toBe('Wife');
  });

  it('evaluates Parent / Child relationships with gender awareness', () => {
    const robertId = getId('Robert');
    const thomasId = getId('Thomas');
    const sarahId = getId('Sarah');

    // Robert is Father of Thomas
    const robertToThomas = calculateKinship(robertId, thomasId, data);
    expect(robertToThomas.relationship).toBe('Father');
    expect(robertToThomas.isDirectAncestor).toBe(true);
    expect(robertToThomas.generationalOffset).toBe(1);

    // Thomas is Son of Robert
    const thomasToRobert = calculateKinship(thomasId, robertId, data);
    expect(thomasToRobert.relationship).toBe('Son');
    expect(thomasToRobert.isDirectDescendant).toBe(true);
    expect(thomasToRobert.generationalOffset).toBe(-1);

    // Sarah is Daughter of Robert
    const sarahToRobert = calculateKinship(sarahId, robertId, data);
    expect(sarahToRobert.relationship).toBe('Daughter');
  });

  it('evaluates Grandparent / Grandchild relationships with generational degree', () => {
    const robertId = getId('Robert');
    const emilyId = getId('Emily');

    // Robert is Grandfather of Emily
    const robertToEmily = calculateKinship(robertId, emilyId, data);
    expect(robertToEmily.relationship).toBe('Grandfather');
    expect(robertToEmily.isDirectAncestor).toBe(true);
    expect(robertToEmily.generationalOffset).toBe(2);

    // Emily is Granddaughter of Robert
    const emilyToRobert = calculateKinship(emilyId, robertId, data);
    expect(emilyToRobert.relationship).toBe('Granddaughter');
    expect(emilyToRobert.isDirectDescendant).toBe(true);
    expect(emilyToRobert.generationalOffset).toBe(-2);
  });

  it('evaluates Full Siblings sharing parents', () => {
    const emilyId = getId('Emily');
    const davidId = getId('David');

    // Emily and David are children of James & Linda
    const emilyToDavid = calculateKinship(emilyId, davidId, data);
    expect(emilyToDavid.relationship).toBe('Sister');
    expect(emilyToDavid.generationalOffset).toBe(0);

    const davidToEmily = calculateKinship(davidId, emilyId, data);
    expect(davidToEmily.relationship).toBe('Brother');
  });

  it('evaluates Aunt / Uncle and Niece / Nephew', () => {
    const sarahId = getId('Sarah');
    const thomasId = getId('Thomas');
    const emilyId = getId('Emily');
    const davidId = getId('David');

    // Sarah Smith is Aunt of Emily Smith
    const sarahToEmily = calculateKinship(sarahId, emilyId, data);
    expect(sarahToEmily.relationship).toBe('Aunt');
    expect(sarahToEmily.generationalOffset).toBe(1);

    // Thomas is Uncle of Emily
    const thomasToEmily = calculateKinship(thomasId, emilyId, data);
    expect(thomasToEmily.relationship).toBe('Uncle');
    expect(thomasToEmily.generationalOffset).toBe(1);

    // Emily is Niece of Sarah
    const emilyToSarah = calculateKinship(emilyId, sarahId, data);
    expect(emilyToSarah.relationship).toBe('Niece');
    expect(emilyToSarah.generationalOffset).toBe(-1);

    // David is Nephew of Thomas
    const davidToThomas = calculateKinship(davidId, thomasId, data);
    expect(davidToThomas.relationship).toBe('Nephew');
    expect(davidToThomas.generationalOffset).toBe(-1);
  });

  it('evaluates First Cousins sharing grandparents', () => {
    const emilyId = getId('Emily');
    const oliviaId = getId('Olivia');
    const robertId = getId('Robert');
    const margaretId = getId('Margaret');

    // Emily Smith (child of James) and Olivia Williams (child of Sarah) share grandparents Robert & Margaret
    const emilyToOlivia = calculateKinship(emilyId, oliviaId, data);
    expect(emilyToOlivia.relationship).toBe('First Cousin');
    expect(emilyToOlivia.degree).toBe('First Cousin');
    expect(emilyToOlivia.generationalOffset).toBe(0);
    expect(emilyToOlivia.commonAncestorIds).toContain(robertId);
    expect(emilyToOlivia.commonAncestorIds).toContain(margaretId);
  });

  it('evaluates In-Laws (Son-in-law, Father-in-law, Brother-in-law, Daughter-in-law)', () => {
    const michaelId = getId('Michael');
    const robertId = getId('Robert');
    const thomasId = getId('Thomas');
    const lindaId = getId('Linda');

    // Michael Williams is married to Sarah Smith (daughter of Robert).
    // Michael is Son-in-law to Robert Smith.
    const michaelToRobert = calculateKinship(michaelId, robertId, data);
    expect(michaelToRobert.relationship).toBe('Son-in-law');

    // Robert is Father-in-law to Michael Williams.
    const robertToMichael = calculateKinship(robertId, michaelId, data);
    expect(robertToMichael.relationship).toBe('Father-in-law');

    // Michael Williams is Brother-in-law to Thomas Smith.
    const michaelToThomas = calculateKinship(michaelId, thomasId, data);
    expect(michaelToThomas.relationship).toBe('Brother-in-law');

    // Linda Smith is Daughter-in-law to Robert Smith.
    const lindaToRobert = calculateKinship(lindaId, robertId, data);
    expect(lindaToRobert.relationship).toBe('Daughter-in-law');
  });
});
