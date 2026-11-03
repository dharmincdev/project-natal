import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchUserTreesFromSupabase, FamilyTreeRow, rowToFamilyTree } from '@/lib/supabase/db';
import { createTreeSchema } from '@/lib/validations/contracts';
import { SAMPLE_TREES } from '@/lib/storage';
import { FamilyTree } from '@/types/tree';

/**
 * GET /api/trees
 * Lists the authenticated user's family trees from Supabase, or sample trees when in demo mode.
 */
export async function GET() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to list user trees.' },
        { status: 401 }
      );
    }

    const trees = await fetchUserTreesFromSupabase(user.id, supabase);
    return NextResponse.json({ trees, mode: 'cloud' }, { status: 200 });
  }

  const sampleTrees: FamilyTree[] = SAMPLE_TREES.map((s) => s.getData().tree);
  return NextResponse.json({ trees: sampleTrees, mode: 'local' }, { status: 200 });
}

/**
 * POST /api/trees
 * Creates a new family tree with Zod validation and server-side ownership enforcement.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTreeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid tree creation payload',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const treeId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : `tree-${uuidv4().slice(0, 8)}`;

    if (isSupabaseConfigured()) {
      const supabase = await createSupabaseServerClient();
      const user = await getAuthenticatedUser();

      if (!user || !supabase) {
        return NextResponse.json(
          { error: 'Authentication required to create a cloud family tree.' },
          { status: 401 }
        );
      }

      const row: FamilyTreeRow = {
        id: treeId,
        owner_id: user.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        settings: parsed.data.settings,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('family_trees')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(
        { tree: rowToFamilyTree(data as FamilyTreeRow), mode: 'cloud' },
        { status: 201 }
      );
    }

    // Demo / Offline mode fallback
    const tree: FamilyTree = {
      id: treeId,
      ownerId: typeof body.ownerId === 'string' ? body.ownerId : 'demo-user',
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      settings: parsed.data.settings,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ tree, mode: 'local' }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create tree.' },
      { status: 500 }
    );
  }
}

