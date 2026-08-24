import { extractPath } from '@/lib/normalization/paths';
import { parsePermissionString } from '@/lib/normalization/permissions';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const CRON_SYNTAX_RE =
  /^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/;
const CRON_FIELD_RE = /^(\*|[\d\-*/,]+)$/;
const WRITABLE_DIR_RE = /^\/(?:tmp|var\/tmp|dev\/shm|home)(?:\/|$)/;

export const cronScheduleRule: DetectionRule = {
  id: 'cron-schedule-risk',
  category: 'cron',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const text = line.text.trim();
      const m = text.match(CRON_SYNTAX_RE);
      if (!m) continue;
      const fields = m.slice(1, 6);
      if (!fields.every((f) => CRON_FIELD_RE.test(f))) continue;

      const command = m[7];
      const path = extractPath(command);
      if (!path) continue;

      const runsFromWritableDir = WRITABLE_DIR_RE.test(path);
      const isRelative = !command.trim().startsWith('/') && !command.trim().startsWith('*');

      if (!runsFromWritableDir && !isRelative) continue;

      drafts.push({
        title: `Scheduled job runs from ${runsFromWritableDir ? 'a commonly-writable location' : 'a relative path'}`,
        category: 'cron',
        severity: runsFromWritableDir ? 'high' : 'medium',
        confidence: 'probable',
        description: `Cron entry executes: ${command}`,
        rationale: runsFromWritableDir
          ? 'A scheduled job that runs a script from a world-writable directory can often be replaced to run attacker-controlled code with the cron job\'s privileges.'
          : 'A scheduled job invoking a command without an absolute path can potentially be hijacked by placing a same-named executable earlier in PATH.',
        evidenceLineIndexes: [line.index],
        context: { path },
        tags: ['cron', 'scheduled-task'],
      });
    }

    return drafts;
  },
};

export const writableCronLocationRule: DetectionRule = {
  id: 'writable-cron-location',
  category: 'cron',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const tokens = line.text.trim().split(/\s+/);
      if (tokens.length === 0) continue;
      const perm = parsePermissionString(tokens[0]);
      if (!perm || !perm.otherWrite) continue;
      const path = tokens[tokens.length - 1];
      if (!path.startsWith('/') || !/\/(cron|spool\/cron)/.test(path)) continue;

      drafts.push({
        title: `Writable cron location: ${path}`,
        category: 'cron',
        severity: 'critical',
        confidence: 'confirmed',
        description: `${path} is writable by any user and lives inside a cron directory.`,
        rationale: 'Anyone able to write into a cron directory can schedule arbitrary commands to run with the privileges of whichever user owns that crontab — frequently root.',
        evidenceLineIndexes: [line.index],
        context: { path, permissions: perm.raw },
        tags: ['cron', 'writable'],
      });
    }

    return drafts;
  },
};
