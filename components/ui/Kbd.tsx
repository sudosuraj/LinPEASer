import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-secondary',
        className
      )}
    >
      {children}
    </kbd>
  );
}
