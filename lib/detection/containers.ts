import { parsePermissionString } from '@/lib/normalization/permissions';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

export const dockerSocketRule: DetectionRule = {
  id: 'docker-socket-writable',
  category: 'containers',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      if (!line.text.includes('docker.sock')) continue;
      const tokens = line.text.trim().split(/\s+/);
      const perm = tokens.length > 0 ? parsePermissionString(tokens[0]) : null;
      if (!perm || !(perm.otherWrite || perm.groupWrite)) continue;

      drafts.push({
        title: 'Writable Docker socket',
        category: 'containers',
        severity: 'critical',
        confidence: 'confirmed',
        description: `docker.sock has permissions ${perm.raw}.`,
        rationale: 'Write access to the Docker socket is equivalent to root on the host — a container can be started with the host filesystem mounted in.',
        evidenceLineIndexes: [line.index],
        tags: ['docker', 'container-escape'],
      });
    }

    return drafts;
  },
};

export const containerContextRule: DetectionRule = {
  id: 'container-context',
  category: 'containers',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const text = line.text.toLowerCase();
      if (text.includes('currently inside a docker container') || text.includes('running inside a docker container')) {
        drafts.push({
          title: 'Execution context is a container',
          category: 'containers',
          severity: 'info',
          confidence: 'confirmed',
          description: 'LinPEAS detected it is running inside a container.',
          rationale: 'Privilege escalation goals differ inside a container — look for host breakout paths (writable Docker socket, dangerous mounts, excess capabilities) alongside normal local privesc checks.',
          evidenceLineIndexes: [line.index],
          tags: ['container-context'],
        });
      }
    }

    return drafts;
  },
};
