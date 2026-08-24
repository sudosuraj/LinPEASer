'use client';

import { useState } from 'react';
import { ChevronDown, Download, FileJson, FileText, Printer } from 'lucide-react';
import { useScanStore } from '@/lib/store/scanStore';
import { triggerDownload } from '@/utils/download';
import { Button } from '@/components/ui/Button';

export function ExportMenu() {
  const scan = useScanStore((s) => s.scan);
  const [open, setOpen] = useState(false);
  if (!scan) return null;

  const baseName = `linpeaser-${(scan.metadata.hostname ?? 'scan').replace(/[^\w.-]+/g, '_')}`;

  const downloadJson = () => {
    triggerDownload(`${baseName}.json`, JSON.stringify(scan, null, 2), 'application/json');
    setOpen(false);
  };
  const downloadRaw = () => {
    triggerDownload(`${baseName}-raw.txt`, scan.rawOutput, 'text/plain');
    setOpen(false);
  };
  const printReport = () => {
    setOpen(false);
    window.print();
  };

  return (
    <div className="relative">
      <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-border-subtle bg-elevated p-1 shadow-xl">
            <MenuItem icon={<FileJson className="h-3.5 w-3.5" />} onClick={downloadJson}>
              Download parsed JSON
            </MenuItem>
            <MenuItem icon={<FileText className="h-3.5 w-3.5" />} onClick={downloadRaw}>
              Download original output
            </MenuItem>
            <MenuItem icon={<Printer className="h-3.5 w-3.5" />} onClick={printReport}>
              Print report
            </MenuItem>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ icon, onClick, children }: { icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-secondary hover:bg-hover hover:text-primary"
    >
      {icon}
      {children}
    </button>
  );
}
