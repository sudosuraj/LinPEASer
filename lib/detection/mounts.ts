import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const MOUNT_LINE_RE = /^\S+\s+on\s+(\S+)\s+type\s+(\S+)\s+\(([^)]+)\)/;

export const riskyMountRule: DetectionRule = {
  id: 'risky-mount-options',
  category: 'mounts',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const m = line.text.trim().match(MOUNT_LINE_RE);
      if (!m) continue;
      const [, mountPoint, fsType, options] = m;
      const optionList = options.split(',').map((o) => o.trim());

      if (fsType === 'proc' || mountPoint === '/proc') continue;

      const isNoisyLoopback = mountPoint === '/' || mountPoint === '/boot';
      if (isNoisyLoopback) continue;

      if (optionList.includes('rw') && (mountPoint.startsWith('/mnt') || mountPoint.startsWith('/media') || fsType === 'nfs' || fsType === 'cifs')) {
        drafts.push({
          title: `Writable ${fsType} mount at ${mountPoint}`,
          category: 'mounts',
          severity: 'medium',
          confidence: 'possible',
          description: `${mountPoint} (${fsType}) is mounted with: ${options}`,
          rationale: 'Removable, network, or auxiliary mounts writable by the current context are worth checking for planted content or credentials.',
          evidenceLineIndexes: [line.index],
          context: { path: mountPoint },
          tags: ['mounts'],
        });
      }
    }

    return drafts;
  },
};
