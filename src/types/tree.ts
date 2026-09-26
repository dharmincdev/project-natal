export type MilestoneType =
  | 'marriage'
  | 'birth'
  | 'divorce'
  | 'graduation'
  | 'retirement'
  | 'achievement'
  | 'memorial'
  | 'other';

export type Milestone = {
  id: string;
  type: MilestoneType;
  date: string;
  description: string;
  submittedBy: 'self' | 'admin';
  location?: string;
};

export type Gender = 'male' | 'female' | 'other' | 'unknown';

export type Person = {
  id: string;
  treeId: string;
  firstName: string;
  lastName: string;
  maidenName?: string | null;
  nickname: string | null;
  gender?: Gender | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  photoUrl: string | null;
  bio: string | null;
  customFields: Record<string, string>;
  milestones: Milestone[];
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
};

export type RelationshipType = 'parent_child' | 'spouse' | 'sibling';

export type RelationshipSubtype = 'biological' | 'step' | 'adoptive' | 'half';

export type Relationship = {
  id: string;
  treeId: string;
  personAId: string;
  personBId: string;
  type: RelationshipType;
  subtype: RelationshipSubtype;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

export type TreeSettings = {
  isPublic: boolean;
  allowClaiming: boolean;
  theme: string;
};

export type FamilyTree = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  settings: TreeSettings;
  createdAt: string;
  updatedAt: string;
};

export type UserTier = 'free' | 'onetime' | 'pro';

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  tier: UserTier;
  createdAt: string;
};

export type TreeData = {
  tree: FamilyTree;
  people: Person[];
  relationships: Relationship[];
};

export const TIER_LIMITS = {
  free: { maxPeople: 25, hasAiChat: false, hasQrCode: false, hasPrint: false, visualizationModes: ['flat'] as const },
  onetime: { maxPeople: 100, hasAiChat: false, hasQrCode: true, hasPrint: true, visualizationModes: ['flat', '3d', 'timeline', 'world'] as const },
  pro: { maxPeople: Infinity, hasAiChat: true, hasQrCode: true, hasPrint: true, visualizationModes: ['flat', '3d', 'timeline', 'world'] as const },
} as const;

export type TierLimits = typeof TIER_LIMITS;
export type TierConfig = TierLimits[UserTier];
export type VisualizationMode = TierLimits[UserTier]['visualizationModes'][number];
