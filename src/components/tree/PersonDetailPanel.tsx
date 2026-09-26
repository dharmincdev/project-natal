'use client';

import { useState, useEffect } from 'react';
import { Person, TreeData, RelationshipType, RelationshipSubtype, Gender } from '@/types/tree';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getParents, getSpouses, getChildren, getSiblings } from '@/lib/tree-utils';
import { UserPlus, Heart, Users, Trash2, Calendar, MapPin, Briefcase } from 'lucide-react';
import CityCombobox from './CityCombobox';

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

  useEffect(() => {
    if (person) {
      setFormData(person);
      setIsDeceased(Boolean(person.deathDate));
    }
  }, [person]);

  if (!person) return null;

  const initials = `${person.firstName[0] || ''}${person.lastName[0] || ''}`.toUpperCase() || '?';

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

  // Relative computations
  const parents = getParents(person.id, treeData.people, treeData.relationships);
  const spouses = getSpouses(person.id, treeData.people, treeData.relationships);
  const children = getChildren(person.id, treeData.people, treeData.relationships);
  const siblings = getSiblings(person.id, treeData.people, treeData.relationships);

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
        <div className="bg-muted/40 border-b p-6 pb-5">
          <SheetHeader className="p-0 mb-4">
            <SheetTitle className="text-xl font-bold tracking-tight">
              {person.firstName} {person.lastName} {person.maidenName ? `(née ${person.maidenName})` : ''}
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-md shrink-0">
              <AvatarImage src={person.photoUrl || undefined} />
              <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base truncate">
                  {person.firstName} {person.lastName}
                </span>
                {person.maidenName && (
                  <span className="text-xs text-muted-foreground font-normal italic">
                    (née {person.maidenName})
                  </span>
                )}
                {person.nickname && (
                  <Badge variant="secondary" className="font-normal text-xs">
                    "{person.nickname}"
                  </Badge>
                )}
                {person.deathDate ? (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Deceased
                  </Badge>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Living
                  </span>
                )}
                {person.gender === 'male' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    <span className="text-xs font-bold leading-none">♂</span> Male
                  </span>
                )}
                {person.gender === 'female' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    <span className="text-xs font-bold leading-none">♀</span> Female
                  </span>
                )}
                {person.gender === 'other' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                    <span>⚧</span> Other
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {person.birthDate ? person.birthDate : 'Birth date unknown'}
                {person.deathDate ? ` – ${person.deathDate}` : ''}
              </p>
              {person.birthPlace && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {person.birthPlace}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body with generous padding */}
        <div className="p-6 space-y-8">
          {/* Family Connections Section */}
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
                {children.length > 0 ? (
                  <div className="space-y-1.5">
                    {children.map(c => {
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

          {/* Edit Form / Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/80 border-b pb-2">
              Personal Information
            </h3>

            {isEditable ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-semibold">First Name *</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName || ''} 
                      onChange={(e) => handleChange('firstName', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-semibold">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName || ''} 
                      onChange={(e) => handleChange('lastName', e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="maidenName" className="text-xs font-semibold flex items-center gap-1">
                      Maiden Name <span className="text-[10px] text-muted-foreground font-normal">(Birth Surname)</span>
                    </Label>
                    <Input 
                      id="maidenName" 
                      placeholder="e.g. Patel or Johnson"
                      value={formData.maidenName || ''} 
                      onChange={(e) => handleChange('maidenName', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nickname" className="text-xs font-semibold">Nickname</Label>
                    <Input 
                      id="nickname" 
                      placeholder="e.g. Johnny, Bob"
                      value={formData.nickname || ''} 
                      onChange={(e) => handleChange('nickname', e.target.value)} 
                    />
                  </div>
                </div>

                {/* Biological Gender */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Biological Gender</Label>
                    {formData.gender && (
                      <button
                        type="button"
                        onClick={() => handleChange('gender', '')}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange('gender', formData.gender === 'male' ? '' : 'male')}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        formData.gender === 'male'
                          ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/50 shadow-xs font-semibold"
                          : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-input"
                      )}
                    >
                      <span className="text-sm font-bold leading-none text-blue-500">♂</span> Male
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('gender', formData.gender === 'female' ? '' : 'female')}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        formData.gender === 'female'
                          ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/50 shadow-xs font-semibold"
                          : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-input"
                      )}
                    >
                      <span className="text-sm font-bold leading-none text-rose-500">♀</span> Female
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('gender', formData.gender === 'other' ? '' : 'other')}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        formData.gender === 'other'
                          ? "bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/50 shadow-xs font-semibold"
                          : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-input"
                      )}
                    >
                      <span>⚧</span> Other
                    </button>
                  </div>
                </div>

                {/* Birth Date & Life Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="birthDate" className="text-xs font-semibold">Birth Date</Label>
                    <div className="flex items-center gap-2">
                      <label 
                        htmlFor="edit-isDeceased" 
                        className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground transition-colors"
                      >
                        <input
                          id="edit-isDeceased"
                          type="checkbox"
                          checked={isDeceased}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsDeceased(checked);
                            if (!checked) {
                              setFormData(prev => ({ ...prev, deathDate: null }));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                        />
                        <span>Deceased</span>
                      </label>
                      {!isDeceased && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Living
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`grid gap-3 ${isDeceased ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="space-y-1.5">
                      <Input 
                        id="birthDate" 
                        type="date"
                        value={formData.birthDate || ''} 
                        onChange={(e) => handleChange('birthDate', e.target.value)} 
                      />
                    </div>

                    {isDeceased && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="deathDate" className="text-xs font-semibold text-muted-foreground">
                            Death Date
                          </Label>
                          {formData.deathDate && (
                            <button
                              type="button"
                              onClick={() => handleChange('deathDate', '')}
                              className="text-[10px] text-muted-foreground hover:text-destructive"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <Input 
                          id="deathDate" 
                          type="date"
                          value={formData.deathDate || ''} 
                          onChange={(e) => handleChange('deathDate', e.target.value)} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="birthPlace" className="text-xs font-semibold">Birth Place</Label>
                  <CityCombobox 
                    id="birthPlace" 
                    placeholder="Search city, country (e.g. Ndola, Zambia or Chicago, IL)"
                    value={formData.birthPlace || ''} 
                    onChange={(val) => handleChange('birthPlace', val)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoUrl" className="text-xs font-semibold">Avatar / Photo URL</Label>
                  <Input 
                    id="photoUrl" 
                    placeholder="https://... (or choose a preset below)"
                    value={formData.photoUrl || ''} 
                    onChange={(e) => handleChange('photoUrl', e.target.value)} 
                  />
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
                    <span className="text-[11px] text-muted-foreground mr-1 shrink-0">Presets:</span>
                    {[
                      { label: 'Elder Man', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
                      { label: 'Elder Woman', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
                      { label: 'Adult Man', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
                      { label: 'Adult Woman', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
                      { label: 'Young Woman', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
                      { label: 'Young Man', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' },
                      { label: 'Teen Girl', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleChange('photoUrl', preset.url)}
                        className={`h-7 w-7 rounded-full overflow-hidden border-2 shrink-0 transition-transform hover:scale-110 ${formData.photoUrl === preset.url ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="h-full w-full object-cover" />
                      </button>
                    ))}
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange('photoUrl', '')}
                        className="text-[10px] text-muted-foreground hover:text-destructive px-1.5 py-0.5 border rounded-md shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-xs font-semibold">Biography / Stories</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Write a brief bio, memories, or fun facts..."
                    value={formData.bio || ''} 
                    onChange={(e) => handleChange('bio', e.target.value)} 
                    rows={4}
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <Button onClick={handleSave} className="flex-1">
                    Save Changes
                  </Button>
                  {onDeletePerson && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove ${person.firstName} ${person.lastName} from the tree?`)) {
                          onDeletePerson(person.id);
                          onClose();
                        }
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {person.maidenName && (
                  <div>
                    <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Maiden Name (Birth Surname)
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {person.maidenName}
                    </p>
                  </div>
                )}
                {person.gender && (
                  <div>
                    <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Biological Gender
                    </span>
                    <p className="text-sm font-medium text-foreground capitalize flex items-center gap-1.5">
                      {person.gender === 'male' && <><span className="text-blue-500 font-bold">♂</span> Male</>}
                      {person.gender === 'female' && <><span className="text-rose-500 font-bold">♀</span> Female</>}
                      {person.gender === 'other' && <>Other</>}
                    </p>
                  </div>
                )}
                {person.bio ? (
                  <div>
                    <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider block mb-1">
                      Biography
                    </span>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {person.bio}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No biography added.</p>
                )}
              </div>
            )}
          </div>

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
        </div>
      </SheetContent>
    </Sheet>
  );
}
