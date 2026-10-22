'use client';

import { useState, useEffect } from 'react';
import { Person, TreeData, RelationshipType, VaultAttachment } from '@/types/tree';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { getParents, getSpouses, getChildren, getSiblings, calculateKinship } from '@/lib/tree-utils';
import { Briefcase } from 'lucide-react';
import PersonVaultSection from './PersonVaultSection';
import PersonHeaderBanner from './detail/PersonHeaderBanner';
import PersonRelationshipsSection from './detail/PersonRelationshipsSection';
import PersonKinshipCard from './detail/PersonKinshipCard';
import PersonEditForm from './detail/PersonEditForm';

type PersonDetailPanelProps = {
  person: Person | null;
  treeData: TreeData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Person>) => void;
  onDeletePerson?: (personId: string) => void;
  onOpenAddRelationship?: (personId: string, defaultType?: RelationshipType) => void;
  onAddRelative?: (personId: string, role: 'parent_of' | 'child_of' | 'spouse_of' | 'sibling_of') => void;
  onDeleteRelationship?: (relationshipId: string) => void;
  onSelectPerson?: (person: Person) => void;
  isEditable: boolean;
};

export default function PersonDetailPanel({
  person,
  treeData,
  isOpen,
  onClose,
  onSave,
  onDeletePerson,
  onOpenAddRelationship,
  onAddRelative,
  onDeleteRelationship,
  onSelectPerson,
  isEditable,
}: PersonDetailPanelProps) {
  const [formData, setFormData] = useState<Partial<Person>>({});
  const [isDeceased, setIsDeceased] = useState(false);
  const [compareTargetId, setCompareTargetId] = useState<string>('');

  // Root person of tree (apex ancestor with no parents, or people[0])
  const rootPerson = treeData.people.find(p => getParents(p.id, treeData.people, treeData.relationships).length === 0) || treeData.people[0];

  useEffect(() => {
    if (person) {
      setFormData(person);
      setIsDeceased(Boolean(person.deathDate));
    }
  }, [person]);

  useEffect(() => {
    if (person && rootPerson) {
      const defaultTarget = rootPerson.id === person.id 
        ? (treeData.people.find(p => p.id !== person.id)?.id || '') 
        : rootPerson.id;
      setCompareTargetId(defaultTarget);
    }
  }, [person, rootPerson, treeData.people]);

  if (!person) return null;

  const handleChange = (field: keyof Person, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      ...formData,
      maidenName: formData.maidenName?.trim() || null,
      deathDate: isDeceased && formData.deathDate ? formData.deathDate : null,
    });
    onClose();
  };

  const handleAddAttachment = (attachment: VaultAttachment) => {
    const current = formData.attachments || person.attachments || [];
    const updated = [...current, attachment];
    setFormData(prev => ({ ...prev, attachments: updated }));
    onSave({
      ...formData,
      attachments: updated,
    });
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const current = formData.attachments || person.attachments || [];
    const updated = current.filter(a => a.id !== attachmentId);
    setFormData(prev => ({ ...prev, attachments: updated }));
    onSave({
      ...formData,
      attachments: updated,
    });
  };

  // Relative computations
  const parents = getParents(person.id, treeData.people, treeData.relationships);
  const spouses = getSpouses(person.id, treeData.people, treeData.relationships);
  const children = getChildren(person.id, treeData.people, treeData.relationships);
  const siblings = getSiblings(person.id, treeData.people, treeData.relationships);

  const kinshipToRoot = rootPerson && rootPerson.id !== person.id
    ? calculateKinship(person.id, rootPerson.id, treeData)
    : null;

  const compareTarget = treeData.people.find(p => p.id === compareTargetId);
  const activeKinship = compareTarget && compareTarget.id !== person.id
    ? calculateKinship(person.id, compareTarget.id, treeData)
    : null;

  const otherFamilyMembers = treeData.people.filter(p => p.id !== person.id);

  const getRelId = (aId: string, bId: string, type: RelationshipType) => {
    const found = treeData.relationships.find(
      r => r.type === type && ((r.personAId === aId && r.personBId === bId) || (r.personAId === bId && r.personBId === aId))
    );
    return found?.id;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg w-full p-0">
        {/* Top Header Banner */}
        <PersonHeaderBanner
          person={person}
          rootPerson={rootPerson}
          kinshipToRoot={kinshipToRoot}
        />

        {/* Content Body */}
        <div className="p-6 space-y-8">
          {/* Family Connections Section */}
          <PersonRelationshipsSection
            person={person}
            parents={parents}
            spouses={spouses}
            childrenList={children}
            siblings={siblings}
            isEditable={isEditable}
            onSelectPerson={onSelectPerson}
            onOpenAddRelationship={onOpenAddRelationship}
            onAddRelative={onAddRelative}
            onDeleteRelationship={onDeleteRelationship}
            getRelId={getRelId}
          />

          {/* Kinship Computing Engine (SPEC.md §4.3) */}
          <PersonKinshipCard
            treeData={treeData}
            rootPerson={rootPerson}
            otherFamilyMembers={otherFamilyMembers}
            compareTargetId={compareTargetId}
            setCompareTargetId={setCompareTargetId}
            activeKinship={activeKinship}
            onSelectPerson={onSelectPerson}
          />

          {/* Personal Information & Edit Form */}
          <PersonEditForm
            person={person}
            formData={formData}
            isDeceased={isDeceased}
            setIsDeceased={setIsDeceased}
            handleChange={handleChange}
            handleSave={handleSave}
            onDeletePerson={onDeletePerson}
            onClose={onClose}
            isEditable={isEditable}
          />

          {/* Custom Fields & Attributes */}
          {person.customFields && Object.keys(person.customFields).length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-muted-foreground" /> Attributes & Notes
              </h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(person.customFields).map(([key, value]) => (
                  <div key={key} className="p-2.5 rounded-md bg-muted/40 border">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">{key}</dt>
                    <dd className="font-medium text-foreground mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Milestones */}
          {person.milestones && person.milestones.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                Milestones
              </h3>
              <div className="space-y-2">
                {person.milestones.map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card/60">
                    <Badge variant="outline" className="text-xs capitalize shrink-0 mt-0.5">
                      {m.type}
                    </Badge>
                    <div>
                      <p className="text-xs text-muted-foreground">{m.date}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memories & Document Vault */}
          <PersonVaultSection
            personName={`${person.firstName} ${person.lastName}`}
            attachments={formData.attachments || person.attachments || []}
            onAddAttachment={handleAddAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            isEditable={isEditable}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
