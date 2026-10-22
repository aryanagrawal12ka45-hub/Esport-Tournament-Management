import * as duckdb from '@duckdb/duckdb-wasm';
import type { DuckDBStatus } from './types';

let dbInstance: duckdb.AsyncDuckDB | null = null;
let dbConnection: duckdb.AsyncDuckDBConnection | null = null;
let currentStatus: DuckDBStatus = 'uninitialized';
let statusListeners: ((status: DuckDBStatus) => void)[] = [];

export function getDuckDbStatus(): DuckDBStatus {
  return currentStatus;
}

export function getDuckDbInstance(): duckdb.AsyncDuckDB | null {
  return dbInstance;
}

export function getDuckDbConnection(): duckdb.AsyncDuckDBConnection | null {
  return dbConnection;
}

export function subscribeDuckDbStatus(listener: (status: DuckDBStatus) => void): () => void {
  statusListeners.push(listener);
  listener(currentStatus);
  return () => {
    statusListeners = statusListeners.filter((l) => l !== listener);
  };
}

export function updateDuckDbStatus(status: DuckDBStatus): void {
  currentStatus = status;
  statusListeners.forEach((l) => l(status));
}

/**
 * Initializes DuckDB-Wasm instance using jsDelivr CDN bundles.
 * Falls back safely if Web Workers or WebAssembly are restricted.
 */
export async function initDuckDB(): Promise<duckdb.AsyncDuckDB | null> {
  if (dbInstance && dbConnection) {
    return dbInstance;
  }

  if (currentStatus === 'loading') {
    // Wait until initialized or fallback
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (currentStatus !== 'loading') {
          clearInterval(check);
          resolve(dbInstance);
        }
      }, 100);
    });
  }

  updateDuckDbStatus('loading');

  try {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' })
    );

    const worker = new Worker(workerUrl);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(workerUrl);

    const conn = await db.connect();
    dbInstance = db;
    dbConnection = conn;
    updateDuckDbStatus('ready');
    return dbInstance;
  } catch (err) {
    console.warn('[ArenaDB DuckDB-Wasm] Failed to initialize WASM worker, falling back to simulated engine:', err);
    updateDuckDbStatus('fallback');
    return null;
  }
}
