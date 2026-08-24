import { cn } from '@/utils/cn';

export function StatCard({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border-subtle bg-surface px-4 py-3', className)}>
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className={cn('mt-1 font-mono text-2xl font-semibold text-primary', valueClassName)}>{value}</p>
    </div>
  );
}
