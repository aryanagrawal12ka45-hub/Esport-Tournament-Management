import { getDuckDbInstance, getDuckDbConnection } from './client';

let lastLoadedDataHash: string = '';

export function getLastLoadedDataHash(): string {
  return lastLoadedDataHash;
}

export function setLastLoadedDataHash(hash: string): void {
  lastLoadedDataHash = hash;
}

/**
 * Ingests in-memory table records into DuckDB as relational tables.
 */
export async function syncTablesToDuckDB(tableData: Record<string, any[]>): Promise<void> {
  const dbInstance = getDuckDbInstance();
  const dbConnection = getDuckDbConnection();
  if (!dbInstance || !dbConnection) return;

  const currentHash = Object.keys(tableData)
    .map((k) => `${k}:${tableData[k]?.length || 0}`)
    .join('|');

  if (currentHash === lastLoadedDataHash) return;

  try {
    for (const [tableName, rows] of Object.entries(tableData)) {
      if (!rows || rows.length === 0) continue;
      const fileName = `${tableName.toLowerCase()}.json`;
      const jsonContent = JSON.stringify(rows);
      await dbInstance.registerFileText(fileName, jsonContent);
      await dbConnection.query(`CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM read_json_auto('${fileName}')`);
    }
    lastLoadedDataHash = currentHash;
  } catch (err) {
    console.warn('[ArenaDB DuckDB-Wasm] Table sync error:', err);
  }
}

/**
 * Reads all active relational tables directly from DuckDB back into object form.
 */
export async function readTablesFromDuckDB(): Promise<Record<string, any[]> | null> {
  const dbConnection = getDuckDbConnection();
  if (!dbConnection) return null;
  try {
    const tableListResult = await dbConnection.query('SHOW TABLES');
    const tableNames: string[] = [];
    for (let i = 0; i < tableListResult.numRows; i++) {
      const row = tableListResult.get(i);
      if (row) {
        const name = Object.values(row)[0];
        if (typeof name === 'string') {
          tableNames.push(name);
        }
      }
    }

    const data: Record<string, any[]> = {};
    for (const tableName of tableNames) {
      const queryResult = await dbConnection.query(`SELECT * FROM "${tableName}"`);
      const cols = queryResult.schema.fields.map((f) => f.name);
      const rows: any[] = [];
      for (let i = 0; i < queryResult.numRows; i++) {
        const rowObj = queryResult.get(i);
        if (rowObj) {
          const item: Record<string, any> = {};
          cols.forEach((col) => {
            const val = (rowObj as any)[col];
            item[col] = typeof val === 'bigint' ? Number(val) : val;
          });
          rows.push(item);
        }
      }
      data[tableName] = rows;
    }
    return data;
  } catch (err) {
    console.warn('[ArenaDB DuckDB] Failed to read tables from DuckDB:', err);
    return null;
  }
}
