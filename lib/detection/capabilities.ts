import { CRITICAL_CAPABILITIES, HIGH_CAPABILITIES } from './knownBinaries';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const CAP_LINE_RE = /^(\S+)\s*=\s*(cap_[\w,+=!\-]+)/i;

export const capabilitiesRule: DetectionRule = {
  id: 'linux-capabilities',
  category: 'capabilities',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const m = line.text.trim().match(CAP_LINE_RE);
      if (!m) continue;
      const [, path, capString] = m;
      const caps = capString
        .toLowerCase()
        .split(/[,+]/)
        .map((c) => c.trim())
        .filter((c) => c.startsWith('cap_'));
      if (caps.length === 0) continue;

      const hasCritical = caps.some((c) => CRITICAL_CAPABILITIES.has(c));
      const hasHigh = caps.some((c) => HIGH_CAPABILITIES.has(c));
      const severity = hasCritical ? 'critical' : hasHigh ? 'high' : 'medium';

      drafts.push({
        title: `Capabilities set on ${path}`,
        category: 'capabilities',
        severity,
        confidence: 'confirmed',
        description: `${path} carries capabilities: ${caps.join(', ')}.`,
        rationale: hasCritical
          ? 'One or more of these capabilities (e.g. setuid/setgid/dac_override/sys_admin/sys_ptrace) can be leveraged directly to gain root, bypass file permission checks, or manipulate other processes.'
          : 'Elevated capabilities extend what this binary can do beyond a normal user process; worth confirming whether the binary can be influenced to act on your behalf.',
        evidenceLineIndexes: [line.index],
        context: { path },
        tags: ['capabilities', ...caps],
      });
    }

    return drafts;
  },
};
