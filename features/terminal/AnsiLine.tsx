import type { CSSProperties } from 'react';
import type { AnsiSegment, RawLine } from '@/types';
import { cn } from '@/utils/cn';

function segmentStyle(segment: AnsiSegment): CSSProperties | undefined {
  const style = segment.style;
  if (!style) return undefined;
  return {
    color: style.fg ?? undefined,
    backgroundColor: style.bg ?? undefined,
    fontWeight: style.bold ? 700 : undefined,
    opacity: style.dim ? 0.65 : undefined,
    fontStyle: style.italic ? 'italic' : undefined,
    textDecoration: [style.underline && 'underline', style.strikethrough && 'line-through'].filter(Boolean).join(' ') || undefined,
    filter: style.inverse ? 'invert(1)' : undefined,
  };
}

function highlightSegmentText(text: string, query: string, keyPrefix: string) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let idx = lower.indexOf(q, cursor);
  let key = 0;
  while (idx !== -1) {
    if (idx > cursor) parts.push(text.slice(cursor, idx));
    parts.push(
      <mark key={`${keyPrefix}-${key++}`} className="search-highlight">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    cursor = idx + q.length;
    idx = lower.indexOf(q, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export function AnsiLine({
  line,
  showLineNumber = true,
  wrap = true,
  highlight = '',
  className,
}: {
  line: RawLine;
  showLineNumber?: boolean;
  wrap?: boolean;
  highlight?: string;
  className?: string;
}) {
  return (
    <div
      id={`line-${line.index}`}
      className={cn('group flex font-mono text-[13px] leading-6 hover:bg-hover/60', !wrap && 'whitespace-pre', className)}
    >
      {showLineNumber && (
        <span className="sticky left-0 mr-3 w-12 shrink-0 select-none pr-2 text-right text-[11px] text-muted/70 tabular-nums">
          {line.index + 1}
        </span>
      )}
      <span className={cn('min-w-0 flex-1', wrap && 'whitespace-pre-wrap break-words')}>
        {line.segments.length === 0
          ? ' '
          : line.segments.map((segment, i) => (
              <span key={i} style={segmentStyle(segment)}>
                {highlightSegmentText(segment.text, highlight, `${line.index}-${i}`)}
              </span>
            ))}
      </span>
    </div>
  );
}
