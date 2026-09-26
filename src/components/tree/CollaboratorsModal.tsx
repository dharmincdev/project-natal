'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Mail, 
  Clock, 
  Crown, 
  Sparkles, 
  Lock,
  ChevronDown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TreeCollaborator, CollaboratorRole, FamilyTree } from '@/types/tree';
import { 
  ROLE_DETAILS, 
  canManageCollaborators, 
  getEffectiveTreeRole 
} from '@/lib/permissions';
import { 
  getStoredCollaborators, 
  addStoredCollaborator, 
  updateStoredCollaboratorRole, 
  removeStoredCollaborator 
} from '@/lib/storage';
import { 
  fetchTreeCollaboratorsFromSupabase, 
  inviteCollaboratorToSupabase, 
  updateCollaboratorRoleInSupabase, 
  removeCollaboratorFromSupabase 
} from '@/lib/supabase/db';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTier } from '@/context/TierContext';

type CollaboratorsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tree: FamilyTree;
  onCollaboratorChange?: () => void;
};

export default function CollaboratorsModal({
  isOpen,
  onClose,
  tree,
  onCollaboratorChange,
}: CollaboratorsModalProps) {
  const { user, profile } = useAuth();
  const { tier, limits, openUpgradeModal } = useTier();

  const [collaborators, setCollaborators] = useState<TreeCollaborator[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load collaborators when modal opens
  useEffect(() => {
    if (!isOpen) return;
    loadCollaborators();
  }, [isOpen, tree.id, tree.slug]);

  const loadCollaborators = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isSupabaseConfigured() && user) {
        const cloudList = await fetchTreeCollaboratorsFromSupabase(tree.id);
        if (cloudList.length > 0) {
          setCollaborators(cloudList);
          setIsLoading(false);
          return;
        }
      }
      // Local storage fallback
      const localList = getStoredCollaborators(tree.slug || tree.id);
      setCollaborators(localList);
    } catch (err: any) {
      console.error('Error loading collaborators:', err);
      // Fallback
      setCollaborators(getStoredCollaborators(tree.slug || tree.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Check tier limits for collaborators
    const maxAllowed = limits.maxCollaborators;
    if (collaborators.length >= maxAllowed) {
      setErrorMsg(`Your current ${tier} plan is limited to ${maxAllowed} collaborators.`);
      return;
    }

    // Check if already invited
    if (collaborators.some((c) => c.email.toLowerCase() === email)) {
      setErrorMsg(`${email} is already invited to this family tree.`);
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && user) {
        const newCollab = await inviteCollaboratorToSupabase(
          tree.id,
          email,
          selectedRole,
          user.id
        );
        if (newCollab) {
          setCollaborators((prev) => [...prev, newCollab]);
        }
      } else {
        // Local mode
        const newCollab = addStoredCollaborator(tree.slug || tree.id, {
          treeId: tree.id,
          userId: null,
          email,
          role: selectedRole,
          status: 'pending',
          invitedBy: user?.id || 'demo-user',
          invitedByName: profile?.name || (user?.user_metadata as any)?.full_name || 'Tree Owner',
        });
        setCollaborators((prev) => [...prev, newCollab]);
      }

      setEmailInput('');
      setSuccessMsg(`Invite sent to ${email} as ${selectedRole}!`);
      if (onCollaboratorChange) onCollaboratorChange();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send invite.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (collabId: string, newRole: CollaboratorRole) => {
    try {
      if (isSupabaseConfigured() && user) {
        await updateCollaboratorRoleInSupabase(collabId, newRole);
      }
      updateStoredCollaboratorRole(tree.slug || tree.id, collabId, newRole);

      setCollaborators((prev) =>
        prev.map((c) => (c.id === collabId ? { ...c, role: newRole } : c))
      );
      if (onCollaboratorChange) onCollaboratorChange();
    } catch (err) {
      console.error('Error changing collaborator role:', err);
    }
  };

  const handleRemove = async (collabId: string, email: string) => {
    if (!confirm(`Remove ${email} from this family tree?`)) return;

    try {
      if (isSupabaseConfigured() && user) {
        await removeCollaboratorFromSupabase(collabId);
      }
      removeStoredCollaborator(tree.slug || tree.id, collabId);

      setCollaborators((prev) => prev.filter((c) => c.id !== collabId));
      if (onCollaboratorChange) onCollaboratorChange();
    } catch (err) {
      console.error('Error removing collaborator:', err);
    }
  };

  const handleCopyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://natal.app';
    const link = `${origin}/t/${tree.slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const canManage = canManageCollaborators(user, tree, collaborators);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-background text-foreground gap-0 border shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                Family Tree Collaborators
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Invite family members and researchers to build and explore <span className="font-semibold text-foreground">{tree.name}</span> together.
              </DialogDescription>
            </div>
          </div>

          {/* Tier limit indicator */}
          <div className="mt-4 flex items-center justify-between p-2.5 rounded-lg bg-card border text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">
                Collaborator Capacity: {collaborators.length} of {limits.maxCollaborators === Infinity ? 'Unlimited' : limits.maxCollaborators}
              </span>
            </div>
            {limits.maxCollaborators !== Infinity && (
              <button
                onClick={() => openUpgradeModal('pro', 'Upgrade to Pro for unlimited tree collaborators.')}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Upgrade to Pro</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Quick Share Link Banner */}
          <div className="p-3.5 rounded-xl border bg-muted/30 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Direct Tree Share Link</p>
              <p className="text-[11px] text-muted-foreground truncate">
                Anyone with access or invitation can view or contribute.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyShareLink}
              className="text-xs h-8 gap-1.5 shrink-0 bg-background"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
          </div>

          {/* Invite Form */}
          {canManage ? (
            <form onSubmit={handleInvite} className="space-y-3">
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
                  <p className="mt-0.5 text-[10px] leading-tight">Add/edit relatives, connections & stories</p>
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
          ) : (
            <div className="p-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>You have Contributor access to this tree. Only Tree Owners and Admins can invite new members.</span>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Members & Contributors ({collaborators.length + 1})
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
              {collaborators.map((collab) => {
                const initials = collab.email.substring(0, 2).toUpperCase();
                const isPending = collab.status === 'pending';

                return (
                  <div key={collab.id} className="p-3 flex items-center justify-between gap-3">
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
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-600 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
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
                          onChange={(e) => handleRoleChange(collab.id, e.target.value as CollaboratorRole)}
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
                          onClick={() => handleRemove(collab.id, collab.email)}
                          className="w-7 h-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Remove collaborator"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {collaborators.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p>No external collaborators invited yet.</p>
                  <p className="text-[11px] mt-0.5">Use the invite form above to add family members.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
