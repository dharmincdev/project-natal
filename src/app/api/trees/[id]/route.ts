import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchTreeDataFromSupabase,
  fetchTreeCollaboratorsFromSupabase,
  upsertPersonInSupabase,
  updateNodePositionsInSupabase,
  deletePersonFromSupabase,
  createRelationshipInSupabase,
  deleteRelationshipFromSupabase,
  deleteTreeFromSupabase,
  importGedcomTreeToSupabase,
} from '@/lib/supabase/db';
import {
  personSchema,
  relationshipSchema,
  updateTreeSchema,
} from '@/lib/validations/contracts';
import {
  canViewTree,
  canEditTree,
  canDeleteTree,
  isTreeRedactedForUser,
} from '@/lib/permissions';
import { redactTreeForPublic } from '@/lib/privacy';
import { validateRelationship } from '@/lib/tree-utils';
import { SAMPLE_TREES } from '@/lib/storage';
import { Person, Relationship, TreeData, TIER_LIMITS, UserTier } from '@/types/tree';

const granularMutationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('upsert_person'),
    person: personSchema.extend({
      id: z.string().optional(),
      treeId: z.string().optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    }),
    currentPeopleCount: z.number().optional(),
    tier: z.enum(['free', 'onetime', 'pro']).optional(),
  }),
  z.object({
    action: z.literal('update_positions'),
    positions: z.array(
      z.object({
        id: z.string().min(1),
        positionX: z.number(),
        positionY: z.number(),
        customFields: z.record(z.string(), z.string()).optional(),
      })
    ),
  }),
  z.object({
    action: z.literal('delete_person'),
    personId: z.string().min(1),
  }),
  z.object({
    action: z.literal('create_relationship'),
    relationship: relationshipSchema.extend({
      id: z.string().optional(),
      treeId: z.string().optional(),
      createdAt: z.string().optional(),
    }),
    existingRelationships: z
      .array(
        relationshipSchema.extend({
          id: z.string(),
          treeId: z.string(),
          createdAt: z.string(),
        })
      )
      .optional(),
  }),
  z.object({
    action: z.literal('delete_relationship'),
    relationshipId: z.string().min(1),
  }),
  z.object({
    action: z.literal('import_gedcom'),
    treeData: z.object({
      tree: z.object({
        id: z.string(),
        ownerId: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().nullable(),
        settings: z.object({
          isPublic: z.boolean(),
          allowClaiming: z.boolean(),
          theme: z.string(),
          livingPrivacyRedaction: z.boolean().optional(),
        }),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
      people: z.array(z.any()),
      relationships: z.array(z.any()),
    }),
  }),
  z.object({
    action: z.literal('update_tree'),
    updates: updateTreeSchema,
  }),
]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/trees/[id]
 * Retrieves a tree by ID or slug, enforcing RBAC and living-person privacy redaction for guests.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser();
    const treeData = await fetchTreeDataFromSupabase(id, supabase);

    if (!treeData) {
      return NextResponse.json({ error: 'Family tree not found.' }, { status: 404 });
    }

    const collaborators = await fetchTreeCollaboratorsFromSupabase(treeData.tree.id, supabase);
    if (!canViewTree(user, treeData.tree, collaborators)) {
      return NextResponse.json(
        { error: 'Forbidden: This family tree is private.' },
        { status: 403 }
      );
    }

    const shouldRedact =
      isTreeRedactedForUser(user, treeData.tree, collaborators) &&
      treeData.tree.settings.livingPrivacyRedaction !== false;

    return NextResponse.json(
      {
        treeData: shouldRedact ? redactTreeForPublic(treeData) : treeData,
        redacted: shouldRedact,
        mode: 'cloud',
      },
      { status: 200 }
    );
  }

  // Fallback for sample trees in local/demo mode
  const sample = SAMPLE_TREES.find(
    (s) => s.slug === id || s.getData().tree.id === id
  );
  if (!sample) {
    return NextResponse.json({ error: 'Family tree not found.' }, { status: 404 });
  }

  return NextResponse.json(
    { treeData: sample.getData(), redacted: false, mode: 'local' },
    { status: 200 }
  );
}

/**
 * PATCH /api/trees/[id]
 * Executes granular tree mutations (PRO-28) with Zod validation, DAG cycle checks,
 * tier capacity enforcement (PRO-31), and RBAC authorization.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: treeId } = await context.params;

  try {
    const body = await request.json();
    const parsed = granularMutationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid granular mutation payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const now = new Date().toISOString();

    // Server-side RBAC check when Supabase is configured
    const supabase = isSupabaseConfigured() ? await createSupabaseServerClient() : null;
    const user = isSupabaseConfigured() ? await getAuthenticatedUser() : null;

    if (isSupabaseConfigured() && supabase) {
      const existingTree = await fetchTreeDataFromSupabase(treeId, supabase);
      if (existingTree) {
        const collaborators = await fetchTreeCollaboratorsFromSupabase(existingTree.tree.id, supabase);
        if (!canEditTree(user, existingTree.tree, collaborators)) {
          return NextResponse.json(
            { error: 'Forbidden: Editor, Admin, or Owner permission required.' },
            { status: 403 }
          );
        }
      }
    }

    switch (payload.action) {
      case 'upsert_person': {
        const tier: UserTier = payload.tier || 'free';
        const maxPeople = TIER_LIMITS[tier].maxPeople;
        if (
          typeof payload.currentPeopleCount === 'number' &&
          !payload.person.id &&
          payload.currentPeopleCount >= maxPeople
        ) {
          return NextResponse.json(
            {
              error: `TIER_LIMIT_EXCEEDED: Tree has reached maximum member capacity (${maxPeople}) for the ${tier} tier.`,
              code: 'TIER_LIMIT_EXCEEDED',
            },
            { status: 403 }
          );
        }

        const person: Person = {
          id: payload.person.id || `p-${uuidv4().slice(0, 8)}`,
          treeId: payload.person.treeId || treeId,
          firstName: payload.person.firstName,
          lastName: payload.person.lastName || '',
          maidenName: payload.person.maidenName ?? null,
          nickname: payload.person.nickname ?? null,
          gender: payload.person.gender ?? null,
          birthDate: payload.person.birthDate ?? null,
          deathDate: payload.person.deathDate ?? null,
          birthPlace: payload.person.birthPlace ?? null,
          photoUrl: payload.person.photoUrl ?? null,
          bio: payload.person.bio ?? null,
          customFields: payload.person.customFields || {},
          milestones: (payload.person.milestones as Person['milestones']) || [],
          attachments: (payload.person.attachments as Person['attachments']) || [],
          positionX: payload.person.positionX ?? 0,
          positionY: payload.person.positionY ?? 0,
          createdAt: payload.person.createdAt || now,
          updatedAt: now,
        };

        if (supabase && user) {
          const saved = await upsertPersonInSupabase(person, supabase);
          return NextResponse.json({ person: saved || person, mode: 'cloud' }, { status: 200 });
        }

        return NextResponse.json({ person, mode: 'local' }, { status: 200 });
      }

      case 'update_positions': {
        if (supabase && user) {
          await updateNodePositionsInSupabase(treeId, payload.positions, supabase);
          return NextResponse.json(
            { updated: payload.positions.length, mode: 'cloud' },
            { status: 200 }
          );
        }
        return NextResponse.json(
          { updated: payload.positions.length, mode: 'local' },
          { status: 200 }
        );
      }

      case 'delete_person': {
        if (supabase && user) {
          await deletePersonFromSupabase(treeId, payload.personId, supabase);
          return NextResponse.json(
            { deletedPersonId: payload.personId, mode: 'cloud' },
            { status: 200 }
          );
        }
        return NextResponse.json(
          { deletedPersonId: payload.personId, mode: 'local' },
          { status: 200 }
        );
      }

      case 'create_relationship': {
        const existingRels: Relationship[] = payload.existingRelationships
          ? payload.existingRelationships.map((r) => ({
              ...r,
              startDate: r.startDate ?? null,
              endDate: r.endDate ?? null,
            }))
          : [];

        const validation = validateRelationship(payload.relationship, existingRels);
        if (!validation.isValid) {
          return NextResponse.json(
            { error: validation.error, code: validation.code },
            { status: 422 }
          );
        }

        const relationship: Relationship = {
          id: payload.relationship.id || `rel-${uuidv4().slice(0, 8)}`,
          treeId: payload.relationship.treeId || treeId,
          personAId: payload.relationship.personAId,
          personBId: payload.relationship.personBId,
          type: payload.relationship.type,
          subtype: payload.relationship.subtype,
          startDate: payload.relationship.startDate ?? null,
          endDate: payload.relationship.endDate ?? null,
          createdAt: payload.relationship.createdAt || now,
        };

        if (supabase && user) {
          const saved = await createRelationshipInSupabase(relationship, existingRels, supabase);
          return NextResponse.json(
            { relationship: saved || relationship, mode: 'cloud' },
            { status: 201 }
          );
        }

        return NextResponse.json({ relationship, mode: 'local' }, { status: 201 });
      }

      case 'delete_relationship': {
        if (supabase && user) {
          await deleteRelationshipFromSupabase(treeId, payload.relationshipId, supabase);
          return NextResponse.json(
            { deletedRelationshipId: payload.relationshipId, mode: 'cloud' },
            { status: 200 }
          );
        }
        return NextResponse.json(
          { deletedRelationshipId: payload.relationshipId, mode: 'local' },
          { status: 200 }
        );
      }

      case 'import_gedcom': {
        const imported = payload.treeData as TreeData;
        if (supabase && user) {
          await importGedcomTreeToSupabase(imported, user.id, supabase);
          return NextResponse.json(
            {
              imported: true,
              peopleCount: imported.people.length,
              relationshipsCount: imported.relationships.length,
              mode: 'cloud',
            },
            { status: 200 }
          );
        }
        return NextResponse.json(
          {
            imported: true,
            peopleCount: imported.people.length,
            relationshipsCount: imported.relationships.length,
            mode: 'local',
          },
          { status: 200 }
        );
      }

      case 'update_tree': {
        return NextResponse.json(
          { treeId, updates: payload.updates, updatedAt: now },
          { status: 200 }
        );
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Mutation failed.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trees/[id]
 * Deletes a family tree after verifying strict Owner authorization (SPEC.md §6.2).
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: treeId } = await context.params;

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser();
    const existingTree = await fetchTreeDataFromSupabase(treeId, supabase);

    if (!existingTree) {
      return NextResponse.json({ error: 'Family tree not found.' }, { status: 404 });
    }

    if (!canDeleteTree(user, existingTree.tree)) {
      return NextResponse.json(
        { error: 'Forbidden: Only the tree Owner can delete a family tree.' },
        { status: 403 }
      );
    }

    await deleteTreeFromSupabase(existingTree.tree.id, supabase);
    return NextResponse.json({ deletedTreeId: existingTree.tree.id, mode: 'cloud' }, { status: 200 });
  }

  // In demo/test mode, check optional x-demo-user-id and x-tree-owner-id headers for RBAC testing
  const demoUserId = request.headers.get('x-demo-user-id');
  const treeOwnerId = request.headers.get('x-tree-owner-id');
  if (demoUserId && treeOwnerId && demoUserId !== treeOwnerId) {
    return NextResponse.json(
      { error: 'Forbidden: Only the tree Owner can delete a family tree.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ deletedTreeId: treeId, mode: 'local' }, { status: 200 });
}
