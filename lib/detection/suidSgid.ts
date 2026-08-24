import { basename, extractPath } from '@/lib/normalization/paths';
import { parsePermissionString } from '@/lib/normalization/permissions';
import { HIGH_RISK_EXECUTABLES } from './knownBinaries';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const WORD_RE = /^[\w.\-]+$/;

function evaluateBit(ctx: AnalysisContext, bit: 'suid' | 'sgid'): FindingDraft[] {
  const drafts: FindingDraft[] = [];

  for (const line of ctx.allLines) {
    const tokens = line.text.trim().split(/\s+/);
    if (tokens.length === 0) continue;
    const perm = parsePermissionString(tokens[0]);
    if (!perm || !perm[bit]) continue;

    const owner = tokens[2] && WORD_RE.test(tokens[2]) ? tokens[2] : undefined;
    const path = tokens[tokens.length - 1].startsWith('/') ? tokens[tokens.length - 1] : extractPath(line.text);
    if (!path) continue;

    const bin = basename(path);
    const isKnownRisky = HIGH_RISK_EXECUTABLES.has(bin);
    const isRootOwned = !owner || owner === 'root';

    let severity: FindingDraft['severity'];
    let confidence: FindingDraft['confidence'];
    if (isRootOwned && isKnownRisky) {
      severity = bit === 'suid' ? 'critical' : 'high';
      confidence = 'confirmed';
    } else if (isRootOwned) {
      severity = 'medium';
      confidence = 'probable';
    } else {
      severity = 'low';
      confidence = 'probable';
    }

    drafts.push({
      title: `${bit === 'suid' ? 'SUID' : 'SGID'} binary: ${path}`,
      category: 'suid-sgid',
      severity,
      confidence,
      description: `${path} has the ${bit === 'suid' ? 'SUID' : 'SGID'} bit set${owner ? `, owned by ${owner}` : ''}.`,
      rationale: isKnownRisky
        ? `${bin} is a binary commonly documented as abusable for privilege escalation when it carries the ${bit === 'suid' ? 'SUID' : 'SGID'} bit — it can often be used to read, write, or execute as its owner.`
        : `Any ${bit === 'suid' ? 'SUID' : 'SGID'} binary run by another user's privileges is worth reviewing manually to see whether it can read/write files or spawn a shell on your behalf.`,
      evidenceLineIndexes: [line.index],
      context: { path, owner, permissions: perm.raw },
      tags: [bit, ...(isKnownRisky ? ['gtfobins-listed'] : [])],
    });
  }

  return drafts;
}

export const suidRule: DetectionRule = {
  id: 'suid-binary',
  category: 'suid-sgid',
  evaluate: (ctx) => evaluateBit(ctx, 'suid'),
};

export const sgidRule: DetectionRule = {
  id: 'sgid-binary',
  category: 'suid-sgid',
  evaluate: (ctx) => evaluateBit(ctx, 'sgid'),
};
