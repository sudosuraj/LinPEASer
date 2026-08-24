'use client';

import { useEffect, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Finding, Section } from '@/types';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { buildFindingsById, countFindingsInSection, highestSeverityInSection } from '@/lib/sectionRisk';
import { SeverityDot } from '@/components/badges/SeverityBadge';
import { FindingCard } from '@/features/findings/FindingCard';
import { SectionLines } from './SectionLines';
import { cn } from '@/utils/cn';
import { pluralize } from '@/utils/format';

export function SectionsView() {
  const scan = useScanStore((s) => s.scan);
  const activeSectionId = useUiStore((s) => s.activeSectionId);
  const expanded = useUiStore((s) => s.expandedSectionIds);
  const toggle = useUiStore((s) => s.toggleSectionExpanded);
  const findingsById = useMemo(() => (scan ? buildFindingsById(scan.findings) : new Map<string, Finding>()), [scan]);

  // Ancestor expansion happens where navigation is triggered (sidebar,
  // command palette) via the navigateToSection store action — this effect
  // only performs the DOM scroll once that state (and therefore the DOM)
  // has caught up, so the target section is actually mounted.
  useEffect(() => {
    if (!activeSectionId) return;
    const el = document.getElementById(`section-${activeSectionId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeSectionId, expanded]);

  if (!scan) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-2 px-6 py-6">
        {scan.sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            depth={0}
            expandedIds={expanded}
            onToggle={toggle}
            findingsById={findingsById}
          />
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  depth,
  expandedIds,
  onToggle,
  findingsById,
}: {
  section: Section;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  findingsById: Map<string, Finding>;
}) {
  const isOpen = expandedIds.has(section.id);
  const risk = useMemo(() => highestSeverityInSection(section, findingsById), [section, findingsById]);
  const findingCount = useMemo(() => countFindingsInSection(section, findingsById), [section, findingsById]);
  const ownFindings = section.findingIds.map((id) => findingsById.get(id)).filter((f): f is Finding => Boolean(f));

  return (
    <div id={`section-${section.id}`} className={cn('rounded-lg border border-border-subtle bg-surface', depth > 0 && 'ml-4')}>
      <button
        onClick={() => onToggle(section.id)}
        className="sticky top-0 z-[1] flex w-full items-center gap-2 rounded-t-lg border-b border-border-subtle bg-surface px-3 py-2.5 text-left"
      >
        <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-muted transition-transform', isOpen && 'rotate-90')} />
        {risk && <SeverityDot severity={risk} />}
        <span className="flex-1 truncate text-sm font-medium text-primary">{section.title}</span>
        {section.isUnrecognized && <span className="shrink-0 text-[10px] text-muted">unrecognized</span>}
        {findingCount > 0 && (
          <span className="shrink-0 text-[11px] text-muted">
            {findingCount} {pluralize(findingCount, 'finding')}
          </span>
        )}
        <span className="shrink-0 text-[11px] text-muted">
          {section.lines.length} {pluralize(section.lines.length, 'line')}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 p-3">
          {ownFindings.length > 0 && (
            <div className="space-y-2">
              {ownFindings.map((finding) => (
                <FindingCard key={finding.id} finding={finding} compact />
              ))}
            </div>
          )}
          {section.lines.length > 0 && <SectionLines lines={section.lines} />}
          {section.subsections.map((child) => (
            <SectionBlock
              key={child.id}
              section={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              findingsById={findingsById}
            />
          ))}
        </div>
      )}
    </div>
  );
}
