import type { Finding } from '@/types';

/**
 * Collapses findings that different rules produced for essentially the same
 * underlying fact (same category, title, and — when known — the same
 * path), merging their evidence rather than showing near-duplicates.
 */
export function dedupeFindings(findings: Finding[]): Finding[] {
  const byKey = new Map<string, Finding>();
  const order: string[] = [];

  for (const finding of findings) {
    const key = `${finding.category}|${finding.title}|${finding.context?.path ?? ''}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, finding);
      order.push(key);
      continue;
    }
    const knownLines = new Set(existing.evidence.map((e) => e.lineIndex));
    for (const evidence of finding.evidence) {
      if (!knownLines.has(evidence.lineIndex)) {
        existing.evidence.push(evidence);
        knownLines.add(evidence.lineIndex);
      }
    }
  }

  return order.map((key) => byKey.get(key)!);
}
