'use client';

import type { SessionMeta, Severity } from '@/types';
import { SEVERITIES } from '@/types';
import { SEVERITY_META } from '@/lib/presentation';
import { SeverityDot } from '@/components/badges/SeverityBadge';
import { formatRelativeTime, pluralize } from '@/utils/format';
import { cn } from '@/utils/cn';
import { SessionActionsMenu } from './SessionActionsMenu';

function highestSeverity(counts: SessionMeta['findingCounts']): Severity | null {
  for (const sev of SEVERITIES) {
    if (counts[sev] > 0) return sev;
  }
  return null;
}

export function SessionCard({
  session,
  selected,
  onToggleSelect,
  onOpen,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
}: {
  session: SessionMeta;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const risk = highestSeverity(session.findingCounts);

  return (
    <div
      onClick={onOpen}
      className={cn(
        'group flex cursor-pointer items-start gap-3 rounded-lg border bg-surface px-4 py-3.5 transition-colors hover:border-border-strong',
        selected ? 'border-accent/50 bg-accent-soft/30' : 'border-border-subtle'
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggleSelect}
        className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer accent-accent"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {risk && <SeverityDot severity={risk} />}
          <p className="truncate text-sm font-medium text-primary">{session.name}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {[session.operatingSystem, session.username].filter(Boolean).join(' · ') || 'No metadata detected'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-secondary">
          <span>
            {session.totalFindings} {pluralize(session.totalFindings, 'finding')}
          </span>
          {risk && <span className={SEVERITY_META[risk].text}>{SEVERITY_META[risk].label} risk</span>}
          <span className="text-muted">Updated {formatRelativeTime(session.updatedAt)}</span>
        </div>
      </div>

      <SessionActionsMenu onOpen={onOpen} onRename={onRename} onDuplicate={onDuplicate} onExport={onExport} onDelete={onDelete} />
    </div>
  );
}
