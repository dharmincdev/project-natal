'use client';

import React from 'react';
import { Gender } from '@/types/tree';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CityCombobox from '../CityCombobox';

const PHOTO_PRESETS = [
  { label: 'Elder Man', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Elder Woman', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
  { label: 'Adult Man', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Adult Woman', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
  { label: 'Young Woman', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { label: 'Young Man', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80' },
  { label: 'Teen Girl', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
];

export type PersonBasicInfoFormProps = {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  maidenName: string;
  setMaidenName: (val: string) => void;
  nickname: string;
  setNickname: (val: string) => void;
  gender: Gender | '';
  setGender: (val: Gender | '') => void;
  birthDate: string;
  setBirthDate: (val: string) => void;
  deathDate: string;
  setDeathDate: (val: string) => void;
  isDeceased: boolean;
  setIsDeceased: (val: boolean) => void;
  birthPlace: string;
  setBirthPlace: (val: string) => void;
  photoUrl: string;
  setPhotoUrl: (val: string) => void;
};

export default function PersonBasicInfoForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  maidenName,
  setMaidenName,
  nickname,
  setNickname,
  gender,
  setGender,
  birthDate,
  setBirthDate,
  deathDate,
  setDeathDate,
  isDeceased,
  setIsDeceased,
  birthPlace,
  setBirthPlace,
  photoUrl,
  setPhotoUrl,
}: PersonBasicInfoFormProps) {
  return (
    <div className="space-y-3.5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Basic Details
      </h4>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="add-firstName" className="text-xs font-semibold">First Name *</Label>
          <Input 
            id="add-firstName" 
            placeholder="e.g. Daniella"
            value={firstName} 
            onChange={e => setFirstName(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-lastName" className="text-xs font-semibold">Last Name</Label>
          <Input 
            id="add-lastName" 
            placeholder="e.g. Smith"
            value={lastName} 
            onChange={e => setLastName(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="add-maidenName" className="text-xs font-semibold flex items-center gap-1">
            Maiden Name <span className="text-[10px] text-muted-foreground font-normal">(Birth Surname)</span>
          </Label>
          <Input 
            id="add-maidenName" 
            placeholder="e.g. Patel or Johnson"
            value={maidenName} 
            onChange={e => setMaidenName(e.target.value)} 
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-nickname" className="text-xs font-semibold">Nickname</Label>
          <Input 
            id="add-nickname" 
            placeholder="Optional nickname"
            value={nickname} 
            onChange={e => setNickname(e.target.value)} 
          />
        </div>
      </div>

      {/* Biological Gender */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Biological Gender</Label>
          {gender && (
            <button
              type="button"
              onClick={() => setGender('')}
              className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setGender(gender === 'male' ? '' : 'male')}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer",
              gender === 'male'
                ? "bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/50 shadow-xs font-semibold"
                : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-input"
            )}
          >
            <span className="text-sm font-bold leading-none text-blue-500">♂</span> Male
          </button>
          <button
            type="button"
            onClick={() => setGender(gender === 'female' ? '' : 'female')}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer",
              gender === 'female'
                ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/50 shadow-xs font-semibold"
                : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-input"
            )}
          >
            <span className="text-sm font-bold leading-none text-rose-500">♀</span> Female
          </button>
          <button
            type="button"
            onClick={() => setGender(gender === 'other' ? '' : 'other')}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer",
              gender === 'other'
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
          <Label htmlFor="add-birthDate" className="text-xs font-semibold">Birth Date</Label>
          <div className="flex items-center gap-2">
            <label 
              htmlFor="add-isDeceased" 
              className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground transition-colors"
            >
              <input
                id="add-isDeceased"
                type="checkbox"
                checked={isDeceased}
                onChange={(e) => {
                  setIsDeceased(e.target.checked);
                  if (!e.target.checked) setDeathDate('');
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
              id="add-birthDate" 
              type="date" 
              value={birthDate} 
              onChange={e => setBirthDate(e.target.value)} 
            />
          </div>

          {isDeceased && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="add-deathDate" className="text-xs font-semibold text-muted-foreground">
                  Death Date
                </Label>
                {deathDate && (
                  <button
                    type="button"
                    onClick={() => setDeathDate('')}
                    className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <Input 
                id="add-deathDate" 
                type="date" 
                value={deathDate} 
                onChange={e => setDeathDate(e.target.value)} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="add-birthPlace" className="text-xs font-semibold">Birth Place</Label>
        <CityCombobox 
          id="add-birthPlace" 
          placeholder="City, State or Country (e.g. Ndola, Zambia)"
          value={birthPlace} 
          onChange={setBirthPlace} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="add-photoUrl" className="text-xs font-semibold">Avatar / Photo URL</Label>
        <Input 
          id="add-photoUrl" 
          placeholder="https://... (or select a preset below)"
          value={photoUrl} 
          onChange={e => setPhotoUrl(e.target.value)} 
        />
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
          <span className="text-[11px] text-muted-foreground mr-1 shrink-0">Presets:</span>
          {PHOTO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPhotoUrl(preset.url)}
              className={`h-7 w-7 rounded-full overflow-hidden border-2 shrink-0 transition-transform hover:scale-110 cursor-pointer ${
                photoUrl === preset.url ? 'border-primary ring-2 ring-primary/30' : 'border-border'
              }`}
              title={preset.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preset.url} alt={preset.label} className="h-full w-full object-cover" />
            </button>
          ))}
          {photoUrl && (
            <button
              type="button"
              onClick={() => setPhotoUrl('')}
              className="text-[10px] text-muted-foreground hover:text-destructive px-1.5 py-0.5 border rounded-md shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
