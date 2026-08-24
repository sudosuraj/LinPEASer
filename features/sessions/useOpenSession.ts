'use client';

import { useCallback, useState } from 'react';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { useNavStore } from '@/lib/store/navStore';
import { sessionStorage } from '@/lib/storage/sessionStorage';

export function useOpenSession() {
  const loadScan = useScanStore((s) => s.loadScan);
  const resetForNewScan = useUiStore((s) => s.resetForNewScan);
  const setRoute = useNavStore((s) => s.setRoute);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openSession = useCallback(
    async (id: string) => {
      setOpeningId(id);
      setError(null);
      try {
        const record = await sessionStorage.getSession(id);
        if (!record) throw new Error('That session could not be found — it may have been deleted.');
        loadScan(record.scan, record.id, record.name);
        resetForNewScan();
        setRoute('report');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open session.');
      } finally {
        setOpeningId(null);
      }
    },
    [loadScan, resetForNewScan, setRoute]
  );

  return { openSession, openingId, error };
}
