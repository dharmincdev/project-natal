'use client';

import { useState, useEffect } from 'react';
import { Person, Relationship, RelationshipSubtype, Gender } from '@/types/tree';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import PersonBasicInfoForm from './dialogs/PersonBasicInfoForm';
import AddPersonRelationshipLinker from './dialogs/AddPersonRelationshipLinker';

export type NewPersonRelationshipData = {
  relatedPersonId: string;
  relationRole: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';
  subtype: RelationshipSubtype;
  alsoLinkChildIds?: string[];
  alsoLinkSpouseIds?: string[];
  alsoLinkParentIds?: string[];
};

type AddPersonDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    person: {
      firstName: string;
      lastName: string;
      maidenName?: string;
      nickname?: string;
      gender?: Gender;
      birthDate?: string;
      deathDate?: string;
      birthPlace?: string;
      photoUrl?: string;
      bio?: string;
    },
    relationship?: NewPersonRelationshipData
  ) => void;
  existingPeople: Person[];
  relationships?: Relationship[];
  defaultRelatedPersonId?: string;
  defaultRelationRole?: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';
};

export default function AddPersonDialog({ 
  isOpen, 
  onClose, 
  onAdd, 
  existingPeople,
  relationships = [],
  defaultRelatedPersonId,
  defaultRelationRole,
}: AddPersonDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [maidenName, setMaidenName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [birthPlace, setBirthPlace] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bio, setBio] = useState('');

  const [relatedPersonId, setRelatedPersonId] = useState(defaultRelatedPersonId || '');
  const [relationRole, setRelationRole] = useState<'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of'>(defaultRelationRole || 'child_of');
  const [subtype, setSubtype] = useState<RelationshipSubtype>('biological');

  const [alsoLinkChildIds, setAlsoLinkChildIds] = useState<string[]>([]);
  const [alsoLinkSpouseIds, setAlsoLinkSpouseIds] = useState<string[]>([]);
  const [alsoLinkParentIds, setAlsoLinkParentIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (defaultRelatedPersonId) setRelatedPersonId(defaultRelatedPersonId);
      if (defaultRelationRole) setRelationRole(defaultRelationRole);
    }
  }, [isOpen, defaultRelatedPersonId, defaultRelationRole]);

  // Find children of selected relative (for spouse_of)
  const childrenOfSpouse = (relationRole === 'spouse_of' && relatedPersonId)
    ? relationships.filter(r => r.type === 'parent_child' && r.personAId === relatedPersonId)
    : [];

  // Find spouses of selected relative (for child_of co-parenting)
  const spousesOfSelected = (relationRole === 'child_of' && relatedPersonId)
    ? relationships
        .filter(r => r.type === 'spouse' && (r.personAId === relatedPersonId || r.personBId === relatedPersonId))
        .map(r => r.personAId === relatedPersonId ? r.personBId : r.personAId)
    : [];

  // Find parents of selected relative (for parent_of or sibling_of)
  const parentsOfRelative = relatedPersonId
    ? relationships.filter(r => r.type === 'parent_child' && r.personBId === relatedPersonId)
    : [];

  useEffect(() => {
    if (relationRole === 'spouse_of' && relatedPersonId) {
      if (subtype !== 'step') {
        setAlsoLinkChildIds(childrenOfSpouse.map(c => c.personBId));
      } else {
        setAlsoLinkChildIds([]);
      }
    } else {
      setAlsoLinkChildIds([]);
    }
  }, [relatedPersonId, relationRole, subtype, isOpen]);

  useEffect(() => {
    if (relationRole === 'parent_of' && relatedPersonId) {
      if (subtype !== 'step') {
        setAlsoLinkSpouseIds(parentsOfRelative.map(p => p.personAId));
      } else {
        setAlsoLinkSpouseIds([]);
      }
    } else {
      setAlsoLinkSpouseIds([]);
    }
  }, [relatedPersonId, relationRole, subtype, isOpen]);

  useEffect(() => {
    if (relationRole === 'child_of' && relatedPersonId) {
      if (subtype !== 'step') {
        setAlsoLinkParentIds(spousesOfSelected);
      } else {
        setAlsoLinkParentIds([]);
      }
    } else if (relationRole === 'sibling_of' && relatedPersonId) {
      if (subtype === 'biological' || subtype === 'adoptive') {
        setAlsoLinkParentIds(parentsOfRelative.map(p => p.personAId));
      } else if (subtype === 'half') {
        setAlsoLinkParentIds(parentsOfRelative.length > 0 ? [parentsOfRelative[0].personAId] : []);
      } else {
        setAlsoLinkParentIds([]);
      }
    } else {
      setAlsoLinkParentIds([]);
    }
  }, [relatedPersonId, relationRole, subtype, isOpen]);

  const selectedRelative = existingPeople.find(p => p.id === relatedPersonId);

  const handleAdd = () => {
    if (!firstName.trim()) return;

    const relationshipData: NewPersonRelationshipData | undefined = relatedPersonId
      ? {
          relatedPersonId,
          relationRole,
          subtype,
          alsoLinkChildIds: relationRole === 'spouse_of' ? alsoLinkChildIds : undefined,
          alsoLinkSpouseIds: relationRole === 'parent_of' ? alsoLinkSpouseIds : undefined,
          alsoLinkParentIds: (relationRole === 'child_of' || relationRole === 'sibling_of') ? alsoLinkParentIds : undefined,
        }
      : undefined;

    onAdd(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        maidenName: maidenName.trim() || undefined,
        nickname: nickname.trim() || undefined,
        gender: gender ? (gender as Gender) : undefined,
        birthDate: birthDate || undefined,
        deathDate: (isDeceased && deathDate) ? deathDate : undefined,
        birthPlace: birthPlace.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        bio: bio.trim() || undefined,
      },
      relationshipData
    );
    
    // Reset form
    setFirstName('');
    setLastName('');
    setMaidenName('');
    setNickname('');
    setGender('');
    setBirthDate('');
    setDeathDate('');
    setIsDeceased(false);
    setBirthPlace('');
    setPhotoUrl('');
    setBio('');
    setRelatedPersonId('');
    setRelationRole('child_of');
    setSubtype('biological');
    onClose();
  };

  const dialogTitle = relationRole === 'parent_of' && selectedRelative
    ? `Add Parent to ${selectedRelative.firstName}`
    : relationRole === 'child_of' && selectedRelative
    ? `Add Child to ${selectedRelative.firstName}`
    : relationRole === 'spouse_of' && selectedRelative
    ? `Add Spouse / Partner to ${selectedRelative.firstName}`
    : relationRole === 'sibling_of' && selectedRelative
    ? `Add Sibling to ${selectedRelative.firstName}`
    : 'Add New Family Member';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <UserPlus className="h-5 w-5 text-primary" /> {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Basic Details Form */}
          <PersonBasicInfoForm
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            maidenName={maidenName}
            setMaidenName={setMaidenName}
            nickname={nickname}
            setNickname={setNickname}
            gender={gender}
            setGender={setGender}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            deathDate={deathDate}
            setDeathDate={setDeathDate}
            isDeceased={isDeceased}
            setIsDeceased={setIsDeceased}
            birthPlace={birthPlace}
            setBirthPlace={setBirthPlace}
            photoUrl={photoUrl}
            setPhotoUrl={setPhotoUrl}
          />

          {/* Relationship Section */}
          <AddPersonRelationshipLinker
            existingPeople={existingPeople}
            relationships={relationships}
            relatedPersonId={relatedPersonId}
            setRelatedPersonId={setRelatedPersonId}
            relationRole={relationRole}
            setRelationRole={setRelationRole}
            subtype={subtype}
            setSubtype={setSubtype}
            alsoLinkChildIds={alsoLinkChildIds}
            setAlsoLinkChildIds={setAlsoLinkChildIds}
            alsoLinkSpouseIds={alsoLinkSpouseIds}
            setAlsoLinkSpouseIds={setAlsoLinkSpouseIds}
            alsoLinkParentIds={alsoLinkParentIds}
            setAlsoLinkParentIds={setAlsoLinkParentIds}
          />

          {/* Bio */}
          <div className="space-y-1.5 border-t pt-3">
            <Label htmlFor="add-bio" className="text-xs font-semibold">Notes / Bio</Label>
            <Textarea 
              id="add-bio" 
              placeholder="Any memories, stories, or achievements..." 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              rows={2} 
            />
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!firstName.trim()} className="gap-1.5">
            <UserPlus className="h-4 w-4" /> Add Person
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
