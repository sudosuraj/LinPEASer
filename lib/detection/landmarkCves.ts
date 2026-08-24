import { basename } from '@/lib/normalization/paths';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

/**
 * A small, deliberately short list of extremely well-documented,
 * version-stable "landmark" local-root CVEs — not a general CVE database
 * (see kernel.ts for why this project doesn't try to maintain one).
 * These are singled out because their affected ranges are precisely known
 * and unlikely to be revised, unlike the constantly-growing space of Linux
 * kernel CVEs already covered indirectly via exploitSuggesterRule.
 */

function isSudoVulnerableToBaronSamedit(version: string): boolean {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)(?:p(\d+))?/);
  if (!m) return false;
  const major = Number(m[1]);
  const minor = Number(m[2]);
  const patch = Number(m[3]);
  const patchLevel = m[4] ? Number(m[4]) : 0;
  if (major !== 1) return false;

  // Legacy branch: 1.8.2 - 1.8.31p2 vulnerable; fixed in 1.8.32.
  if (minor === 8) {
    if (patch < 2) return false;
    if (patch < 31) return true;
    if (patch === 31) return patchLevel <= 2;
    return false;
  }
  // Stable branch: 1.9.0 - 1.9.5p1 vulnerable; fixed in 1.9.5p2.
  if (minor === 9) {
    if (patch < 5) return true;
    if (patch === 5) return patchLevel <= 1;
    return false;
  }
  return false;
}

export const sudoBaronSameditRule: DetectionRule = {
  id: 'sudo-baron-samedit',
  category: 'sudo',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const m = line.text.trim().match(/^Sudo version\s+(\d+\.\d+\.\d+(?:p\d+)?)/i);
      if (!m) continue;
      const version = m[1];
      if (!isSudoVulnerableToBaronSamedit(version)) continue;

      drafts.push({
        title: `sudo ${version} is a candidate for CVE-2021-3156 ("Baron Samedit")`,
        category: 'sudo',
        severity: 'high',
        confidence: 'probable',
        description: `Detected sudo version ${version}, inside the range affected by CVE-2021-3156.`,
        rationale:
          'CVE-2021-3156 is a heap buffer overflow in sudo (versions 1.8.2-1.8.31p2 and 1.9.0-1.9.5p1) that lets any local user escalate to root without authentication, with public exploits widely available. Some distributions backport this fix without changing the reported version string, so confirm against your distribution\'s advisories before relying on this.',
        evidenceLineIndexes: [line.index],
        tags: ['sudo', 'cve-2021-3156', 'known-exploit'],
      });
    }

    return drafts;
  },
};

export const pkexecPwnkitRule: DetectionRule = {
  id: 'pkexec-pwnkit',
  category: 'sudo',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const tokens = line.text.trim().split(/\s+/);
      if (tokens.length === 0) continue;
      const path = tokens[tokens.length - 1];
      if (!path.startsWith('/') || basename(path) !== 'pkexec') continue;

      drafts.push({
        title: 'pkexec present — check for CVE-2021-4034 ("PwnKit")',
        category: 'sudo',
        severity: 'medium',
        confidence: 'possible',
        description: `${path} was found. pkexec ships SUID-root by design, which is also the vector for CVE-2021-4034.`,
        rationale:
          'CVE-2021-4034 ("PwnKit") affected essentially every polkit/pkexec build for over a decade before its January 2022 patch, and pkexec\'s own output gives no way to tell whether a distribution has applied the fix. Worth a direct version/patch check before ruling it out — public proof-of-concept exploits have been available since disclosure.',
        evidenceLineIndexes: [line.index],
        context: { path },
        tags: ['sudo', 'cve-2021-4034', 'known-exploit'],
      });
    }

    return drafts;
  },
};
