'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RawLine } from '@/types';
import { AnsiLine } from '@/features/terminal/AnsiLine';

const VIRTUALIZE_THRESHOLD = 300;

export function SectionLines({ lines }: { lines: RawLine[] }) {
  if (lines.length <= VIRTUALIZE_THRESHOLD) {
    return (
      <div className="max-h-96 overflow-y-auto rounded-md border border-border-subtle bg-canvas p-2">
        {lines.map((line) => (
          <AnsiLine key={line.index} line={line} />
        ))}
      </div>
    );
  }
  return <VirtualizedLines lines={lines} />;
}

function VirtualizedLines({ lines }: { lines: RawLine[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 20,
  });

  return (
    <div ref={parentRef} className="max-h-96 overflow-y-auto rounded-md border border-border-subtle bg-canvas p-2">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)` }}
          >
            <AnsiLine line={lines[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
