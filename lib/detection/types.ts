import type { Confidence, FindingCategory, FindingContext, RawLine, Scan, Section, Severity } from '@/types';

export interface AnalysisContext {
  scan: Scan;
  /** Every line in the document, in original order. */
  allLines: RawLine[];
  /** Every section, flattened depth-first. */
  flatSections: Section[];
}

export interface FindingDraft {
  title: string;
  category: FindingCategory;
  severity: Severity;
  confidence: Confidence;
  description: string;
  rationale: string;
  evidenceLineIndexes: number[];
  context?: FindingContext;
  tags?: string[];
}

export interface DetectionRule {
  id: string;
  category: FindingCategory;
  evaluate(ctx: AnalysisContext): FindingDraft[];
}
