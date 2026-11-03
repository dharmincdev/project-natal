import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import {
  assertNotBlobUrl,
  uploadVaultAsset,
} from '@/lib/supabase/storage';
import {
  personToRow,
  rowToPerson,
  relationshipToRow,
  rowToRelationship,
  saveTreeDataToSupabase,
} from '@/lib/supabase/db';
import { applyRealtimeTreeEvent, getPeerColor } from '@/lib/supabase/realtime';
import { getInitialSmithTreeData } from '@/data/fixtures/smith-family';
import { GET as getTrees, POST as postTree } from '@/app/api/trees/route';
import {
  GET as getTreeById,
  PATCH as patchTreeById,
  DELETE as deleteTreeById,
} from '@/app/api/trees/[id]/route';
import { POST as postCollaboratorInvite } from '@/app/api/collaborators/invite/route';
import { SupabaseClient } from '@supabase/supabase-js';

describe('Project 6: Production Supabase Backend, Storage, Realtime & APIs (PRO-21..31)', () => {
  describe('Migration 004_production_backend.sql Invariants (PRO-28, PRO-29, PRO-31)', () => {
    const sqlPath = path.join(process.cwd(), 'supabase/migrations/004_production_backend.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    it('provisions vault-audio, vault-docs, and avatars storage buckets (PRO-29)', () => {
      expect(sql).toContain("'vault-audio'");
      expect(sql).toContain("'vault-docs'");
      expect(sql).toContain("'avatars'");
      expect(sql).toContain('insert into storage.buckets');
    });

    it('enforces self-relationship CHECK constraint and DAG cycle trigger (PRO-31)', () => {
      expect(sql).toContain('chk_no_self_relationship');
      expect(sql).toContain('check (person_a_id <> person_b_id)');
      expect(sql).toContain('trg_prevent_relationship_cycle');
      expect(sql).toContain('CYCLE_DETECTED');
    });

    it('enforces BEFORE INSERT tier capacity trigger on people (PRO-31)', () => {
      expect(sql).toContain('enforce_tree_member_limit');
      expect(sql).toContain('trg_enforce_tree_member_limit');
      expect(sql).toContain('TIER_LIMIT_EXCEEDED');
    });

    it('defines atomic import_gedcom_tree RPC function (PRO-28)', () => {
      expect(sql).toContain('create or replace function public.import_gedcom_tree');
      expect(sql).toContain('delete from public.relationships where tree_id = v_tree_id');
      expect(sql).toContain('delete from public.people where tree_id = v_tree_id');
    });
  });

  describe('Supabase Storage Helper & Ephemeral Blob Guard (PRO-29)', () => {
    it('rejects ephemeral browser blob: URLs via assertNotBlobUrl', () => {
      expect(() => assertNotBlobUrl('blob:http://localhost:3001/abc-123')).toThrow(
        /EPHEMERAL_BLOB_URL_FORBIDDEN/
      );
      expect(assertNotBlobUrl('https://xyz.supabase.co/storage/v1/object/public/vault-audio/1.webm')).toContain(
        'https://'
      );
    });

    it('converts uploaded audio/docs to non-blob Base64 Data URLs in offline fallback mode', async () => {
      const sampleBlob = new Blob(['test-document-payload'], { type: 'text/plain' });
      const res = await uploadVaultAsset({
        bucket: 'vault-docs',
        treeId: 'smith-family',
        personId: 'p-1',
        file: sampleBlob,
        fileName: 'census-1950.txt',
      });

      expect(res.storageMode).toBe('base64-fallback');
      expect(res.url.startsWith('data:')).toBe(true);
      expect(res.url.startsWith('blob:')).toBe(false);
    });
  });

  describe('Granular CRUD & SQL Deletion Reconciliation in db.ts (PRO-28)', () => {
    it('round-trips Person and Relationship rows without data loss', () => {
      const smith = getInitialSmithTreeData();
      const person = smith.people[0];
      const row = personToRow(person, smith.tree.id);
      const restored = rowToPerson(row);
      expect(restored.id).toBe(person.id);
      expect(restored.firstName).toBe(person.firstName);

      const rel = smith.relationships[0];
      const relRow = relationshipToRow(rel, smith.tree.id);
      const restoredRel = rowToRelationship(relRow);
      expect(restoredRel.id).toBe(rel.id);
      expect(restoredRel.type).toBe(rel.type);
    });

    it('reconciles and deletes removed people and relationships in SQL during saveTreeDataToSupabase', async () => {
      const smith = getInitialSmithTreeData();
      const deletedRelIds: string[][] = [];
      const deletedPersonIds: string[][] = [];

      const mockClient = {
        from: (table: string) => {
          if (table === 'family_trees') {
            return {
              upsert: async () => ({ error: null }),
            };
          }
          if (table === 'relationships') {
            return {
              select: () => ({
                eq: async () => ({
                  data: [{ id: smith.relationships[0].id }, { id: 'zombie-rel-999' }],
                  error: null,
                }),
              }),
              delete: () => ({
                eq: () => ({
                  in: async (_col: string, ids: string[]) => {
                    deletedRelIds.push(ids);
                    return { error: null };
                  },
                }),
              }),
              upsert: async () => ({ error: null }),
            };
          }
          if (table === 'people') {
            return {
              select: () => ({
                eq: async () => ({
                  data: [{ id: smith.people[0].id }, { id: 'zombie-person-888' }],
                  error: null,
                }),
              }),
              delete: () => ({
                eq: () => ({
                  in: async (_col: string, ids: string[]) => {
                    deletedPersonIds.push(ids);
                    return { error: null };
                  },
                }),
              }),
              upsert: async () => ({ error: null }),
            };
          }
          return {};
        },
      } as unknown as SupabaseClient;

      const ok = await saveTreeDataToSupabase(smith, 'user-1', mockClient);
      expect(ok).toBe(true);
      expect(deletedRelIds[0]).toContain('zombie-rel-999');
      expect(deletedPersonIds[0]).toContain('zombie-person-888');
    });
  });

  describe('Protected /api/trees & /api/trees/[id] Route Handlers (PRO-28, PRO-31)', () => {
    it('GET /api/trees returns sample trees in local mode', async () => {
      const res = await getTrees();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.trees)).toBe(true);
      expect(data.trees.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /api/trees validates schema and creates a new tree', async () => {
      const validReq = new NextRequest('http://localhost:3001/api/trees', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Patel Lineage',
          slug: 'patel-lineage',
          description: 'Four generations from Gujarat to Chicago',
        }),
      });
      const res = await postTree(validReq);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.tree.slug).toBe('patel-lineage');
    });

    it('GET /api/trees/[id] retrieves Smith Family tree data', async () => {
      const req = new NextRequest('http://localhost:3001/api/trees/smith-family');
      const res = await getTreeById(req, { params: Promise.resolve({ id: 'smith-family' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.treeData.people.length).toBe(10);
    });

    it('PATCH /api/trees/[id] enforces Free tier 25-member capacity limit (PRO-31)', async () => {
      const req = new NextRequest('http://localhost:3001/api/trees/smith-family', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'upsert_person',
          person: {
            firstName: 'Overflow',
            lastName: 'Relative',
          },
          currentPeopleCount: 25,
          tier: 'free',
        }),
      });
      const res = await patchTreeById(req, { params: Promise.resolve({ id: 'smith-family' }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('TIER_LIMIT_EXCEEDED');
    });

    it('PATCH /api/trees/[id] rejects self-parent / DAG cycle relationships with HTTP 422 (PRO-31)', async () => {
      const req = new NextRequest('http://localhost:3001/api/trees/smith-family', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'create_relationship',
          relationship: {
            personAId: 'p-1',
            personBId: 'p-1',
            type: 'parent_child',
            subtype: 'biological',
          },
        }),
      });
      const res = await patchTreeById(req, { params: Promise.resolve({ id: 'smith-family' }) });
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.code).toBe('CYCLE_DETECTED');
    });

    it('DELETE /api/trees/[id] enforces Owner-only deletion (RBAC)', async () => {
      const forbiddenReq = new NextRequest('http://localhost:3001/api/trees/smith-family', {
        method: 'DELETE',
        headers: {
          'x-demo-user-id': 'editor-user',
          'x-tree-owner-id': 'owner-user',
        },
      });
      const res = await deleteTreeById(forbiddenReq, {
        params: Promise.resolve({ id: 'smith-family' }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe('Realtime Tree Event Reducer & Collaborator Invite API (PRO-23, PRO-30)', () => {
    it('applies node_move and person_delete realtime events deterministically', () => {
      const initial = getInitialSmithTreeData();
      const targetId = initial.people[0].id;

      const moved = applyRealtimeTreeEvent(initial, {
        type: 'node_move',
        senderId: 'peer-2',
        personId: targetId,
        position: { x: 420, y: 180 },
      });
      const movedPerson = moved.people.find((p) => p.id === targetId)!;
      expect(movedPerson.positionX).toBe(420);
      expect(movedPerson.positionY).toBe(180);

      const afterDelete = applyRealtimeTreeEvent(moved, {
        type: 'person_delete',
        senderId: 'peer-2',
        personId: targetId,
      });
      expect(afterDelete.people.some((p) => p.id === targetId)).toBe(false);
      expect(getPeerColor('peer-2')).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('POST /api/collaborators/invite validates email and returns pending collaborator + inviteUrl', async () => {
      const req = new NextRequest('http://localhost:3001/api/collaborators/invite', {
        method: 'POST',
        body: JSON.stringify({
          treeId: 'smith-family',
          treeSlug: 'smith-family',
          treeName: 'The Smith Family',
          email: 'Cousin.Elena@SmithFamily.org',
          role: 'editor',
          invitedBy: 'user-owner',
          invitedByName: 'Robert Smith',
        }),
      });
      const res = await postCollaboratorInvite(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.collaborator.email).toBe('cousin.elena@smithfamily.org');
      expect(data.collaborator.role).toBe('editor');
      expect(data.collaborator.status).toBe('pending');
      expect(data.inviteUrl).toContain('/t/smith-family?invite=');
    });
  });
});

