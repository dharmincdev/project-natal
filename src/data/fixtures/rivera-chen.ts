import { Person, Relationship, TreeData } from '@/types/tree';

export function getInitialRiveraChenTreeData(): TreeData {
  const treeId = 'tree-rivera-chen';

  const p = (
    id: string,
    firstName: string,
    lastName: string,
    nickname: string | null,
    birthDate: string | null,
    deathDate: string | null,
    birthPlace: string | null,
    occupation: string,
    bio: string,
    photoUrl: string
  ): Person => ({
    id,
    treeId,
    firstName,
    lastName,
    nickname,
    birthDate,
    deathDate,
    birthPlace,
    photoUrl,
    bio,
    customFields: { occupation },
    milestones: [],
    positionX: 0,
    positionY: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const people: Person[] = [
    // Generation 1 - Rivera Side
    p('rc-carlos', 'Carlos', 'Rivera', 'Abuelo', '1942-04-18', null, 'Mexico City, Mexico', 'Master Carpenter (Retired)', 'Founded Rivera Woodworks in 1968. Devoted grandfather who loves teaching traditional woodwork.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'),
    p('rc-rosa', 'Rosa', 'Rivera (Méndez)', null, '1944-09-03', '1992-11-14', 'Guadalajara, Mexico', 'Botanist & Florist', 'Renowned botanical illustrator and florist. Her love of nature lives on in her children.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'),
    p('rc-carmen', 'Carmen', 'Delgado-Rivera', null, '1952-01-22', null, 'Puebla, Mexico', 'Art Teacher', 'Married Carlos in 1996. Warm matriarch and passionate watercolor artist.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'),

    // Generation 1 - Chen Side
    p('rc-david', 'David', 'Chen', 'Grandpa Dave', '1940-08-15', null, 'Taipei, Taiwan', 'Electrical Engineer (Retired)', 'Emigrated to California in 1972. Pioneer in early semiconductor circuitry.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'),
    p('rc-shufen', 'Shu-Fen', 'Chen (Lin)', 'Nai Nai', '1943-03-29', null, 'Tainan, Taiwan', 'Calligrapher & Educator', 'High school literature educator for 35 years. Passionate tea ceremony host.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'),

    // Generation 2 - Rivera Offspring
    p('rc-mateo', 'Mateo', 'Rivera', null, '1968-06-14', null, 'Mexico City, Mexico', 'Executive Chef & Restaurateur', 'Chef-owner of Cantina Del Sol in San Francisco. Blends Mexican culinary traditions with modern techniques.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),
    p('rc-elena', 'Elena', 'Rivera-Johnson', null, '1971-12-05', null, 'Los Angeles, CA', 'Landscape Architect', 'Designs public parks and ecological green spaces throughout the Bay Area.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'),
    p('rc-marcus', 'Marcus', 'Johnson', null, '1969-07-19', null, 'Oakland, CA', 'Biochemist', 'Research director working on renewable agricultural enzymes. Jazz enthusiast.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
    p('rc-gabriel', 'Gabriel', 'Rivera', 'Gabe', '1985-05-11', null, 'San Francisco, CA', 'Documentary Film Editor', 'Son of Carlos and Carmen. Emmy-nominated documentary film editor.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'),
    p('rc-isabella', 'Isabella', 'Rossi-Rivera', 'Bella', '1987-10-02', null, 'Florence, Italy', 'Fashion Stylist', 'Italian-born stylist and vintage collector. Married Gabriel in 2015.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'),

    // Generation 2 - Chen Offspring
    p('rc-mei', 'Mei', 'Chen-Rivera', null, '1972-02-18', null, 'Taipei, Taiwan', 'Pediatric Neurologist', 'Chief of Pediatric Neurology at UCSF Childrens Hospital. Married Mateo in 1998.', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80'),
    p('rc-kevin', 'Kevin', 'Chen', null, '1975-11-28', null, 'San Jose, CA', 'VP of Engineering', 'Leads robotics software teams in Silicon Valley. Marathon runner.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'),
    p('rc-priya', 'Priya', 'Patel-Chen', null, '1978-04-09', null, 'Austin, TX', 'Creative Director', 'Brand identity designer and ceramics enthusiast. Married Kevin in 2004.', 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200&auto=format&fit=crop&q=80'),
    p('rc-albert', 'Albert', 'Chen', 'Al', '1980-08-20', null, 'San Jose, CA', 'Environmental Attorney', 'Clean energy policy advocate and avid rock climber.', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80'),

    // Generation 3 - Mateo & Mei's Children (Blended & Biological)
    p('rc-chloe', 'Chloe', 'Rivera-Chen', null, '1995-09-14', null, 'San Francisco, CA', 'Human Rights Attorney', 'Daughter of Mei from earlier marriage; lovingly adopted by Mateo in 2000.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80'),
    p('rc-liam', 'Liam', 'OConnor', null, '1993-01-30', null, 'Dublin, Ireland', 'Civil Engineer', 'Urban infrastructure engineer. Married Chloe in 2022.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'),
    p('rc-sofia', 'Sofia', 'Rivera-Chen', null, '2000-06-25', null, 'San Francisco, CA', 'Cellist & Sound Designer', 'Twin sister of Diego. Performs with SF Contemporary Symphony.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'),
    p('rc-diego', 'Diego', 'Rivera-Chen', null, '2000-06-25', null, 'San Francisco, CA', 'Robotics Researcher', 'Twin brother of Sofia. Doctoral candidate in surgical robotics at Stanford.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),

    // Generation 3 - Elena & Marcus's Children
    p('rc-maya', 'Maya', 'Rivera-Johnson', null, '1999-10-17', null, 'Berkeley, CA', 'Wildlife Veterinarian', 'Specializes in marine mammal rescue along the Northern California coast.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'),
    p('rc-lucas', 'Lucas', 'Rivera-Johnson', 'Luke', '2003-05-08', null, 'Berkeley, CA', 'Astrophysics Student', 'Junior at UC Berkeley. Amateur astrophotographer.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'),

    // Generation 3 - Kevin & Priya's Children
    p('rc-arjun', 'Arjun', 'Chen', null, '2006-03-12', null, 'Palo Alto, CA', 'High School Senior', 'Varsity swimmer and robotics club captain.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
    p('rc-anya', 'Anya', 'Chen', null, '2009-11-23', null, 'Palo Alto, CA', 'High School Freshman', 'Competitive debate champion and aspiring fiction novelist.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'),

    // Generation 3 - Gabriel & Isabella's Children
    p('rc-camila', 'Camila', 'Rivera-Rossi', 'Cami', '2017-08-04', null, 'San Francisco, CA', 'Elementary Student', 'Loves ballet, painting, and visits to her great-grandfather Carlos workshop.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'),
    p('rc-mateo-jr', 'Mateo', 'Rivera-Rossi', 'Teo', '2020-04-16', null, 'San Francisco, CA', 'Kindergarten', 'Named after his beloved uncle Mateo.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'),

    // Generation 4 - Chloe & Liam's Child
    p('rc-leo', 'Leo', 'OConnor-Rivera', null, '2024-02-14', null, 'Oakland, CA', 'Baby', 'The youngest 4th-generation blessing in the Rivera-Chen family.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'),
  ];

  const rel = (
    id: string,
    personAId: string,
    personBId: string,
    type: 'parent_child' | 'spouse' | 'sibling',
    subtype: 'biological' | 'step' | 'adoptive' | 'half' = 'biological'
  ): Relationship => ({
    id,
    treeId,
    personAId,
    personBId,
    type,
    subtype,
    startDate: null,
    endDate: null,
    createdAt: new Date().toISOString(),
  });

  const relationships: Relationship[] = [
    // Carlos & Rosa (Marriage 1)
    rel('rc-r1', 'rc-carlos', 'rc-rosa', 'spouse', 'biological'),
    rel('rc-r2', 'rc-carlos', 'rc-mateo', 'parent_child', 'biological'),
    rel('rc-r3', 'rc-rosa', 'rc-mateo', 'parent_child', 'biological'),
    rel('rc-r4', 'rc-carlos', 'rc-elena', 'parent_child', 'biological'),
    rel('rc-r5', 'rc-rosa', 'rc-elena', 'parent_child', 'biological'),
    rel('rc-r6', 'rc-mateo', 'rc-elena', 'sibling', 'biological'),

    // Carlos & Carmen (Marriage 2 - Blended)
    rel('rc-r7', 'rc-carlos', 'rc-carmen', 'spouse', 'biological'),
    rel('rc-r8', 'rc-carlos', 'rc-gabriel', 'parent_child', 'biological'),
    rel('rc-r9', 'rc-carmen', 'rc-gabriel', 'parent_child', 'biological'),
    rel('rc-r10', 'rc-mateo', 'rc-gabriel', 'sibling', 'half'),
    rel('rc-r11', 'rc-elena', 'rc-gabriel', 'sibling', 'half'),
    rel('rc-r12', 'rc-carmen', 'rc-mateo', 'parent_child', 'step'),
    rel('rc-r13', 'rc-carmen', 'rc-elena', 'parent_child', 'step'),

    // David & Shu-Fen (Chen Patriarchs)
    rel('rc-r14', 'rc-david', 'rc-shufen', 'spouse', 'biological'),
    rel('rc-r15', 'rc-david', 'rc-mei', 'parent_child', 'biological'),
    rel('rc-r16', 'rc-shufen', 'rc-mei', 'parent_child', 'biological'),
    rel('rc-r17', 'rc-david', 'rc-kevin', 'parent_child', 'biological'),
    rel('rc-r18', 'rc-shufen', 'rc-kevin', 'parent_child', 'biological'),
    rel('rc-r19', 'rc-david', 'rc-albert', 'parent_child', 'biological'),
    rel('rc-r20', 'rc-shufen', 'rc-albert', 'parent_child', 'biological'),
    rel('rc-r21', 'rc-mei', 'rc-kevin', 'sibling', 'biological'),
    rel('rc-r22', 'rc-kevin', 'rc-albert', 'sibling', 'biological'),

    // Mateo & Mei (The central multicultural union)
    rel('rc-r23', 'rc-mateo', 'rc-mei', 'spouse', 'biological'),
    rel('rc-r24', 'rc-mei', 'rc-chloe', 'parent_child', 'biological'),
    rel('rc-r25', 'rc-mateo', 'rc-chloe', 'parent_child', 'adoptive'), // Adoptive father
    rel('rc-r26', 'rc-mateo', 'rc-sofia', 'parent_child', 'biological'),
    rel('rc-r27', 'rc-mei', 'rc-sofia', 'parent_child', 'biological'),
    rel('rc-r28', 'rc-mateo', 'rc-diego', 'parent_child', 'biological'),
    rel('rc-r29', 'rc-mei', 'rc-diego', 'parent_child', 'biological'),
    rel('rc-r30', 'rc-sofia', 'rc-diego', 'sibling', 'biological'), // Twins
    rel('rc-r31', 'rc-chloe', 'rc-sofia', 'sibling', 'half'),

    // Elena & Marcus
    rel('rc-r32', 'rc-elena', 'rc-marcus', 'spouse', 'biological'),
    rel('rc-r33', 'rc-elena', 'rc-maya', 'parent_child', 'biological'),
    rel('rc-r34', 'rc-marcus', 'rc-maya', 'parent_child', 'biological'),
    rel('rc-r35', 'rc-elena', 'rc-lucas', 'parent_child', 'biological'),
    rel('rc-r36', 'rc-marcus', 'rc-lucas', 'parent_child', 'biological'),

    // Kevin & Priya
    rel('rc-r37', 'rc-kevin', 'rc-priya', 'spouse', 'biological'),
    rel('rc-r38', 'rc-kevin', 'rc-arjun', 'parent_child', 'biological'),
    rel('rc-r39', 'rc-priya', 'rc-arjun', 'parent_child', 'biological'),
    rel('rc-r40', 'rc-kevin', 'rc-anya', 'parent_child', 'biological'),
    rel('rc-r41', 'rc-priya', 'rc-anya', 'parent_child', 'biological'),

    // Gabriel & Isabella
    rel('rc-r42', 'rc-gabriel', 'rc-isabella', 'spouse', 'biological'),
    rel('rc-r43', 'rc-gabriel', 'rc-camila', 'parent_child', 'biological'),
    rel('rc-r44', 'rc-isabella', 'rc-camila', 'parent_child', 'biological'),
    rel('rc-r45', 'rc-gabriel', 'rc-mateo-jr', 'parent_child', 'biological'),
    rel('rc-r46', 'rc-isabella', 'rc-mateo-jr', 'parent_child', 'biological'),

    // Generation 4: Chloe & Liam
    rel('rc-r47', 'rc-chloe', 'rc-liam', 'spouse', 'biological'),
    rel('rc-r48', 'rc-chloe', 'rc-leo', 'parent_child', 'biological'),
    rel('rc-r49', 'rc-liam', 'rc-leo', 'parent_child', 'biological'),
  ];

  return {
    tree: {
      id: treeId,
      ownerId: 'user-demo',
      name: 'The Rivera-Chen Family',
      slug: 'rivera-chen',
      description: 'A 4-generation multicultural blended family spanning Mexico City, Taipei, and California with step, half, and adoptive branches.',
      settings: { isPublic: true, allowClaiming: false, theme: 'light' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    people,
    relationships,
  };
}
