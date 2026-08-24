import { ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';

export function PrivacyBadge({ className }: { className?: string }) {
  return (
    <span
      title="Parsing and storage happen entirely in this browser. Nothing about your scan is uploaded anywhere."
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-2 px-2.5 py-1 text-[11px] text-secondary',
        className
      )}
    >
      <ShieldCheck className="h-3 w-3 text-accent" />
      Local only
    </span>
  );
}
