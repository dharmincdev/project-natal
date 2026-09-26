import { Person, Relationship, TreeData } from '@/types/tree';

export function getInitialHouseTargaryenTreeData(): TreeData {
  const treeId = 'tree-house-targaryen';

  const p = (
    id: string,
    firstName: string,
    lastName: string,
    nickname: string | null,
    birthDate: string | null,
    deathDate: string | null,
    birthPlace: string | null,
    title: string,
    dragon: string | null,
    bio: string,
    photoUrl: string
  ): Person => {
    const customFields: Record<string, string> = { Title: title };
    if (dragon) customFields.Dragon = dragon;

    return {
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
      customFields,
      milestones: [],
      positionX: 0,
      positionY: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const people: Person[] = [
    // Generation 1: The Conquest
    p('tg-aegon-1', 'Aegon I', 'Targaryen', 'The Conqueror', '0027-01-01', '0037-01-01', 'Dragonstone', 'Lord of the Seven Kingdoms', 'Balerion the Black Dread', 'First Lord of the Seven Kingdoms and King on the Iron Throne. Unified Westeros alongside his sister-wives.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),
    p('tg-visenya', 'Visenya', 'Targaryen', null, '0029-01-01', '0044-01-01', 'Dragonstone', 'Queen of the Seven Kingdoms', 'Vhagar', 'Elder sister-wife to Aegon. Fierce warrior who wielded the Valyrian steel sword Dark Sister.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'),
    p('tg-rhaenys-1', 'Rhaenys', 'Targaryen', null, '0025-01-01', '0010-01-01', 'Dragonstone', 'Queen of the Seven Kingdoms', 'Meraxes', 'Younger sister-wife to Aegon. Beloved for her grace, music, and love of flying before falling in Dorne.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'),

    // Generation 2: Sons of the Dragon
    p('tg-aenys-1', 'Aenys I', 'Targaryen', null, '0007-01-01', '0042-01-01', 'King\'s Landing', 'King on the Iron Throne', 'Quicksilver', 'Second Targaryen king, son of Aegon and Rhaenys. Gentle, cultured, but faced religious uprisings.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
    p('tg-alyssa-v', 'Alyssa', 'Velaryon', null, '0007-01-01', '0054-01-01', 'Driftmark', 'Queen Dowager', null, 'Queen of Aenys I and mother of King Jaehaerys I. Known for her cunning political resilience.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'),
    p('tg-maegor-1', 'Maegor I', 'Targaryen', 'The Cruel', '0012-01-01', '0048-01-01', 'Dragonstone', 'King on the Iron Throne', 'Balerion the Black Dread', 'Son of Aegon and Visenya. Brutally crushed the Faith Militant and oversaw the completion of the Red Keep.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'),

    // Generation 3: The Golden Age
    p('tg-jaehaerys-1', 'Jaehaerys I', 'Targaryen', 'The Conciliator', '0034-01-01', '0103-01-01', 'King\'s Landing', 'King on the Iron Throne', 'Vermithor (The Bronze Fury)', 'Longest-reigning Targaryen monarch (55 years). Built the Kingsroad, unified royal law, and presided over Westeros’ golden age.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'),
    p('tg-alysanne', 'Alysanne', 'Targaryen', 'Good Queen Alysanne', '0036-01-01', '0100-01-01', 'Dragonstone', 'Queen of the Seven Kingdoms', 'Silverwing', 'Beloved sister-wife of Jaehaerys. Abolished the lord’s right to the first night and doubled the Night’s Watch gift.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'),

    // Generation 4: Princes of Dragonstone
    p('tg-aemon', 'Aemon', 'Targaryen', null, '0055-01-01', '0092-01-01', 'King\'s Landing', 'Prince of Dragonstone', 'Caraxes', 'Eldest surviving son and heir to Jaehaerys I. Master of Laws and father to Rhaenys.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'),
    p('tg-jocelyn', 'Jocelyn', 'Baratheon', null, '0054-01-01', '0115-01-01', 'Storm\'s End', 'Princess of Dragonstone', null, 'Half-sister of Jaehaerys I and mother of Princess Rhaenys.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'),
    p('tg-baelon', 'Baelon', 'Targaryen', 'The Brave', '0057-01-01', '0101-01-01', 'King\'s Landing', 'Hand of the King', 'Vhagar', 'Famous knight and Prince of Dragonstone. Slew the Dornish invaders and served as Hand to his father.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
    p('tg-alyssa-t', 'Alyssa', 'Targaryen', null, '0060-01-01', '0084-01-01', 'King\'s Landing', 'Princess', 'Meleys (The Red Queen)', 'Sister-wife of Baelon. Renowned warrior princess who took her infant sons riding on her dragon.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'),

    // Generation 5: The Dance of the Dragons Era
    p('tg-rhaenys-queen', 'Rhaenys', 'Targaryen', 'The Queen Who Never Was', '0074-01-01', '0129-01-01', 'Driftmark', 'Princess', 'Meleys (The Red Queen)', 'Passed over for the Iron Throne at the Great Council of 101 AC. Fierce dragonrider and Lady of Driftmark.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'),
    p('tg-corlys', 'Corlys', 'Velaryon', 'The Sea Snake', '0053-01-01', '0132-01-01', 'High Tide', 'Lord of the Tides', null, 'Greatest mariner of the Seven Kingdoms whose nine voyages brought immense wealth to House Velaryon.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'),
    
    p('tg-viserys-1', 'Viserys I', 'Targaryen', 'The Peaceful', '0077-01-01', '0129-01-01', 'King\'s Landing', 'King on the Iron Throne', 'Balerion (Last Rider)', 'Fifth king of Westeros. Reigned over prosperity and appointed his daughter Rhaenyra as his chosen heir.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'),
    p('tg-aemma', 'Aemma', 'Arryn', null, '0082-01-01', '0105-01-01', 'The Eyrie', 'Queen of the Seven Kingdoms', null, 'First Queen of Viserys I and beloved mother of Princess Rhaenyra.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'),
    p('tg-alicent', 'Alicent', 'Hightower', null, '0088-01-01', '0133-01-01', 'Oldtown', 'Queen Dowager', null, 'Second Queen of Viserys I. Champion of the "Greens" faction and mother to King Aegon II.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'),
    p('tg-daemon', 'Daemon', 'Targaryen', 'The Rogue Prince', '0081-01-01', '0130-01-01', 'King\'s Landing', 'Prince of the City', 'Caraxes (The Blood Wyrm)', 'Legendary and unpredictable warrior. Commander of the City Watch, husband to Rhaenyra, and king of the Stepstones.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),

    // Generation 6: Dance Contenders
    p('tg-rhaenyra', 'Rhaenyra', 'Targaryen', 'The Realm\'s Delight', '0097-01-01', '0130-01-01', 'Dragonstone', 'Queen of the Seven Kingdoms', 'Syrax', 'Designated heir of Viserys I and leader of the "Blacks" during the Dance of the Dragons civil war.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'),
    p('tg-laenor', 'Laenor', 'Velaryon', null, '0094-01-01', '0120-01-01', 'Driftmark', 'Knight of Driftmark', 'Seasmoke', 'First husband of Princess Rhaenyra and son of the Sea Snake.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
    p('tg-laena', 'Laena', 'Velaryon', null, '0092-01-01', '0120-01-01', 'Driftmark', 'Lady of Driftmark', 'Vhagar', 'Daughter of Corlys and Rhaenys. Claimed the largest dragon in the world and married Prince Daemon.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'),

    // The Green Claimants (Alicent's Children)
    p('tg-aegon-2', 'Aegon II', 'Targaryen', 'The Usurper', '0107-01-01', '0131-01-01', 'King\'s Landing', 'King on the Iron Throne', 'Sunfyre the Golden', 'Crowned King by the Greens in opposition to his elder half-sister Rhaenyra.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'),
    p('tg-helaena', 'Helaena', 'Targaryen', null, '0109-01-01', '0130-01-01', 'King\'s Landing', 'Queen of the Seven Kingdoms', 'Dreamfyre', 'Beloved by the smallfolk, gentle sister-wife of Aegon II with mysterious prophetic foresight.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80'),
    p('tg-aemond', 'Aemond', 'Targaryen', 'One-Eye', '0110-01-01', '0130-01-01', 'King\'s Landing', 'Prince Regent', 'Vhagar', 'Fierce Green warrior who claimed Vhagar as a boy. Mortal rival to Prince Daemon.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'),

    // Generation 7: The Heirs
    p('tg-jacaerys', 'Jacaerys', 'Velaryon', 'Jace', '0114-01-01', '0129-01-01', 'Dragonstone', 'Prince of Dragonstone', 'Vermax', 'Eldest son of Rhaenyra. Capable diplomat who secured the North and the Vale for the Blacks.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),
    p('tg-lucerys', 'Lucerys', 'Velaryon', 'Luke', '0115-01-01', '0129-01-01', 'Dragonstone', 'Heir to Driftmark', 'Arrax', 'Second son of Rhaenyra whose tragic death at Shipbreaker Bay ignited the war.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
    p('tg-aegon-3', 'Aegon III', 'Targaryen', 'The Dragonbane', '0120-01-01', '0157-01-01', 'Dragonstone', 'King on the Iron Throne', 'Stormcloud', 'Son of Rhaenyra and Daemon. Reunited the realm after the Dance; saw the death of the last dragons.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'),
    p('tg-viserys-2', 'Viserys II', 'Targaryen', null, '0122-01-01', '0172-01-01', 'Dragonstone', 'Hand & King', null, 'Clever son of Rhaenyra and Daemon. Guided the realm as Hand through three reigns before ruling himself.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'),

    // Modern Era (Late Dynasty down to ASOIAF)
    p('tg-aerys-2', 'Aerys II', 'Targaryen', 'The Mad King', '0244-01-01', '0283-01-01', 'King\'s Landing', 'King on the Iron Throne', null, 'Last Targaryen king to sit the Iron Throne before Robert\'s Rebellion.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'),
    p('tg-rhaella', 'Rhaella', 'Targaryen', null, '0245-01-01', '0284-01-01', 'King\'s Landing', 'Queen of the Seven Kingdoms', null, 'Sister-wife of Aerys II and mother of Rhaegar, Viserys, and Daenerys.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'),
    p('tg-rhaegar', 'Rhaegar', 'Targaryen', 'The Last Dragon', '0259-01-01', '0283-01-01', 'Summerhall', 'Prince of Dragonstone', null, 'Chivalrous prince, singer, and tournament champion whose union with Lyanna Stark triggered rebellion.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),
    p('tg-lyanna', 'Lyanna', 'Stark', null, '0267-01-01', '0283-01-01', 'Winterfell', 'Lady of Winterfell', null, 'Beloved daughter of Lord Rickard Stark and secret mother of Jon Snow.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'),
    p('tg-viserys-beggar', 'Viserys', 'Targaryen', 'The Beggar King', '0276-01-01', '0298-01-01', 'King\'s Landing', 'Exiled Prince', null, 'Brother of Daenerys who sought to regain the Iron Throne with Dothraki aid.', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'),
    p('tg-daenerys', 'Daenerys', 'Targaryen', 'Stormborn / Mother of Dragons', '0284-05-19', null, 'Dragonstone', 'Queen of Meereen & Westeros', 'Drogon (The Black Dread Reborn)', 'Breaker of Chains, Mother of Dragons, and youngest child of King Aerys II.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'),
    p('tg-jon-snow', 'Aegon / Jon', 'Targaryen (Snow)', 'The White Wolf', '0283-08-01', null, 'Tower of Joy, Dorne', 'King in the North', 'Rhaegal', 'Secret son of Prince Rhaegar Targaryen and Lyanna Stark. Lord Commander of the Night\'s Watch.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
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
    // Generation 1: Aegon & Sister-Wives
    rel('tg-r1', 'tg-aegon-1', 'tg-visenya', 'spouse', 'biological'),
    rel('tg-r2', 'tg-aegon-1', 'tg-rhaenys-1', 'spouse', 'biological'),
    rel('tg-r3', 'tg-aegon-1', 'tg-aenys-1', 'parent_child', 'biological'),
    rel('tg-r4', 'tg-rhaenys-1', 'tg-aenys-1', 'parent_child', 'biological'),
    rel('tg-r5', 'tg-aegon-1', 'tg-maegor-1', 'parent_child', 'biological'),
    rel('tg-r6', 'tg-visenya', 'tg-maegor-1', 'parent_child', 'biological'),
    rel('tg-r7', 'tg-aenys-1', 'tg-maegor-1', 'sibling', 'half'),

    // Generation 2: Aenys & Alyssa
    rel('tg-r8', 'tg-aenys-1', 'tg-alyssa-v', 'spouse', 'biological'),
    rel('tg-r9', 'tg-aenys-1', 'tg-jaehaerys-1', 'parent_child', 'biological'),
    rel('tg-r10', 'tg-alyssa-v', 'tg-jaehaerys-1', 'parent_child', 'biological'),
    rel('tg-r11', 'tg-aenys-1', 'tg-alysanne', 'parent_child', 'biological'),
    rel('tg-r12', 'tg-alyssa-v', 'tg-alysanne', 'parent_child', 'biological'),
    rel('tg-r13', 'tg-jaehaerys-1', 'tg-alysanne', 'sibling', 'biological'),

    // Generation 3: Jaehaerys & Alysanne
    rel('tg-r14', 'tg-jaehaerys-1', 'tg-alysanne', 'spouse', 'biological'),
    rel('tg-r15', 'tg-jaehaerys-1', 'tg-aemon', 'parent_child', 'biological'),
    rel('tg-r16', 'tg-alysanne', 'tg-aemon', 'parent_child', 'biological'),
    rel('tg-r17', 'tg-jaehaerys-1', 'tg-baelon', 'parent_child', 'biological'),
    rel('tg-r18', 'tg-alysanne', 'tg-baelon', 'parent_child', 'biological'),
    rel('tg-r19', 'tg-jaehaerys-1', 'tg-alyssa-t', 'parent_child', 'biological'),
    rel('tg-r20', 'tg-alysanne', 'tg-alyssa-t', 'parent_child', 'biological'),
    rel('tg-r21', 'tg-aemon', 'tg-baelon', 'sibling', 'biological'),

    // Generation 4: Aemon & Jocelyn
    rel('tg-r22', 'tg-aemon', 'tg-jocelyn', 'spouse', 'biological'),
    rel('tg-r23', 'tg-aemon', 'tg-rhaenys-queen', 'parent_child', 'biological'),
    rel('tg-r24', 'tg-jocelyn', 'tg-rhaenys-queen', 'parent_child', 'biological'),

    // Generation 4: Baelon & Alyssa
    rel('tg-r25', 'tg-baelon', 'tg-alyssa-t', 'spouse', 'biological'),
    rel('tg-r26', 'tg-baelon', 'tg-viserys-1', 'parent_child', 'biological'),
    rel('tg-r27', 'tg-alyssa-t', 'tg-viserys-1', 'parent_child', 'biological'),
    rel('tg-r28', 'tg-baelon', 'tg-daemon', 'parent_child', 'biological'),
    rel('tg-r29', 'tg-alyssa-t', 'tg-daemon', 'parent_child', 'biological'),
    rel('tg-r30', 'tg-viserys-1', 'tg-daemon', 'sibling', 'biological'),

    // Rhaenys Queen & Corlys Velaryon
    rel('tg-r31', 'tg-rhaenys-queen', 'tg-corlys', 'spouse', 'biological'),
    rel('tg-r32', 'tg-rhaenys-queen', 'tg-laenor', 'parent_child', 'biological'),
    rel('tg-r33', 'tg-corlys', 'tg-laenor', 'parent_child', 'biological'),
    rel('tg-r34', 'tg-rhaenys-queen', 'tg-laena', 'parent_child', 'biological'),
    rel('tg-r35', 'tg-corlys', 'tg-laena', 'parent_child', 'biological'),

    // Viserys I & Aemma Arryn
    rel('tg-r36', 'tg-viserys-1', 'tg-aemma', 'spouse', 'biological'),
    rel('tg-r37', 'tg-viserys-1', 'tg-rhaenyra', 'parent_child', 'biological'),
    rel('tg-r38', 'tg-aemma', 'tg-rhaenyra', 'parent_child', 'biological'),

    // Viserys I & Alicent Hightower
    rel('tg-r39', 'tg-viserys-1', 'tg-alicent', 'spouse', 'biological'),
    rel('tg-r40', 'tg-viserys-1', 'tg-aegon-2', 'parent_child', 'biological'),
    rel('tg-r41', 'tg-alicent', 'tg-aegon-2', 'parent_child', 'biological'),
    rel('tg-r42', 'tg-viserys-1', 'tg-helaena', 'parent_child', 'biological'),
    rel('tg-r43', 'tg-alicent', 'tg-helaena', 'parent_child', 'biological'),
    rel('tg-r44', 'tg-viserys-1', 'tg-aemond', 'parent_child', 'biological'),
    rel('tg-r45', 'tg-alicent', 'tg-aemond', 'parent_child', 'biological'),
    rel('tg-r46', 'tg-aegon-2', 'tg-helaena', 'spouse', 'biological'), // Sibling marriage

    // Rhaenyra & Laenor Velaryon
    rel('tg-r47', 'tg-rhaenyra', 'tg-laenor', 'spouse', 'biological'),
    rel('tg-r48', 'tg-rhaenyra', 'tg-jacaerys', 'parent_child', 'biological'),
    rel('tg-r49', 'tg-laenor', 'tg-jacaerys', 'parent_child', 'biological'),
    rel('tg-r50', 'tg-rhaenyra', 'tg-lucerys', 'parent_child', 'biological'),
    rel('tg-r51', 'tg-laenor', 'tg-lucerys', 'parent_child', 'biological'),

    // Daemon & Laena Velaryon
    rel('tg-r52', 'tg-daemon', 'tg-laena', 'spouse', 'biological'),

    // Daemon & Rhaenyra Targaryen (Uncle-Niece marriage)
    rel('tg-r53', 'tg-daemon', 'tg-rhaenyra', 'spouse', 'biological'),
    rel('tg-r54', 'tg-daemon', 'tg-aegon-3', 'parent_child', 'biological'),
    rel('tg-r55', 'tg-rhaenyra', 'tg-aegon-3', 'parent_child', 'biological'),
    rel('tg-r56', 'tg-daemon', 'tg-viserys-2', 'parent_child', 'biological'),
    rel('tg-r57', 'tg-rhaenyra', 'tg-viserys-2', 'parent_child', 'biological'),
    rel('tg-r58', 'tg-aegon-3', 'tg-viserys-2', 'sibling', 'biological'),

    // Lineage Bridge: Viserys II ➔ Aerys II (connecting Late Dynasty)
    rel('tg-r-bridge', 'tg-viserys-2', 'tg-aerys-2', 'parent_child', 'biological'),

    // Late Dynasty: Aerys II & Rhaella
    rel('tg-r59', 'tg-aerys-2', 'tg-rhaella', 'spouse', 'biological'),
    rel('tg-r60', 'tg-aerys-2', 'tg-rhaegar', 'parent_child', 'biological'),
    rel('tg-r61', 'tg-rhaella', 'tg-rhaegar', 'parent_child', 'biological'),
    rel('tg-r62', 'tg-aerys-2', 'tg-viserys-beggar', 'parent_child', 'biological'),
    rel('tg-r63', 'tg-rhaella', 'tg-viserys-beggar', 'parent_child', 'biological'),
    rel('tg-r64', 'tg-aerys-2', 'tg-daenerys', 'parent_child', 'biological'),
    rel('tg-r65', 'tg-rhaella', 'tg-daenerys', 'parent_child', 'biological'),
    rel('tg-r66', 'tg-rhaegar', 'tg-daenerys', 'sibling', 'biological'),

    // Rhaegar & Lyanna ➔ Jon Snow (Aegon)
    rel('tg-r67', 'tg-rhaegar', 'tg-lyanna', 'spouse', 'biological'),
    rel('tg-r68', 'tg-rhaegar', 'tg-jon-snow', 'parent_child', 'biological'),
    rel('tg-r69', 'tg-lyanna', 'tg-jon-snow', 'parent_child', 'biological'),
  ];

  return {
    tree: {
      id: treeId,
      ownerId: 'user-demo',
      name: 'House Targaryen Dynasty',
      slug: 'house-targaryen',
      description: 'The royal lineage of the dragonlords of Westeros, spanning Aegon the Conqueror through the Dance of the Dragons down to Daenerys Stormborn and Jon Snow.',
      settings: { isPublic: true, allowClaiming: false, theme: 'dark' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    people,
    relationships,
  };
}
