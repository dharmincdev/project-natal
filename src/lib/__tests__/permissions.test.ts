import { describe, it, expect } from 'vitest';
import {
  getEffectiveTreeRole,
  canViewTree,
  canEditTree,
  canRecordAudioMemories,
  canExportGedcom,
  canImportGedcom,
  canManageCollaborators,
  canDeleteTree,
  isTreeRedactedForUser,
} from '../permissions';
import { FamilyTree, TreeCollaborator } from '@/types/tree';

describe('SPEC.md §6.2 Role-Based Access Control (RBAC) Matrix', () => {
  const sampleTree: FamilyTree = {
    id: 'tree-100',
    ownerId: 'user-owner',
    name: 'Harrison Family Tree',
    slug: 'harrison-family',
    description: 'Ancestral history',
    settings: {
      isPublic: true,
      allowClaiming: false,
      theme: 'light',
      livingPrivacyRedaction: true,
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const collaborators: TreeCollaborator[] = [
    {
      id: 'collab-1',
      treeId: 'tree-100',
      userId: 'user-admin',
      email: 'admin@family.org',
      role: 'admin',
      status: 'accepted',
      invitedBy: 'user-owner',
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'collab-2',
      treeId: 'tree-100',
      userId: 'user-editor',
      email: 'editor@family.org',
      role: 'editor',
      status: 'accepted',
      invitedBy: 'user-owner',
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'collab-3',
      treeId: 'tree-100',
      userId: 'user-viewer',
      email: 'viewer@family.org',
      role: 'viewer',
      status: 'accepted',
      invitedBy: 'user-owner',
      createdAt: '2026-01-02T00:00:00Z',
    },
  ];

  const ownerUser = { id: 'user-owner', email: 'owner@family.org' };
  const adminUser = { id: 'user-admin', email: 'admin@family.org' };
  const editorUser = { id: 'user-editor', email: 'editor@family.org' };
  const viewerUser = { id: 'user-viewer', email: 'viewer@family.org' };
  const guestUser = null;

  describe('Role Determination', () => {
    it('identifies tree owner correctly', () => {
      expect(getEffectiveTreeRole(ownerUser, sampleTree, collaborators)).toBe('owner');
    });

    it('identifies admin collaborator', () => {
      expect(getEffectiveTreeRole(adminUser, sampleTree, collaborators)).toBe('admin');
    });

    it('identifies editor collaborator', () => {
      expect(getEffectiveTreeRole(editorUser, sampleTree, collaborators)).toBe('editor');
    });

    it('identifies viewer collaborator', () => {
      expect(getEffectiveTreeRole(viewerUser, sampleTree, collaborators)).toBe('viewer');
    });

    it('identifies unauthenticated public visitor as guest', () => {
      expect(getEffectiveTreeRole(guestUser, sampleTree, collaborators)).toBe('guest');
    });
  });

  describe('Capability: Add / Edit / Move Relatives (canEditTree)', () => {
    it('allows owner, admin, and editor to edit tree', () => {
      expect(canEditTree(ownerUser, sampleTree, collaborators)).toBe(true);
      expect(canEditTree(adminUser, sampleTree, collaborators)).toBe(true);
      expect(canEditTree(editorUser, sampleTree, collaborators)).toBe(true);
    });

    it('denies viewer and guest from editing tree', () => {
      expect(canEditTree(viewerUser, sampleTree, collaborators)).toBe(false);
      expect(canEditTree(guestUser, sampleTree, collaborators)).toBe(false);
    });
  });

  describe('Capability: Record Oral History Audio Memories (canRecordAudioMemories)', () => {
    it('allows owner, admin, and editor to record oral history stories', () => {
      expect(canRecordAudioMemories(ownerUser, sampleTree, collaborators)).toBe(true);
      expect(canRecordAudioMemories(adminUser, sampleTree, collaborators)).toBe(true);
      expect(canRecordAudioMemories(editorUser, sampleTree, collaborators)).toBe(true);
    });

    it('denies viewer and guest from recording oral history stories', () => {
      expect(canRecordAudioMemories(viewerUser, sampleTree, collaborators)).toBe(false);
      expect(canRecordAudioMemories(guestUser, sampleTree, collaborators)).toBe(false);
    });
  });

  describe('Capability: GEDCOM Interoperability (canExportGedcom / canImportGedcom)', () => {
    it('allows owner, admin, editor, and viewer to export and import GEDCOM', () => {
      expect(canExportGedcom(ownerUser, sampleTree, collaborators)).toBe(true);
      expect(canExportGedcom(adminUser, sampleTree, collaborators)).toBe(true);
      expect(canExportGedcom(editorUser, sampleTree, collaborators)).toBe(true);
      expect(canExportGedcom(viewerUser, sampleTree, collaborators)).toBe(true);

      expect(canImportGedcom(ownerUser, sampleTree, collaborators)).toBe(true);
      expect(canImportGedcom(viewerUser, sampleTree, collaborators)).toBe(true);
    });

    it('denies unauthenticated guests from GEDCOM operations', () => {
      expect(canExportGedcom(guestUser, sampleTree, collaborators)).toBe(false);
      expect(canImportGedcom(guestUser, sampleTree, collaborators)).toBe(false);
    });
  });

  describe('Capability: Manage Collaborators (canManageCollaborators)', () => {
    it('allows owner and admin to manage collaborators', () => {
      expect(canManageCollaborators(ownerUser, sampleTree, collaborators)).toBe(true);
      expect(canManageCollaborators(adminUser, sampleTree, collaborators)).toBe(true);
    });

    it('denies editor, viewer, and guest from managing collaborators', () => {
      expect(canManageCollaborators(editorUser, sampleTree, collaborators)).toBe(false);
      expect(canManageCollaborators(viewerUser, sampleTree, collaborators)).toBe(false);
      expect(canManageCollaborators(guestUser, sampleTree, collaborators)).toBe(false);
    });
  });

  describe('Capability: Delete Tree (canDeleteTree)', () => {
    it('strictly permits only the owner to delete the tree', () => {
      expect(canDeleteTree(ownerUser, sampleTree)).toBe(true);
      expect(canDeleteTree(adminUser, sampleTree)).toBe(false);
      expect(canDeleteTree(editorUser, sampleTree)).toBe(false);
      expect(canDeleteTree(viewerUser, sampleTree)).toBe(false);
      expect(canDeleteTree(guestUser, sampleTree)).toBe(false);
    });
  });

  describe('Privacy Redaction Evaluation (isTreeRedactedForUser)', () => {
    it('redacts tree for unauthenticated public guests', () => {
      expect(isTreeRedactedForUser(guestUser, sampleTree, collaborators)).toBe(true);
    });

    it('does not redact tree for authenticated collaborators (viewer, editor, admin, owner)', () => {
      expect(isTreeRedactedForUser(viewerUser, sampleTree, collaborators)).toBe(false);
      expect(isTreeRedactedForUser(editorUser, sampleTree, collaborators)).toBe(false);
      expect(isTreeRedactedForUser(adminUser, sampleTree, collaborators)).toBe(false);
      expect(isTreeRedactedForUser(ownerUser, sampleTree, collaborators)).toBe(false);
    });
  });
});
