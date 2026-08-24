'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, FileText, ListChecks, Search } from 'lucide-react';
import type { Severity } from '@/types';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { collectAllLines, flattenSections } from '@/lib/parser';
import { findAncestorIds } from '@/lib/sectionRisk';
import { SeverityDot } from '@/components/badges/SeverityBadge';
import { cn } from '@/utils/cn';

interface ResultItem {
  kind: 'section' | 'finding' | 'line';
  key: string;
  label: string;
  sub?: string;
  severity?: Severity;
  onSelect: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

/**
 * Owns only the open/closed state and the global keyboard shortcuts.
 * Mounting/unmounting CommandPaletteDialog per `open` (rather than always
 * rendering it and toggling visibility) means its query/selection state is
 * simply fresh React state on every open — no reset-on-open effect needed.
 */
export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const scan = useScanStore((s) => s.scan);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === '/' && !isTypingTarget(e.target) && scan) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen, scan]);

  if (!open || !scan) return null;
  return <CommandPaletteDialog onClose={() => setOpen(false)} />;
}

function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const setActiveView = useUiStore((s) => s.setActiveView);
  const navigateToSection = useUiStore((s) => s.navigateToSection);
  const setFindingsQuery = useUiStore((s) => s.setFindingsQuery);
  const setPendingRawLineJump = useUiStore((s) => s.setPendingRawLineJump);
  const scan = useScanStore((s) => s.scan);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo<ResultItem[]>(() => {
    if (!scan || query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    const items: ResultItem[] = [];

    for (const section of flattenSections(scan.sections)) {
      if (items.filter((i) => i.kind === 'section').length >= 6) break;
      if (!section.title.toLowerCase().includes(q)) continue;
      items.push({
        kind: 'section',
        key: `section-${section.id}`,
        label: section.title,
        sub: section.path.slice(0, -1).join(' / ') || undefined,
        onSelect: () => {
          setActiveView('sections');
          navigateToSection(section.id, findAncestorIds(scan.sections, section.id) ?? []);
          onClose();
        },
      });
    }

    for (const finding of scan.findings) {
      if (items.filter((i) => i.kind === 'finding').length >= 6) break;
      if (!finding.title.toLowerCase().includes(q) && !finding.description.toLowerCase().includes(q)) continue;
      items.push({
        kind: 'finding',
        key: `finding-${finding.id}`,
        label: finding.title,
        sub: finding.sectionPath.join(' / '),
        severity: finding.severity,
        onSelect: () => {
          setActiveView('findings');
          setFindingsQuery(finding.title);
          onClose();
        },
      });
    }

    for (const line of collectAllLines(scan.sections)) {
      if (items.filter((i) => i.kind === 'line').length >= 8) break;
      if (!line.text.toLowerCase().includes(q)) continue;
      items.push({
        kind: 'line',
        key: `line-${line.index}`,
        label: line.text.trim().slice(0, 140) || '(blank line)',
        sub: `Line ${line.index + 1}`,
        onSelect: () => {
          setActiveView('raw');
          setPendingRawLineJump(line.index);
          onClose();
        },
      });
    }

    return items;
  }, [scan, query, setActiveView, navigateToSection, setFindingsQuery, setPendingRawLineJump, onClose]);

  const safeActiveIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border-strong bg-elevated shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                results[safeActiveIndex]?.onSelect();
              }
            }}
            placeholder="Search sections, findings, and raw output…"
            className="w-full bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
          />
        </div>

        <div className="max-h-96 overflow-y-auto py-1">
          {query.trim().length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-muted">Start typing to search across the whole scan.</p>
          )}
          {query.trim().length > 0 && results.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-muted">No matches.</p>
          )}
          {results.map((item, i) => (
            <button
              key={item.key}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={item.onSelect}
              className={cn(
                'flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs',
                i === safeActiveIndex ? 'bg-hover text-primary' : 'text-secondary'
              )}
            >
              {item.kind === 'section' && <ListChecks className="h-3.5 w-3.5 shrink-0 text-muted" />}
              {item.kind === 'finding' &&
                (item.severity ? <SeverityDot severity={item.severity} /> : <ListChecks className="h-3.5 w-3.5 shrink-0" />)}
              {item.kind === 'line' && <FileText className="h-3.5 w-3.5 shrink-0 text-muted" />}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.sub && <span className="shrink-0 truncate text-[10px] text-muted">{item.sub}</span>}
              {i === safeActiveIndex && <CornerDownLeft className="h-3 w-3 shrink-0 text-muted" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
