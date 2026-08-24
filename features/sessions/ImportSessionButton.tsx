'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { sessionStorage } from '@/lib/storage/sessionStorage';
import { Button } from '@/components/ui/Button';

export function ImportSessionButton({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    try {
      const text = await file.text();
      await sessionStorage.importSessionFromJson(text);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed — this file is not a valid LinPEASer export.');
    }
  };

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
        <Upload className="h-3.5 w-3.5" />
        Import
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      {error && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-md border border-critical/30 bg-critical/10 p-2 text-[11px] text-critical">
          {error}
        </div>
      )}
    </div>
  );
}
