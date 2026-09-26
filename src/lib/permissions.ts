import { FamilyTree, TreeCollaborator, User, CollaboratorRole } from '@/types/tree';

export type EffectiveTreeRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';

export const ROLE_DETAILS: Record<
  CollaboratorRole | 'owner',
  {
    title: string;
    description: string;
    badgeColor: string;
  }
> = {
  owner: {
    title: 'Owner',
    description: 'Full ownership and administrative control over the tree.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
  },
  admin: {
    title: 'Admin',
    description: 'Can edit all records and invite or manage other contributors.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700',
  },
  editor: {
    title: 'Editor',
    description: 'Can add, edit, and connect family members, milestones, and bios.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700',
  },
  viewer: {
    title: 'Viewer',
    description: 'Can explore private family details and branches without editing.',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  },
};

/**
 * Determines the effective role of a user for a given family tree.
 */
export function getEffectiveTreeRole(
  user: { id?: string; email?: string } | null,
  tree: FamilyTree,
  collaborators: TreeCollaborator[] = []
): EffectiveTreeRole {
  // If no user is logged in
  if (!user) {
    // In local demo mode or unowned sample tree
    if (
      !tree.ownerId ||
      tree.ownerId === 'demo-user' ||
      tree.ownerId === 'local-user' ||
      tree.ownerId === 'user-demo' ||
      tree.slug === 'smith-family' ||
      tree.slug === 'rivera-chen' ||
      tree.slug === 'house-targaryen'
    ) {
      return 'owner';
    }
    return 'guest';
  }

  // Tree owner
  if (tree.ownerId === user.id) {
    return 'owner';
  }

  // Check collaborator list
  const collaborator = collaborators.find((c) => {
    if (user.id && c.userId && c.userId === user.id) return true;
    if (user.email && c.email.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  });

  if (collaborator) {
    return collaborator.role;
  }

  // Local demo or guest
  if (
    !tree.ownerId ||
    tree.ownerId === 'demo-user' ||
    tree.ownerId === 'local-user' ||
    tree.ownerId === 'user-demo' ||
    tree.slug === 'smith-family' ||
    tree.slug === 'rivera-chen' ||
    tree.slug === 'house-targaryen'
  ) {
    return 'owner';
  }

  return 'guest';
}

/**
 * Checks if the user has permission to add, edit, or delete family members.
 */
export function canEditTree(
  user: { id?: string; email?: string } | null,
  tree: FamilyTree,
  collaborators: TreeCollaborator[] = []
): boolean {
  const role = getEffectiveTreeRole(user, tree, collaborators);
  return role === 'owner' || role === 'admin' || role === 'editor';
}

/**
 * Checks if the user has permission to invite or manage collaborators.
 */
export function canManageCollaborators(
  user: { id?: string; email?: string } | null,
  tree: FamilyTree,
  collaborators: TreeCollaborator[] = []
): boolean {
  const role = getEffectiveTreeRole(user, tree, collaborators);
  return role === 'owner' || role === 'admin';
}

/**
 * Checks if the user has permission to delete the entire tree.
 */
export function canDeleteTree(
  user: { id?: string; email?: string } | null,
  tree: FamilyTree
): boolean {
  if (!user) {
    return !tree.ownerId || tree.ownerId === 'demo-user' || tree.ownerId === 'local-user';
  }
  return tree.ownerId === user.id;
}
