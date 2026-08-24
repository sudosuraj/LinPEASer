import { isSensitivePath } from '@/lib/normalization/paths';
import { parsePermissionString } from '@/lib/normalization/permissions';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const BENIGN_WRITABLE_PREFIXES = ['/tmp/', '/var/tmp/', '/dev/shm/'];
const SENSITIVE_PREFIXES = ['/etc/', '/root/', '/usr/', '/lib/', '/opt/', '/boot/', '/sbin/', '/bin/', '/run/', '/var/run/'];

export const writableFileRule: DetectionRule = {
  id: 'world-writable-file',
  category: 'writable',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const tokens = line.text.trim().split(/\s+/);
      if (tokens.length === 0) continue;
      const perm = parsePermissionString(tokens[0]);
      if (!perm || !perm.otherWrite || perm.fileType === 'l') continue;

      const path = tokens[tokens.length - 1];
      if (!path.startsWith('/')) continue;
      if (BENIGN_WRITABLE_PREFIXES.some((p) => path.startsWith(p))) continue;

      const sensitive = isSensitivePath(path);
      const underSystemPrefix = SENSITIVE_PREFIXES.some((p) => path.startsWith(p));

      let severity: FindingDraft['severity'] = 'interesting';
      if (sensitive) severity = 'critical';
      else if (underSystemPrefix) severity = 'high';

      drafts.push({
        title: `World-writable ${perm.fileType === 'd' ? 'directory' : 'file'}: ${path}`,
        category: 'writable',
        severity,
        confidence: 'confirmed',
        description: `${path} is writable by any user.`,
        rationale: sensitive
          ? 'This path holds credentials or authentication configuration — any user being able to modify it is a direct path to compromise.'
          : underSystemPrefix
            ? 'System paths that any user can modify are frequently abusable to plant malicious content that a privileged process later reads or executes.'
            : 'World-writable content is worth a quick look for what reads or executes it, and with what privileges.',
        evidenceLineIndexes: [line.index],
        context: { path, permissions: perm.raw },
        tags: ['writable', perm.fileType === 'd' ? 'directory' : 'file'],
      });
    }

    return drafts;
  },
};
