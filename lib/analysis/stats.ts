import { FINDING_CATEGORIES, SEVERITY_WEIGHT } from '@/types';
import type { Finding, FindingCategory, Scan, Severity } from '@/types';

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  interesting: number;
  info: number;
}

export interface RiskArea {
  sectionId: string;
  title: string;
  score: number;
  counts: SeverityCounts;
}

export interface OverviewStats {
  totalFindings: number;
  bySeverity: SeverityCounts;
  byCategory: Record<FindingCategory, number>;
  sectionsAnalyzed: number;
  topRiskAreas: RiskArea[];
  privescCandidates: Finding[];
}

const PRIVESC_CATEGORIES = new Set<FindingCategory>([
  'suid-sgid',
  'capabilities',
  'sudo',
  'cron',
  'path-hijack',
  'writable',
  'containers',
  'nfs',
  'services',
  'users-groups',
]);

function emptyCounts(): SeverityCounts {
  return { critical: 0, high: 0, medium: 0, low: 0, interesting: 0, info: 0 };
}

function bumpCount(counts: SeverityCounts, severity: Severity): void {
  counts[severity] += 1;
}

export function computeOverviewStats(scan: Scan): OverviewStats {
  const bySeverity = emptyCounts();
  const byCategory = Object.fromEntries(FINDING_CATEGORIES.map((c) => [c, 0])) as Record<FindingCategory, number>;
  const riskByTopSection = new Map<string, RiskArea>();

  for (const finding of scan.findings) {
    bumpCount(bySeverity, finding.severity);
    byCategory[finding.category] += 1;

    const topTitle = finding.sectionPath[0];
    if (topTitle && finding.sectionId) {
      const topSection = scan.sections.find((s) => s.path[0] === topTitle);
      const key = topSection?.id ?? topTitle;
      let area = riskByTopSection.get(key);
      if (!area) {
        area = { sectionId: key, title: topTitle, score: 0, counts: emptyCounts() };
        riskByTopSection.set(key, area);
      }
      bumpCount(area.counts, finding.severity);
      area.score += SEVERITY_WEIGHT[finding.severity];
    }
  }

  const topRiskAreas = Array.from(riskByTopSection.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const privescCandidates = scan.findings
    .filter((f) => (f.severity === 'critical' || f.severity === 'high') && PRIVESC_CATEGORIES.has(f.category))
    .slice(0, 20);

  return {
    totalFindings: scan.findings.length,
    bySeverity,
    byCategory,
    sectionsAnalyzed: scan.sections.length,
    topRiskAreas,
    privescCandidates,
  };
}
