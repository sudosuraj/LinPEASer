'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, LayoutDashboard, ListChecks, PanelLeftClose, PanelLeftOpen, TerminalSquare } from 'lucide-react';
import type { Finding, Section, Severity } from '@/types';
import { SEVERITIES } from '@/types';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { computeOverviewStats } from '@/lib/analysis';
import { buildFindingsById, findAncestorIds, highestSeverityInSection } from '@/lib/sectionRisk';
import { SEVERITY_META } from '@/lib/presentation';
import { SeverityDot } from '@/components/badges/SeverityBadge';
import { cn } from '@/utils/cn';

export function SectionSidebar() {
  const scan = useScanStore((s) => s.scan);
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const activeSectionId = useUiStore((s) => s.activeSectionId);
  const navigateToSection = useUiStore((s) => s.navigateToSection);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const setSeverityFilter = useUiStore((s) => s.setSeverityFilter);
  const severityFilter = useUiStore((s) => s.severityFilter);

  const findingsById = useMemo(() => (scan ? buildFindingsById(scan.findings) : new Map<string, Finding>()), [scan]);
  const overview = useMemo(() => (scan ? computeOverviewStats(scan) : null), [scan]);

  if (!scan || !overview) return null;

  if (sidebarCollapsed) {
    return (
      <aside className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-border-subtle bg-surface py-4 md:flex">
        <button onClick={toggleSidebarCollapsed} className="text-muted hover:text-primary" title="Expand sidebar">
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  const goToSection = (id: string) => {
    setActiveView('sections');
    navigateToSection(id, findAncestorIds(scan.sections, id) ?? []);
    setMobileNavOpen(false);
  };

  return (
    <>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setMobileNavOpen(false)} />
      )}
      <aside
        className={cn(
          'z-40 flex w-72 shrink-0 flex-col overflow-hidden border-r border-border-subtle bg-surface',
          'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:shadow-2xl max-md:transition-transform max-md:duration-200',
          mobileNavOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="font-mono text-xs font-semibold tracking-[0.2em] text-muted">LINPEASER</span>
          <button onClick={toggleSidebarCollapsed} className="hidden text-muted hover:text-primary md:block" title="Collapse sidebar">
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-6">
        <div className="space-y-0.5">
          <NavRow
            active={activeView === 'overview'}
            icon={<LayoutDashboard className="h-3.5 w-3.5" />}
            onClick={() => {
              setActiveView('overview');
              setMobileNavOpen(false);
            }}
          >
            Overview
          </NavRow>

          <NavRow
            active={activeView === 'findings' && severityFilter.length === 0}
            icon={<ListChecks className="h-3.5 w-3.5" />}
            count={overview.totalFindings}
            onClick={() => {
              setActiveView('findings');
              setSeverityFilter([]);
              setMobileNavOpen(false);
            }}
          >
            Findings
          </NavRow>
          <div className="ml-6 space-y-0.5 border-l border-border-subtle pl-2">
            {SEVERITIES.filter((s) => s !== 'info').map((sev) => (
              <SeverityRow
                key={sev}
                severity={sev}
                count={overview.bySeverity[sev]}
                active={activeView === 'findings' && severityFilter.length === 1 && severityFilter[0] === sev}
                onClick={() => {
                  setActiveView('findings');
                  setSeverityFilter([sev]);
                  setMobileNavOpen(false);
                }}
              />
            ))}
          </div>

          <NavRow
            active={activeView === 'raw'}
            icon={<TerminalSquare className="h-3.5 w-3.5" />}
            onClick={() => {
              setActiveView('raw');
              setMobileNavOpen(false);
            }}
          >
            Raw Output
          </NavRow>
        </div>

        <div>
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
            Sections ({scan.sections.length})
          </p>
          <div className="space-y-0.5">
            {scan.sections.map((section) => (
              <SectionTreeItem
                key={section.id}
                section={section}
                depth={0}
                activeSectionId={activeSectionId}
                findingsById={findingsById}
                onSelect={goToSection}
              />
            ))}
          </div>
        </div>
        </nav>
      </aside>
    </>
  );
}

function NavRow({
  active,
  icon,
  count,
  onClick,
  children,
}: {
  active: boolean;
  icon: React.ReactNode;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors',
        active ? 'bg-accent-soft text-accent' : 'text-secondary hover:bg-hover hover:text-primary'
      )}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {count !== undefined && <span className="text-[11px] tabular-nums text-muted">{count}</span>}
    </button>
  );
}

function SeverityRow({
  severity,
  count,
  active,
  onClick,
}: {
  severity: Severity;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors',
        active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-hover hover:text-secondary'
      )}
    >
      <SeverityDot severity={severity} />
      <span className="flex-1 truncate">{SEVERITY_META[severity].label}</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

function SectionTreeItem({
  section,
  depth,
  activeSectionId,
  findingsById,
  onSelect,
}: {
  section: Section;
  depth: number;
  activeSectionId: string | null;
  findingsById: Map<string, Finding>;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = section.subsections.length > 0;
  const risk = useMemo(() => highestSeverityInSection(section, findingsById), [section, findingsById]);

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1 text-[13px] transition-colors',
          activeSectionId === section.id ? 'bg-accent-soft text-accent' : 'text-secondary hover:bg-hover hover:text-primary'
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded((v) => !v)} className="shrink-0 text-muted hover:text-primary">
            <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <button onClick={() => onSelect(section.id)} className="flex flex-1 items-center gap-1.5 truncate text-left">
          {risk && <SeverityDot severity={risk} />}
          <span className="truncate">{section.title}</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <div>
          {section.subsections.map((child) => (
            <SectionTreeItem
              key={child.id}
              section={child}
              depth={depth + 1}
              activeSectionId={activeSectionId}
              findingsById={findingsById}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
