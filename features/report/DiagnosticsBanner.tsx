'use client';

import { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { useScanStore } from '@/lib/store/scanStore';
import { cn } from '@/utils/cn';

export function DiagnosticsBanner() {
  const scan = useScanStore((s) => s.scan);
  const [dismissed, setDismissed] = useState(false);

  if (!scan || dismissed || scan.diagnostics.length === 0) return null;

  const worst = scan.diagnostics.some((d) => d.level === 'error')
    ? 'error'
    : scan.diagnostics.some((d) => d.level === 'warning')
      ? 'warning'
      : 'info';

  return (
    <div
      className={cn(
        'flex items-start gap-2 border-b px-5 py-2.5 text-xs',
        worst === 'error' && 'border-critical/30 bg-critical/10 text-critical',
        worst === 'warning' && 'border-medium/30 bg-medium/10 text-medium',
        worst === 'info' && 'border-border-subtle bg-surface-2 text-secondary'
      )}
    >
      {worst === 'info' ? <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
      <ul className="flex-1 space-y-0.5">
        {scan.diagnostics.map((d, i) => (
          <li key={i}>{d.message}</li>
        ))}
      </ul>
      <button onClick={() => setDismissed(true)} className="shrink-0 opacity-70 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
