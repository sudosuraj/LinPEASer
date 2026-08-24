import { isSensitivePath } from '@/lib/normalization/paths';
import { parsePermissionString } from '@/lib/normalization/permissions';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

export const sensitiveFileReadableRule: DetectionRule = {
  id: 'sensitive-file-readable',
  category: 'sensitive-files',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const tokens = line.text.trim().split(/\s+/);
      if (tokens.length === 0) continue;
      const path = tokens[tokens.length - 1];
      if (!path.startsWith('/') || !isSensitivePath(path)) continue;

      const perm = parsePermissionString(tokens[0]);
      const readableByOthers = perm ? perm.otherRead : true; // no perms captured — presence alone is still worth flagging

      drafts.push({
        title: `Sensitive file present: ${path}`,
        category: 'sensitive-files',
        severity: readableByOthers && perm ? 'high' : 'interesting',
        confidence: perm ? 'confirmed' : 'possible',
        description: perm ? `${path} has permissions ${perm.raw}.` : `${path} was referenced in the output.`,
        rationale: 'This path commonly holds authentication material or configuration secrets; confirm who can read it and what it contains.',
        evidenceLineIndexes: [line.index],
        context: { path, permissions: perm?.raw },
        tags: ['sensitive-file'],
      });
    }

    return drafts;
  },
};
