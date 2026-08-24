'use client';

import { LayoutGrid, Pencil, Plus } from 'lucide-react';
import { useNavStore } from '@/lib/store/navStore';
import { useScanStore } from '@/lib/store/scanStore';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { Button } from '@/components/ui/Button';

/** Persistent top-level chrome shown on the Sessions dashboard and the report view. */
export function TopNav({ breadcrumb, onRenameBreadcrumb }: { breadcrumb?: string; onRenameBreadcrumb?: () => void }) {
  const route = useNavStore((s) => s.route);
  const setRoute = useNavStore((s) => s.setRoute);
  const resetScan = useScanStore((s) => s.reset);

  const goSessions = () => setRoute('sessions');
  const goNewScan = () => {
    resetScan();
    setRoute('landing');
  };

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3 py-2 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm sm:gap-2">
        <button
          onClick={goSessions}
          className="shrink-0 font-mono font-semibold text-primary transition-colors hover:text-accent"
        >
          LinPEASer
        </button>
        {breadcrumb && (
          <span className="flex min-w-0 items-center gap-1.5 text-muted">
            <span className="hidden sm:inline">/</span>
            <button onClick={goSessions} className="hidden shrink-0 transition-colors hover:text-secondary sm:inline">
              Sessions
            </button>
            <span className="hidden sm:inline">/</span>
            <span className="sm:hidden">/</span>
            <span className="min-w-0 truncate text-secondary">{breadcrumb}</span>
            {onRenameBreadcrumb && (
              <button onClick={onRenameBreadcrumb} className="shrink-0 text-muted hover:text-secondary" title="Rename session">
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <PrivacyBadge className="hidden lg:inline-flex" />
        {route !== 'sessions' && (
          <Button size="sm" variant="ghost" onClick={goSessions} title="Sessions">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sessions</span>
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={goNewScan} title="New Scan">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Scan</span>
        </Button>
      </div>
    </div>
  );
}
