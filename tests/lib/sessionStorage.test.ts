import { beforeEach, describe, expect, it } from 'vitest';
import { buildScan } from '@/lib/scan';
import { sessionStorage } from '@/lib/storage/sessionStorage';
import { validateSessionExportJson, SessionImportError } from '@/lib/storage/validateImport';
import { SAMPLE_SCAN_TEXT } from '@/lib/sampleScan';

async function resetDatabase() {
  await sessionStorage.clearAllSessions();
}

beforeEach(async () => {
  await resetDatabase();
});

describe('sessionStorage CRUD', () => {
  it('creates a session and derives metadata from the scan', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const meta = await sessionStorage.createSession(scan);

    expect(meta.id).toBeTruthy();
    expect(meta.hostname).toBe('sample-target');
    expect(meta.username).toBe('carol');
    expect(meta.totalFindings).toBe(scan.findings.length);
    expect(meta.findingCounts.critical).toBeGreaterThan(0);
  });

  it('uses a custom name when provided, else derives one', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const named = await sessionStorage.createSession(scan, 'My Custom Name');
    expect(named.name).toBe('My Custom Name');

    const unnamed = await sessionStorage.createSession(scan);
    expect(unnamed.name).toBe('sample-target');
  });

  it('reads back the full session record including the parsed scan', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const meta = await sessionStorage.createSession(scan, 'Readable');
    const record = await sessionStorage.getSession(meta.id);

    expect(record).not.toBeNull();
    expect(record!.scan.findings.length).toBe(scan.findings.length);
    expect(record!.scan.rawOutput).toBe(scan.rawOutput);
  });

  it('returns null for a session that does not exist', async () => {
    expect(await sessionStorage.getSession('sess_does_not_exist')).toBeNull();
  });

  it('lists sessions most-recently-updated first', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const first = await sessionStorage.createSession(scan, 'First');
    await new Promise((r) => setTimeout(r, 2));
    const second = await sessionStorage.createSession(scan, 'Second');

    const list = await sessionStorage.listSessions();
    expect(list[0].id).toBe(second.id);
    expect(list[1].id).toBe(first.id);
  });

  it('renames a session', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const meta = await sessionStorage.createSession(scan, 'Original');
    await sessionStorage.renameSession(meta.id, '  Renamed  ');

    const updated = await sessionStorage.getSessionMeta(meta.id);
    expect(updated!.name).toBe('Renamed');
  });

  it('rejects renaming to an empty name', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const meta = await sessionStorage.createSession(scan, 'Original');
    await expect(sessionStorage.renameSession(meta.id, '   ')).rejects.toThrow();
  });

  it('duplicates a session as an independent copy', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const original = await sessionStorage.createSession(scan, 'Original');
    const copy = await sessionStorage.duplicateSession(original.id);

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toContain('copy');

    await sessionStorage.deleteSession(original.id);
    const copyStillThere = await sessionStorage.getSession(copy.id);
    expect(copyStillThere).not.toBeNull();
  });

  it('deletes a single session without affecting others (isolation)', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const a = await sessionStorage.createSession(scan, 'A');
    const b = await sessionStorage.createSession(scan, 'B');

    await sessionStorage.deleteSession(a.id);

    expect(await sessionStorage.getSession(a.id)).toBeNull();
    expect(await sessionStorage.getSession(b.id)).not.toBeNull();
  });

  it('bulk-deletes multiple sessions', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const a = await sessionStorage.createSession(scan, 'A');
    const b = await sessionStorage.createSession(scan, 'B');
    const c = await sessionStorage.createSession(scan, 'C');

    await sessionStorage.deleteSessions([a.id, b.id]);

    const remaining = await sessionStorage.listSessions();
    expect(remaining.map((s) => s.id)).toEqual([c.id]);
  });

  it('clears all sessions', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    await sessionStorage.createSession(scan, 'A');
    await sessionStorage.createSession(scan, 'B');

    await sessionStorage.clearAllSessions();
    expect(await sessionStorage.listSessions()).toEqual([]);
  });

  it('persists data in the underlying IndexedDB store, not just JS memory', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const meta = await sessionStorage.createSession(scan, 'Persisted');

    // Bypass our module's cached connection and read the raw database directly,
    // simulating a fresh page load opening a brand-new connection.
    const raw = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('linpeaser-db');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const tx = raw.transaction('sessionMeta', 'readonly');
    const record = await new Promise((resolve, reject) => {
      const r = tx.objectStore('sessionMeta').get(meta.id);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    raw.close();

    expect(record).toMatchObject({ id: meta.id, name: 'Persisted' });
  });

  it('handles a large session without error', async () => {
    const bigLines = Array.from({ length: 4000 }, (_, i) => `-rw-r--r-- 1 root root 10 Jan 1 2024 /var/log/app/file-${i}.log`);
    const bigInput = `${SAMPLE_SCAN_TEXT}\n${bigLines.join('\n')}`;
    const scan = buildScan(bigInput);

    const meta = await sessionStorage.createSession(scan, 'Large');
    expect(meta.totalLines).toBeGreaterThan(4000);

    const record = await sessionStorage.getSession(meta.id);
    expect(record!.scan.totalLines).toBe(scan.totalLines);
  });
});

describe('session export/import', () => {
  it('round-trips a session through export and import', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const original = await sessionStorage.createSession(scan, 'Exportable');
    const exported = await sessionStorage.exportSession(original.id);

    expect(exported.linpeaserExportVersion).toBe(1);
    expect(exported.session.scan.findings.length).toBe(scan.findings.length);

    const imported = await sessionStorage.importSessionFromJson(JSON.stringify(exported));
    expect(imported.id).not.toBe(original.id);
    expect(imported.totalFindings).toBe(original.totalFindings);
  });

  it('rejects invalid JSON', async () => {
    await expect(sessionStorage.importSessionFromJson('{ not valid json')).rejects.toThrow();
  });

  it('rejects well-formed JSON with the wrong shape', async () => {
    await expect(sessionStorage.importSessionFromJson(JSON.stringify({ hello: 'world' }))).rejects.toThrow();
  });

  it('rejects an export with an unrecognized version', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const bad = { linpeaserExportVersion: 99, session: { name: 'x', createdAt: '', updatedAt: '', scan } };
    expect(() => validateSessionExportJson(JSON.stringify(bad))).toThrow(SessionImportError);
  });

  it('rejects a finding with an invalid severity value (corrupted data)', async () => {
    const scan = buildScan(SAMPLE_SCAN_TEXT);
    const corrupted = {
      linpeaserExportVersion: 1,
      exportedAt: new Date().toISOString(),
      session: {
        name: 'Corrupted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scan: { ...scan, findings: [{ ...scan.findings[0], severity: 'apocalyptic' }] },
      },
    };
    expect(() => validateSessionExportJson(JSON.stringify(corrupted))).toThrow(SessionImportError);
  });

  it('never executes content from imported data (JSON.parse only)', async () => {
    const maliciousLookingButHarmless = JSON.stringify({
      linpeaserExportVersion: 1,
      session: { name: '<img src=x onerror=alert(1)>', createdAt: 'x', updatedAt: 'x', scan: null },
    });
    // Should fail validation (scan is not an object), never throw from executing the string.
    await expect(sessionStorage.importSessionFromJson(maliciousLookingButHarmless)).rejects.toThrow();
  });
});
