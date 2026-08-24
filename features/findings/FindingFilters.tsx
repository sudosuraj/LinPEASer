'use client';

import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, Search, X } from 'lucide-react';
import type { Confidence, Finding, FindingCategory } from '@/types';
import { CONFIDENCE_LEVELS, FINDING_CATEGORY_LABELS, SEVERITIES } from '@/types';
import { useUiStore } from '@/lib/store/uiStore';
import { SEVERITY_META, CONFIDENCE_META } from '@/lib/presentation';
import { cn } from '@/utils/cn';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FindingFilters({ allFindings }: { allFindings: Finding[] }) {
  const severityFilter = useUiStore((s) => s.severityFilter);
  const setSeverityFilter = useUiStore((s) => s.setSeverityFilter);
  const categoryFilter = useUiStore((s) => s.categoryFilter);
  const setCategoryFilter = useUiStore((s) => s.setCategoryFilter);
  const confidenceFilter = useUiStore((s) => s.confidenceFilter);
  const setConfidenceFilter = useUiStore((s) => s.setConfidenceFilter);
  const findingsQuery = useUiStore((s) => s.findingsQuery);
  const setFindingsQuery = useUiStore((s) => s.setFindingsQuery);
  const resetFilters = useUiStore((s) => s.resetFilters);
  const [expanded, setExpanded] = useState(false);

  const presentCategories = Array.from(new Set(allFindings.map((f) => f.category))) as FindingCategory[];
  const activeFilterCount = severityFilter.length + categoryFilter.length + confidenceFilter.length;
  const hasActiveFilters = activeFilterCount > 0 || findingsQuery.length > 0;

  return (
    <div className="border-b border-border-subtle bg-surface px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={findingsQuery}
            onChange={(e) => setFindingsQuery(e.target.value)}
            placeholder="Search findings by title, path, or evidence…"
            className="w-full rounded-md border border-border-subtle bg-canvas py-1.5 pl-8 pr-3 text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
            expanded || activeFilterCount > 0
              ? 'border-accent/40 bg-accent-soft text-accent'
              : 'border-border-subtle text-muted hover:border-border-strong hover:text-secondary'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-fg">{activeFilterCount}</span>
          )}
          <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
        </button>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="flex shrink-0 items-center gap-1 text-xs text-muted hover:text-secondary">
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-2.5 border-t border-border-subtle pt-3">
          <FilterRow label="Severity">
            {SEVERITIES.map((sev) => (
              <Chip
                key={sev}
                active={severityFilter.includes(sev)}
                onClick={() => setSeverityFilter(toggle(severityFilter, sev))}
                activeClass={cn(SEVERITY_META[sev].bg, SEVERITY_META[sev].text, SEVERITY_META[sev].border)}
              >
                {SEVERITY_META[sev].label}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label="Confidence">
            {CONFIDENCE_LEVELS.map((c: Confidence) => (
              <Chip key={c} active={confidenceFilter.includes(c)} onClick={() => setConfidenceFilter(toggle(confidenceFilter, c))}>
                {CONFIDENCE_META[c].label}
              </Chip>
            ))}
          </FilterRow>

          {presentCategories.length > 0 && (
            <FilterRow label="Category">
              {presentCategories.map((cat) => (
                <Chip key={cat} active={categoryFilter.includes(cat)} onClick={() => setCategoryFilter(toggle(categoryFilter, cat))}>
                  {FINDING_CATEGORY_LABELS[cat]}
                </Chip>
              ))}
            </FilterRow>
          )}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
        active ? (activeClass ?? 'border-accent/40 bg-accent-soft text-accent') : 'border-border-subtle text-muted hover:border-border-strong hover:text-secondary'
      )}
    >
      {children}
    </button>
  );
}
