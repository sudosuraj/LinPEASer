import type { ParseDiagnostic, Scan, Section } from '@/types';
import { generateId } from '@/utils/id';
import type { EnumerationParser } from '../types';
import { buildRawLines } from '../ansi';
import { looksLikeBinary, stripBom } from './preprocess';
import { buildSectionTree } from './structure';
import { extractMetadata } from './metadata';

function detectLinpeas(input: string): number {
  const sample = input.slice(0, 20000).toLowerCase();
  let score = 0;
  if (sample.includes('linpeas')) score += 0.6;
  if (sample.includes('hacktricks')) score += 0.2;
  if (/╣.*╠/.test(sample) || sample.includes('╣')) score += 0.2;
  if (sample.includes('suid') || sample.includes('sudo -l')) score += 0.1;
  return Math.min(score, 1);
}

function countSections(sections: Section[], predicate: (s: Section) => boolean): number {
  let count = 0;
  for (const section of sections) {
    if (predicate(section)) count++;
    count += countSections(section.subsections, predicate);
  }
  return count;
}

function looksTruncated(raw: string): boolean {
  const tail = raw.slice(-200);
  const lastEsc = tail.lastIndexOf('\x1b');
  if (lastEsc === -1) return false;
  return !/[A-Za-z]/.test(tail.slice(lastEsc + 1));
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function parseLinpeas(rawInput: string): Scan {
  const start = now();
  const diagnostics: ParseDiagnostic[] = [];

  const cleaned = stripBom(rawInput);

  if (cleaned.trim().length === 0) {
    diagnostics.push({ level: 'error', message: 'The input was empty — nothing to parse.' });
  } else if (looksLikeBinary(cleaned)) {
    diagnostics.push({
      level: 'warning',
      message: 'This input contains a high proportion of non-text bytes and may not be a plain-text LinPEAS capture.',
    });
  }

  const lines = buildRawLines(cleaned);
  const { sections, diagnostics: structureDiagnostics } = buildSectionTree(lines);
  const { metadata, diagnostics: metadataDiagnostics } = extractMetadata(cleaned);
  diagnostics.push(...structureDiagnostics, ...metadataDiagnostics);

  const truncated = looksTruncated(cleaned);
  if (truncated) {
    diagnostics.push({
      level: 'info',
      message: 'The output appears to end mid-sequence — this scan may be truncated.',
    });
  }

  const recognizedSections = countSections(sections, (s) => !s.isUnrecognized);
  const unrecognizedSections = countSections(sections, (s) => s.isUnrecognized);

  return {
    id: generateId('scan'),
    sourceFormat: 'linpeas',
    metadata,
    sections,
    findings: [],
    rawOutput: cleaned,
    totalLines: lines.length,
    diagnostics,
    stats: {
      totalLines: lines.length,
      recognizedSections,
      unrecognizedSections,
      totalFindings: 0,
      truncated,
      processingTimeMs: now() - start,
    },
  };
}

export const linpeasParser: EnumerationParser = {
  format: 'linpeas',
  label: 'LinPEAS',
  detect: detectLinpeas,
  parse: parseLinpeas,
};
