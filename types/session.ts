import type { Scan } from './scan';
import type { Severity } from './common';

export type SeverityCountMap = Record<Severity, number>;

/**
 * Lightweight, list-friendly facts about a session. Stored in its own
 * IndexedDB object store so the Session Manager can list, search, and sort
 * every session without ever deserializing a session's (potentially large)
 * parsed scan or raw output.
 */
export interface SessionMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  hostname: string | null;
  username: string | null;
  operatingSystem: string | null;
  toolVersion: string | null;
  isRoot: boolean | null;
  findingCounts: SeverityCountMap;
  totalFindings: number;
  totalLines: number;
  /** Approximate size of the raw output, for display and quota awareness. */
  sizeBytes: number;
}

/** The heavy payload for one session — fetched only when a session is opened. */
export interface SessionPayload {
  id: string;
  scan: Scan;
}

/** A fully-hydrated session: metadata plus its parsed scan. */
export interface SessionRecord extends SessionMeta {
  scan: Scan;
}

/** Schema for a portable, re-importable export of a single session. */
export interface SessionExport {
  linpeaserExportVersion: 1;
  exportedAt: string;
  session: {
    name: string;
    createdAt: string;
    updatedAt: string;
    scan: Scan;
  };
}
