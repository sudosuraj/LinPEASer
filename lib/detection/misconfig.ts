import { parsePermissionString } from '@/lib/normalization/permissions';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

/** Config-file-looking paths under /etc that are group- or world-writable. */
export const writableConfigFileRule: DetectionRule = {
  id: 'writable-config-file',
  category: 'permissions',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const tokens = line.text.trim().split(/\s+/);
      if (tokens.length === 0) continue;
      const path = tokens[tokens.length - 1];
      if (!/^\/etc\/[\w./\-]+\.(conf|cfg|ini|yml|yaml|json)$/.test(path)) continue;

      const perm = parsePermissionString(tokens[0]);
      if (!perm || !(perm.otherWrite || perm.groupWrite)) continue;

      drafts.push({
        title: `Writable configuration file: ${path}`,
        category: 'permissions',
        severity: perm.otherWrite ? 'high' : 'medium',
        confidence: 'confirmed',
        description: `${path} has permissions ${perm.raw}.`,
        rationale: 'Configuration files that unprivileged users can modify can often be leveraged to change what a privileged process does the next time it reads them.',
        evidenceLineIndexes: [line.index],
        context: { path, permissions: perm.raw },
        tags: ['permissions', 'writable'],
      });
    }

    return drafts;
  },
};

/**
 * Safety-net rule: LinPEAS's own strongest visual flag — a red-on-yellow or
 * yellow-on-red combination — surfaced as a low-confidence, low-priority
 * finding when nothing else already explained the line. Deliberately does
 * NOT fire on plain red text alone (far too common/noisy in real output);
 * color is used here only as corroborating evidence for manual review, per
 * the project's severity model, never as the sole basis for a rating.
 */
export const colorFlaggedFallbackRule: DetectionRule = {
  id: 'color-flagged-fallback',
  category: 'other',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      if (!line.signals.includes('critical-combo')) continue;
      if (!line.text.trim()) continue;

      drafts.push({
        title: 'Highlighted by LinPEAS as critical',
        category: 'other',
        severity: 'medium',
        confidence: 'possible',
        description: line.text.trim().slice(0, 200),
        rationale: 'LinPEAS itself rendered this line in its strongest warning color combination. No specific rule above matched it, so it is surfaced for manual review rather than silently dropped.',
        evidenceLineIndexes: [line.index],
        tags: ['color-flagged'],
      });
    }

    return drafts;
  },
};
