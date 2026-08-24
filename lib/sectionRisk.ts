import { SEVERITY_WEIGHT } from '@/types';
import type { Finding, Section, Severity } from '@/types';

export function buildFindingsById(findings: Finding[]): Map<string, Finding> {
  return new Map(findings.map((f) => [f.id, f]));
}

/** Highest-severity finding anywhere within a section or its descendants. */
export function highestSeverityInSection(section: Section, findingsById: Map<string, Finding>): Severity | null {
  let best: Severity | null = null;
  const consider = (sec: Section) => {
    for (const id of sec.findingIds) {
      const finding = findingsById.get(id);
      if (finding && (!best || SEVERITY_WEIGHT[finding.severity] > SEVERITY_WEIGHT[best])) {
        best = finding.severity;
      }
    }
    for (const child of sec.subsections) consider(child);
  };
  consider(section);
  return best;
}

export function countFindingsInSection(section: Section, findingsById: Map<string, Finding>): number {
  let count = 0;
  const consider = (sec: Section) => {
    count += sec.findingIds.filter((id) => findingsById.has(id)).length;
    for (const child of sec.subsections) consider(child);
  };
  consider(section);
  return count;
}

/** Ids of every ancestor of `targetId`, root-first. Null if not found. */
export function findAncestorIds(sections: Section[], targetId: string, trail: string[] = []): string[] | null {
  for (const section of sections) {
    if (section.id === targetId) return trail;
    if (section.subsections.length > 0) {
      const found = findAncestorIds(section.subsections, targetId, [...trail, section.id]);
      if (found) return found;
    }
  }
  return null;
}
