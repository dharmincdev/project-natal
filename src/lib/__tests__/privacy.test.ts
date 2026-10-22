import { describe, it, expect } from 'vitest';
import { isLivingPerson, redactLivingPerson, redactTreeForPublic } from '@/lib/privacy';
import { Person, TreeData } from '@/types/tree';

const mockPerson = (overrides: Partial<Person> = {}): Person => ({
  id: 'p-test-1',
  treeId: 'tree-1',
  firstName: 'Emily',
  lastName: 'Smith',
  maidenName: 'Davis',
  nickname: 'Em',
  gender: 'female',
  birthDate: '1998-04-20',
  deathDate: null,
  birthPlace: 'San Francisco, CA',
  photoUrl: 'https://example.com/emily.jpg',
  bio: 'Private personal story and medical history',
  customFields: { occupation: 'Designer', phone: '555-0199' },
  milestones: [
    { id: 'm-1', type: 'graduation', date: '2020-05-15', description: 'Graduation', submittedBy: 'admin' },
  ],
  attachments: [
    {
      id: 'att-1',
      type: 'photo_archive',
      title: 'Private Photo',
      url: 'https://example.com/photo.jpg',
      uploadedAt: '2020-01-01T00:00:00Z',
    },
  ],
  positionX: 100,
  positionY: 200,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('Living Person Privacy Redaction (SPEC §6.1)', () => {
  it('identifies individuals with deathDate as deceased (not living)', () => {
    const deceased = mockPerson({
      birthDate: '1945-05-12',
      deathDate: '2018-11-03',
    });
    expect(isLivingPerson(deceased, 2026)).toBe(false);
  });

  it('identifies centenarians (> 100 years old) without deathDate as deceased under genealogy standard', () => {
    const historicalAncestor = mockPerson({
      birthDate: '1890-01-15',
      deathDate: null,
    });
    expect(isLivingPerson(historicalAncestor, 2026)).toBe(false);
  });

  it('identifies persons born within 100 years without deathDate as living', () => {
    const livingYoung = mockPerson({ birthDate: '1998-04-20', deathDate: null });
    const livingSenior = mockPerson({ birthDate: '1935-08-10', deathDate: null }); // 91 in 2026

    expect(isLivingPerson(livingYoung, 2026)).toBe(true);
    expect(isLivingPerson(livingSenior, 2026)).toBe(true);
  });

  it('defaults to living if birthDate is null and deathDate is null for privacy safety', () => {
    const unknownDates = mockPerson({ birthDate: null, deathDate: null });
    expect(isLivingPerson(unknownDates)).toBe(true);
  });

  it('redacts living individuals completely: masks names, hides dates, bio, vault, and photos', () => {
    const living = mockPerson();
    const redacted = redactLivingPerson(living);

    // Name masked
    expect(redacted.firstName).toBe('Living');
    expect(redacted.lastName).toBe('Relative');
    expect(redacted.nickname).toBeNull();
    expect(redacted.maidenName).toBeNull();

    // Sensitive dates & locations masked
    expect(redacted.birthDate).toBeNull();
    expect(redacted.deathDate).toBeNull();
    expect(redacted.birthPlace).toBeNull();

    // Media & personal data stripped
    expect(redacted.photoUrl).toBeNull();
    expect(redacted.bio).toBeNull();
    expect(redacted.customFields).toEqual({});
    expect(redacted.milestones).toEqual([]);
    expect(redacted.attachments).toEqual([]);

    // Graph structural continuity preserved
    expect(redacted.id).toBe(living.id);
    expect(redacted.treeId).toBe(living.treeId);
    expect(redacted.positionX).toBe(100);
    expect(redacted.positionY).toBe(200);
  });

  it('does NOT redact deceased ancestors', () => {
    const deceased = mockPerson({
      firstName: 'Robert',
      lastName: 'Smith',
      birthDate: '1910-02-14',
      deathDate: '1985-06-20',
      bio: 'Historic patriarch biography',
    });

    const result = redactLivingPerson(deceased);
    expect(result.firstName).toBe('Robert');
    expect(result.lastName).toBe('Smith');
    expect(result.bio).toBe('Historic patriarch biography');
    expect(result.birthDate).toBe('1910-02-14');
  });

  it('redacts entire tree dataset for public view while preserving relationships', () => {
    const living = mockPerson({ id: 'p-living', birthDate: '2000-01-01' });
    const deceased = mockPerson({
      id: 'p-deceased',
      firstName: 'Arthur',
      birthDate: '1920-01-01',
      deathDate: '1995-01-01',
    });

    const testTreeData: TreeData = {
      tree: {
        id: 'tree-1',
        ownerId: 'u-1',
        name: 'Public Tree',
        slug: 'public-tree',
        description: 'Public Tree Description',
        settings: { isPublic: true, allowClaiming: false, theme: 'light' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      people: [living, deceased],
      relationships: [
        {
          id: 'rel-1',
          treeId: 'tree-1',
          personAId: 'p-deceased',
          personBId: 'p-living',
          type: 'parent_child',
          subtype: 'biological',
          startDate: null,
          endDate: null,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    };

    const redactedTree = redactTreeForPublic(testTreeData);

    const publicLiving = redactedTree.people.find((p) => p.id === 'p-living')!;
    const publicDeceased = redactedTree.people.find((p) => p.id === 'p-deceased')!;

    expect(publicLiving.firstName).toBe('Living');
    expect(publicLiving.lastName).toBe('Relative');

    expect(publicDeceased.firstName).toBe('Arthur');
    expect(publicDeceased.deathDate).toBe('1995-01-01');

    // Relationships intact
    expect(redactedTree.relationships).toHaveLength(1);
    expect(redactedTree.relationships[0].personAId).toBe('p-deceased');
    expect(redactedTree.relationships[0].personBId).toBe('p-living');
  });

  it('respects livingPrivacyRedaction: false if explicitly configured by tree owner per SPEC.md §3.2', () => {
    const living = mockPerson({ id: 'p-living', firstName: 'Sarah', lastName: 'Connor', birthDate: '1995-03-10' });
    const optOutTreeData: TreeData = {
      tree: {
        id: 'tree-2',
        ownerId: 'u-1',
        name: 'Opt-out Tree',
        slug: 'opt-out-tree',
        description: null,
        settings: { isPublic: true, allowClaiming: false, theme: 'light', livingPrivacyRedaction: false },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      people: [living],
      relationships: [],
    };

    const result = redactTreeForPublic(optOutTreeData);
    expect(result.people[0].firstName).toBe('Sarah');
    expect(result.people[0].lastName).toBe('Connor');
  });
});

