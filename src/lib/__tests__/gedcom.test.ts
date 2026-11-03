import { describe, it, expect } from 'vitest';
import { parseGedcom } from '@/lib/gedcom/parser';
import { exportToGedcom } from '@/lib/gedcom/exporter';
import { getInitialSmithTreeData } from '@/data/fixtures/smith-family';
import { TreeData } from '@/types/tree';

describe('GEDCOM 5.5.1 & 7.0 Parser & Exporter (PRO-16, PRO-17)', () => {
  it('parses standard 0 @I1@ INDI and 0 @F1@ FAM records in GEDCOM 5.5.1 and 7.0 formats', () => {
    const sampleGedcom = `\uFEFF0 HEAD
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
1 CHAR UTF-8
1 TITL Kennedy Sample Lineage
0 @I1@ INDI
1 NAME Arthur /Pendelton/
2 GIVN Arthur
2 SURN Pendelton
2 NICK Artie
1 SEX M
1 BIRT
2 DATE 14 FEB 1940
2 PLAC Boston, MA
1 DEAT
2 DATE 10 OCT 2015
1 OCCU Marine Biologist
1 NOTE Wrote several books on Atlantic ecosystems.
2 CONT Retired in Maine.
0 @I2@ INDI
1 NAME Clara /Pendelton/
2 GIVN Clara
2 SURN Pendelton
2 _MARNM Montgomery
1 SEX F
1 BIRT
2 DATE ABT 1943
2 PLAC Providence, RI
0 @I3@ INDI
1 NAME Elena /Pendelton/
1 SEX F
1 BIRT
2 DATE 5 NOV 1972
2 PLAC Boston, MA
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
1 MARR
2 DATE 20 JUN 1965
2 PLAC Newport, RI
0 TRLR`;

    const result = parseGedcom(sampleGedcom);

    expect(result.stats.individualCount).toBe(3);
    expect(result.stats.familyCount).toBe(1);
    expect(result.stats.gedcomVersion).toBe('5.5.1');
    expect(result.treeData.tree.name).toBe('Kennedy Sample Lineage');

    const arthur = result.treeData.people.find((p) => p.firstName === 'Arthur');
    const clara = result.treeData.people.find((p) => p.firstName === 'Clara');
    const elena = result.treeData.people.find((p) => p.firstName === 'Elena');

    expect(arthur).toBeDefined();
    expect(arthur?.lastName).toBe('Pendelton');
    expect(arthur?.nickname).toBe('Artie');
    expect(arthur?.gender).toBe('male');
    expect(arthur?.birthDate).toBe('1940-02-14');
    expect(arthur?.birthPlace).toBe('Boston, MA');
    expect(arthur?.deathDate).toBe('2015-10-10');
    expect(arthur?.customFields.occupation).toBe('Marine Biologist');
    expect(arthur?.bio).toContain('Wrote several books');
    expect(arthur?.bio).toContain('Retired in Maine.');

    expect(clara).toBeDefined();
    expect(clara?.maidenName).toBe('Montgomery');
    expect(clara?.birthDate).toBe('1943');

    expect(elena).toBeDefined();
    expect(elena?.birthDate).toBe('1972-11-05');

    const spouseRels = result.treeData.relationships.filter((r) => r.type === 'spouse');
    const pcRels = result.treeData.relationships.filter((r) => r.type === 'parent_child');

    expect(spouseRels).toHaveLength(1);
    expect(spouseRels[0].startDate).toBe('1965-06-20');
    expect(pcRels).toHaveLength(2);
    expect(pcRels.some((r) => r.personAId === arthur?.id && r.personBId === elena?.id)).toBe(true);
    expect(pcRels.some((r) => r.personAId === clara?.id && r.personBId === elena?.id)).toBe(true);
  });

  it('round-trips SMITH_FAMILY_TREE through exportToGedcom and parseGedcom losslessly', () => {
    const original = getInitialSmithTreeData();
    const gedcomText = exportToGedcom(original);

    expect(gedcomText).toContain('0 HEAD');
    expect(gedcomText).toContain('2 VERS 7.0');
    expect(gedcomText).toContain('0 @I1@ INDI');
    expect(gedcomText).toContain('0 @F1@ FAM');
    expect(gedcomText).toContain('0 TRLR');

    const reimported = parseGedcom(gedcomText);

    expect(reimported.stats.individualCount).toBe(original.people.length);
    expect(reimported.treeData.people).toHaveLength(10);

    // Verify every person's core demographic fields survived round-trip
    for (const origPerson of original.people) {
      const match = reimported.treeData.people.find(
        (p) => p.firstName === origPerson.firstName && p.lastName === origPerson.lastName
      );
      expect(match).toBeDefined();
      expect(match?.gender).toBe(origPerson.gender);
      expect(match?.birthDate).toBe(origPerson.birthDate);
      expect(match?.deathDate).toBe(origPerson.deathDate);
      expect(match?.birthPlace).toBe(origPerson.birthPlace);
      expect(match?.maidenName).toBe(origPerson.maidenName);
      expect(match?.nickname).toBe(origPerson.nickname);
      expect(match?.bio).toBe(origPerson.bio);
      if (origPerson.customFields.occupation) {
        expect(match?.customFields.occupation).toBe(origPerson.customFields.occupation);
      }
    }

    const origSpouses = original.relationships.filter((r) => r.type === 'spouse');
    const origParentChild = original.relationships.filter((r) => r.type === 'parent_child');

    const reimportedSpouses = reimported.treeData.relationships.filter((r) => r.type === 'spouse');
    const reimportedParentChild = reimported.treeData.relationships.filter(
      (r) => r.type === 'parent_child'
    );

    expect(reimportedSpouses).toHaveLength(origSpouses.length);
    expect(reimportedParentChild).toHaveLength(origParentChild.length);
  });

  it('preserves single-parent families, unmarried co-parents, and standalone siblings on round-trip', () => {
    const now = new Date().toISOString();
    const singleParentTree: TreeData = {
      tree: {
        id: 'tree-single-parent',
        ownerId: 'owner-1',
        name: 'Single Parent & Sibling Tree',
        slug: 'single-parent-tree',
        description: null,
        settings: { isPublic: false, allowClaiming: false, theme: 'default' },
        createdAt: now,
        updatedAt: now,
      },
      people: [
        {
          id: 'p-single-mom',
          treeId: 'tree-single-parent',
          firstName: 'Diana',
          lastName: 'Carter',
          maidenName: null,
          nickname: null,
          gender: 'female',
          birthDate: '1968-04-10',
          deathDate: null,
          birthPlace: 'Denver, CO',
          photoUrl: null,
          bio: 'Single mother of two.',
          customFields: {},
          milestones: [],
          positionX: 0,
          positionY: 0,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'p-child-1',
          treeId: 'tree-single-parent',
          firstName: 'Liam',
          lastName: 'Carter',
          maidenName: null,
          nickname: null,
          gender: 'male',
          birthDate: '1995-09-21',
          deathDate: null,
          birthPlace: 'Denver, CO',
          photoUrl: null,
          bio: null,
          customFields: {},
          milestones: [],
          positionX: 0,
          positionY: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'p-child-2',
          treeId: 'tree-single-parent',
          firstName: 'Maya',
          lastName: 'Carter',
          maidenName: null,
          nickname: null,
          gender: 'female',
          birthDate: '1998-12-03',
          deathDate: null,
          birthPlace: 'Denver, CO',
          photoUrl: null,
          bio: null,
          customFields: {},
          milestones: [],
          positionX: 1,
          positionY: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'p-sib-a',
          treeId: 'tree-single-parent',
          firstName: 'Noah',
          lastName: 'Brooks',
          maidenName: null,
          nickname: null,
          gender: 'male',
          birthDate: '1985-01-15',
          deathDate: null,
          birthPlace: 'Austin, TX',
          photoUrl: null,
          bio: null,
          customFields: {},
          milestones: [],
          positionX: 2,
          positionY: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'p-sib-b',
          treeId: 'tree-single-parent',
          firstName: 'Zoe',
          lastName: 'Brooks',
          maidenName: null,
          nickname: null,
          gender: 'female',
          birthDate: '1987-06-20',
          deathDate: null,
          birthPlace: 'Austin, TX',
          photoUrl: null,
          bio: null,
          customFields: {},
          milestones: [],
          positionX: 3,
          positionY: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
      relationships: [
        {
          id: 'rel-sp-1',
          treeId: 'tree-single-parent',
          personAId: 'p-single-mom',
          personBId: 'p-child-1',
          type: 'parent_child',
          subtype: 'biological',
          startDate: null,
          endDate: null,
          createdAt: now,
        },
        {
          id: 'rel-sp-2',
          treeId: 'tree-single-parent',
          personAId: 'p-single-mom',
          personBId: 'p-child-2',
          type: 'parent_child',
          subtype: 'biological',
          startDate: null,
          endDate: null,
          createdAt: now,
        },
        {
          id: 'rel-standalone-sib',
          treeId: 'tree-single-parent',
          personAId: 'p-sib-a',
          personBId: 'p-sib-b',
          type: 'sibling',
          subtype: 'biological',
          startDate: null,
          endDate: null,
          createdAt: now,
        },
      ],
    };

    const gedcom = exportToGedcom(singleParentTree);
    const parsed = parseGedcom(gedcom);

    expect(parsed.treeData.people).toHaveLength(5);

    const diana = parsed.treeData.people.find((p) => p.firstName === 'Diana')!;
    const liam = parsed.treeData.people.find((p) => p.firstName === 'Liam')!;
    const maya = parsed.treeData.people.find((p) => p.firstName === 'Maya')!;
    const noah = parsed.treeData.people.find((p) => p.firstName === 'Noah')!;
    const zoe = parsed.treeData.people.find((p) => p.firstName === 'Zoe')!;

    // Single mother has 0 spouse edges and 2 parent_child edges
    const spouseEdges = parsed.treeData.relationships.filter((r) => r.type === 'spouse');
    expect(spouseEdges).toHaveLength(0);

    const pcEdges = parsed.treeData.relationships.filter((r) => r.type === 'parent_child');
    expect(pcEdges).toHaveLength(2);
    expect(pcEdges.some((r) => r.personAId === diana.id && r.personBId === liam.id)).toBe(true);
    expect(pcEdges.some((r) => r.personAId === diana.id && r.personBId === maya.id)).toBe(true);

    // Standalone siblings survive round-trip
    const sibEdges = parsed.treeData.relationships.filter((r) => r.type === 'sibling');
    expect(sibEdges).toHaveLength(1);
    const sibPair = [sibEdges[0].personAId, sibEdges[0].personBId].sort();
    expect(sibPair).toEqual([noah.id, zoe.id].sort());
  });
});
