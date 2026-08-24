import type { Scan } from '@/types';

/**
 * A pluggable input-format parser. LinPEAS is the only implementation
 * today, but the app is built against this interface (rather than calling
 * the LinPEAS parser directly) so a future enumeration format can be
 * registered without touching the UI or analysis layers.
 */
export interface EnumerationParser {
  readonly format: string;
  readonly label: string;
  /** Quick heuristic sniff test; higher score (0-1) means a more likely match. */
  detect(input: string): number;
  parse(input: string): Scan;
}
