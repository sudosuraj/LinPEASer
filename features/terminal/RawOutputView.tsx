'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { buildRawLines } from '@/lib/parser/ansi';
import { AnsiLine } from './AnsiLine';
import { TerminalToolbar } from './TerminalToolbar';

export function RawOutputView() {
  const scan = useScanStore((s) => s.scan);
  const lineWrap = useUiStore((s) => s.lineWrap);
  const pendingRawLineJump = useUiStore((s) => s.pendingRawLineJump);
  const setPendingRawLineJump = useUiStore((s) => s.setPendingRawLineJump);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [copied, setCopied] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);
  // Section content excludes each section's own header line, so it is not a
  // complete transcript — re-derive from the preserved raw text instead,
  // which is what "raw output" means: everything, including headers.
  const allLines = useMemo(() => (scan ? buildRawLines(scan.rawOutput) : []), [scan]);

  const virtualizer = useVirtualizer({
    count: allLines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 30,
  });

  const matches = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return [];
    const result: number[] = [];
    for (const line of allLines) {
      if (line.text.toLowerCase().includes(q)) result.push(line.index);
      if (result.length >= 5000) break; // guard against pathological queries on huge documents
    }
    return result;
  }, [allLines, deferredQuery]);

  useEffect(() => setCurrentMatch(0), [deferredQuery]);

  useEffect(() => {
    if (pendingRawLineJump === null) return;
    const id = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(Math.max(0, Math.min(allLines.length - 1, pendingRawLineJump)), { align: 'center' });
      setPendingRawLineJump(null);
    });
    return () => cancelAnimationFrame(id);
  }, [pendingRawLineJump, allLines.length, virtualizer, setPendingRawLineJump]);

  const scrollToLine = (lineIndex: number) => {
    virtualizer.scrollToIndex(Math.max(0, Math.min(allLines.length - 1, lineIndex)), { align: 'center' });
  };

  const goToMatch = (delta: number) => {
    if (matches.length === 0) return;
    const next = (currentMatch + delta + matches.length) % matches.length;
    setCurrentMatch(next);
    scrollToLine(matches[next]);
  };

  const copyAll = async () => {
    if (!scan) return;
    try {
      await navigator.clipboard.writeText(scan.rawOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — silently ignore, the export menu covers this case too.
    }
  };

  if (!scan) return null;

  return (
    <div className="flex h-full flex-col">
      <TerminalToolbar
        query={query}
        onQueryChange={setQuery}
        matchCount={matches.length}
        currentMatch={currentMatch}
        onNext={() => goToMatch(1)}
        onPrev={() => goToMatch(-1)}
        onJumpToLine={(n) => scrollToLine(n - 1)}
        onCopy={copyAll}
        copied={copied}
      />
      <div ref={parentRef} className="flex-1 overflow-auto bg-canvas px-3 py-2">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((item) => (
            <div key={item.key} style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)` }}>
              <AnsiLine line={allLines[item.index]} wrap={lineWrap} highlight={deferredQuery} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
