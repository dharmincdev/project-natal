'use client';

import { Person, Relationship, RelationshipSubtype } from '@/types/tree';
import { Label } from '@/components/ui/label';
import { Heart, Users } from 'lucide-react';

type AddPersonRelationshipLinkerProps = {
  existingPeople: Person[];
  relationships: Relationship[];
  relatedPersonId: string;
  setRelatedPersonId: (id: string) => void;
  relationRole: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of';
  setRelationRole: (role: 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of') => void;
  subtype: RelationshipSubtype;
  setSubtype: (subtype: RelationshipSubtype) => void;
  alsoLinkChildIds: string[];
  setAlsoLinkChildIds: React.Dispatch<React.SetStateAction<string[]>>;
  alsoLinkSpouseIds: string[];
  setAlsoLinkSpouseIds: React.Dispatch<React.SetStateAction<string[]>>;
  alsoLinkParentIds: string[];
  setAlsoLinkParentIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function AddPersonRelationshipLinker({
  existingPeople,
  relationships,
  relatedPersonId,
  setRelatedPersonId,
  relationRole,
  setRelationRole,
  subtype,
  setSubtype,
  alsoLinkChildIds,
  setAlsoLinkChildIds,
  alsoLinkSpouseIds,
  setAlsoLinkSpouseIds,
  alsoLinkParentIds,
  setAlsoLinkParentIds,
}: AddPersonRelationshipLinkerProps) {
  if (existingPeople.length === 0) return null;

  const selectedRelative = existingPeople.find(p => p.id === relatedPersonId);

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

  return (
    <div className="space-y-3.5 border-t pt-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-primary" /> Relationship in Tree
      </h4>

      <div className="space-y-3 p-3.5 rounded-lg border bg-muted/20">
        <div className="space-y-1.5">
          <Label htmlFor="add-relatedPerson" className="text-xs font-semibold">
            Connect to existing family member:
          </Label>
          <select
            id="add-relatedPerson"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={relatedPersonId}
            onChange={e => setRelatedPersonId(e.target.value)}
          >
            <option value="">None (Add as independent node)</option>
            {existingPeople.map(p => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} {p.birthDate ? `(b. ${p.birthDate.split('-')[0]})` : ''}
              </option>
            ))}
          </select>
        </div>

        {relatedPersonId && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="add-relationRole" className="text-xs font-semibold">
                This new person is the:
              </Label>
              <select
                id="add-relationRole"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={relationRole}
                onChange={e => setRelationRole(e.target.value as 'child_of' | 'parent_of' | 'spouse_of' | 'sibling_of')}
              >
                <option value="child_of">Child of {selectedRelative?.firstName} (Descendant)</option>
                <option value="spouse_of">Spouse / Partner of {selectedRelative?.firstName}</option>
                <option value="parent_of">Parent of {selectedRelative?.firstName} (Ancestor)</option>
                <option value="sibling_of">Sibling of {selectedRelative?.firstName} (Brother/Sister)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-subtype" className="text-xs font-semibold">
                Relationship type:
              </Label>
              <select
                id="add-subtype"
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

            {/* Co-parenting option when adding a spouse */}
            {relationRole === 'spouse_of' && childrenOfSpouse.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg border bg-background/80 text-xs mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-rose-500" /> Co-Parenting:
                  </span>
                  <span className="text-[10px] text-muted-foreground">Uncheck if step-marriage</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Is this new spouse also a parent to {selectedRelative?.firstName}&apos;s existing children?
                </p>
                <div className="space-y-1.5 pt-1">
                  {childrenOfSpouse.map(rel => {
                    const child = existingPeople.find(p => p.id === rel.personBId);
                    if (!child) return null;
                    const isChecked = alsoLinkChildIds.includes(child.id);
                    return (
                      <label key={child.id} className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlsoLinkChildIds(prev => [...prev, child.id]);
                            } else {
                              setAlsoLinkChildIds(prev => prev.filter(id => id !== child.id));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                        />
                        <span>Also parent to <strong>{child.firstName} {child.lastName}</strong></span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Marriage connection option when adding a parent */}
            {relationRole === 'parent_of' && parentsOfRelative.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg border bg-background/80 text-xs mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-rose-500" /> Marital Connection:
                  </span>
                  <span className="text-[10px] text-muted-foreground">Uncheck if not married</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Is this new parent married / partnered with {selectedRelative?.firstName}&apos;s other parent?
                </p>
                <div className="space-y-1.5 pt-1">
                  {parentsOfRelative.map(rel => {
                    const parent = existingPeople.find(p => p.id === rel.personAId);
                    if (!parent) return null;
                    const isChecked = alsoLinkSpouseIds.includes(parent.id);
                    return (
                      <label key={parent.id} className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlsoLinkSpouseIds(prev => [...prev, parent.id]);
                            } else {
                              setAlsoLinkSpouseIds(prev => prev.filter(id => id !== parent.id));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                        />
                        <span>Also spouse / partner to <strong>{parent.firstName} {parent.lastName}</strong></span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Co-parenting option when adding a child */}
            {relationRole === 'child_of' && spousesOfSelected.length > 0 && (
              <div className="space-y-2 p-3 rounded-lg border bg-background/80 text-xs mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> Co-Parenting:
                  </span>
                  <span className="text-[10px] text-muted-foreground">Uncheck for half-sibling</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Is this child also shared with {selectedRelative?.firstName}&apos;s spouse?
                </p>
                <div className="space-y-1.5 pt-1">
                  {spousesOfSelected.map(spouseId => {
                    const spouse = existingPeople.find(p => p.id === spouseId);
                    if (!spouse) return null;
                    const isChecked = alsoLinkParentIds.includes(spouse.id);
                    return (
                      <label key={spouse.id} className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlsoLinkParentIds(prev => [...prev, spouse.id]);
                            } else {
                              setAlsoLinkParentIds(prev => prev.filter(id => id !== spouse.id));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                        />
                        <span>Also child of <strong>{spouse.firstName} {spouse.lastName}</strong> (Spouse)</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sibling shared parents selection */}
            {relationRole === 'sibling_of' && (
              <div className="space-y-2 p-3 rounded-lg border bg-background/80 text-xs mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" /> Shared Parents:
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {subtype === 'half' ? 'Select 1 parent for half-sibling' : 'Check shared parents'}
                  </span>
                </div>
                {parentsOfRelative.length > 0 ? (
                  <>
                    <p className="text-[11px] text-muted-foreground">
                      Which of {selectedRelative?.firstName}&apos;s parents does this sibling share?
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {parentsOfRelative.map(rel => {
                        const parent = existingPeople.find(p => p.id === rel.personAId);
                        if (!parent) return null;
                        const isChecked = alsoLinkParentIds.includes(parent.id);
                        return (
                          <label key={parent.id} className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAlsoLinkParentIds(prev => [...prev, parent.id]);
                                } else {
                                  setAlsoLinkParentIds(prev => prev.filter(id => id !== parent.id));
                                }
                              }}
                              className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                            />
                            <span>Shared Parent: <strong>{parent.firstName} {parent.lastName}</strong></span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    {selectedRelative?.firstName} has no parents listed in tree yet. Both will appear as siblings.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
