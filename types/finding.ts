import type { Confidence, FindingCategory, Severity } from './common';

export interface EvidenceLine {
  lineIndex: number;
  text: string;
}

/** Structured, best-effort contextual facts extracted alongside a finding. */
export interface FindingContext {
  path?: string;
  user?: string;
  owner?: string;
  group?: string;
  permissions?: string;
  port?: string;
  [key: string]: string | undefined;
}

export interface Finding {
  id: string;
  title: string;
  category: FindingCategory;
  severity: Severity;
  confidence: Confidence;
  sectionId: string | null;
  /** Human-readable breadcrumb, e.g. ["Files & Permissions", "SUID files"]. */
  sectionPath: string[];
  /** Original, unmodified lines this finding is based on. Never invented. */
  evidence: EvidenceLine[];
  /** What was found. */
  description: string;
  /** Why it matters from an offensive-security perspective. */
  rationale: string;
  context?: FindingContext;
  tags: string[];
  /** Id of the detection rule that produced this finding, for traceability. */
  ruleId: string;
}
