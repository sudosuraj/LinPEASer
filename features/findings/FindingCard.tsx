'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Finding } from '@/types';
import { SeverityBadge } from '@/components/badges/SeverityBadge';
import { ConfidenceBadge } from '@/components/badges/ConfidenceBadge';
import { CategoryBadge } from '@/components/badges/CategoryBadge';
import { cn } from '@/utils/cn';

export function FindingCard({ finding, compact = false }: { finding: Finding; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface transition-colors hover:border-border-strong">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={finding.severity} />
            <ConfidenceBadge confidence={finding.confidence} />
            <CategoryBadge category={finding.category} />
          </div>
          <p className="text-sm font-medium text-primary">{finding.title}</p>
          {!compact && <p className="mt-0.5 truncate text-xs text-muted">{finding.sectionPath.join(' / ')}</p>}
        </div>
        <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-muted transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border-subtle px-4 py-3 text-xs">
          <p className="text-secondary">{finding.description}</p>
          <div>
            <p className="mb-1 font-semibold uppercase tracking-wide text-muted">Why it matters</p>
            <p className="text-secondary">{finding.rationale}</p>
          </div>
          {finding.evidence.length > 0 && (
            <div>
              <p className="mb-1 font-semibold uppercase tracking-wide text-muted">Evidence</p>
              <div className="space-y-1 rounded-md border border-border-subtle bg-canvas p-2 font-mono">
                {finding.evidence.slice(0, 6).map((e) => (
                  <div key={e.lineIndex} className="flex gap-2 whitespace-pre-wrap break-all">
                    <span className="shrink-0 select-none text-muted">{e.lineIndex + 1}</span>
                    <span className="text-secondary">{e.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {finding.sectionPath.length > 0 && (
            <p className="text-muted">
              <span className="font-semibold uppercase tracking-wide">Source:</span> {finding.sectionPath.join(' / ')}
            </p>
          )}
          {finding.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {finding.tags.map((tag) => (
                <span key={tag} className="rounded border border-border-subtle px-1.5 py-0.5 text-[10px] text-muted">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
