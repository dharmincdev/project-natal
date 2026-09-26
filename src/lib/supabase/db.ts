import { getSupabaseBrowserClient } from './client';
import { FamilyTree, Person, Relationship, TreeData, TreeCollaborator, CollaboratorRole, CollaboratorStatus } from '@/types/tree';

// Row types matching Supabase PostgreSQL tables
export type ProfileRow = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  tier: 'free' | 'onetime' | 'pro';
  created_at: string;
  updated_at: string;
};

export type FamilyTreeRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  settings: {
    isPublic: boolean;
    allowClaiming: boolean;
    theme: string;
  };
  created_at: string;
  updated_at: string;
};

export type PersonRow = {
  id: string;
  tree_id: string;
  first_name: string;
  last_name: string;
  maiden_name: string | null;
  nickname: string | null;
  gender: string | null;
  birth_date: string | null;
  death_date: string | null;
  birth_place: string | null;
  photo_url: string | null;
  bio: string | null;
  custom_fields: Record<string, string>;
  milestones: any[];
  attachments?: any[];
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
};

export type RelationshipRow = {
  id: string;
  tree_id: string;
  person_a_id: string;
  person_b_id: string;
  type: string;
  subtype: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

// Converters between DB Rows and Project Natal TypeScript Types
export function rowToFamilyTree(row: FamilyTreeRow): FamilyTree {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    settings: row.settings || { isPublic: true, allowClaiming: false, theme: 'default' },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToPerson(row: PersonRow): Person {
  return {
    id: row.id,
    treeId: row.tree_id,
    firstName: row.first_name,
    lastName: row.last_name || '',
    maidenName: row.maiden_name,
    nickname: row.nickname,
    gender: (row.gender as any) || null,
    birthDate: row.birth_date,
    deathDate: row.death_date,
    birthPlace: row.birth_place,
    photoUrl: row.photo_url,
    bio: row.bio,
    customFields: row.custom_fields || {},
    milestones: row.milestones || [],
    attachments: row.attachments || [],
    positionX: row.position_x || 0,
    positionY: row.position_y || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToRelationship(row: RelationshipRow): Relationship {
  return {
    id: row.id,
    treeId: row.tree_id,
    personAId: row.person_a_id,
    personBId: row.person_b_id,
    type: row.type as any,
    subtype: row.subtype as any,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
  };
}

/**
 * Fetch all family trees belonging to a user from Supabase.
 */
export async function fetchUserTreesFromSupabase(userId: string): Promise<FamilyTree[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];

  const { data, error } = await client
    .from('family_trees')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user trees from Supabase:', error);
    return [];
  }

  return (data as FamilyTreeRow[]).map(rowToFamilyTree);
}

/**
 * Fetch a complete TreeData (tree + people + relationships) by slug or ID.
 */
export async function fetchTreeDataFromSupabase(slugOrId: string): Promise<TreeData | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  // 1. Fetch tree
  const { data: treeData, error: treeError } = await client
    .from('family_trees')
    .select('*')
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .single();

  if (treeError || !treeData) {
    return null;
  }

  const tree = rowToFamilyTree(treeData as FamilyTreeRow);

  // 2. Fetch people
  const { data: peopleData, error: peopleError } = await client
    .from('people')
    .select('*')
    .eq('tree_id', tree.id);

  if (peopleError) {
    console.error('Error fetching people from Supabase:', peopleError);
    return null;
  }

  // 3. Fetch relationships
  const { data: relData, error: relError } = await client
    .from('relationships')
    .select('*')
    .eq('tree_id', tree.id);

  if (relError) {
    console.error('Error fetching relationships from Supabase:', relError);
    return null;
  }

  return {
    tree,
    people: (peopleData as PersonRow[]).map(rowToPerson),
    relationships: (relData as RelationshipRow[]).map(rowToRelationship),
  };
}

/**
 * Saves a complete TreeData to Supabase.
 */
export async function saveTreeDataToSupabase(treeData: TreeData, userId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const now = new Date().toISOString();

  // 1. Upsert tree
  const treeRow: FamilyTreeRow = {
    id: treeData.tree.id,
    owner_id: userId,
    name: treeData.tree.name,
    slug: treeData.tree.slug,
    description: treeData.tree.description,
    settings: treeData.tree.settings,
    created_at: treeData.tree.createdAt || now,
    updated_at: now,
  };

  const { error: treeError } = await client
    .from('family_trees')
    .upsert(treeRow, { onConflict: 'id' });

  if (treeError) {
    console.error('Error saving tree to Supabase:', treeError);
    return false;
  }

  // 2. Upsert people
  if (treeData.people.length > 0) {
    const peopleRows: PersonRow[] = treeData.people.map((p) => ({
      id: p.id,
      tree_id: treeData.tree.id,
      first_name: p.firstName,
      last_name: p.lastName || '',
      maiden_name: p.maidenName || null,
      nickname: p.nickname || null,
      gender: p.gender || null,
      birth_date: p.birthDate || null,
      death_date: p.deathDate || null,
      birth_place: p.birthPlace || null,
      photo_url: p.photoUrl || null,
      bio: p.bio || null,
      custom_fields: p.customFields || {},
      milestones: p.milestones || [],
      attachments: p.attachments || [],
      position_x: p.positionX || 0,
      position_y: p.positionY || 0,
      created_at: p.createdAt || now,
      updated_at: now,
    }));

    const { error: peopleError } = await client
      .from('people')
      .upsert(peopleRows, { onConflict: 'id' });

    if (peopleError) {
      console.error('Error saving people to Supabase:', peopleError);
      return false;
    }
  }

  // 3. Upsert relationships
  if (treeData.relationships.length > 0) {
    const relRows: RelationshipRow[] = treeData.relationships.map((r) => ({
      id: r.id,
      tree_id: treeData.tree.id,
      person_a_id: r.personAId,
      person_b_id: r.personBId,
      type: r.type,
      subtype: r.subtype,
      start_date: r.startDate || null,
      end_date: r.endDate || null,
      created_at: r.createdAt || now,
    }));

    const { error: relError } = await client
      .from('relationships')
      .upsert(relRows, { onConflict: 'id' });

    if (relError) {
      console.error('Error saving relationships to Supabase:', relError);
      return false;
    }
  }

  return true;
}

export type TreeCollaboratorRow = {
  id: string;
  tree_id: string;
  user_id: string | null;
  email: string;
  role: string;
  status: string;
  invited_by: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string | null;
    avatar_url: string | null;
  } | null;
};

export function rowToTreeCollaborator(row: TreeCollaboratorRow): TreeCollaborator {
  return {
    id: row.id,
    treeId: row.tree_id,
    userId: row.user_id,
    email: row.email,
    role: row.role as CollaboratorRole,
    status: row.status as CollaboratorStatus,
    invitedBy: row.invited_by,
    invitedByName: row.profiles?.name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all collaborators for a family tree from Supabase.
 */
export async function fetchTreeCollaboratorsFromSupabase(treeId: string): Promise<TreeCollaborator[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];

  const { data, error } = await client
    .from('tree_collaborators')
    .select(`
      *,
      profiles:user_id (name, avatar_url)
    `)
    .eq('tree_id', treeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching tree collaborators from Supabase:', error);
    return [];
  }

  return (data as TreeCollaboratorRow[]).map(rowToTreeCollaborator);
}

/**
 * Invites a new collaborator to a tree in Supabase.
 */
export async function inviteCollaboratorToSupabase(
  treeId: string,
  email: string,
  role: CollaboratorRole,
  invitedBy: string
): Promise<TreeCollaborator | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  // Check if user with this email already exists in profiles
  const { data: profileData } = await client
    .from('profiles')
    .select('id, name')
    .eq('email', email.trim().toLowerCase())
    .single();

  const insertPayload = {
    tree_id: treeId,
    email: email.trim().toLowerCase(),
    role,
    status: 'pending',
    invited_by: invitedBy,
    user_id: profileData?.id || null,
  };

  const { data, error } = await client
    .from('tree_collaborators')
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error('Error inviting collaborator to Supabase:', error);
    throw error;
  }

  return rowToTreeCollaborator(data as TreeCollaboratorRow);
}

/**
 * Updates a collaborator's role in Supabase.
 */
export async function updateCollaboratorRoleInSupabase(
  collaboratorId: string,
  role: CollaboratorRole
): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client
    .from('tree_collaborators')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', collaboratorId);

  if (error) {
    console.error('Error updating collaborator role in Supabase:', error);
    return false;
  }

  return true;
}

/**
 * Removes a collaborator from a tree in Supabase.
 */
export async function removeCollaboratorFromSupabase(collaboratorId: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client
    .from('tree_collaborators')
    .delete()
    .eq('id', collaboratorId);

  if (error) {
    console.error('Error removing collaborator from Supabase:', error);
    return false;
  }

  return true;
}
