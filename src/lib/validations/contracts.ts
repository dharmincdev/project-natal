import { z } from 'zod';

/**
 * Zod validation schemas matching PostgreSQL column types & SPEC.md §3 domain models.
 */

export const treeSettingsSchema = z.object({
  isPublic: z.boolean().default(true),
  allowClaiming: z.boolean().default(false),
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  livingPrivacyRedaction: z.boolean().default(true),
});

export const treeSchema = z.object({
  name: z.string().trim().min(1, 'Tree name is required').max(100, 'Tree name cannot exceed 100 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').nullable().optional(),
  settings: treeSettingsSchema.default({ isPublic: true, allowClaiming: false, theme: 'light', livingPrivacyRedaction: true }),
});

export const createTreeSchema = treeSchema;
export const updateTreeSchema = treeSchema.partial();

export const genderSchema = z.enum(['male', 'female', 'other']).nullable().optional();

export const milestoneSchema = z.object({
  id: z.string(),
  type: z.string(),
  date: z.string(),
  description: z.string(),
  location: z.string().optional(),
  submittedBy: z.string().optional(),
});

export const vaultAttachmentSchema = z.object({
  id: z.string(),
  type: z.enum(['audio', 'document', 'certificate', 'photo_archive']),
  title: z.string().min(1),
  description: z.string().optional(),
  url: z.string().min(1),
  durationSeconds: z.number().optional(),
  fileSize: z.number().optional(),
  fileName: z.string().optional(),
  recordedAt: z.string().optional(),
  uploadedAt: z.string(),
});

export const personSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().max(100).default(''),
  maidenName: z.string().trim().max(100).nullable().optional(),
  nickname: z.string().trim().max(100).nullable().optional(),
  gender: genderSchema,
  birthDate: z.string().nullable().optional(),
  deathDate: z.string().nullable().optional(),
  birthPlace: z.string().trim().max(255).nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  bio: z.string().trim().max(5000).nullable().optional(),
  customFields: z.record(z.string(), z.string()).default({}),
  milestones: z.array(milestoneSchema).default([]),
  attachments: z.array(vaultAttachmentSchema).default([]),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
});

export const createPersonSchema = personSchema;
export const updatePersonSchema = personSchema.partial();

export const relationshipTypeSchema = z.enum(['parent_child', 'spouse', 'sibling']);
export const relationshipSubtypeSchema = z.enum(['biological', 'step', 'adoptive', 'half']);

export const relationshipSchema = z.object({
  personAId: z.string().min(1, 'First person ID is required'),
  personBId: z.string().min(1, 'Second person ID is required'),
  type: relationshipTypeSchema,
  subtype: relationshipSubtypeSchema.default('biological'),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export const createRelationshipSchema = relationshipSchema;

export const stripeCheckoutSchema = z.object({
  targetTier: z.enum(['onetime', 'pro'], {
    error: 'Invalid target tier selected; must be "onetime" or "pro"',
  }),
  userId: z.string().optional(),
  userEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  successUrl: z.string().url('Invalid success URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional(),
});
