'use client';

import { useCallback } from 'react';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { useNavStore } from '@/lib/store/navStore';
import { parseInWorker } from '@/lib/worker/client';
import { sessionStorage } from '@/lib/storage/sessionStorage';
import { MAX_UPLOAD_BYTES } from '@/lib/constants';

/**
 * Shared entry point for turning raw text into a loaded, persisted Scan
 * session, from any UI surface (landing screen, "New Scan" action, etc).
 */
export function useParseScan() {
  const setStatus = useScanStore((s) => s.setStatus);
  const loadScan = useScanStore((s) => s.loadScan);
  const resetForNewScan = useUiStore((s) => s.resetForNewScan);
  const setRoute = useNavStore((s) => s.setRoute);

  const parse = useCallback(
    async (raw: string, name?: string) => {
      if (raw.trim().length === 0) {
        setStatus('error', 'There is nothing to parse — paste or upload some output first.');
        return;
      }
      if (raw.length > MAX_UPLOAD_BYTES) {
        setStatus(
          'error',
          `This input is larger than LinPEASer's ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit and could exhaust browser memory. Try trimming the capture first.`
        );
        return;
      }

      setStatus('parsing');
      try {
        const scan = await parseInWorker(raw);
        let sessionId: string | null = null;
        let sessionName: string | null = null;
        try {
          const meta = await sessionStorage.createSession(scan, name);
          sessionId = meta.id;
          sessionName = meta.name;
        } catch {
          // IndexedDB unavailable (private browsing, disabled storage, etc.) —
          // still show the report, just without persistence for this session.
        }
        loadScan(scan, sessionId, sessionName);
        resetForNewScan();
        setRoute('report');
      } catch (error) {
        setStatus('error', error instanceof Error ? error.message : 'Parsing failed for an unknown reason.');
      }
    },
    [setStatus, loadScan, resetForNewScan, setRoute]
  );

  return { parse };
}
