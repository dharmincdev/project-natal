'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TreeCollaborator, CollaboratorRole, FamilyTree } from '@/types/tree';
import { canManageCollaborators } from '@/lib/permissions';
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
import CollaboratorInviteForm from './collaborators/CollaboratorInviteForm';
import CollaboratorsList from './collaborators/CollaboratorsList';

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
    } catch (err) {
      console.error('Error loading collaborators:', err);
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
          invitedByName: profile?.name || (user?.user_metadata as Record<string, unknown> | undefined)?.full_name as string | undefined || 'Tree Owner',
        });
        setCollaborators((prev) => [...prev, newCollab]);
      }

      setEmailInput('');
      setSuccessMsg(`Invite sent to ${email} as ${selectedRole}!`);
      if (onCollaboratorChange) onCollaboratorChange();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send invite.');
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
          <CollaboratorInviteForm
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onSubmit={handleInvite}
            isLoading={isLoading}
            errorMsg={errorMsg}
            successMsg={successMsg}
            canManage={canManage}
          />

          {/* Members List */}
          <CollaboratorsList
            collaborators={collaborators}
            canManage={canManage}
            onRoleChange={handleRoleChange}
            onRemove={handleRemove}
          />
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
