import { CONFIDENCE_LEVELS, SEVERITIES } from '@/types';
import type { Scan, Section, SessionExport } from '@/types';

/**
 * Structural validation for imported session JSON. Runs before anything is
 * written to IndexedDB or rendered. Only JSON.parse is ever used on
 * imported content (never eval/Function), and every field is checked
 * against an expected shape — malformed or hostile input is rejected with
 * a clear reason rather than partially trusted.
 */
export class SessionImportError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isBooleanOrNull(value: unknown): value is boolean | null {
  return value === null || typeof value === 'boolean';
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new SessionImportError(message);
}

function validateSection(value: unknown, path: string): asserts value is Section {
  assert(isRecord(value), `${path}: expected an object`);
  assert(typeof value.id === 'string', `${path}.id: expected a string`);
  assert(typeof value.title === 'string', `${path}.title: expected a string`);
  assert(typeof value.level === 'number', `${path}.level: expected a number`);
  assert(Array.isArray(value.lines), `${path}.lines: expected an array`);
  assert(Array.isArray(value.subsections), `${path}.subsections: expected an array`);
  assert(Array.isArray(value.findingIds), `${path}.findingIds: expected an array`);
  assert(Array.isArray(value.path), `${path}.path: expected an array`);
  (value.subsections as unknown[]).forEach((child, i) => validateSection(child, `${path}.subsections[${i}]`));
}

function validateFinding(value: unknown, path: string): void {
  assert(isRecord(value), `${path}: expected an object`);
  assert(typeof value.id === 'string', `${path}.id: expected a string`);
  assert(typeof value.title === 'string', `${path}.title: expected a string`);
  assert(
    typeof value.severity === 'string' && (SEVERITIES as readonly string[]).includes(value.severity),
    `${path}.severity: not a recognized severity level`
  );
  assert(
    typeof value.confidence === 'string' && (CONFIDENCE_LEVELS as readonly string[]).includes(value.confidence),
    `${path}.confidence: not a recognized confidence level`
  );
  assert(Array.isArray(value.evidence), `${path}.evidence: expected an array`);
  assert(Array.isArray(value.tags), `${path}.tags: expected an array`);
}

function validateScan(value: unknown): asserts value is Scan {
  assert(isRecord(value), 'scan: expected an object');
  assert(typeof value.id === 'string', 'scan.id: expected a string');
  assert(typeof value.sourceFormat === 'string', 'scan.sourceFormat: expected a string');
  assert(typeof value.rawOutput === 'string', 'scan.rawOutput: expected a string');
  assert(typeof value.totalLines === 'number', 'scan.totalLines: expected a number');
  assert(Array.isArray(value.sections), 'scan.sections: expected an array');
  assert(Array.isArray(value.findings), 'scan.findings: expected an array');
  assert(Array.isArray(value.diagnostics), 'scan.diagnostics: expected an array');
  assert(isRecord(value.stats), 'scan.stats: expected an object');
  assert(isRecord(value.metadata), 'scan.metadata: expected an object');

  const metadata = value.metadata;
  assert(isStringOrNull(metadata.hostname), 'scan.metadata.hostname: expected a string or null');
  assert(isStringOrNull(metadata.operatingSystem), 'scan.metadata.operatingSystem: expected a string or null');
  assert(isBooleanOrNull(metadata.isRoot), 'scan.metadata.isRoot: expected a boolean or null');

  (value.sections as unknown[]).forEach((s, i) => validateSection(s, `scan.sections[${i}]`));
  (value.findings as unknown[]).forEach((f, i) => validateFinding(f, `scan.findings[${i}]`));
}

export function validateSessionExportJson(json: string): SessionExport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new SessionImportError('This file is not valid JSON.');
  }

  assert(isRecord(parsed), 'Expected a JSON object at the top level.');
  assert(parsed.linpeaserExportVersion === 1, 'Unrecognized export version — this file was not exported by LinPEASer.');
  assert(isRecord(parsed.session), 'session: expected an object');

  const session = parsed.session;
  assert(typeof session.name === 'string' && session.name.trim().length > 0, 'session.name: expected a non-empty string');
  assert(typeof session.createdAt === 'string', 'session.createdAt: expected a string');
  assert(typeof session.updatedAt === 'string', 'session.updatedAt: expected a string');
  validateScan(session.scan);

  return parsed as unknown as SessionExport;
}
