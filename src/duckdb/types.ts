export type DuckDBStatus = 'uninitialized' | 'loading' | 'ready' | 'fallback' | 'error';

export type DuckDBMutationListener = (updatedTables: Record<string, any[]>) => void;

export interface QueryExecutionResult {
  columns: string[];
  rows: any[][];
  durationMs: number;
  isDuckDb: boolean;
  rowCount: number;
  error?: string;
  explainPlan?: string;
  isMutation?: boolean;
}
