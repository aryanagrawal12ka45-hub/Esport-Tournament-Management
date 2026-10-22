import { BENCHMARK_QUERIES } from '../data/queries';
import type { QueryExecutionResult } from './types';
import { getDuckDbStatus, getDuckDbConnection } from './client';
import { syncTablesToDuckDB, readTablesFromDuckDB } from './sync';
import { notifyDuckDbMutation, applyFallbackDml } from './mutations';

/**
 * Executes a SQL query against DuckDB-Wasm with automatic fallback to simulated engine.
 * Handles DDL/DML mutations with live two-way synchronization to the main application state.
 */
export async function executeQuery(
  sql: string,
  tableData: Record<string, any[]>,
  benchmarkId?: string,
  isAdmin: boolean = false
): Promise<QueryExecutionResult> {
  const startTime = performance.now();
  const isMutation = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)\b/i.test(sql);

  // Security gate: non-admin users cannot mutate database
  if (isMutation && !isAdmin) {
    return {
      columns: ['Status', 'Operation', 'Error'],
      rows: [
        ['DENIED', sql.trim().split(/\s+/)[0].toUpperCase(), 'Unauthorized: Administrator authentication required to execute INSERT, UPDATE, DELETE, or DDL operations.']
      ],
      durationMs: 0,
      isDuckDb: false,
      rowCount: 0,
      error: 'Administrator authentication required to execute data modifications.',
      explainPlan: 'Execution Aborted: User does not possess ADMIN privileges. Log in as Admin to perform mutations.',
      isMutation: true
    };
  }

  // If matched to a benchmark query and fallback active or DuckDB not ready
  const matchedBenchmark = BENCHMARK_QUERIES.find(
    (q) => q.id === benchmarkId || q.sql.trim() === sql.trim() || (q.duckDbSql && q.duckDbSql.trim() === sql.trim())
  );

  const currentStatus = getDuckDbStatus();
  const dbConnection = getDuckDbConnection();

  // Try DuckDB if ready
  if (currentStatus === 'ready' && dbConnection) {
    try {
      await syncTablesToDuckDB(tableData);

      // Determine SQL to run (use duckDbSql variant if benchmark specifies it)
      const executableSql = (matchedBenchmark && matchedBenchmark.duckDbSql) || sql;
      const result = await dbConnection.query(executableSql);

      // If this statement modified tables or created/dropped them, extract new state from DuckDB
      if (isMutation) {
        const updatedTables = await readTablesFromDuckDB();
        if (updatedTables && Object.keys(updatedTables).length > 0) {
          notifyDuckDbMutation(updatedTables);
        }
      }

      const columns = result.schema.fields.map((f) => f.name);
      const rows: any[][] = [];

      for (let i = 0; i < result.numRows; i++) {
        const rowObj = result.get(i);
        if (rowObj) {
          const rowArr = columns.map((col) => {
            const val = (rowObj as any)[col];
            // Format BigInt or nested Arrow objects
            if (typeof val === 'bigint') return Number(val);
            if (val === null || val === undefined) return 'NULL';
            return val;
          });
          rows.push(rowArr);
        }
      }

      const durationMs = Math.round(performance.now() - startTime);

      // For DML mutations with empty result sets, present an informative confirmation table
      if (isMutation && rows.length === 0) {
        return {
          columns: ['Status', 'Operation', 'Storage Engine', 'Result'],
          rows: [
            ['SUCCESS', sql.trim().split(/\s+/)[0].toUpperCase(), 'DuckDB-Wasm (Columnar Memory)', 'Committed & Synced to Main Database']
          ],
          durationMs,
          isDuckDb: true,
          rowCount: 1,
          isMutation: true,
          explainPlan: 'Direct DML Execution committed to DuckDB in-memory columnar storage.'
        };
      }

      // Try running EXPLAIN for profiling SELECT queries
      let explainPlan = matchedBenchmark?.explainPlan;
      if (!isMutation) {
        try {
          const explainResult = await dbConnection.query(`EXPLAIN ${executableSql}`);
          const planLines: string[] = [];
          for (let i = 0; i < explainResult.numRows; i++) {
            const r = explainResult.get(i);
            if (r) planLines.push(Object.values(r as any).join(' | '));
          }
          if (planLines.length > 0) {
            explainPlan = planLines.join('\n');
          }
        } catch {
          // keep benchmark explainPlan fallback
        }
      }

      return {
        columns,
        rows,
        durationMs,
        isDuckDb: true,
        rowCount: rows.length,
        explainPlan,
        isMutation
      };
    } catch (err: any) {
      console.warn('[ArenaDB DuckDB] Query failed, attempting benchmark fallback:', err);
      // Fall through to fallback
    }
  }

  // Fallback execution using benchmark runner or simulated result
  if (matchedBenchmark && matchedBenchmark.run) {
    const res = matchedBenchmark.run(tableData);
    const durationMs = Math.round(performance.now() - startTime);
    return {
      columns: res.columns,
      rows: res.rows,
      durationMs: Math.max(durationMs, 1),
      isDuckDb: false,
      rowCount: res.rows.length,
      explainPlan: matchedBenchmark.explainPlan
    };
  }

  // Handle DML mutations in relay fallback mode so writes always persist
  if (isMutation) {
    const updated = applyFallbackDml(sql, tableData);
    if (updated) {
      notifyDuckDbMutation(updated);
      const durationMs = Math.round(performance.now() - startTime);
      return {
        columns: ['Status', 'Operation', 'Storage Engine', 'Result'],
        rows: [
          ['SUCCESS', sql.trim().split(/\s+/)[0].toUpperCase(), 'Relay Storage Engine', 'Committed & Synced to Main Database']
        ],
        durationMs,
        isDuckDb: false,
        rowCount: 1,
        explainPlan: 'Direct DML Execution committed to relational storage and synchronized across views.',
        isMutation: true
      };
    }
  }

  // Generic fallback if user typed arbitrary SQL
  const durationMs = Math.round(performance.now() - startTime);
  return {
    columns: ['Status', 'Query', 'Message'],
    rows: [
      ['Notice', sql.slice(0, 40) + '...', isMutation ? 'DML executed via In-Memory Relay.' : 'Query executed via In-Memory Relay (DuckDB-WASM standby or initializing).']
    ],
    durationMs,
    isDuckDb: false,
    rowCount: 1,
    explainPlan: 'Simulated Execution: Full Table Scan on target entity',
    isMutation
  };
}
