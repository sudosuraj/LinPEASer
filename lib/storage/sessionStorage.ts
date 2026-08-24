import type { Scan, SessionExport, SessionMeta, SessionRecord, SeverityCountMap } from '@/types';
import { generateId } from '@/utils/id';
import { getDb } from './db';
import { broadcastSessionsChanged } from './broadcast';
import { validateSessionExportJson } from './validateImport';

function emptySeverityCounts(): SeverityCountMap {
  return { critical: 0, high: 0, medium: 0, low: 0, interesting: 0, info: 0 };
}

function computeFindingCounts(scan: Scan): SeverityCountMap {
  const counts = emptySeverityCounts();
  for (const finding of scan.findings) counts[finding.severity]++;
  return counts;
}

function byteSize(text: string): number {
  return typeof Blob !== 'undefined' ? new Blob([text]).size : text.length;
}

function defaultSessionName(scan: Scan): string {
  return scan.metadata.hostname ?? scan.metadata.operatingSystem ?? `Scan — ${new Date().toLocaleString()}`;
}

function buildMeta(id: string, name: string, scan: Scan, createdAt: string, updatedAt: string): SessionMeta {
  return {
    id,
    name,
    createdAt,
    updatedAt,
    hostname: scan.metadata.hostname,
    username: scan.metadata.currentUser,
    operatingSystem: scan.metadata.operatingSystem,
    toolVersion: scan.metadata.toolVersion,
    isRoot: scan.metadata.isRoot,
    findingCounts: computeFindingCounts(scan),
    totalFindings: scan.findings.length,
    totalLines: scan.totalLines,
    sizeBytes: byteSize(scan.rawOutput),
  };
}

async function createSession(scan: Scan, name?: string): Promise<SessionMeta> {
  const db = await getDb();
  const id = generateId('sess');
  const now = new Date().toISOString();
  const meta = buildMeta(id, name?.trim() || defaultSessionName(scan), scan, now, now);

  const tx = db.transaction(['sessionMeta', 'sessionPayload'], 'readwrite');
  await Promise.all([tx.objectStore('sessionMeta').put(meta), tx.objectStore('sessionPayload').put({ id, scan }), tx.done]);

  broadcastSessionsChanged();
  return meta;
}

async function getSession(id: string): Promise<SessionRecord | null> {
  const db = await getDb();
  const [meta, payload] = await Promise.all([db.get('sessionMeta', id), db.get('sessionPayload', id)]);
  if (!meta || !payload) return null;
  return { ...meta, scan: payload.scan };
}

async function getSessionMeta(id: string): Promise<SessionMeta | null> {
  const db = await getDb();
  return (await db.get('sessionMeta', id)) ?? null;
}

async function listSessions(): Promise<SessionMeta[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex('sessionMeta', 'by-updatedAt');
  return all.reverse();
}

async function renameSession(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Session name cannot be empty.');

  const db = await getDb();
  const meta = await db.get('sessionMeta', id);
  if (!meta) throw new Error('Session not found.');

  await db.put('sessionMeta', { ...meta, name: trimmed, updatedAt: new Date().toISOString() });
  broadcastSessionsChanged();
}

async function duplicateSession(id: string): Promise<SessionMeta> {
  const record = await getSession(id);
  if (!record) throw new Error('Session not found.');
  return createSession(record.scan, `${record.name} (copy)`);
}

async function deleteSession(id: string): Promise<void> {
  return deleteSessions([id]);
}

async function deleteSessions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(['sessionMeta', 'sessionPayload'], 'readwrite');
  await Promise.all([
    ...ids.map((id) => tx.objectStore('sessionMeta').delete(id)),
    ...ids.map((id) => tx.objectStore('sessionPayload').delete(id)),
    tx.done,
  ]);
  broadcastSessionsChanged();
}

async function clearAllSessions(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['sessionMeta', 'sessionPayload'], 'readwrite');
  await Promise.all([tx.objectStore('sessionMeta').clear(), tx.objectStore('sessionPayload').clear(), tx.done]);
  broadcastSessionsChanged();
}

async function exportSession(id: string): Promise<SessionExport> {
  const record = await getSession(id);
  if (!record) throw new Error('Session not found.');
  return {
    linpeaserExportVersion: 1,
    exportedAt: new Date().toISOString(),
    session: { name: record.name, createdAt: record.createdAt, updatedAt: record.updatedAt, scan: record.scan },
  };
}

/** Validates, then persists, an exported session JSON as a brand-new session. */
async function importSessionFromJson(json: string): Promise<SessionMeta> {
  const parsed = validateSessionExportJson(json);
  return createSession(parsed.session.scan, `${parsed.session.name} (imported)`);
}

async function estimateStorageUsage(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}

export const sessionStorage = {
  createSession,
  getSession,
  getSessionMeta,
  listSessions,
  renameSession,
  duplicateSession,
  deleteSession,
  deleteSessions,
  clearAllSessions,
  exportSession,
  importSessionFromJson,
  estimateStorageUsage,
};
