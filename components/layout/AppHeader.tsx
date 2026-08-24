'use client';

import { Menu, Search, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { Kbd } from '@/components/ui/Kbd';
import { ExportMenu } from '@/features/export/ExportMenu';

export function AppHeader() {
  const scan = useScanStore((s) => s.scan);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  if (!scan) return null;
  const { metadata, stats } = scan;

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border-subtle bg-surface px-5 py-2.5">
      <div className="flex min-w-0 items-center gap-3 text-xs text-secondary">
        <button onClick={() => setMobileNavOpen(true)} className="shrink-0 text-muted hover:text-primary md:hidden" title="Open menu">
          <Menu className="h-4 w-4" />
        </button>
        {metadata.hostname && (
          <span className="truncate">
            <span className="text-muted">host</span> {metadata.hostname}
          </span>
        )}
        {metadata.operatingSystem && (
          <span className="hidden truncate md:inline">
            <span className="text-muted">os</span> {metadata.operatingSystem}
          </span>
        )}
        {metadata.currentUser && (
          <span className="hidden items-center gap-1 sm:inline-flex">
            <User className="h-3 w-3 text-muted" />
            {metadata.currentUser}
          </span>
        )}
        {metadata.isRoot !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
              metadata.isRoot ? 'border-critical/30 bg-critical/10 text-critical' : 'border-border-strong bg-surface-2 text-muted'
            }`}
          >
            {metadata.isRoot ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {metadata.isRoot ? 'root' : 'non-root'}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-xs text-muted lg:inline">{stats.totalFindings} findings</span>
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-xs text-muted hover:border-border-strong hover:text-secondary sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          Search
          <Kbd>⌘K</Kbd>
        </button>
        <ExportMenu />
      </div>
    </header>
  );
}
