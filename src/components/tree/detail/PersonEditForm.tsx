'use client';

import { Person } from '@/types/tree';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import CityCombobox from '../CityCombobox';

type PersonEditFormProps = {
  person: Person;
  formData: Partial<Person>;
  isDeceased: boolean;
  setIsDeceased: (val: boolean) => void;
  handleChange: (field: keyof Person, value: string) => void;
  handleSave: () => void;
  onDeletePerson?: (personId: string) => void;
  onClose: () => void;
  isEditable: boolean;
};

export default function PersonEditForm({
  person,
  formData,
  isDeceased,
  setIsDeceased,
  handleChange,
  handleSave,
  onDeletePerson,
  onClose,
  isEditable,
}: PersonEditFormProps) {
  return (
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
                        handleChange('deathDate', '');
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
  );
}
