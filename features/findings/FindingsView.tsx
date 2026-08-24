'use client';

import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CONFIDENCE_WEIGHT, SEVERITY_WEIGHT } from '@/types';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { FindingFilters } from './FindingFilters';
import { FindingCard } from './FindingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListChecks } from 'lucide-react';

type SortKey = 'severity' | 'confidence' | 'title';

const VIRTUALIZE_THRESHOLD = 60;

export function FindingsView() {
  const scan = useScanStore((s) => s.scan);
  const severityFilter = useUiStore((s) => s.severityFilter);
  const categoryFilter = useUiStore((s) => s.categoryFilter);
  const confidenceFilter = useUiStore((s) => s.confidenceFilter);
  const findingsQuery = useUiStore((s) => s.findingsQuery);
  const [sortKey, setSortKey] = useState<SortKey>('severity');

  const filtered = useMemo(() => {
    if (!scan) return [];
    const q = findingsQuery.trim().toLowerCase();
    let list = scan.findings.filter((f) => {
      if (severityFilter.length > 0 && !severityFilter.includes(f.severity)) return false;
      if (categoryFilter.length > 0 && !categoryFilter.includes(f.category)) return false;
      if (confidenceFilter.length > 0 && !confidenceFilter.includes(f.confidence)) return false;
      if (q) {
        const haystack = `${f.title} ${f.description} ${f.context?.path ?? ''} ${f.evidence.map((e) => e.text).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title);
      if (sortKey === 'confidence') return CONFIDENCE_WEIGHT[b.confidence] - CONFIDENCE_WEIGHT[a.confidence];
      return SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    });

    return list;
  }, [scan, severityFilter, categoryFilter, confidenceFilter, findingsQuery, sortKey]);

  const parentRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = filtered.length > VIRTUALIZE_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? filtered.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 8,
  });

  if (!scan) return null;

  return (
    <div className="flex h-full flex-col">
      <FindingFilters allFindings={scan.findings} />
      <div className="flex items-center justify-between px-6 pt-4">
        <p className="text-xs text-muted">
          {filtered.length} of {scan.findings.length} findings
        </p>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-md border border-border-subtle bg-surface-2 px-2 py-1 text-xs text-secondary focus:border-accent focus:outline-none"
        >
          <option value="severity">Sort: Severity</option>
          <option value="confidence">Sort: Confidence</option>
          <option value="title">Sort: Title</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title="No findings match these filters"
            description="Try clearing a filter or broadening your search."
          />
        </div>
      ) : shouldVirtualize ? (
        <div ref={parentRef} className="flex-1 overflow-y-auto px-6 py-4">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((item) => (
              <div
                key={item.key}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)`, paddingBottom: 8 }}
              >
                <FindingCard finding={filtered[item.index]} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
          {filtered.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
}
