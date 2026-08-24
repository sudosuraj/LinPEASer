'use client';

import { useState } from 'react';
import { useScanStore } from '@/lib/store/scanStore';
import { useUiStore } from '@/lib/store/uiStore';
import { TopNav } from '@/components/layout/TopNav';
import { AppHeader } from '@/components/layout/AppHeader';
import { SectionSidebar } from '@/features/sections/SectionSidebar';
import { OverviewView } from './OverviewView';
import { FindingsView } from '@/features/findings/FindingsView';
import { SectionsView } from '@/features/sections/SectionsView';
import { RawOutputView } from '@/features/terminal/RawOutputView';
import { CommandPalette } from '@/features/search/CommandPalette';
import { DiagnosticsBanner } from './DiagnosticsBanner';
import { PrintReport } from './PrintReport';
import { RenameDialog } from '@/features/sessions/RenameDialog';
import { sessionStorage } from '@/lib/storage/sessionStorage';

export function ReportShell() {
  const scan = useScanStore((s) => s.scan);
  const activeSessionId = useScanStore((s) => s.activeSessionId);
  const activeSessionName = useScanStore((s) => s.activeSessionName);
  const renameActiveSession = useScanStore((s) => s.renameActiveSession);
  const activeView = useUiStore((s) => s.activeView);
  const [renaming, setRenaming] = useState(false);

  if (!scan) return null;

  return (
    <>
      <div className="flex h-screen flex-col print:hidden">
        <TopNav breadcrumb={activeSessionName ?? undefined} onRenameBreadcrumb={activeSessionId ? () => setRenaming(true) : undefined} />
        <AppHeader />
        <DiagnosticsBanner key={scan.id} />
        <div className="flex flex-1 overflow-hidden">
          <SectionSidebar />
          <main className="flex-1 overflow-hidden">
            {activeView === 'overview' && <OverviewView />}
            {activeView === 'findings' && <FindingsView />}
            {activeView === 'sections' && <SectionsView />}
            {activeView === 'raw' && <RawOutputView />}
          </main>
        </div>
      </div>
      <CommandPalette />
      <PrintReport />
      {renaming && activeSessionId && activeSessionName && (
        <RenameDialog
          initialName={activeSessionName}
          onCancel={() => setRenaming(false)}
          onRename={async (name) => {
            await sessionStorage.renameSession(activeSessionId, name);
            renameActiveSession(name);
            setRenaming(false);
          }}
        />
      )}
    </>
  );
}
