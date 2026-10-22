'use client';

import React from 'react';
import { Users, Crown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TreeCollaborator, CollaboratorRole } from '@/types/tree';
import { ROLE_DETAILS } from '@/lib/permissions';
import CollaboratorItemRow from './CollaboratorItemRow';

export type CollaboratorsListProps = {
  collaborators: TreeCollaborator[];
  canManage: boolean;
  onRoleChange: (collabId: string, newRole: CollaboratorRole) => void;
  onRemove: (collabId: string, email: string) => void;
};

export default function CollaboratorsList({
  collaborators,
  canManage,
  onRoleChange,
  onRemove,
}: CollaboratorsListProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Active Members &amp; Contributors ({collaborators.length + 1})
        </label>
      </div>

      <div className="divide-y border rounded-xl overflow-hidden bg-card">
        {/* Owner Row */}
        <div className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-8 h-8 border">
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                OW
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-foreground truncate">
                  Tree Creator
                </p>
                <Crown className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Primary family tree administrator
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${ROLE_DETAILS.owner.badgeColor}`}
          >
            Owner
          </Badge>
        </div>

        {/* Collaborators Rows */}
        {collaborators.map((collab) => (
          <CollaboratorItemRow
            key={collab.id}
            collab={collab}
            canManage={canManage}
            onRoleChange={onRoleChange}
            onRemove={onRemove}
          />
        ))}

        {collaborators.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p>No external collaborators invited yet.</p>
            <p className="text-[11px] mt-0.5">Use the invite form above to add family members.</p>
          </div>
        )}
      </div>
    </div>
  );
}
