import type { AnalysisContext, DetectionRule, FindingDraft } from './types';

const CVE_RE = /\bCVE-\d{4}-\d{4,7}\b/;

export const kernelInfoRule: DetectionRule = {
  id: 'kernel-version-info',
  category: 'kernel',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];
    const kernel = ctx.scan.metadata.kernelVersion;
    if (!kernel) return drafts;

    const line = ctx.allLines.find((l) => l.text.includes(kernel));
    drafts.push({
      title: `Kernel version: ${kernel}`,
      category: 'kernel',
      severity: 'info',
      confidence: 'confirmed',
      description: `Detected kernel version ${kernel}.`,
      rationale: 'LinPEASer does not maintain a kernel CVE database — cross-reference this version against current advisories or a dedicated exploit-suggester run before relying on it.',
      evidenceLineIndexes: line ? [line.index] : [],
      tags: ['kernel', 'inventory'],
    });

    return drafts;
  },
};

/**
 * Surfaces CVE identifiers that LinPEAS's own embedded exploit-suggester
 * output already printed, without independently judging exploitability.
 */
export const exploitSuggesterRule: DetectionRule = {
  id: 'exploit-suggester-output',
  category: 'kernel',
  evaluate(ctx: AnalysisContext): FindingDraft[] {
    const drafts: FindingDraft[] = [];
    const exploitSections = ctx.flatSections.filter((s) => s.kind === 'exploits');
    if (exploitSections.length === 0) return drafts;

    for (const section of exploitSections) {
      for (const line of section.lines) {
        const m = line.text.match(CVE_RE);
        if (!m) continue;
        drafts.push({
          title: `Possible kernel/software exploit referenced: ${m[0]}`,
          category: 'kernel',
          severity: 'medium',
          confidence: 'possible',
          description: `LinPEAS's exploit-suggester output referenced ${m[0]}.`,
          rationale: 'This identifier was surfaced by an embedded exploit-suggester tool, not independently verified here — confirm applicability against the exact kernel/package version before relying on it.',
          evidenceLineIndexes: [line.index],
          tags: ['kernel', 'exploit-candidate'],
        });
      }
    }

    return drafts;
  },
};
