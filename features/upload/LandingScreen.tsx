'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ClipboardPaste, ShieldCheck, Sparkles, Terminal, UploadCloud } from 'lucide-react';
import { useScanStore } from '@/lib/store/scanStore';
import { useNavStore } from '@/lib/store/navStore';
import { useParseScan } from '@/lib/useParseScan';
import { SAMPLE_SCAN_TEXT } from '@/lib/sampleScan';
import { MAX_RECOMMENDED_UPLOAD_BYTES } from '@/lib/constants';
import { formatBytes } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PrivacyBadge } from '@/components/ui/PrivacyBadge';
import { useSessionsList } from '@/features/sessions/useSessionsList';

type Mode = 'paste' | 'upload';

export function LandingScreen() {
  const [mode, setMode] = useState<Mode>('paste');
  const [text, setText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = useScanStore((s) => s.status);
  const error = useScanStore((s) => s.error);
  const { parse } = useParseScan();
  const { sessions } = useSessionsList();
  const setRoute = useNavStore((s) => s.setRoute);

  const handleFile = useCallback(
    async (file: File) => {
      const contents = await file.text();
      setText(contents);
      void parse(contents);
    },
    [parse]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile]
  );

  const isParsing = status === 'parsing';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        {sessions.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setRoute('sessions')}
              className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-secondary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sessions
            </button>
            <PrivacyBadge />
          </div>
        )}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1 text-xs text-secondary">
            <Terminal className="h-3.5 w-3.5 text-accent" />
            Client-side LinPEAS analysis console
          </div>
          <h1 className="font-mono text-4xl font-semibold tracking-tight text-primary sm:text-5xl">LinPEASer</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-secondary">
            Turn raw LinPEAS output into organized, prioritized privilege-escalation intelligence — parsed, analyzed,
            and searchable in your browser.
          </p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface shadow-2xl shadow-black/20">
          <div className="flex border-b border-border-subtle px-2 pt-2">
            <TabButton active={mode === 'paste'} onClick={() => setMode('paste')} icon={<ClipboardPaste className="h-3.5 w-3.5" />}>
              Paste Output
            </TabButton>
            <TabButton active={mode === 'upload'} onClick={() => setMode('upload')} icon={<UploadCloud className="h-3.5 w-3.5" />}>
              Upload .txt
            </TabButton>
          </div>

          <div className="p-5">
            {mode === 'paste' ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the full terminal output of linpeas.sh here…"
                  spellCheck={false}
                  className="h-56 w-full resize-none rounded-lg border border-border-subtle bg-surface-2 p-3 font-mono text-xs leading-relaxed text-primary placeholder:text-muted focus:border-accent focus:outline-none"
                />
                <Button variant="primary" disabled={isParsing || text.trim().length === 0} onClick={() => void parse(text)}>
                  {isParsing ? 'Parsing…' : 'Parse Output'}
                </Button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors ${
                  dragActive ? 'border-accent bg-accent-soft' : 'border-border-strong hover:border-border-strong hover:bg-surface-2'
                }`}
              >
                <UploadCloud className="h-8 w-8 text-muted" />
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">Drop a .txt file, or click to browse</p>
                  <p className="mt-1 text-xs text-muted">
                    Recommended up to {formatBytes(MAX_RECOMMENDED_UPLOAD_BYTES)} for the smoothest experience.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.log,.out,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                    e.target.value = '';
                  }}
                />
              </div>
            )}

            {isParsing && (
              <div className="mt-4">
                <ProgressBar />
                <p className="mt-2 text-center text-xs text-muted">Parsing and analyzing in a background thread…</p>
              </div>
            )}

            {error && !isParsing && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-critical/30 bg-critical/10 p-3 text-xs text-critical">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted">
          <button
            onClick={() => void parse(SAMPLE_SCAN_TEXT)}
            className="inline-flex items-center gap-1.5 text-secondary transition-colors hover:text-accent"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Try a sample scan
          </button>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Parsing happens entirely in your browser — nothing is uploaded.
          </span>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 pb-3 text-sm font-medium transition-colors ${
        active ? 'text-primary' : 'text-muted hover:text-secondary'
      }`}
    >
      {icon}
      {children}
      {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />}
    </button>
  );
}
