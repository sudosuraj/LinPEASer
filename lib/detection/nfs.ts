import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const EXPORT_LINE_RE = /^(\/\S+)\s+(.+)$/;

export const nfsExportsRule: DetectionRule = {
  id: 'nfs-exports',
  category: 'nfs',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const text = line.text.trim();
      const m = text.match(EXPORT_LINE_RE);
      if (!m || !/\(.*\)/.test(m[2])) continue;
      const options = m[2];

      const noRootSquash = /no_root_squash/i.test(options);
      const openToAll = /^\*/.test(options.trim()) || /\(\s*\*/.test(options);

      if (!noRootSquash && !openToAll) continue;

      drafts.push({
        title: noRootSquash ? `NFS export without root squashing: ${m[1]}` : `NFS export open to any host: ${m[1]}`,
        category: 'nfs',
        severity: noRootSquash ? 'critical' : 'high',
        confidence: 'confirmed',
        description: `Export entry: ${text}`,
        rationale: noRootSquash
          ? 'With no_root_squash set, a client mounting this export as root retains root privileges on the exported files — creating a SUID binary from the client is a direct route to host root.'
          : 'An export reachable from any host expands who can attempt to read or tamper with its contents.',
        evidenceLineIndexes: [line.index],
        context: { path: m[1] },
        tags: ['nfs'],
      });
    }

    return drafts;
  },
};
