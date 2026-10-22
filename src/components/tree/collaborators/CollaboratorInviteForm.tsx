'use client';

import React from 'react';
import { Mail, UserPlus, Edit3, Eye, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollaboratorRole } from '@/types/tree';

export type CollaboratorInviteFormProps = {
  emailInput: string;
  setEmailInput: (email: string) => void;
  selectedRole: CollaboratorRole;
  setSelectedRole: (role: CollaboratorRole) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  errorMsg: string | null;
  successMsg: string | null;
  canManage: boolean;
};

export default function CollaboratorInviteForm({
  emailInput,
  setEmailInput,
  selectedRole,
  setSelectedRole,
  onSubmit,
  isLoading,
  errorMsg,
  successMsg,
  canManage,
}: CollaboratorInviteFormProps) {
  if (!canManage) {
    return (
      <div className="p-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
        <span>You have Contributor access to this tree. Only Tree Owners and Admins can invite new members.</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
        Invite New Contributor
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="email"
            placeholder="relative@familyemail.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="pl-9 h-9 text-xs"
            disabled={isLoading}
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as CollaboratorRole)}
          className="h-9 px-3 text-xs rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-32"
          disabled={isLoading}
        >
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>

        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !emailInput.trim()}
          className="h-9 text-xs font-semibold gap-1.5 shrink-0 bg-primary text-primary-foreground"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Send Invite</span>
        </Button>
      </div>

      {/* Role Explanations */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-muted-foreground">
        <div className="p-2 rounded-lg bg-muted/20 border border-muted">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Edit3 className="w-3 h-3 text-blue-500" /> Editor
          </span>
          <p className="mt-0.5 text-[10px] leading-tight">Add/edit relatives, connections &amp; stories</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/20 border border-muted">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Eye className="w-3 h-3 text-zinc-500" /> Viewer
          </span>
          <p className="mt-0.5 text-[10px] leading-tight">Explore private tree and leaves stories</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/20 border border-muted">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Shield className="w-3 h-3 text-purple-500" /> Admin
          </span>
          <p className="mt-0.5 text-[10px] leading-tight">Full edit rights plus invite others</p>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
          {errorMsg}
        </p>
      )}
      {successMsg && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900">
          {successMsg}
        </p>
      )}
    </form>
  );
}
