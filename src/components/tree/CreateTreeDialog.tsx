'use client';

import React, { useState } from 'react';
import { TreeData } from '@/types/tree';
import { createNewUserTree } from '@/lib/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, User, ArrowRight, TreePine } from 'lucide-react';

type CreateTreeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onTreeCreated: (newTreeData: TreeData) => void;
};

export default function CreateTreeDialog({
  isOpen,
  onClose,
  onTreeCreated,
}: CreateTreeDialogProps) {
  const [treeName, setTreeName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<'blank' | 'nuclear'>('blank');
  
  // Starting Person details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [bio, setBio] = useState('');

  const isValid = treeName.trim().length > 0 && firstName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const newTree = createNewUserTree({
      name: treeName,
      description: description || undefined,
      startingPersonFirstName: firstName,
      startingPersonLastName: lastName || undefined,
      startingPersonBirthDate: birthDate || undefined,
      startingPersonBirthPlace: birthPlace || undefined,
      startingPersonBio: bio || undefined,
      template,
    });

    onTreeCreated(newTree);
    onClose();

    // Reset fields
    setTreeName('');
    setDescription('');
    setFirstName('');
    setLastName('');
    setBirthDate('');
    setBirthPlace('');
    setBio('');
    setTemplate('blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TreePine className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Start a New Family Tree
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Create your custom family lineage. Begin with yourself or your earliest known ancestor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tree Details */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tree-name" className="text-xs font-semibold flex items-center gap-1">
                Family Tree Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tree-name"
                placeholder="e.g. The Davis Family Tree"
                value={treeName}
                onChange={(e) => setTreeName(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tree-desc" className="text-xs font-semibold">
                Description (optional)
              </Label>
              <Input
                id="tree-desc"
                placeholder="e.g. Tracing our lineage from Virginia to California"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Starter Template Selection */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold block">Choose Starter Layout</Label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTemplate('blank')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  template === 'blank'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 text-foreground font-medium'
                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">Blank Canvas</span>
                  {template === 'blank' && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] leading-snug">
                  Start clean with just your starting member. Add relatives one by one.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('nuclear')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  template === 'nuclear'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 text-foreground font-medium'
                    : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">Nuclear Template</span>
                  {template === 'nuclear' && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                      Selected
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] leading-snug">
                  Prepopulates 3 generations (grandparents, parents, kids) to quickly fill in.
                </p>
              </button>
            </div>
          </div>

          {/* Starting Relative Section */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b pb-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Starting Family Member</span>
              <span className="text-[10px] text-muted-foreground font-normal ml-auto">
                (You or an ancestor)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="person-first" className="text-[11px] font-semibold">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="person-first"
                  placeholder="e.g. Arthur"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="person-last" className="text-[11px] font-semibold">
                  Last Name
                </Label>
                <Input
                  id="person-last"
                  placeholder="e.g. Davis"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="person-birth-date" className="text-[11px] font-semibold">
                  Birth Date
                </Label>
                <Input
                  id="person-birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="person-birth-place" className="text-[11px] font-semibold">
                  Birth Place
                </Label>
                <Input
                  id="person-birth-place"
                  placeholder="e.g. Chicago, IL"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="person-bio" className="text-[11px] font-semibold">
                Brief Bio / Notes
              </Label>
              <Input
                id="person-bio"
                placeholder="e.g. Family patriarch, worked in architecture"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!isValid} className="gap-1.5 font-semibold">
              <span>Create Tree</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
