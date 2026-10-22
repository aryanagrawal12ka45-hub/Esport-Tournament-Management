import type { DuckDBMutationListener } from './types';
import { getDuckDbStatus, getDuckDbConnection } from './client';
import { readTablesFromDuckDB, setLastLoadedDataHash } from './sync';

let mutationListeners: DuckDBMutationListener[] = [];

export function subscribeDuckDbMutation(listener: DuckDBMutationListener): () => void {
  mutationListeners.push(listener);
  return () => {
    mutationListeners = mutationListeners.filter((l) => l !== listener);
  };
}

export function notifyDuckDbMutation(updatedTables: Record<string, any[]>): void {
  const hash = Object.keys(updatedTables)
    .map((k) => `${k}:${updatedTables[k]?.length || 0}`)
    .join('|');
  setLastLoadedDataHash(hash);
  mutationListeners.forEach((l) => l(updatedTables));
}

/**
 * Executes a DML/DDL mutation SQL directly in DuckDB and notifies listeners.
 */
export async function executeDmlInDuckDB(sql: string): Promise<Record<string, any[]> | null> {
  const currentStatus = getDuckDbStatus();
  const dbConnection = getDuckDbConnection();

  if (currentStatus === 'ready' && dbConnection) {
    try {
      await dbConnection.query(sql);
      const updatedTables = await readTablesFromDuckDB();
      if (updatedTables && Object.keys(updatedTables).length > 0) {
        notifyDuckDbMutation(updatedTables);
        return updatedTables;
      }
    } catch (err) {
      console.warn('[ArenaDB DuckDB] Direct DML execution caught error:', err);
    }
  }
  return null;
}

/**
 * Fallback parser and executor for basic DML statements (INSERT, UPDATE, DELETE).
 * Ensures writes are committed even when WASM workers are in standby.
 */
export function applyFallbackDml(sql: string, tableData: Record<string, any[]>): Record<string, any[]> | null {
  const clean = sql.trim().replace(/;+$/, '');

  // INSERT INTO tableName (cols...) VALUES (vals...)
  const insertMatch = clean.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*(?:\(([^)]+)\))?\s*VALUES\s*\((.+)\)/i);
  if (insertMatch) {
    const tableName = insertMatch[1].toUpperCase();
    const cols = insertMatch[2] ? insertMatch[2].split(',').map((c) => c.trim().replace(/^["']|["']$/g, '')) : null;
    const rawVals = insertMatch[3].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const rows = tableData[tableName] || [];
    const newRecord: Record<string, any> = {};

    if (cols) {
      cols.forEach((col, idx) => {
        const val = rawVals[idx];
        newRecord[col] = !isNaN(Number(val)) && val !== '' ? Number(val) : val;
      });
    } else {
      const sample = rows[0] || {};
      const sampleKeys = Object.keys(sample);
      sampleKeys.forEach((key, idx) => {
        const val = rawVals[idx];
        newRecord[key] = !isNaN(Number(val)) && val !== '' ? Number(val) : val;
      });
    }

    return {
      ...tableData,
      [tableName]: [newRecord, ...rows]
    };
  }

  // UPDATE tableName SET ... WHERE ...
  const updateMatch = clean.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
  if (updateMatch) {
    const tableName = updateMatch[1].toUpperCase();
    const setClause = updateMatch[2];
    const whereClause = updateMatch[3];
    const rows = tableData[tableName] || [];

    const assignments: Record<string, any> = {};
    setClause.split(',').forEach((part) => {
      const [col, val] = part.split('=').map((p) => p.trim());
      if (col && val !== undefined) {
        const cleanCol = col.replace(/^["']|["']$/g, '');
        const cleanVal = val.replace(/^["']|["']$/g, '');
        assignments[cleanCol] = !isNaN(Number(cleanVal)) && cleanVal !== '' ? Number(cleanVal) : cleanVal;
      }
    });

    return {
      ...tableData,
      [tableName]: rows.map((r) => {
        if (whereClause) {
          const [wCol, wVal] = whereClause.split('=').map((p) => p.trim().replace(/^["']|["']$/g, ''));
          if (String(r[wCol]) !== String(wVal)) return r;
        }
        return { ...r, ...assignments };
      })
    };
  }

  // DELETE FROM tableName WHERE ...
  const deleteMatch = clean.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
  if (deleteMatch) {
    const tableName = deleteMatch[1].toUpperCase();
    const whereClause = deleteMatch[2];
    const rows = tableData[tableName] || [];
    if (!whereClause) {
      return { ...tableData, [tableName]: [] };
    }
    const [wCol, wVal] = whereClause.split('=').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    return {
      ...tableData,
      [tableName]: rows.filter((r) => String(r[wCol]) !== String(wVal))
    };
  }

  return null;
}
