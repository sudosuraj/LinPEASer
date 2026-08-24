import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const PASSWD_LINE_RE = /^([\w.\-]+):([^:]*):(\d+):(\d+):/;
const PRIVILEGED_GROUPS = new Set(['docker', 'lxd', 'lxc', 'disk', 'adm', 'shadow', 'sudo', 'wheel']);

export const additionalRootUserRule: DetectionRule = {
  id: 'additional-uid0-user',
  category: 'users-groups',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const m = line.text.match(PASSWD_LINE_RE);
      if (!m) continue;
      const [, user, passField, uid] = m;
      if (uid !== '0' || user === 'root') continue;

      drafts.push({
        title: `Additional UID 0 user: ${user}`,
        category: 'users-groups',
        severity: 'critical',
        confidence: 'confirmed',
        description: `${user} shares UID 0 with root.`,
        rationale: 'Any account with UID 0 has root\'s full privileges regardless of its name — this is frequently a deliberately planted backdoor.',
        evidenceLineIndexes: [line.index],
        context: { user },
        tags: ['users', 'uid0'],
      });

      if (passField === '') {
        drafts.push({
          title: `User ${user} has an empty password field`,
          category: 'users-groups',
          severity: 'critical',
          confidence: 'confirmed',
          description: `${user}'s password field is empty in the account database.`,
          rationale: 'An empty password field typically allows logging in as that account with no password at all.',
          evidenceLineIndexes: [line.index],
          context: { user },
          tags: ['users', 'no-password'],
        });
      }
    }

    return drafts;
  },
};

export const privilegedGroupMembershipRule: DetectionRule = {
  id: 'privileged-group-membership',
  category: 'users-groups',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const m = line.text.match(/\bgroups=([^\n]+)/);
      if (!m) continue;
      const found = Array.from(m[1].matchAll(/\((\w+)\)/g)).map((g) => g[1]);
      const privileged = found.filter((g) => PRIVILEGED_GROUPS.has(g));
      if (privileged.length === 0) continue;

      drafts.push({
        title: `Current user is in privileged group(s): ${privileged.join(', ')}`,
        category: 'users-groups',
        severity: privileged.includes('docker') || privileged.includes('lxd') || privileged.includes('lxc') ? 'critical' : 'high',
        confidence: 'confirmed',
        description: `Group membership includes: ${found.join(', ')}`,
        rationale: 'Membership in docker/lxd/disk/adm/shadow is a well-documented path to root or to reading otherwise-protected files, without needing any additional vulnerability.',
        evidenceLineIndexes: [line.index],
        tags: ['users', 'group-privesc'],
      });
    }

    return drafts;
  },
};
