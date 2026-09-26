'use client';

import React, { useState, useRef, useEffect } from 'react';
import { searchCities, CitySuggestion } from '@/lib/geo';
import { Input } from '@/components/ui/input';
import { MapPin, X } from 'lucide-react';

type CityComboboxProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function CityCombobox({
  id,
  value,
  onChange,
  placeholder = 'City, State or Country (e.g. Ndola, Zambia)',
  className,
}: CityComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      setSuggestions(searchCities(query, 7));
    }
  }, [query, isOpen]);

  // Click outside listener to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: CitySuggestion) => {
    onChange(item.fullName);
    setQuery(item.fullName);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setQuery(nextVal);
    onChange(nextVal);
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && isOpen && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setSuggestions(searchCities(query, 7));
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`pl-8 pr-8 text-sm ${className || ''}`}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onChange('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
            title="Clear location"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
            Suggested Global Locations
          </div>
          {suggestions.map((item) => (
            <button
              key={item.fullName}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-muted/80 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-semibold text-foreground truncate">{item.city}</span>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded group-hover:bg-background">
                {item.country}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
