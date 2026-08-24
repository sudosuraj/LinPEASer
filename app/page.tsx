'use client';

import { useEffect } from 'react';
import { useScanStore } from '@/lib/store/scanStore';
import { useNavStore } from '@/lib/store/navStore';
import { sessionStorage } from '@/lib/storage/sessionStorage';
import { LandingScreen } from '@/features/upload/LandingScreen';
import { ReportShell } from '@/features/report/ReportShell';
import { SessionsView } from '@/features/sessions/SessionsView';

export default function Home() {
  const scan = useScanStore((s) => s.scan);
  const route = useNavStore((s) => s.route);
  const setRoute = useNavStore((s) => s.setRoute);
  const bootstrapped = useNavStore((s) => s.bootstrapped);
  const setBootstrapped = useNavStore((s) => s.setBootstrapped);

  useEffect(() => {
    if (bootstrapped) return;
    sessionStorage
      .listSessions()
      .then((sessions) => setRoute(sessions.length > 0 ? 'sessions' : 'landing'))
      .catch(() => setRoute('landing'))
      .finally(() => setBootstrapped(true));
  }, [bootstrapped, setRoute, setBootstrapped]);

  if (!bootstrapped) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas" />;
  }

  if (route === 'report' && scan) return <ReportShell />;
  if (route === 'sessions') return <SessionsView />;
  return <LandingScreen />;
}
