import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const INTERESTING_VARS: { name: string; severity: FindingDraft['severity']; note: string }[] = [
  { name: 'LD_PRELOAD', severity: 'high', note: 'can force arbitrary shared libraries to load into every dynamically-linked process this user starts' },
  { name: 'LD_LIBRARY_PATH', severity: 'medium', note: 'can redirect library resolution toward attacker-controlled libraries' },
  { name: 'PYTHONPATH', severity: 'low', note: 'can cause a script to import an attacker-controlled module instead of the intended one' },
  { name: 'PERL5LIB', severity: 'low', note: 'can cause a script to load an attacker-controlled Perl module' },
];

export const interestingEnvironmentVariableRule: DetectionRule = {
  id: 'interesting-env-var',
  category: 'environment',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      const text = line.text.trim();
      for (const variable of INTERESTING_VARS) {
        const m = text.match(new RegExp(`^(?:export\\s+)?${variable.name}\\s*=\\s*(.+)$`));
        if (!m || !m[1].trim()) continue;
        drafts.push({
          title: `${variable.name} is set`,
          category: 'environment',
          severity: variable.severity,
          confidence: 'confirmed',
          description: `${variable.name}=${m[1]}`,
          rationale: `If this value is influenceable by another user or a shared script, it ${variable.note}.`,
          evidenceLineIndexes: [line.index],
          tags: ['environment'],
        });
      }
    }

    return drafts;
  },
};
