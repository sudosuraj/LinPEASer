import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const PROCESS_FROM_TMP_RE = /\broot\b.*(\/tmp\/|\/dev\/shm\/|\/var\/tmp\/)\S+/;

export const processFromWritableDirRule: DetectionRule = {
  id: 'process-from-writable-dir',
  category: 'processes',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const section of ctx.flatSections) {
      // LinPEAS versions vary in whether processes get their own section or
      // share one with cron/services/timers — check all of them rather than
      // assuming a single exact SectionKind.
      if (section.kind !== 'processes' && section.kind !== 'cron' && section.kind !== 'services') continue;
      for (const line of section.lines) {
        if (!PROCESS_FROM_TMP_RE.test(line.text)) continue;
        drafts.push({
          title: 'Root process executing from a commonly-writable directory',
          category: 'processes',
          severity: 'high',
          confidence: 'probable',
          description: line.text.trim().slice(0, 200),
          rationale: 'A privileged process running a binary or script from /tmp, /var/tmp, or /dev/shm may be replaceable before its next execution.',
          evidenceLineIndexes: [line.index],
          tags: ['processes'],
        });
      }
    }

    return drafts;
  },
};
