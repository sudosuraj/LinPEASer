import { basename } from '@/lib/normalization/paths';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

/**
 * Binaries with well-documented "wildcard injection" behavior: run against
 * a bare shell glob, specially-named files in the working directory
 * (e.g. `--checkpoint=1`, `--checkpoint-action=exec=...` for tar) get
 * parsed as options instead of filenames.
 */
const WILDCARD_VULNERABLE_BINARIES = new Set(['tar', 'rsync', 'chown', 'chmod', 'zip', '7z']);

const CRON_SYNTAX_RE = /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/;
const CRON_FIELD_RE = /^(\*|[\d\-*/,]+)$/;

export const wildcardInjectionRule: DetectionRule = {
  id: 'wildcard-injection',
  category: 'cron',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const text = line.text.trim();
      const m = text.match(CRON_SYNTAX_RE);
      if (!m) continue;
      const fields = m.slice(1, 6);
      if (!fields.every((f) => CRON_FIELD_RE.test(f))) continue;

      const command = m[6];
      const tokens = command.split(/\s+/);
      const binary = tokens.map((t) => basename(t)).find((t) => WILDCARD_VULNERABLE_BINARIES.has(t));
      const hasBareWildcard = tokens.includes('*') || tokens.includes('./*');
      if (!binary || !hasBareWildcard) continue;

      drafts.push({
        title: `Wildcard passed to ${binary} in a scheduled job`,
        category: 'cron',
        severity: 'high',
        confidence: 'probable',
        description: `Cron entry runs ${binary} with an unquoted wildcard: ${command}`,
        rationale: `${binary} is documented as vulnerable to "wildcard injection": when it expands a bare glob in a directory it doesn't control, specially-named files (e.g. starting with "--") are parsed as command-line options instead of filenames. Anyone able to write into that directory can often turn this into code execution as whichever user runs the job.`,
        evidenceLineIndexes: [line.index],
        tags: ['cron', 'wildcard-injection'],
      });
    }

    return drafts;
  },
};
