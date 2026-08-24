import type { FindingCategory } from '@/types';
import { FINDING_CATEGORY_LABELS } from '@/types';
import { Badge } from '@/components/ui/Badge';

export function CategoryBadge({ category }: { category: FindingCategory }) {
  return <Badge className="border-border-subtle bg-transparent text-muted uppercase">{FINDING_CATEGORY_LABELS[category]}</Badge>;
}
