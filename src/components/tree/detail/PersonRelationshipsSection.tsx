'use client';

import { Person, RelationshipType } from '@/types/tree';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Heart, Users, Trash2 } from 'lucide-react';

type PersonRelationshipsSectionProps = {
  person: Person;
  parents: Person[];
  spouses: Person[];
  childrenList: Person[];
  siblings: Person[];
  isEditable: boolean;
  onSelectPerson?: (person: Person) => void;
  onOpenAddRelationship?: (personId: string, defaultType?: RelationshipType) => void;
  onAddRelative?: (personId: string, role: 'parent_of' | 'child_of' | 'spouse_of' | 'sibling_of') => void;
  onDeleteRelationship?: (relationshipId: string) => void;
  getRelId: (aId: string, bId: string, type: RelationshipType) => string | undefined;
};

export default function PersonRelationshipsSection({
  person,
  parents,
  spouses,
  childrenList,
  siblings,
  isEditable,
  onSelectPerson,
  onOpenAddRelationship,
  onAddRelative,
  onDeleteRelationship,
  getRelId,
}: PersonRelationshipsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-primary" /> Family Relationships
        </h3>
        {isEditable && onOpenAddRelationship && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs gap-1"
            onClick={() => onOpenAddRelationship(person.id)}
          >
            <UserPlus className="h-3.5 w-3.5" /> Connect
          </Button>
        )}
      </div>

      <div className="grid gap-3 text-sm">
        {/* Spouses */}
        <div className="p-3 rounded-lg border bg-card/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
              <Heart className="h-3 w-3" /> Spouse / Partner
            </span>
            {isEditable && (onAddRelative || onOpenAddRelationship) && (
              <button
                onClick={() => onAddRelative ? onAddRelative(person.id, 'spouse_of') : onOpenAddRelationship?.(person.id, 'spouse')}
                className="text-xs text-primary hover:underline"
              >
                + Add Spouse
              </button>
            )}
          </div>
          {spouses.length > 0 ? (
            <div className="space-y-1.5">
              {spouses.map(s => {
                const relId = getRelId(person.id, s.id, 'spouse');
                return (
                  <div key={s.id} className="flex items-center justify-between group">
                    <button
                      onClick={() => onSelectPerson?.(s)}
                      className="text-left font-medium hover:text-primary transition-colors text-sm"
                    >
                      {s.firstName} {s.lastName}
                    </button>
                    {isEditable && relId && onDeleteRelationship && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100"
                        onClick={() => onDeleteRelationship(relId)}
                        title="Remove connection"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">None listed</p>
          )}
        </div>

        {/* Parents */}
        <div className="p-3 rounded-lg border bg-card/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Parents
            </span>
            {isEditable && (onAddRelative || onOpenAddRelationship) && (
              <button
                onClick={() => onAddRelative ? onAddRelative(person.id, 'parent_of') : onOpenAddRelationship?.(person.id, 'parent_child')}
                className="text-xs text-primary hover:underline"
              >
                + Add Parent
              </button>
            )}
          </div>
          {parents.length > 0 ? (
            <div className="space-y-1.5">
              {parents.map(p => {
                const relId = getRelId(p.id, person.id, 'parent_child');
                return (
                  <div key={p.id} className="flex items-center justify-between group">
                    <button
                      onClick={() => onSelectPerson?.(p)}
                      className="text-left font-medium hover:text-primary transition-colors text-sm"
                    >
                      {p.firstName} {p.lastName}
                    </button>
                    {isEditable && relId && onDeleteRelationship && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100"
                        onClick={() => onDeleteRelationship(relId)}
                        title="Remove connection"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">None listed</p>
          )}
        </div>

        {/* Children */}
        <div className="p-3 rounded-lg border bg-card/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Children
            </span>
            {isEditable && (onAddRelative || onOpenAddRelationship) && (
              <button
                onClick={() => onAddRelative ? onAddRelative(person.id, 'child_of') : onOpenAddRelationship?.(person.id, 'parent_child')}
                className="text-xs text-primary hover:underline"
              >
                + Add Child
              </button>
            )}
          </div>
          {childrenList.length > 0 ? (
            <div className="space-y-1.5">
              {childrenList.map(c => {
                const relId = getRelId(person.id, c.id, 'parent_child');
                return (
                  <div key={c.id} className="flex items-center justify-between group">
                    <button
                      onClick={() => onSelectPerson?.(c)}
                      className="text-left font-medium hover:text-primary transition-colors text-sm"
                    >
                      {c.firstName} {c.lastName}
                    </button>
                    {isEditable && relId && onDeleteRelationship && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100"
                        onClick={() => onDeleteRelationship(relId)}
                        title="Remove connection"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">None listed</p>
          )}
        </div>

        {/* Siblings */}
        <div className="p-3 rounded-lg border bg-card/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Siblings
            </span>
            {isEditable && (onAddRelative || onOpenAddRelationship) && (
              <button
                onClick={() => onAddRelative ? onAddRelative(person.id, 'sibling_of') : onOpenAddRelationship?.(person.id, 'sibling')}
                className="text-xs text-primary hover:underline"
              >
                + Add Sibling
              </button>
            )}
          </div>
          {siblings.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {siblings.map(s => (
                <Badge
                  key={s.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80 py-1"
                  onClick={() => onSelectPerson?.(s)}
                >
                  {s.firstName} {s.lastName}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">None listed</p>
          )}
        </div>
      </div>
    </div>
  );
}
