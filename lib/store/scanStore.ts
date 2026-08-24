import { create } from 'zustand';
import type { Scan } from '@/types';

export type ParseStatus = 'idle' | 'parsing' | 'ready' | 'error';

interface ScanState {
  scan: Scan | null;
  /** Id of the persisted session this scan belongs to, if any. */
  activeSessionId: string | null;
  activeSessionName: string | null;
  status: ParseStatus;
  error: string | null;
  progress: number;
  loadScan: (scan: Scan, sessionId?: string | null, sessionName?: string | null) => void;
  renameActiveSession: (name: string) => void;
  setStatus: (status: ParseStatus, error?: string | null) => void;
  setProgress: (progress: number) => void;
  reset: () => void;
}

/**
 * Holds the current parsed scan in memory only. Nothing here is written to
 * localStorage or sent anywhere directly — persistence (when a session is
 * created) goes through the IndexedDB-backed session storage layer, and
 * even then never leaves the browser.
 */
export const useScanStore = create<ScanState>((set) => ({
  scan: null,
  activeSessionId: null,
  activeSessionName: null,
  status: 'idle',
  error: null,
  progress: 0,
  loadScan: (scan, sessionId = null, sessionName = null) =>
    set({ scan, activeSessionId: sessionId, activeSessionName: sessionName, status: 'ready', error: null, progress: 100 }),
  renameActiveSession: (name) => set({ activeSessionName: name }),
  setStatus: (status, error = null) => set({ status, error }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({ scan: null, activeSessionId: null, activeSessionName: null, status: 'idle', error: null, progress: 0 }),
}));
