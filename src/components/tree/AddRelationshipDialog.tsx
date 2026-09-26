'use client';

import { useState, useEffect } from 'react';
import { Person, RelationshipType, RelationshipSubtype } from '@/types/tree';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link2, UserPlus } from 'lucide-react';

export type RelChoiceType = 'spouse' | 'parent_of' | 'child_of' | 'sibling';

type AddRelationshipDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddRelationship: (rel: {
    personAId: string;
    personBId: string;
    type: RelationshipType;
    subtype: RelationshipSubtype;
  }) => void;
  existingPeople: Person[];
  defaultPersonAId?: string;
  defaultType?: RelationshipType | RelChoiceType;
  onSwitchToAddPerson?: (personId?: string, defaultRole?: 'parent_of' | 'child_of' | 'spouse_of') => void;
};

export default function AddRelationshipDialog({
  isOpen,
  onClose,
  onAddRelationship,
  existingPeople,
  defaultPersonAId,
  defaultType = 'spouse',
  onSwitchToAddPerson,
}: AddRelationshipDialogProps) {
  const [personAId, setPersonAId] = useState(defaultPersonAId || '');
  const [personBId, setPersonBId] = useState('');
  
  const resolveInitialType = (dt: RelationshipType | RelChoiceType): RelChoiceType => {
    if (dt === 'parent_child') return 'parent_of';
    return dt as RelChoiceType;
  };

  const [type, setType] = useState<RelChoiceType>(resolveInitialType(defaultType));
  const [subtype, setSubtype] = useState<RelationshipSubtype>('biological');

  useEffect(() => {
    if (defaultPersonAId) {
      setPersonAId(defaultPersonAId);
    }
  }, [defaultPersonAId]);

  useEffect(() => {
    if (defaultType) {
      setType(resolveInitialType(defaultType));
    }
  }, [defaultType]);

  const personA = existingPeople.find(p => p.id === personAId);
  const personB = existingPeople.find(p => p.id === personBId);
  const otherPeople = existingPeople.filter(p => p.id !== personAId);

  const handleConnect = () => {
    if (!personAId || !personBId || personAId === personBId) return;

    if (type === 'child_of') {
      // Invert: personB is the parent (personAId in relationship), personA is the child (personBId)
      onAddRelationship({
        personAId: personBId,
        personBId: personAId,
        type: 'parent_child',
        subtype,
      });
    } else if (type === 'parent_of') {
      onAddRelationship({
        personAId: personAId,
        personBId: personBId,
        type: 'parent_child',
        subtype,
      });
    } else {
      onAddRelationship({
        personAId,
        personBId,
        type: type as RelationshipType,
        subtype,
      });
    }

    // Reset
    setPersonBId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Link2 className="h-5 w-5 text-primary" /> Connect Family Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Person A */}
          <div className="space-y-1.5">
            <Label htmlFor="rel-personA" className="text-xs font-semibold">
              First Person:
            </Label>
            <select
              id="rel-personA"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={personAId}
              onChange={e => {
                setPersonAId(e.target.value);
                if (personBId === e.target.value) setPersonBId('');
              }}
            >
              <option value="">Select person...</option>
              {existingPeople.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} {p.birthDate ? `(b. ${p.birthDate.split('-')[0]})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Relationship Type */}
          <div className="space-y-1.5">
            <Label htmlFor="rel-type" className="text-xs font-semibold">
              Relationship:
            </Label>
            <select
              id="rel-type"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={type}
              onChange={e => setType(e.target.value as RelChoiceType)}
            >
              <option value="parent_of">
                {personA ? `${personA.firstName} is Parent of (Ancestor ➔ Child)` : 'Parent of (Ancestor ➔ Child)'}
              </option>
              <option value="child_of">
                {personA ? `${personA.firstName} is Child of (Child ➔ Parent)` : 'Child of (Child ➔ Parent)'}
              </option>
              <option value="spouse">Spouse / Partner of</option>
              <option value="sibling">Sibling of (Brother / Sister)</option>
            </select>
          </div>

          {/* Person B or Empty State */}
          {otherPeople.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 text-center space-y-2.5 my-2">
              <p className="text-xs text-muted-foreground">
                There are no other family members in the tree to connect yet.
              </p>
              {onSwitchToAddPerson && (
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold"
                  onClick={() => {
                    onClose();
                    onSwitchToAddPerson(
                      personAId,
                      type === 'child_of' ? 'parent_of' : type === 'parent_of' ? 'child_of' : 'spouse_of'
                    );
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  + Add New Relative to {personA?.firstName || 'Tree'}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="rel-personB" className="text-xs font-semibold">
                {type === 'parent_of'
                  ? `Child of ${personA?.firstName || 'First Person'}:`
                  : type === 'child_of'
                  ? `Parent of ${personA?.firstName || 'First Person'}:`
                  : type === 'spouse'
                  ? `Spouse / Partner of ${personA?.firstName || 'First Person'}:`
                  : `Sibling of ${personA?.firstName || 'First Person'}:`}
              </Label>
              <select
                id="rel-personB"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={personBId}
                onChange={e => setPersonBId(e.target.value)}
              >
                <option value="">Select relative...</option>
                {otherPeople.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} {p.birthDate ? `(b. ${p.birthDate.split('-')[0]})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subtype */}
          <div className="space-y-1.5">
            <Label htmlFor="rel-subtype" className="text-xs font-semibold">
              Category:
            </Label>
            <select
              id="rel-subtype"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={subtype}
              onChange={e => setSubtype(e.target.value as RelationshipSubtype)}
            >
              <option value="biological">Biological</option>
              <option value="step">Step</option>
              <option value="adoptive">Adoptive</option>
              <option value="half">Half</option>
            </select>
          </div>

          {/* Summary Preview */}
          {personA && personB && (
            <div className="p-3 rounded-lg border bg-muted/40 text-xs space-y-1">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider block">Preview</span>
              <p className="font-medium text-foreground">
                {type === 'spouse' && `${personA.firstName} and ${personB.firstName} are married / partners.`}
                {type === 'parent_of' && `${personA.firstName} is the parent of ${personB.firstName} (${subtype}).`}
                {type === 'child_of' && `${personB.firstName} is the parent of ${personA.firstName} (${subtype}).`}
                {type === 'sibling' && `${personA.firstName} and ${personB.firstName} are siblings (${subtype}).`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleConnect} 
            disabled={!personAId || !personBId || personAId === personBId}
          >
            Create Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
