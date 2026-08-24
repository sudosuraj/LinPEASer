'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, WrapText } from 'lucide-react';
import { useUiStore } from '@/lib/store/uiStore';
import { cn } from '@/utils/cn';

export function TerminalToolbar({
  query,
  onQueryChange,
  matchCount,
  currentMatch,
  onNext,
  onPrev,
  onJumpToLine,
  onCopy,
  copied,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  matchCount: number;
  currentMatch: number;
  onNext: () => void;
  onPrev: () => void;
  onJumpToLine: (line: number) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const lineWrap = useUiStore((s) => s.lineWrap);
  const toggleLineWrap = useUiStore((s) => s.toggleLineWrap);
  const [jumpValue, setJumpValue] = useState('');

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-4 py-2.5">
      <div className="flex min-w-[220px] flex-1 items-center gap-1.5">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search raw output…"
          className="w-full rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {query && (
          <>
            <span className="shrink-0 text-[11px] tabular-nums text-muted">
              {matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : '0/0'}
            </span>
            <button onClick={onPrev} disabled={matchCount === 0} className="text-muted hover:text-primary disabled:opacity-30">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={onNext} disabled={matchCount === 0} className="text-muted hover:text-primary disabled:opacity-30">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = parseInt(jumpValue, 10);
          if (!Number.isNaN(n)) onJumpToLine(n);
        }}
        className="flex items-center gap-1.5"
      >
        <input
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder="Line #"
          className="w-20 rounded-md border border-border-subtle bg-surface-2 px-2 py-1.5 text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </form>

      <button
        onClick={toggleLineWrap}
        className={cn(
          'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs',
          lineWrap ? 'border-accent/40 bg-accent-soft text-accent' : 'border-border-subtle text-muted hover:text-secondary'
        )}
      >
        <WrapText className="h-3.5 w-3.5" />
        Wrap
      </button>

      <button onClick={onCopy} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs text-muted hover:text-secondary">
        <Copy className="h-3.5 w-3.5" />
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
