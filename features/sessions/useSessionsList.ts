'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SessionMeta } from '@/types';
import { sessionStorage } from '@/lib/storage/sessionStorage';
import { subscribeSessionsChanged } from '@/lib/storage/broadcast';

export function useSessionsList() {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    sessionStorage
      .listSessions()
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => subscribeSessionsChanged(refresh), [refresh]);

  return { sessions, loading, refresh };
}
