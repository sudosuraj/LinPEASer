import { cn } from '@/utils/cn';

export function ProgressBar({ indeterminate = true, value = 0, className }: { indeterminate?: boolean; value?: number; className?: string }) {
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-surface-2', className)}>
      {indeterminate ? (
        <div className="h-full w-1/3 animate-[progress_1.1s_ease-in-out_infinite] rounded-full bg-accent" />
      ) : (
        <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      )}
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
