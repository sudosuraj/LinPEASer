import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

interface CredentialPattern {
  regex: RegExp;
  label: string;
  severity: FindingDraft['severity'];
  confidence: FindingDraft['confidence'];
}

const PATTERNS: CredentialPattern[] = [
  { regex: /-----BEGIN[ A-Z]*PRIVATE KEY-----/, label: 'Private key material', severity: 'critical', confidence: 'confirmed' },
  { regex: /AKIA[0-9A-Z]{16}/, label: 'AWS access key ID', severity: 'critical', confidence: 'confirmed' },
  { regex: /xox[baprs]-[0-9A-Za-z-]{10,}/, label: 'Slack token', severity: 'high', confidence: 'confirmed' },
  { regex: /gh[pousr]_[A-Za-z0-9]{20,}/, label: 'GitHub token', severity: 'high', confidence: 'confirmed' },
  { regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{3,}/i, label: 'Hard-coded password', severity: 'high', confidence: 'probable' },
  { regex: /(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['"]?[^\s'"]{6,}/i, label: 'API key or token', severity: 'high', confidence: 'probable' },
  { regex: /mysql\s+-u\s*\S+\s+-p\S+/i, label: 'Database credentials on a command line', severity: 'medium', confidence: 'probable' },
];

export const credentialKeywordRule: DetectionRule = {
  id: 'credential-keyword',
  category: 'credentials',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];

    for (const line of ctx.allLines) {
      if (!line.text.trim()) continue;
      for (const pattern of PATTERNS) {
        if (pattern.regex.test(line.text)) {
          drafts.push({
            title: pattern.label,
            category: 'credentials',
            severity: pattern.severity,
            confidence: pattern.confidence,
            description: `Line matched a pattern consistent with "${pattern.label.toLowerCase()}".`,
            rationale: 'Credentials or secrets found in scripts, config, or history files can often be reused directly to authenticate as another user or service.',
            evidenceLineIndexes: [line.index],
            tags: ['credentials'],
          });
          break; // one match per line is enough signal
        }
      }
    }

    return drafts;
  },
};
