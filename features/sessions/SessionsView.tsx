'use client';

import { useMemo, useState } from 'react';
import { AlertOctagon, ClipboardList, Plus, Search, Trash2 } from 'lucide-react';
import type { SessionMeta } from '@/types';
import { TopNav } from '@/components/layout/TopNav';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useNavStore } from '@/lib/store/navStore';
import { sessionStorage } from '@/lib/storage/sessionStorage';
import { triggerDownload } from '@/utils/download';
import { useSessionsList } from './useSessionsList';
import { useOpenSession } from './useOpenSession';
import { SessionCard } from './SessionCard';
import { RenameDialog } from './RenameDialog';
import { ImportSessionButton } from './ImportSessionButton';

type FilterTab = 'all' | 'recent' | 'high-risk';
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type DeleteTarget = { kind: 'single'; id: string; name: string } | { kind: 'bulk'; ids: string[] } | { kind: 'all' };

export function SessionsView() {
  const { sessions, loading, refresh } = useSessionsList();
  const { openSession, openingId } = useOpenSession();
  const setRoute = useNavStore((s) => s.setRoute);

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renameTarget, setRenameTarget] = useState<SessionMeta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    // eslint-disable-next-line react-hooks/purity -- a slightly-stale "recent" cutoff between renders is fine here
    const recentCutoff = Date.now() - RECENT_WINDOW_MS;
    return sessions.filter((s) => {
      if (tab === 'recent' && new Date(s.updatedAt).getTime() < recentCutoff) return false;
      if (tab === 'high-risk' && s.findingCounts.critical === 0 && s.findingCounts.high === 0) return false;
      if (!q) return true;
      return [s.name, s.hostname, s.operatingSystem, s.username].some((v) => v?.toLowerCase().includes(q));
    });
  }, [sessions, query, tab]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelected(new Set(filtered.map((s) => s.id)));
  const deselectAll = () => setSelected(new Set());

  const handleExportOne = async (id: string) => {
    const record = await sessionStorage.exportSession(id);
    triggerDownload(`linpeaser-session-${record.session.name.replace(/[^\w.-]+/g, '_')}.json`, JSON.stringify(record, null, 2), 'application/json');
  };

  const handleExportSelected = async () => {
    for (const id of selected) {
      await handleExportOne(id);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'single') await sessionStorage.deleteSession(deleteTarget.id);
    else if (deleteTarget.kind === 'bulk') await sessionStorage.deleteSessions(deleteTarget.ids);
    else await sessionStorage.clearAllSessions();
    setSelected(new Set());
    setDeleteTarget(null);
    refresh();
  };

  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-primary">Sessions</h1>
              <p className="mt-0.5 text-xs text-muted">Every scan you&apos;ve parsed, stored locally in this browser.</p>
            </div>
            <div className="flex items-center gap-2">
              <ImportSessionButton onImported={refresh} />
              <Button variant="primary" size="sm" onClick={() => setRoute('landing')}>
                <Plus className="h-3.5 w-3.5" />
                New Scan
              </Button>
            </div>
          </div>

          {!loading && sessions.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="No scan sessions yet"
              description="Paste or upload your first LinPEAS output to start analyzing a system."
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search sessions…"
                    className="w-full rounded-md border border-border-subtle bg-canvas py-1.5 pl-8 pr-3 text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex rounded-md border border-border-subtle bg-surface-2 p-0.5 text-xs">
                  {(['all', 'recent', 'high-risk'] as FilterTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`rounded px-2.5 py-1 capitalize transition-colors ${
                        tab === t ? 'bg-accent-soft text-accent' : 'text-muted hover:text-secondary'
                      }`}
                    >
                      {t === 'high-risk' ? 'High Risk' : t}
                    </button>
                  ))}
                </div>
                {sessions.length > 0 && (
                  <button
                    onClick={() => setDeleteTarget({ kind: 'all' })}
                    className="ml-auto flex items-center gap-1 text-xs text-muted hover:text-critical"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear all
                  </button>
                )}
              </div>

              {selected.size > 0 && (
                <div className="mb-3 flex items-center gap-3 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-accent">
                  <span>{selected.size} selected</span>
                  <button onClick={selectAll} className="hover:underline">
                    Select all
                  </button>
                  <button onClick={deselectAll} className="hover:underline">
                    Deselect
                  </button>
                  <button onClick={() => void handleExportSelected()} className="ml-auto hover:underline">
                    Export selected
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ kind: 'bulk', ids: Array.from(selected) })}
                    className="text-critical hover:underline"
                  >
                    Delete selected
                  </button>
                </div>
              )}

              {filtered.length === 0 ? (
                <EmptyState
                  icon={<AlertOctagon className="h-6 w-6" />}
                  title="No sessions match"
                  description="Try a different search term or filter."
                />
              ) : (
                <div className="space-y-2">
                  {filtered.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      selected={selected.has(session.id)}
                      onToggleSelect={() => toggleSelect(session.id)}
                      onOpen={() => (openingId ? undefined : void openSession(session.id))}
                      onRename={() => setRenameTarget(session)}
                      onDuplicate={async () => {
                        await sessionStorage.duplicateSession(session.id);
                        refresh();
                      }}
                      onExport={() => void handleExportOne(session.id)}
                      onDelete={() => setDeleteTarget({ kind: 'single', id: session.id, name: session.name })}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {renameTarget && (
        <RenameDialog
          initialName={renameTarget.name}
          onCancel={() => setRenameTarget(null)}
          onRename={async (name) => {
            await sessionStorage.renameSession(renameTarget.id, name);
            setRenameTarget(null);
            refresh();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={deleteTarget.kind === 'all' ? 'Clear all sessions?' : deleteTarget.kind === 'bulk' ? 'Delete selected sessions?' : 'Delete session?'}
          description={
            deleteTarget.kind === 'all'
              ? `This permanently deletes all ${sessions.length} local session(s). This cannot be undone.`
              : deleteTarget.kind === 'bulk'
                ? `This permanently deletes ${deleteTarget.ids.length} session(s). This cannot be undone.`
                : `"${deleteTarget.name}" will be permanently deleted. This cannot be undone.`
          }
          confirmLabel="Delete"
          danger
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
