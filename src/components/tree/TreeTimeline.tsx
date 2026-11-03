'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TreeData, Person } from '@/types/tree';
import {
  buildTimelineEvents,
  groupEventsByDecade,
  TimelineEventType,
  formatYearDisplay,
  getContemporariesInYear,
  extractYear,
} from '@/lib/timeline-utils';
import { getPersonFullName, isDeceased } from '@/lib/tree-utils';
import {
  Calendar,
  Search,
  Heart,
  Clock,
  ChevronRight,
  RotateCcw,
  BarChart3,
  ScrollText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type TreeTimelineProps = {
  treeData: TreeData;
  onPersonClick: (person: Person) => void;
  highlightedPersonId?: string | null;
};

export default function TreeTimeline({
  treeData,
  onPersonClick,
  highlightedPersonId,
}: TreeTimelineProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<TimelineEventType | 'all'>('all');

  // Auto-scroll to highlighted person when jumped from Spotlight Search
  useEffect(() => {
    if (highlightedPersonId) {
      const el = document.getElementById(`timeline-person-${highlightedPersonId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedPersonId]);

  // Timeline Data Processing
  const { events, lifespans, minYear, maxYear, isHistoricalDynasty } = useMemo(() => {
    return buildTimelineEvents(treeData);
  }, [treeData]);

  // Unified Time Traveler Year Scrubber state (always active in unified timeline view)
  const [scrubberYear, setScrubberYear] = useState<number>(maxYear);

  useEffect(() => {
    setScrubberYear(maxYear);
  }, [maxYear, treeData.tree.id]);

  const isScrubbingPast = scrubberYear < maxYear;

  // Filter events by type, search query, and scrubbed year
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (activeTypeFilter !== 'all' && event.type !== activeTypeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pName = getPersonFullName(event.person).toLowerCase();
        const relName = event.relatedPerson ? getPersonFullName(event.relatedPerson).toLowerCase() : '';
        const title = event.title.toLowerCase();
        const desc = (event.description || '').toLowerCase();
        if (
          !pName.includes(query) &&
          !relName.includes(query) &&
          !title.includes(query) &&
          !desc.includes(query)
        ) {
          return false;
        }
      }

      if (event.year > scrubberYear) {
        return false;
      }

      return true;
    });
  }, [events, activeTypeFilter, searchQuery, scrubberYear]);

  // Filter lifespans by search query
  const filteredLifespans = useMemo(() => {
    if (!searchQuery.trim()) return lifespans;
    const query = searchQuery.toLowerCase();
    return lifespans.filter((item) =>
      getPersonFullName(item.person).toLowerCase().includes(query)
    );
  }, [lifespans, searchQuery]);

  // Group filtered events into decades
  const decadeGroups = useMemo(() => {
    return groupEventsByDecade(filteredEvents, isHistoricalDynasty);
  }, [filteredEvents, isHistoricalDynasty]);

  // Relatives alive during the current scrubbed year
  const contemporaries = useMemo(() => {
    return getContemporariesInYear(lifespans, scrubberYear);
  }, [lifespans, scrubberYear]);

  const lifespanByPersonId = useMemo(() => {
    return new Map(lifespans.map((l) => [l.person.id, l]));
  }, [lifespans]);

  // Event counts for category pills
  const counts = useMemo(() => {
    return {
      all: events.length,
      birth: events.filter((e) => e.type === 'birth').length,
      marriage: events.filter((e) => e.type === 'marriage').length,
      milestone: events.filter((e) => e.type === 'milestone').length,
      death: events.filter((e) => e.type === 'death').length,
    };
  }, [events]);

  const totalSpan = Math.max(maxYear - minYear, 1);
  const scrubberPercent = Math.max(0, Math.min(100, ((scrubberYear - minYear) / totalSpan) * 100));

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      {/* Top Unified Header, Search, Category Filters & Time Traveler Year Scrubber */}
      <div className="flex-none p-3 sm:p-4 border-b bg-card space-y-3 z-10 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5 shrink-0">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Family Timeline</span>
            </h2>
            <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">
              Unified Lifespans • Time Traveler • Event Stream
            </Badge>
          </div>

          {/* Search relative input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by relative name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Always-Visible Interactive Time Traveler Year Scrubber */}
        <div
          data-testid="time-traveler-scrubber"
          className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/30 text-xs space-y-2"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Traveler Year Scrubber:</span>
                <span
                  data-testid="scrubber-year-badge"
                  className="font-mono text-sm font-bold bg-amber-500/20 px-2 py-0.5 rounded-md text-foreground"
                >
                  {formatYearDisplay(scrubberYear, isHistoricalDynasty)}
                </span>
              </span>
              {isScrubbingPast && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setScrubberYear(maxYear)}
                  className="h-6 px-2 text-[10px] gap-1 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to {formatYearDisplay(maxYear, isHistoricalDynasty)}</span>
                </Button>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground">
              <strong>{contemporaries.length}</strong> of {lifespans.length} relatives alive in{' '}
              <strong>{formatYearDisplay(scrubberYear, isHistoricalDynasty)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {formatYearDisplay(minYear, isHistoricalDynasty)}
            </span>
            <input
              type="range"
              aria-label="Time Traveler Year Scrubber"
              min={minYear}
              max={maxYear}
              value={scrubberYear}
              onChange={(e) => setScrubberYear(Number(e.target.value))}
              className="flex-1 accent-amber-600 h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {formatYearDisplay(maxYear, isHistoricalDynasty)}
            </span>
          </div>

          {/* Living Contemporaries & Historical Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
              In {formatYearDisplay(scrubberYear, isHistoricalDynasty)}:
            </span>
            {lifespans.map((item) => {
              const isAliveInYear =
                item.birthYear <= scrubberYear && item.deathYear >= scrubberYear;
              const ageInYear = scrubberYear - item.birthYear;

              return (
                <button
                  key={item.person.id}
                  type="button"
                  onClick={() => onPersonClick(item.person)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] transition-all shrink-0 cursor-pointer ${
                    isAliveInYear
                      ? 'bg-background border-emerald-500/40 text-foreground hover:border-primary shadow-2xs'
                      : 'bg-muted/40 border-border/50 text-muted-foreground opacity-45 grayscale'
                  }`}
                  title={
                    isAliveInYear
                      ? `${getPersonFullName(item.person)} — Age ${ageInYear} in ${scrubberYear}`
                      : item.birthYear > scrubberYear
                      ? `${getPersonFullName(item.person)} — Not yet born (b. ${item.birthYear})`
                      : `${getPersonFullName(item.person)} — Deceased (${item.birthYear}–${item.deathYear})`
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAliveInYear ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span className="font-medium">{item.person.firstName}</span>
                  {isAliveInYear && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({ageInYear} yrs)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTypeFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              activeTypeFilter === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All Events ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('birth')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              activeTypeFilter === 'birth'
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            👶 Births ({counts.birth})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('marriage')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              activeTypeFilter === 'marriage'
                ? 'bg-rose-600 text-white font-semibold shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            💍 Marriages ({counts.marriage})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('milestone')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              activeTypeFilter === 'milestone'
                ? 'bg-violet-600 text-white font-semibold shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            🏆 Milestones ({counts.milestone})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeFilter('death')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              activeTypeFilter === 'death'
                ? 'bg-slate-700 text-white font-semibold shadow-xs'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            🪦 Memorials ({counts.death})
          </button>
        </div>
      </div>

      {/* Main Unified Scrollable Area: Lifespan Tracks + Chronological Decade Stream */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Top Column: Gantt-Style Lifespan Tracks */}
          <section
            aria-label="Lifespan Tracks"
            className="lg:col-span-5 space-y-3 bg-card/60 border border-border rounded-2xl p-3.5 sm:p-4 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2 border-b pb-2.5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-500" />
                <h3 className="text-xs sm:text-sm font-bold text-foreground">
                  📊 Lifespan Tracks
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {formatYearDisplay(minYear, isHistoricalDynasty)} –{' '}
                {formatYearDisplay(maxYear, isHistoricalDynasty)}
              </span>
            </div>

            <div className="space-y-2 relative">
              {filteredLifespans.map((item) => {
                const leftPercent = Math.max(
                  0,
                  Math.min(100, ((item.birthYear - minYear) / totalSpan) * 100)
                );
                const widthPercent = Math.max(
                  8,
                  Math.min(
                    100 - leftPercent,
                    ((item.deathYear - item.birthYear) / totalSpan) * 100
                  )
                );
                const dead = !item.isLiving;
                const aliveInScrubbedYear =
                  item.birthYear <= scrubberYear && item.deathYear >= scrubberYear;
                const ageInScrubbedYear = scrubberYear - item.birthYear;

                return (
                  <div
                    key={item.person.id}
                    onClick={() => onPersonClick(item.person)}
                    className={`group p-2.5 rounded-xl border bg-card hover:bg-muted/40 transition-all cursor-pointer space-y-1.5 ${
                      !aliveInScrubbedYear && isScrubbingPast
                        ? 'opacity-45 grayscale border-border/50'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          className={`h-6 w-6 shrink-0 ${dead ? 'grayscale contrast-125' : ''}`}
                        >
                          <AvatarImage
                            src={item.person.photoUrl || undefined}
                            alt={item.person.firstName}
                          />
                          <AvatarFallback className="text-[10px] font-bold">
                            {item.person.firstName?.[0]}
                            {item.person.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {getPersonFullName(item.person)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] shrink-0 font-mono">
                        <span className="text-muted-foreground">
                          {formatYearDisplay(item.birthYear, isHistoricalDynasty)} –{' '}
                          {dead
                            ? formatYearDisplay(item.deathYear, isHistoricalDynasty)
                            : 'Present'}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 h-4 ${
                            dead
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300'
                          }`}
                        >
                          {isScrubbingPast && aliveInScrubbedYear
                            ? `${ageInScrubbedYear}y in ${scrubberYear}`
                            : dead
                            ? `Lived ${item.age}y`
                            : `Age ${item.age}`}
                        </Badge>
                      </div>
                    </div>

                    {/* Lifespan Horizontal Bar with Scrubber Marker */}
                    <div className="w-full bg-muted/60 h-4 rounded-full relative overflow-hidden">
                      <div
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                        className={`absolute top-0 bottom-0 rounded-full flex items-center justify-between px-2 text-[9px] font-bold text-white transition-all ${
                          dead
                            ? 'bg-gradient-to-r from-slate-600 to-slate-500'
                            : 'bg-gradient-to-r from-sky-500 to-emerald-500 shadow-xs'
                        }`}
                      >
                        <span className="truncate">{item.person.firstName}</span>
                        <span className="opacity-90 font-mono hidden sm:inline">
                          {item.age}y
                        </span>
                      </div>
                      {/* Vertical Year Scrubber Line */}
                      <div
                        style={{ left: `${scrubberPercent}%` }}
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10 pointer-events-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right / Bottom Column: Chronological Event Stream by Decade */}
          <section aria-label="Chronological Event Stream" className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b pb-2.5">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-bold text-foreground">
                  📜 Chronological Event Stream
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Showing <strong>{filteredEvents.length}</strong> milestones across{' '}
                <strong>{decadeGroups.length}</strong> decades
              </span>
            </div>

            <div className="space-y-8 relative">
              {/* Illuminated Spine Line */}
              <div className="absolute top-2 bottom-6 left-4 sm:left-6 w-0.5 bg-gradient-to-b from-primary/80 via-primary/30 to-border -translate-x-1/2" />

              {decadeGroups.length === 0 ? (
                <div className="text-center py-16 space-y-3 border rounded-2xl bg-card/50">
                  <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">No events found</p>
                  <p className="text-xs text-muted-foreground">
                    Try clearing your search query, selecting &quot;All Events&quot;, or moving the
                    year scrubber forward.
                  </p>
                </div>
              ) : (
                decadeGroups.map((group) => (
                  <div key={group.decadeStart} className="space-y-4 relative">
                    {/* Decade / Era Header Pill */}
                    <div className="sticky top-0 z-10 flex items-center gap-3 py-1">
                      <div className="w-8 sm:w-12 flex items-center justify-center shrink-0">
                        <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-xs tracking-wider">
                        {group.decadeLabel}
                      </span>
                      <div className="h-px flex-1 bg-border/60" />
                    </div>

                    {/* Decade Events */}
                    <div className="space-y-3 ml-8 sm:ml-12 pl-2">
                      {group.events.map((event) => {
                        const dead = isDeceased(event.person);
                        const isHighlighted = event.person.id === highlightedPersonId;
                        const personBirthYear =
                          extractYear(event.person.birthDate) ??
                          lifespanByPersonId.get(event.person.id)?.birthYear ??
                          null;
                        const ageAtEvent =
                          personBirthYear !== null && event.year >= personBirthYear
                            ? event.year - personBirthYear
                            : null;

                        return (
                          <div
                            key={event.id}
                            id={`timeline-person-${event.person.id}`}
                            onClick={() => onPersonClick(event.person)}
                            className={`group relative p-3 sm:p-4 rounded-xl border bg-card/90 hover:bg-muted/50 transition-all shadow-xs hover:shadow-md cursor-pointer space-y-1.5 ${
                              isHighlighted
                                ? 'ring-4 ring-primary border-primary shadow-xl scale-[1.02] animate-pulse bg-primary/5'
                                : 'border-border hover:border-primary/40'
                            }`}
                          >
                            {/* Event Header Row */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar
                                  className={`h-8 w-8 shrink-0 ${
                                    dead ? 'grayscale contrast-125 ring-1 ring-slate-400' : ''
                                  }`}
                                >
                                  <AvatarImage
                                    src={event.person.photoUrl || undefined}
                                    alt={event.person.firstName}
                                  />
                                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                    {event.person.firstName?.[0]}
                                    {event.person.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {event.title}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {event.description || getPersonFullName(event.person)}
                                  </p>
                                </div>
                              </div>

                              {/* Date & Age Badge */}
                              <div className="flex flex-col items-end shrink-0">
                                <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
                                  {formatYearDisplay(event.year, isHistoricalDynasty)}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {event.badgeText && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {event.badgeText}
                                    </span>
                                  )}
                                  {ageAtEvent !== null && ageAtEvent > 0 && (
                                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-medium">
                                      • Age {ageAtEvent}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Marriage Second Relative Link */}
                            {event.relatedPerson && (
                              <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                                  <span>
                                    Spouse:{' '}
                                    <strong>{getPersonFullName(event.relatedPerson)}</strong>
                                  </span>
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPersonClick(event.relatedPerson!);
                                  }}
                                  className="h-6 px-1.5 text-[10px] text-primary hover:text-primary/80"
                                >
                                  View Spouse <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
