import type { Severity } from '@/types';

/** Ascending order, unlike the display-oriented SEVERITIES constant. */
const ASCENDING: Severity[] = ['info', 'interesting', 'low', 'medium', 'high', 'critical'];

export function escalateSeverity(base: Severity, steps: number): Severity {
  const idx = ASCENDING.indexOf(base);
  const next = Math.min(ASCENDING.length - 1, Math.max(0, idx + steps));
  return ASCENDING[next];
}
