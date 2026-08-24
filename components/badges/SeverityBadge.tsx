import type { Severity } from '@/types';
import { SEVERITY_META } from '@/lib/presentation';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITY_META[severity];
  return (
    <Badge className={cn(meta.text, meta.bg, meta.border, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  );
}

export function SeverityDot({ severity, className }: { severity: Severity; className?: string }) {
  const meta = SEVERITY_META[severity];
  return <span className={cn('inline-block h-2 w-2 shrink-0 rounded-full', meta.dot, className)} title={meta.label} />;
}
