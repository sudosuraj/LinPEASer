import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const WRITABLE_LOOKING_DIR_RE = /^\/(?:tmp|var\/tmp|dev\/shm|home)(?:\/|$)/;

export const pathHijackRule: DetectionRule = {
  id: 'path-env-hijack',
  category: 'path-hijack',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const m = line.text.match(/^\s*(?:export\s+)?PATH\s*=\s*(.+)$/);
      if (!m) continue;
      const entries = m[1].split(':').map((e) => e.trim());

      if (entries.some((e) => e === '.' || e === '')) {
        drafts.push({
          title: 'PATH includes the current directory',
          category: 'path-hijack',
          severity: 'medium',
          confidence: 'confirmed',
          description: `PATH resolves to: ${m[1]}`,
          rationale: 'When "." (or an empty/trailing colon, which means the same thing) is on PATH, running an unqualified command can execute an attacker-planted file from the current directory instead of the intended binary.',
          evidenceLineIndexes: [line.index],
          tags: ['path'],
        });
      }

      const writableEntries = entries.filter((e) => WRITABLE_LOOKING_DIR_RE.test(e));
      if (writableEntries.length > 0) {
        drafts.push({
          title: 'PATH contains a commonly-writable directory',
          category: 'path-hijack',
          severity: 'high',
          confidence: 'probable',
          description: `PATH includes: ${writableEntries.join(', ')}`,
          rationale: 'If a directory on PATH is writable and appears before the legitimate binary\'s directory, a same-named malicious executable there can be run instead — especially dangerous in a root-owned script or cron job.',
          evidenceLineIndexes: [line.index],
          tags: ['path'],
        });
      }
    }

    return drafts;
  },
};
