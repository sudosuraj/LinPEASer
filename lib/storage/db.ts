import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SessionMeta, SessionPayload } from '@/types';

const DB_NAME = 'linpeaser-db';
const DB_VERSION = 1;

interface LinpeaserDB extends DBSchema {
  sessionMeta: {
    key: string;
    value: SessionMeta;
    indexes: { 'by-updatedAt': string };
  };
  sessionPayload: {
    key: string;
    value: SessionPayload;
  };
}

let dbPromise: Promise<IDBPDatabase<LinpeaserDB>> | null = null;

/**
 * Opens (and memoizes) the LinPEASer IndexedDB database.
 *
 * Schema is versioned so future changes can migrate existing records rather
 * than dropping them: add a new `if (oldVersion < N)` block to `upgrade`
 * for each schema revision, bump DB_VERSION, and leave earlier blocks in
 * place so a browser on an old version migrates through each step in turn.
 */
export function getDb(): Promise<IDBPDatabase<LinpeaserDB>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this browser — session storage is disabled.'));
  }
  if (!dbPromise) {
    dbPromise = openDB<LinpeaserDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const metaStore = db.createObjectStore('sessionMeta', { keyPath: 'id' });
          metaStore.createIndex('by-updatedAt', 'updatedAt');
          db.createObjectStore('sessionPayload', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}
