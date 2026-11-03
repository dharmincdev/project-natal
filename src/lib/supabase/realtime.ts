'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from './client';
import { Person, Relationship, TreeData } from '@/types/tree';

export type PresencePeer = {
  userId: string;
  name: string;
  email: string;
  color: string;
  onlineAt: string;
  selectedPersonId?: string | null;
};

export type RealtimeTreeEvent =
  | {
      type: 'person_upsert';
      senderId: string;
      person: Person;
    }
  | {
      type: 'person_delete';
      senderId: string;
      personId: string;
    }
  | {
      type: 'relationship_upsert';
      senderId: string;
      relationship: Relationship;
    }
  | {
      type: 'relationship_delete';
      senderId: string;
      relationshipId: string;
    }
  | {
      type: 'node_move';
      senderId: string;
      personId: string;
      position: { x: number; y: number };
    }
  | {
      type: 'tree_sync';
      senderId: string;
      treeData: TreeData;
    };

const PEER_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export function getPeerColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PEER_COLORS[Math.abs(hash) % PEER_COLORS.length];
}

export type UseTreeRealtimeOptions = {
  treeId: string;
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  selectedPersonId?: string | null;
  onRemoteTreeEvent?: (event: RealtimeTreeEvent) => void;
};

/**
 * Applies a RealtimeTreeEvent to an existing TreeData snapshot immutably.
 */
export function applyRealtimeTreeEvent(prev: TreeData, event: RealtimeTreeEvent): TreeData {
  switch (event.type) {
    case 'person_upsert': {
      const exists = prev.people.some((p) => p.id === event.person.id);
      return {
        ...prev,
        people: exists
          ? prev.people.map((p) => (p.id === event.person.id ? event.person : p))
          : [...prev.people, event.person],
      };
    }
    case 'person_delete': {
      return {
        ...prev,
        people: prev.people.filter((p) => p.id !== event.personId),
        relationships: prev.relationships.filter(
          (r) => r.personAId !== event.personId && r.personBId !== event.personId
        ),
      };
    }
    case 'relationship_upsert': {
      const exists = prev.relationships.some((r) => r.id === event.relationship.id);
      return {
        ...prev,
        relationships: exists
          ? prev.relationships.map((r) =>
              r.id === event.relationship.id ? event.relationship : r
            )
          : [...prev.relationships, event.relationship],
      };
    }
    case 'relationship_delete': {
      return {
        ...prev,
        relationships: prev.relationships.filter((r) => r.id !== event.relationshipId),
      };
    }
    case 'node_move': {
      return {
        ...prev,
        people: prev.people.map((p) =>
          p.id === event.personId
            ? {
                ...p,
                positionX: event.position.x,
                positionY: event.position.y,
                customFields: {
                  ...p.customFields,
                  _manualPos: 'true',
                },
              }
            : p
        ),
      };
    }
    case 'tree_sync': {
      return event.treeData;
    }
  }
}

/**
 * Live Multi-User Collaboration & Presence Hook (PRO-30).
 * Connects to Supabase Realtime channel `tree:${treeId}` with Presence tracking
 * and broadcast events, plus a browser BroadcastChannel bridge for multi-tab sync.
 */
export function useTreeRealtime({
  treeId,
  currentUser,
  selectedPersonId,
  onRemoteTreeEvent,
}: UseTreeRealtimeOptions) {
  const [activePeers, setActivePeers] = useState<PresencePeer[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const onRemoteEventRef = useRef(onRemoteTreeEvent);
  const sessionPeerIdRef = useRef<string>(
    currentUser?.id || `peer-${Math.random().toString(36).slice(2, 8)}`
  );

  useEffect(() => {
    onRemoteEventRef.current = onRemoteTreeEvent;
  }, [onRemoteTreeEvent]);

  useEffect(() => {
    if (currentUser?.id) {
      sessionPeerIdRef.current = currentUser.id;
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!treeId) return;

    const peerId = currentUser?.id || sessionPeerIdRef.current;
    const peerName =
      currentUser?.name ||
      currentUser?.email?.split('@')[0] ||
      'Family Archivist';
    const peerEmail = currentUser?.email || 'guest@natal.app';
    const peerMeta: PresencePeer = {
      userId: peerId,
      name: peerName,
      email: peerEmail,
      color: getPeerColor(peerId),
      onlineAt: new Date().toISOString(),
      selectedPersonId: selectedPersonId ?? null,
    };

    // Always seed local presence immediately so active session is reflected
    setActivePeers([peerMeta]);
    setIsConnected(true);

    // 1. Setup Supabase Realtime Channel if configured
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const channel = supabase.channel(`tree:${treeId}`, {
        config: {
          presence: { key: peerId },
        },
      });
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresencePeer>();
          const peers: PresencePeer[] = [];
          Object.values(state).forEach((entries) => {
            entries.forEach((entry) => {
              if (entry.userId) {
                peers.push(entry);
              }
            });
          });
          setActivePeers(peers.length > 0 ? peers : [peerMeta]);
        })
        .on('broadcast', { event: 'tree_mutation' }, ({ payload }) => {
          const event = payload as RealtimeTreeEvent;
          if (event && event.senderId !== peerId && onRemoteEventRef.current) {
            onRemoteEventRef.current(event);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            await channel.track(peerMeta);
          }
        });
    }

    // 2. Setup local BroadcastChannel for instant multi-tab sync
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel(`natal_tree_${treeId}`);
        broadcastChannelRef.current = bc;
        bc.onmessage = (msg) => {
          const event = msg.data as RealtimeTreeEvent | undefined;
          if (event && event.senderId !== peerId && onRemoteEventRef.current) {
            onRemoteEventRef.current(event);
          }
        };
      } catch {
        // Ignore if BroadcastChannel is unsupported in environment
      }
    }

    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [treeId, currentUser?.id, currentUser?.name, currentUser?.email, selectedPersonId]);

  const broadcastTreeEvent = useCallback(
    (
      event:
        | Omit<Extract<RealtimeTreeEvent, { type: 'person_upsert' }>, 'senderId'>
        | Omit<Extract<RealtimeTreeEvent, { type: 'person_delete' }>, 'senderId'>
        | Omit<Extract<RealtimeTreeEvent, { type: 'relationship_upsert' }>, 'senderId'>
        | Omit<Extract<RealtimeTreeEvent, { type: 'relationship_delete' }>, 'senderId'>
        | Omit<Extract<RealtimeTreeEvent, { type: 'node_move' }>, 'senderId'>
        | Omit<Extract<RealtimeTreeEvent, { type: 'tree_sync' }>, 'senderId'>
    ) => {
      const fullEvent = {
        ...event,
        senderId: currentUser?.id || sessionPeerIdRef.current,
      } as RealtimeTreeEvent;

      if (channelRef.current) {
        channelRef.current
          .send({
            type: 'broadcast',
            event: 'tree_mutation',
            payload: fullEvent,
          })
          .catch(() => {});
      }

      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage(fullEvent);
        } catch {
          // Ignore closed channel errors
        }
      }
    },
    [currentUser?.id]
  );

  return {
    activePeers,
    isConnected,
    broadcastTreeEvent,
  };
}

