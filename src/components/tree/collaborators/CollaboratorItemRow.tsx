'use client';

import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TreeCollaborator, CollaboratorRole } from '@/types/tree';
import { ROLE_DETAILS } from '@/lib/permissions';

export type CollaboratorItemRowProps = {
  collab: TreeCollaborator;
  canManage: boolean;
  onRoleChange: (collabId: string, newRole: CollaboratorRole) => void;
  onRemove: (collabId: string, email: string) => void;
};

export default function CollaboratorItemRow({
  collab,
  canManage,
  onRoleChange,
  onRemove,
}: CollaboratorItemRowProps) {
  const initials = collab.email.substring(0, 2).toUpperCase();
  const isPending = collab.status === 'pending';

  return (
    <div className="p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="w-8 h-8 border">
          <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-foreground truncate">
              {collab.invitedByName || collab.email.split('@')[0]}
            </p>
            {isPending && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 text-amber-600 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40"
              >
                <Clock className="w-2.5 h-2.5 mr-0.5" /> Pending
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">
            {collab.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {canManage ? (
          <select
            value={collab.role}
            onChange={(e) => onRoleChange(collab.id, e.target.value as CollaboratorRole)}
            className="h-7 px-2 text-[11px] font-medium rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${
              ROLE_DETAILS[collab.role]?.badgeColor || ''
            }`}
          >
            {collab.role}
          </Badge>
        )}

        {canManage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(collab.id, collab.email)}
            className="w-7 h-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            title="Remove collaborator"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
