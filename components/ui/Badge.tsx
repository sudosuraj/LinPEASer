import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Badge({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none tracking-wide whitespace-nowrap',
        className
      )}
    >
      {children}
    </span>
  );
}
