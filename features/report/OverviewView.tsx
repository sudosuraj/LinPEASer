'use client';

import { useMemo } from 'react';
import { AlertOctagon } from 'lucide-react';
import { SEVERITIES } from '@/types';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { computeOverviewStats } from '@/lib/analysis';
import { SEVERITY_META } from '@/lib/presentation';
import { FINDING_CATEGORY_LABELS } from '@/types';
import { StatCard } from './StatCard';
import { FindingCard } from '@/features/findings/FindingCard';
import { pluralize } from '@/utils/format';

export function OverviewView() {
  const scan = useScanStore((s) => s.scan);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const setSeverityFilter = useUiStore((s) => s.setSeverityFilter);
  const stats = useMemo(() => (scan ? computeOverviewStats(scan) : null), [scan]);

  if (!scan || !stats) return null;

  const topCategories = Object.entries(stats.byCategory)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-primary">Findings Summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={stats.totalFindings} />
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              onClick={() => {
                setActiveView('findings');
                setSeverityFilter([sev]);
              }}
              className="text-left"
            >
              <StatCard label={SEVERITY_META[sev].label} value={stats.bySeverity[sev]} valueClassName={SEVERITY_META[sev].text} />
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-primary">Highest-Risk Areas</h2>
          <div className="space-y-2">
            {stats.topRiskAreas.length === 0 && <p className="text-xs text-muted">No risk-scored sections yet.</p>}
            {stats.topRiskAreas.map((area) => (
              <div key={area.sectionId} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface px-3 py-2">
                <span className="truncate text-sm text-secondary">{area.title}</span>
                <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted">
                  {area.counts.critical > 0 && <span className="text-critical">{area.counts.critical}C</span>}
                  {area.counts.high > 0 && <span className="text-high">{area.counts.high}H</span>}
                  {area.counts.medium > 0 && <span className="text-medium">{area.counts.medium}M</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-primary">Findings by Category</h2>
          <div className="space-y-1.5">
            {topCategories.length === 0 && <p className="text-xs text-muted">No findings yet.</p>}
            {topCategories.map(([category, count]) => (
              <div key={category} className="flex items-center gap-2">
                <span className="w-40 shrink-0 truncate text-xs text-secondary">
                  {FINDING_CATEGORY_LABELS[category as keyof typeof FINDING_CATEGORY_LABELS]}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(count / Math.max(...topCategories.map(([, c]) => c))) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-critical" />
          <h2 className="text-sm font-semibold text-primary">Potential Privilege-Escalation Paths</h2>
          <span className="text-xs text-muted">
            ({stats.privescCandidates.length} {pluralize(stats.privescCandidates.length, 'candidate')})
          </span>
        </div>
        {stats.privescCandidates.length === 0 ? (
          <p className="text-xs text-muted">
            No high-confidence privilege-escalation candidates were surfaced by the current rule set — review the full
            findings list for lower-severity leads.
          </p>
        ) : (
          <div className="space-y-2">
            {stats.privescCandidates.slice(0, 8).map((finding) => (
              <FindingCard key={finding.id} finding={finding} compact />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 text-xs text-muted sm:grid-cols-4">
        <InfoStat label="Sections analyzed" value={stats.sectionsAnalyzed} />
        <InfoStat label="Total lines" value={scan.stats.totalLines} />
        <InfoStat label="Recognized sections" value={scan.stats.recognizedSections} />
        <InfoStat label="Parse time" value={`${scan.stats.processingTimeMs.toFixed(0)} ms`} />
      </section>
      </div>
    </div>
  );
}

function InfoStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-sm text-secondary">{value}</p>
    </div>
  );
}
