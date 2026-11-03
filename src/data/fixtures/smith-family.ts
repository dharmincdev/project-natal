import { Milestone, Person, Relationship, TreeData, VaultAttachment } from '@/types/tree';

/**
 * Legacy 16-byte (2ms) silent WAV that shipped in initial prototype fixtures.
 * Used to detect and transparently upgrade stale localStorage seed attachments.
 */
export const LEGACY_SILENT_WAV_DATA_URL =
  'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAACAgICAgICAgICAgICAgICA';

/**
 * Synthesizes a valid, audible multi-second 16-bit PCM mono WAV data URL
 * containing a warm 4-chord harmonic progression (C -> F -> G -> C).
 */
export function generateWarmHarmonicWavDataUrl(
  durationSeconds = 4,
  sampleRate = 8000
): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.max(1, Math.floor(durationSeconds * sampleRate));
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF / WAVE header (44 bytes)
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Warm 4-chord progression: C major -> F major -> G major -> C major
  const chords: number[][] = [
    [261.63, 329.63, 392.0],
    [349.23, 440.0, 523.25],
    [392.0, 493.88, 587.33],
    [261.63, 329.63, 392.0, 523.25],
  ];

  const chordDuration = durationSeconds / chords.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(chords.length - 1, Math.floor(t / chordDuration));
    const chord = chords[chordIndex];
    const localT = t - chordIndex * chordDuration;

    // Smooth per-chord attack/decay envelope + global fade-in/out
    const attack = Math.min(1, localT / 0.08);
    const release = Math.min(1, (chordDuration - localT) / 0.12);
    const globalFade = Math.min(1, t / 0.05, (durationSeconds - t) / 0.15);
    const envelope = Math.max(0, attack * release * globalFade);

    let signal = 0;
    for (let c = 0; c < chord.length; c++) {
      const freq = chord[c];
      signal += Math.sin(2 * Math.PI * freq * t) * 0.75;
      signal += Math.sin(2 * Math.PI * (freq * 2) * t) * 0.25;
    }
    signal /= chord.length;

    const pcmValue = Math.max(
      -32767,
      Math.min(32767, Math.round(signal * envelope * 18000))
    );
    view.setInt16(44 + i * 2, pcmValue, true);
  }

  const bytes = new Uint8Array(buffer);
  let base64 = '';
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  } else {
    const chunkSize = 0x8000;
    const chunks: string[] = [];
    for (let i = 0; i < bytes.length; i += chunkSize) {
      chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
    }
    base64 = btoa(chunks.join(''));
  }

  return `data:audio/wav;base64,${base64}`;
}

export const SEED_AUDIO_DATA_URL: string = generateWarmHarmonicWavDataUrl(4, 8000);

export function loadSmithFamily(treeId: string): { 
  people: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>[], 
  relationships: Omit<Relationship, 'id' | 'createdAt'>[] 
} {
  const p = (
    treeId: string,
    firstName: string,
    lastName: string,
    nickname: string | null,
    birthDate: string | null,
    birthPlace: string | null,
    bio: string | null,
    customFields: Record<string, string>,
    milestones: Milestone[],
    positionX: number,
    positionY: number,
    photoUrl: string | null = null,
    maidenName: string | null = null,
    gender: 'male' | 'female' | 'other' | null = null,
    attachments: VaultAttachment[] = []
  ): Omit<Person, 'id' | 'createdAt' | 'updatedAt'> => ({
    treeId, firstName, lastName, maidenName, nickname, gender, birthDate, deathDate: null, birthPlace, photoUrl, bio, customFields, milestones, attachments, positionX, positionY
  });

  // Curated realistic portrait photos for all family members
  const people = [
    p(
      treeId,
      'Robert',
      'Smith',
      'Bob',
      '1945-05-12',
      'Chicago, IL',
      'Patriarch of the Smith family. Worked as a civil engineer for 40 years.',
      { occupation: 'Civil Engineer', hobbies: 'Fishing, Woodworking' },
      [{ id: 'm1', type: 'retirement', date: '2010-06-01', description: 'Retired from civil engineering', submittedBy: 'admin' }],
      0,
      0,
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
      null,
      'male',
      [
        {
          id: 'att-rob-audio',
          type: 'audio',
          title: "Grandpa Robert's Memories of Chicago (1968)",
          description: "High school oral history interview recorded with granddaughter Emily.",
          url: SEED_AUDIO_DATA_URL,
          durationSeconds: 42,
          recordedAt: '2019-11-28T16:00:00.000Z',
          uploadedAt: '2019-11-28T16:30:00.000Z',
        },
      ]
    ),
    p(
      treeId,
      'Margaret',
      'Smith',
      'Peggy',
      '1948-08-22',
      'Boston, MA',
      'Matriarch of the family. Loved gardening and baking.',
      { occupation: 'Teacher', hobbies: 'Gardening, Baking' },
      [],
      1,
      0,
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      'Johnson',
      'female',
      [
        {
          id: 'att-peg-cert',
          type: 'certificate',
          title: 'Commonwealth Teaching Certificate (1970)',
          description: 'Massachusetts Department of Education certification.',
          url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
          fileName: 'massachusetts_teaching_license_1970.pdf',
          fileSize: 342000,
          uploadedAt: '2020-03-12T10:15:00.000Z',
        },
      ]
    ),
    p(treeId, 'James', 'Smith', 'Jim', '1970-03-15', 'Chicago, IL', 'Eldest son. Followed his father into engineering.', { occupation: 'Software Engineer' }, [], -1, 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', null, 'male'),
    p(treeId, 'Linda', 'Smith', null, '1972-11-05', 'Seattle, WA', null, { occupation: 'Architect' }, [], -2, 1, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80', 'Davis', 'female'),
    p(treeId, 'Sarah', 'Smith-Williams', null, '1974-07-30', 'Chicago, IL', null, { occupation: 'Doctor' }, [], 1, 1, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80', null, 'female'),
    p(treeId, 'Michael', 'Williams', 'Mike', '1973-01-12', 'New York, NY', null, { occupation: 'Lawyer' }, [], 2, 1, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', null, 'male'),
    p(treeId, 'Thomas', 'Smith', 'Tom', '1978-09-09', 'Chicago, IL', 'Youngest son. Travels the world as a freelance photographer.', { occupation: 'Photographer', hobbies: 'Traveling, Surfing' }, [], 3, 1, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80', null, 'male'),
    p(treeId, 'Emily', 'Smith', 'Em', '1998-04-20', 'San Francisco, CA', 'Recent college graduate.', { occupation: 'Graphic Designer' }, [{ id: 'm2', type: 'graduation', date: '2020-05-15', description: 'Graduated from Art School', submittedBy: 'admin' }], -1.5, 2, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', null, 'female'),
    p(treeId, 'David', 'Smith', 'Dave', '2001-10-10', 'San Francisco, CA', 'College student studying computer science.', { occupation: 'Student' }, [], -0.5, 2, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80', null, 'male'),
    p(treeId, 'Olivia', 'Williams', 'Liv', '2005-02-14', 'Boston, MA', 'High school senior.', { occupation: 'Student' }, [], 1.5, 2, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', null, 'female'),
  ];

  const rel = (
    personAId: string,
    personBId: string,
    type: 'parent_child' | 'spouse' | 'sibling',
    subtype: 'biological' | 'step' | 'adoptive' | 'half'
  ): Omit<Relationship, 'id' | 'createdAt'> => ({
    treeId, personAId, personBId, type, subtype, startDate: null, endDate: null
  });

  const relationships: Omit<Relationship, 'id' | 'createdAt'>[] = [
    rel('Robert', 'Margaret', 'spouse', 'biological'),
    rel('Robert', 'James', 'parent_child', 'biological'),
    rel('Margaret', 'James', 'parent_child', 'biological'),
    rel('Robert', 'Sarah', 'parent_child', 'biological'),
    rel('Margaret', 'Sarah', 'parent_child', 'biological'),
    rel('Robert', 'Thomas', 'parent_child', 'biological'),
    rel('Margaret', 'Thomas', 'parent_child', 'biological'),
    rel('James', 'Linda', 'spouse', 'biological'),
    rel('James', 'Emily', 'parent_child', 'biological'),
    rel('Linda', 'Emily', 'parent_child', 'biological'),
    rel('James', 'David', 'parent_child', 'biological'),
    rel('Linda', 'David', 'parent_child', 'biological'),
    rel('Sarah', 'Michael', 'spouse', 'biological'),
    rel('Sarah', 'Olivia', 'parent_child', 'biological'),
    rel('Michael', 'Olivia', 'parent_child', 'biological'),
    rel('James', 'Sarah', 'sibling', 'biological'),
    rel('James', 'Thomas', 'sibling', 'biological'),
    rel('Sarah', 'Thomas', 'sibling', 'biological'),
    rel('Emily', 'David', 'sibling', 'biological')
  ];

  return { people, relationships };
}
export function getInitialSmithTreeData(): TreeData {
  const treeId = 'tree-smith-demo';
  const rawData = loadSmithFamily(treeId);
  const idMap = new Map<string, string>();

  // Deterministic IDs
  rawData.people.forEach((p, index) => {
    idMap.set(p.firstName, `p-${index + 1}-${p.firstName.toLowerCase()}`);
  });

  const people: Person[] = rawData.people.map((p) => {
    const id = idMap.get(p.firstName) || `p-${Math.random().toString(36).substring(2, 9)}`;
    return {
      ...p,
      id,
      treeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const relationships: Relationship[] = rawData.relationships.map((r, index) => {
    const personAId = idMap.get(r.personAId) || r.personAId;
    const personBId = idMap.get(r.personBId) || r.personBId;
    return {
      ...r,
      id: `rel-${index + 1}`,
      treeId,
      personAId,
      personBId,
      createdAt: new Date().toISOString(),
    };
  });

  return {
    tree: {
      id: treeId,
      ownerId: 'user-demo',
      name: 'The Smith Family Tree',
      slug: 'smith-family',
      description: 'A 3-generation family tree showing grandparents, parents, and grandchildren.',
      settings: { isPublic: true, allowClaiming: false, theme: 'light' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    people,
    relationships,
  };
}

export async function seedSmithFamily(store: typeof import('@/lib/store')): Promise<TreeData> {
  const treeData = getInitialSmithTreeData();
  const tree = await store.createTree(treeData.tree.ownerId, treeData.tree.name, treeData.tree.slug, treeData.tree.description || undefined);
  
  for (const person of treeData.people) {
    const { id: _id, treeId: _treeId, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = person;
    await store.addPerson(tree.id, rest);
  }

  for (const rel of treeData.relationships) {
    const { id: _id, treeId: _treeId, createdAt: _createdAt, ...rest } = rel;
    await store.addRelationship(tree.id, rest);
  }

  const loaded = await store.getTreeData(tree.id);
  if (!loaded) throw new Error("Failed to load tree data after seeding");
  return loaded;
}

export const SMITH_FAMILY_TREE: TreeData = getInitialSmithTreeData();

