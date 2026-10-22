'use client';

import { Person, TreeData } from '@/types/tree';
import { Label } from '@/components/ui/label';
import { GitBranch } from 'lucide-react';
import { KinshipResult } from '@/lib/tree-utils';

type PersonKinshipCardProps = {
  treeData: TreeData;
  rootPerson?: Person;
  otherFamilyMembers: Person[];
  compareTargetId: string;
  setCompareTargetId: (id: string) => void;
  activeKinship: KinshipResult | null;
  onSelectPerson?: (person: Person) => void;
};

export default function PersonKinshipCard({
  treeData,
  rootPerson,
  otherFamilyMembers,
  compareTargetId,
  setCompareTargetId,
  activeKinship,
  onSelectPerson,
}: PersonKinshipCardProps) {
  if (otherFamilyMembers.length === 0) return null;

  return (
    <div className="space-y-3 p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Kinship & Consanguinity
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">LCA Engine</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kinship-compare" className="text-xs font-medium text-muted-foreground">
          Calculate relationship relative to:
        </Label>
        <select
          id="kinship-compare"
          value={compareTargetId}
          onChange={(e) => setCompareTargetId(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {otherFamilyMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.firstName} {m.lastName} {m.id === rootPerson?.id ? '(Tree Root)' : ''}
            </option>
          ))}
        </select>

        {activeKinship && (
          <div className="mt-2.5 p-3 rounded-lg border bg-primary/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">
                {activeKinship.relationship}
              </span>
              {activeKinship.degree && (
                <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  {activeKinship.degree}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeKinship.description}
            </p>
            {activeKinship.commonAncestorIds.length > 0 && (
              <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                <span className="font-semibold">Shared Ancestors:</span>
                {activeKinship.commonAncestorIds.map((caId) => {
                  const ca = treeData.people.find((p) => p.id === caId);
                  if (!ca) return null;
                  return (
                    <span
                      key={caId}
                      onClick={() => onSelectPerson?.(ca)}
                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-background border hover:border-primary cursor-pointer transition-colors text-foreground font-medium"
                    >
                      {ca.firstName} {ca.lastName}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
