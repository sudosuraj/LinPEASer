import { parsePermissionString } from '@/lib/normalization/permissions';
import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const UNIT_PATH_RE = /\/(?:etc|lib|usr\/lib)\/systemd\/system\/\S+\.(service|timer|socket)$/;
const INIT_SCRIPT_RE = /\/etc\/init\.d\/\S+$/;

export const writableServiceDefinitionRule: DetectionRule = {
  id: 'writable-service-definition',
  category: 'services',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const tokens = line.text.trim().split(/\s+/);
      if (tokens.length === 0) continue;
      const path = tokens[tokens.length - 1];
      if (!UNIT_PATH_RE.test(path) && !INIT_SCRIPT_RE.test(path)) continue;

      const perm = parsePermissionString(tokens[0]);
      if (!perm || !(perm.otherWrite || perm.groupWrite)) continue;

      drafts.push({
        title: `Writable service definition: ${path}`,
        category: 'services',
        severity: 'critical',
        confidence: 'confirmed',
        description: `${path} has permissions ${perm.raw}.`,
        rationale: 'A modifiable unit or init script that runs (or will run) as a privileged user is a direct code-execution path the next time the service starts or the host reboots.',
        evidenceLineIndexes: [line.index],
        context: { path, permissions: perm.raw },
        tags: ['services', 'writable'],
      });
    }

    return drafts;
  },
};
