import type { Finding } from './finding';
import type { Section } from './section';

export interface ScanMetadata {
  hostname: string | null;
  operatingSystem: string | null;
  distro: string | null;
  kernelVersion: string | null;
  currentUser: string | null;
  isRoot: boolean | null;
  scanDate: string | null;
  toolVersion: string | null;
  ipAddresses: string[];
  /** ISO timestamp captured client-side when parsing ran. */
  parsedAt: string;
}

export interface ParseDiagnostic {
  level: 'info' | 'warning' | 'error';
  message: string;
  lineIndex?: number;
}

export interface ParseStats {
  totalLines: number;
  recognizedSections: number;
  unrecognizedSections: number;
  totalFindings: number;
  truncated: boolean;
  processingTimeMs: number;
}

export interface Scan {
  id: string;
  /** Which parser produced this scan; more formats can be registered later. */
  sourceFormat: string;
  metadata: ScanMetadata;
  sections: Section[];
  findings: Finding[];
  rawOutput: string;
  totalLines: number;
  diagnostics: ParseDiagnostic[];
  stats: ParseStats;
}
