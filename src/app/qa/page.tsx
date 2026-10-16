'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  QA_SUITES, 
  QA_TEST_CASES, 
  QATestCase, 
  QASuite 
} from '@/data/qa-test-cases';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  RotateCcw, 
  Download, 
  Search, 
  Filter, 
  Sparkles, 
  Layers, 
  Users, 
  Mic, 
  CreditCard, 
  Cloud, 
  FileSpreadsheet, 
  QrCode, 
  Smartphone, 
  Compass, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft,
  Check,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/shared/ThemeToggle';

type TestState = {
  status: 'passed' | 'failed' | 'pending';
  notes?: string;
  subChecks?: Record<number, boolean>;
  updatedAt?: string;
};

const STORAGE_KEY = 'project_natal_qa_checklist_v1';

export default function QAPage() {
  const [checklist, setChecklist] = useState<Record<string, TestState>>({});
  const [selectedSuiteId, setSelectedSuiteId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'passed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  // Load saved checklist from localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setChecklist(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load QA checklist from localStorage', e);
    }
  }, []);

  // Save changes to localStorage
  const saveChecklist = (newState: Record<string, TestState>) => {
    setChecklist(newState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to persist QA checklist', e);
    }
  };

  const setTestStatus = (id: string, status: 'passed' | 'failed' | 'pending') => {
    const updated = {
      ...checklist,
      [id]: {
        ...checklist[id],
        status,
        updatedAt: new Date().toISOString(),
      },
    };
    saveChecklist(updated);
  };

  const updateTestNotes = (id: string, notes: string) => {
    const updated = {
      ...checklist,
      [id]: {
        ...checklist[id],
        status: checklist[id]?.status || 'pending',
        notes,
        updatedAt: new Date().toISOString(),
      },
    };
    saveChecklist(updated);
  };

  const toggleSubCheck = (testId: string, subIndex: number) => {
    const currentSub = checklist[testId]?.subChecks || {};
    const updatedSub = {
      ...currentSub,
      [subIndex]: !currentSub[subIndex],
    };

    const updated = {
      ...checklist,
      [testId]: {
        ...checklist[testId],
        status: checklist[testId]?.status || 'pending',
        subChecks: updatedSub,
      },
    };
    saveChecklist(updated);
  };

  const toggleExpand = (id: string) => {
    setExpandedTests(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    QA_TEST_CASES.forEach(tc => {
      allExpanded[tc.id] = true;
    });
    setExpandedTests(allExpanded);
  };

  const collapseAll = () => {
    setExpandedTests({});
  };

  const resetAllProgress = () => {
    if (confirm('Are you sure you want to reset all test statuses and notes? This will clear your saved checklist.')) {
      saveChecklist({});
    }
  };

  const markCurrentSuiteAsPassed = () => {
    const targetCases = selectedSuiteId === 'all' 
      ? QA_TEST_CASES 
      : QA_TEST_CASES.filter(tc => tc.suiteId === selectedSuiteId);
    
    const updated = { ...checklist };
    targetCases.forEach(tc => {
      updated[tc.id] = {
        ...updated[tc.id],
        status: 'passed',
        updatedAt: new Date().toISOString(),
      };
    });
    saveChecklist(updated);
  };

  // Metrics calculations
  const totalCount = QA_TEST_CASES.length;
  const passedCount = useMemo(() => {
    return QA_TEST_CASES.filter(tc => checklist[tc.id]?.status === 'passed').length;
  }, [checklist]);

  const failedCount = useMemo(() => {
    return QA_TEST_CASES.filter(tc => checklist[tc.id]?.status === 'failed').length;
  }, [checklist]);

  const pendingCount = totalCount - passedCount - failedCount;
  const passPercentage = Math.round((passedCount / totalCount) * 100);

  // Filtered test cases
  const filteredCases = useMemo(() => {
    return QA_TEST_CASES.filter(tc => {
      // Suite filter
      if (selectedSuiteId !== 'all' && tc.suiteId !== selectedSuiteId) {
        return false;
      }
      // Status filter
      const currentStatus = checklist[tc.id]?.status || 'pending';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = tc.id.toLowerCase().includes(q);
        const matchesTitle = tc.title.toLowerCase().includes(q);
        const matchesObj = tc.objective.toLowerCase().includes(q);
        const matchesSuite = tc.suiteTitle.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesObj && !matchesSuite) {
          return false;
        }
      }
      return true;
    });
  }, [selectedSuiteId, statusFilter, searchQuery, checklist]);

  // Export report as markdown
  const exportMarkdownReport = () => {
    let report = `# 🧪 Project Natal — Manual QA Execution Report\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n`;
    report += `**Overall Score:** ${passedCount}/${totalCount} Passed (${passPercentage}%)\n`;
    report += `**Failed:** ${failedCount} | **Pending:** ${pendingCount}\n\n`;
    report += `---\n\n`;

    QA_SUITES.forEach(suite => {
      const suiteCases = QA_TEST_CASES.filter(tc => tc.suiteId === suite.id);
      const suitePassed = suiteCases.filter(tc => checklist[tc.id]?.status === 'passed').length;
      report += `## ${suite.id}: ${suite.title} (${suitePassed}/${suiteCases.length})\n\n`;

      suiteCases.forEach(tc => {
        const state = checklist[tc.id];
        const statusIcon = state?.status === 'passed' ? '✅ PASS' : state?.status === 'failed' ? '❌ FAIL' : '⚪ PENDING';
        report += `### [${statusIcon}] ${tc.id}: ${tc.title}\n`;
        report += `- **Priority:** ${tc.priority}\n`;
        report += `- **Objective:** ${tc.objective}\n`;
        if (state?.notes) {
          report += `- **Tester Notes:** ${state.notes}\n`;
        }
        report += `\n`;
      });
    });

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-natal-qa-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSuiteIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers className="w-4 h-4" />;
      case 'UserCheck': return <UserCheck className="w-4 h-4" />;
      case 'Mic': return <Mic className="w-4 h-4" />;
      case 'Compass': return <Compass className="w-4 h-4" />;
      case 'FileSpreadsheet': return <FileSpreadsheet className="w-4 h-4" />;
      case 'Cloud': return <Cloud className="w-4 h-4" />;
      case 'CreditCard': return <CreditCard className="w-4 h-4" />;
      case 'Users': return <Users className="w-4 h-4" />;
      case 'QrCode': return <QrCode className="w-4 h-4" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/demo"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
            title="Return to Tree Canvas"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Tree</span>
          </Link>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🧪</span>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight leading-tight">
                Project Natal QA Plan
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Interactive Manual Testing Checklist • 50 Test Cases
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Localhost:3001 Live
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={exportMarkdownReport}
            className="h-8 text-xs gap-1.5 shadow-2xs"
            title="Download completed QA test report as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Report</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetAllProgress}
            className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Clear all checklist progress and notes"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <div className="h-4 w-px bg-border shrink-0 hidden sm:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Progress & Metrics Dashboard Banner */}
        <div className="p-4 sm:p-6 rounded-2xl border bg-card shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Testing Progress</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {passedCount} / {totalCount} Completed
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Check off each case as you manually test in the app. Progress is automatically saved to your browser.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={markCurrentSuiteAsPassed}
                className="text-xs h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Mark View as Passed
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                className="text-xs h-8 text-muted-foreground"
              >
                Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="text-xs h-8 text-muted-foreground"
              >
                Collapse
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300" 
                style={{ width: `${(passedCount / totalCount) * 100}%` }}
                title={`Passed: ${passedCount}`}
              />
              <div 
                className="h-full bg-rose-500 transition-all duration-300" 
                style={{ width: `${(failedCount / totalCount) * 100}%` }}
                title={`Failed: ${failedCount}`}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {passPercentage}% Passed
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {passedCount} Passed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {failedCount} Failed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  {pendingCount} Pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Suite Selector */}
        <div className="space-y-3">
          {/* Search & Status Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search test cases by title, ID, or keywords..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs bg-card"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Segmented Buttons */}
            <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-background shadow-xs text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('passed')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'passed'
                    ? 'bg-background shadow-xs text-emerald-600 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Passed ({passedCount})
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  statusFilter === 'failed'
                    ? 'bg-background shadow-xs text-rose-600 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Failed ({failedCount})
              </button>
            </div>
          </div>

          {/* Suite Filter Horizontal Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedSuiteId('all')}
              className={`px-3 py-1.5 rounded-lg border font-semibold shrink-0 transition-all ${
                selectedSuiteId === 'all'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border'
              }`}
            >
              All Suites (50)
            </button>
            {QA_SUITES.map(suite => {
              const suiteCases = QA_TEST_CASES.filter(tc => tc.suiteId === suite.id);
              const suitePassed = suiteCases.filter(tc => checklist[tc.id]?.status === 'passed').length;
              const isSelected = selectedSuiteId === suite.id;

              return (
                <button
                  key={suite.id}
                  onClick={() => setSelectedSuiteId(suite.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium shrink-0 transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  {getSuiteIcon(suite.icon)}
                  <span>{suite.id}: {suite.title}</span>
                  <span className={`text-[10px] px-1 py-0 rounded-full font-bold ml-0.5 ${
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {suitePassed}/{suiteCases.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Cases List */}
        <div className="space-y-3">
          {filteredCases.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl bg-card text-muted-foreground space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-50" />
              <p className="font-semibold text-foreground text-sm">No test cases match your criteria</p>
              <p className="text-xs">Try clearing your search query or switching filters.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSelectedSuiteId('all'); setStatusFilter('all'); setSearchQuery(''); }}
                className="mt-2 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredCases.map(tc => {
              const state = checklist[tc.id] || { status: 'pending' };
              const isExpanded = !!expandedTests[tc.id];
              const subChecks = state.subChecks || {};

              return (
                <div
                  key={tc.id}
                  className={`rounded-xl border transition-all duration-150 bg-card shadow-2xs ${
                    state.status === 'passed'
                      ? 'border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10'
                      : state.status === 'failed'
                      ? 'border-rose-500/30 bg-rose-50/10 dark:bg-rose-950/10'
                      : 'border-border'
                  }`}
                >
                  {/* Card Header Row */}
                  <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Status Toggle Button */}
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <button
                          onClick={() => setTestStatus(tc.id, state.status === 'passed' ? 'pending' : 'passed')}
                          className={`p-1 rounded-md transition-colors ${
                            state.status === 'passed'
                              ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          title={state.status === 'passed' ? 'Mark as Pending' : 'Mark as Passed'}
                        >
                          <CheckCircle2 className={`w-5 h-5 ${state.status === 'passed' ? 'fill-emerald-500 text-white' : ''}`} />
                        </button>
                        <button
                          onClick={() => setTestStatus(tc.id, state.status === 'failed' ? 'pending' : 'failed')}
                          className={`p-1 rounded-md transition-colors ${
                            state.status === 'failed'
                              ? 'text-rose-600 bg-rose-100 dark:bg-rose-900/40'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                          title={state.status === 'failed' ? 'Mark as Pending' : 'Mark as Failed'}
                        >
                          <XCircle className={`w-5 h-5 ${state.status === 'failed' ? 'fill-rose-500 text-white' : ''}`} />
                        </button>
                      </div>

                      {/* Title & Metadata */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {tc.id}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 font-bold ${
                              tc.priority === 'P0' 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' 
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                            }`}
                          >
                            {tc.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                            {tc.suiteId}
                          </Badge>
                          <span className="text-xs sm:text-sm font-semibold text-foreground">
                            {tc.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {tc.objective}
                        </p>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      {/* Direct Link to test in app */}
                      <Link
                        href={tc.targetRoute}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors shadow-2xs"
                        title={`Open ${tc.targetRoute} in new tab`}
                      >
                        <span>{tc.targetLabel}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {/* Expand / Collapse Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(tc.id)}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 ml-1" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-border/60 bg-muted/20 space-y-3.5 text-xs">
                      {/* Objective */}
                      <div className="space-y-1">
                        <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block">
                          Objective
                        </span>
                        <p className="text-foreground font-medium">
                          {tc.objective}
                        </p>
                      </div>

                      {/* Steps */}
                      <div className="space-y-1.5">
                        <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block">
                          Step-by-Step Instructions
                        </span>
                        <ol className="list-decimal list-inside space-y-1 text-foreground/90 pl-1">
                          {tc.steps.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Expected Outcome with Interactive Sub-Checks */}
                      <div className="space-y-1.5">
                        <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block">
                          Expected Outcomes (Click to verify each)
                        </span>
                        <div className="space-y-1">
                          {tc.expected.map((exp, expIdx) => {
                            const isChecked = !!subChecks[expIdx];
                            return (
                              <button
                                key={expIdx}
                                type="button"
                                onClick={() => toggleSubCheck(tc.id, expIdx)}
                                className={`w-full flex items-start gap-2 p-1.5 rounded-lg text-left transition-colors ${
                                  isChecked 
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 text-foreground font-medium' 
                                    : 'hover:bg-muted/60 text-muted-foreground'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                  isChecked 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-border bg-background'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className={isChecked ? 'line-through opacity-80' : ''}>
                                  {exp}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tester Notes & Bug Observations */}
                      <div className="space-y-1 pt-1">
                        <label 
                          htmlFor={`notes-${tc.id}`}
                          className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block"
                        >
                          Tester Notes / Bug Observations
                        </label>
                        <textarea
                          id={`notes-${tc.id}`}
                          rows={2}
                          value={state.notes || ''}
                          onChange={e => updateTestNotes(tc.id, e.target.value)}
                          placeholder="Record any unexpected behavior, UI glitches, or suggestions here (auto-saved)..."
                          className="w-full rounded-lg border border-input bg-background p-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
