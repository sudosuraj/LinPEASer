import { CONFIDENCE_WEIGHT, SEVERITY_WEIGHT } from '@/types';
import type { Finding, ParseDiagnostic, Scan } from '@/types';
import { generateId } from '@/utils/id';
import { collectAllLines, findSectionForLine, flattenSections } from '@/lib/parser';
import { allDetectionRules } from '@/lib/detection';
import type { AnalysisContext } from '@/lib/detection';
import { dedupeFindings } from './dedupe';

function buildContext(scan: Scan): AnalysisContext {
  return {
    scan,
    allLines: collectAllLines(scan.sections),
    flatSections: flattenSections(scan.sections),
  };
}

/**
 * Runs every registered detection rule against the parsed scan and returns
 * finalized, sorted Findings. Mutates scan.sections to record which
 * findings originated in which section (used for sidebar counts).
 */
export function runAnalysis(scan: Scan): { findings: Finding[]; diagnostics: ParseDiagnostic[] } {
  const ctx = buildContext(scan);
  const diagnostics: ParseDiagnostic[] = [];
  const drafted: Finding[] = [];

  for (const rule of allDetectionRules) {
    try {
      const drafts = rule.evaluate(ctx);
      for (const draft of drafts) {
        const firstLine = draft.evidenceLineIndexes[0];
        const section = firstLine !== undefined ? findSectionForLine(scan.sections, firstLine) : null;

        drafted.push({
          id: generateId('finding'),
          title: draft.title,
          category: draft.category,
          severity: draft.severity,
          confidence: draft.confidence,
          sectionId: section?.id ?? null,
          sectionPath: section?.path ?? [],
          evidence: draft.evidenceLineIndexes.map((idx) => ({
            lineIndex: idx,
            text: ctx.allLines[idx]?.text ?? '',
          })),
          description: draft.description,
          rationale: draft.rationale,
          context: draft.context,
          tags: draft.tags ?? [],
          ruleId: rule.id,
        });
      }
    } catch (error) {
      diagnostics.push({
        level: 'warning',
        message: `Detection rule "${rule.id}" failed and was skipped: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const findings = dedupeFindings(drafted).sort((a, b) => {
    const severityDelta = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (severityDelta !== 0) return severityDelta;
    return CONFIDENCE_WEIGHT[b.confidence] - CONFIDENCE_WEIGHT[a.confidence];
  });

  for (const finding of findings) {
    if (!finding.sectionId) continue;
    const section = ctx.flatSections.find((s) => s.id === finding.sectionId);
    section?.findingIds.push(finding.id);
  }

  return { findings, diagnostics };
}
