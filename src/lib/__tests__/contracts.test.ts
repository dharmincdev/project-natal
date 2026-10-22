import { describe, it, expect } from 'vitest';
import {
  treeSchema,
  personSchema,
  relationshipSchema,
  stripeCheckoutSchema,
} from '@/lib/validations/contracts';

describe('Strict Zod Runtime Validation Schemas (SPEC §3 & §7)', () => {
  describe('treeSchema', () => {
    it('validates a valid tree creation payload', () => {
      const valid = {
        name: 'Smith Family Tree',
        slug: 'smith-family',
        description: '3 generations of Smiths',
        settings: { isPublic: true, allowClaiming: false, theme: 'light' as const },
      };
      const result = treeSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an empty tree name', () => {
      const invalid = {
        name: '   ',
        slug: 'valid-slug',
      };
      const result = treeSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid slug characters (spaces, special symbols, uppercase)', () => {
      const invalidSlugs = ['Smith Family', 'smith_family', 'smith/family', 'SMITH'];
      for (const slug of invalidSlugs) {
        const result = treeSchema.safeParse({ name: 'Valid Name', slug });
        expect(result.success).toBe(false);
      }
    });
  });

  describe('personSchema', () => {
    it('validates a complete person payload', () => {
      const valid = {
        firstName: 'Robert',
        lastName: 'Smith',
        nickname: 'Bob',
        gender: 'male' as const,
        birthDate: '1945-05-12',
        deathDate: null,
        birthPlace: 'Chicago, IL',
        bio: 'Civil Engineer',
        positionX: 100,
        positionY: 200,
      };
      const result = personSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects missing or whitespace-only first name', () => {
      const invalid = {
        firstName: '  ',
        lastName: 'Smith',
      };
      const result = personSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid gender option', () => {
      const invalid = {
        firstName: 'Alex',
        gender: 'invalid-gender',
      };
      const result = personSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('relationshipSchema', () => {
    it('validates a valid parent_child relationship', () => {
      const valid = {
        personAId: 'p-1',
        personBId: 'p-2',
        type: 'parent_child' as const,
        subtype: 'biological' as const,
      };
      const result = relationshipSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects missing personAId or personBId', () => {
      const invalid = {
        personAId: '',
        personBId: 'p-2',
        type: 'spouse' as const,
      };
      const result = relationshipSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects invalid relationship type', () => {
      const invalid = {
        personAId: 'p-1',
        personBId: 'p-2',
        type: 'cousin', // Not a root relationship type
      };
      const result = relationshipSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('stripeCheckoutSchema', () => {
    it('validates onetime and pro checkout requests', () => {
      const onetime = {
        targetTier: 'onetime',
        userId: 'user-123',
        userEmail: 'user@example.com',
      };
      const pro = {
        targetTier: 'pro',
        userEmail: 'pro@example.com',
      };
      expect(stripeCheckoutSchema.safeParse(onetime).success).toBe(true);
      expect(stripeCheckoutSchema.safeParse(pro).success).toBe(true);
    });

    it('rejects free or unknown tiers', () => {
      expect(stripeCheckoutSchema.safeParse({ targetTier: 'free' }).success).toBe(false);
      expect(stripeCheckoutSchema.safeParse({ targetTier: 'enterprise' }).success).toBe(false);
    });

    it('rejects malformed email addresses', () => {
      const invalid = {
        targetTier: 'pro',
        userEmail: 'not-an-email',
      };
      expect(stripeCheckoutSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
