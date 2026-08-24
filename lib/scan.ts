import type { Scan } from '@/types';
import { selectParser } from '@/lib/parser';
import { runAnalysis } from '@/lib/analysis';

/**
 * Single entry point used by both the Web Worker and (as a fallback) the
 * main thread: parse raw input into a structured Scan, then run the
 * analysis engine over it. Kept as two explicit steps internally so
 * parsing and analysis stay independently testable and reusable.
 */
export function buildScan(rawInput: string): Scan {
  const parser = selectParser(rawInput);
  const scan = parser.parse(rawInput);

  const { findings, diagnostics } = runAnalysis(scan);
  scan.findings = findings;
  scan.diagnostics = [...scan.diagnostics, ...diagnostics];
  scan.stats.totalFindings = findings.length;

  return scan;
}
