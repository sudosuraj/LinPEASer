import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

export const pamMisconfigRule: DetectionRule = {
  id: 'pam-misconfiguration',
  category: 'authentication',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const text = line.text.trim();
      if (!text || text.startsWith('#')) continue;

      if (/pam_permit\.so/.test(text)) {
        drafts.push({
          title: 'PAM stack includes pam_permit',
          category: 'authentication',
          severity: 'high',
          confidence: 'confirmed',
          description: text.slice(0, 200),
          rationale: 'pam_permit unconditionally succeeds — if it sits in an auth stack outside of a controlled fallback, it can allow authentication with no real check.',
          evidenceLineIndexes: [line.index],
          tags: ['authentication', 'pam'],
        });
      }

      if (/pam_unix\.so[^\n]*\bnullok\b/.test(text)) {
        drafts.push({
          title: 'PAM allows empty passwords (nullok)',
          category: 'authentication',
          severity: 'high',
          confidence: 'confirmed',
          description: text.slice(0, 200),
          rationale: 'The nullok option lets accounts with an empty password field authenticate successfully.',
          evidenceLineIndexes: [line.index],
          tags: ['authentication', 'pam'],
        });
      }
    }

    return drafts;
  },
};
