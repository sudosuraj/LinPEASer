import type { Confidence } from '@/types';
import { CONFIDENCE_META } from '@/lib/presentation';
import { Badge } from '@/components/ui/Badge';

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const meta = CONFIDENCE_META[confidence];
  return (
    <Badge title={meta.hint} className="border-border-strong bg-surface-2 text-secondary">
      {meta.label}
    </Badge>
  );
}
