import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Search,
  History,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import { BENCHMARK_QUERIES } from '../data/queries';
import type { SQLBenchmarkQuery } from '../data/queries';
import { executeQuery, type QueryExecutionResult } from '../duckdb';
import { HudCard } from './ui/HudCard';
import { StatusPill } from './ui/StatusPill';

export const QueryLab: React.FC = () => {
  const { tableData, duckDbStatus, selectedBenchmarkId, setSelectedBenchmarkId } = useDatabase();

  const currentBenchmark =
    BENCHMARK_QUERIES.find((q) => q.id.toLowerCase() === (selectedBenchmarkId || '').toLowerCase()) || BENCHMARK_QUERIES[0];

  const [editorSql, setEditorSql] = useState<string>(currentBenchmark.sql);
  const [activeTab, setActiveTab] = useState<'results' | 'explain'>('results');
  const [querySearch, setQuerySearch] = useState('');
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedResults, setCopiedResults] = useState(false);

  const [executionResult, setExecutionResult] = useState<QueryExecutionResult | null>(null);

  const handleRunQuery = async (sqlToRun?: string, benchId?: string) => {
    const targetSql = sqlToRun || editorSql;
    setIsRunning(true);

    try {
      const res = await executeQuery(targetSql, tableData, benchId || selectedBenchmarkId);
      setExecutionResult(res);

      // Add to history
      setQueryHistory((prev) => [
        targetSql.slice(0, 50) + (targetSql.length > 50 ? '...' : ''),
        ...prev.filter((h) => h !== targetSql).slice(0, 9)
      ]);
    } catch (err: any) {
      setExecutionResult({
        columns: ['Error'],
        rows: [[err.message || 'Query execution error']],
        durationMs: 0,
        isDuckDb: false,
        rowCount: 0,
        error: err.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Execute benchmark on mount or selection, and keep editorSql in sync
  useEffect(() => {
    setEditorSql(currentBenchmark.sql);
    handleRunQuery(currentBenchmark.sql, currentBenchmark.id);
  }, [selectedBenchmarkId]);

  const handleSelectBenchmark = (bench: SQLBenchmarkQuery) => {
    setSelectedBenchmarkId(bench.id);
    setEditorSql(bench.sql);
  };

  const handleCopyResultsCsv = () => {
    if (!executionResult || executionResult.rows.length === 0) return;
    const lines = [executionResult.columns.join(',')];
    executionResult.rows.forEach((r) => {
      lines.push(
        r
          .map((v) => `"${String(v !== undefined && v !== null ? v : '').replace(/"/g, '""')}"`)
          .join(',')
      );
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedResults(true);
    setTimeout(() => setCopiedResults(false), 2000);
  };

  const filteredBenchmarks = BENCHMARK_QUERIES.filter(
    (b) =>
      b.name.toLowerCase().includes(querySearch.toLowerCase()) ||
      b.category.toLowerCase().includes(querySearch.toLowerCase()) ||
      b.featureTag.toLowerCase().includes(querySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Terminal className="w-7 h-7 md:w-8 md:h-8 text-primary-token flex-shrink-0" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-token">
              Query Lab & DuckDB Database
            </h2>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            Primary In-Browser Columnar Database & Analytics Engine • Real-time SQL DDL/DML Mutations • 11 Analytical Benchmarks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill
            variant={duckDbStatus === 'ready' ? 'success' : 'primary'}
            size="md"
          >
            {duckDbStatus === 'ready'
              ? 'DUCKDB-WASM MAIN DATABASE'
              : duckDbStatus === 'loading'
              ? 'DUCKDB INITIALIZING'
              : 'ENGINE RELAY FALLBACK'}
          </StatusPill>
        </div>
      </div>

      {/* Two-Pane IDE Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Query Benchmarks & History (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <HudCard
            title="Benchmark Repository"
            subtitle="11 enterprise queries across 4 categories"
          >
            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted" />
              <input
                type="text"
                placeholder="Search benchmark queries..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-2 border border-token font-mono text-xs text-token placeholder-muted focus:outline-none focus:border-primary-token"
              />
            </div>

            {/* Query Card List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {filteredBenchmarks.map((bench) => {
                const isSelected = bench.id === selectedBenchmarkId;
                return (
                  <div
                    key={bench.id}
                    onClick={() => handleSelectBenchmark(bench)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer font-mono text-xs ${
                      isSelected
                        ? 'bg-primary-soft border-primary shadow-sm'
                        : 'bg-surface border-token hover:border-token-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-token truncate">
                        {bench.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-primary-token border border-token font-semibold flex-shrink-0">
                        {bench.featureTag}
                      </span>
                    </div>
                    <p className="text-xs text-muted line-clamp-2">
                      {bench.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </HudCard>

          {/* History Snippets */}
          {queryHistory.length > 0 && (
            <HudCard title="Recent Queries" subtitle="Execution history">
              <div className="space-y-1.5 font-mono text-xs">
                {queryHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-surface-2 text-muted truncate flex items-center gap-2 border border-token"
                  >
                    <History className="w-3.5 h-3.5 text-primary-token flex-shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </HudCard>
          )}
        </div>

        {/* Right Pane: SQL Editor & Results Profiler (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* SQL Editor Card */}
          <HudCard
            title={currentBenchmark.name}
            subtitle={currentBenchmark.description}
            badge={
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent-soft text-accent-token border border-token font-bold">
                {currentBenchmark.category}
              </span>
            }
          >
            {/* Textarea Editor */}
            <div className="relative rounded-lg overflow-hidden border border-token bg-surface-2">
              <textarea
                value={editorSql}
                onChange={(e) => setEditorSql(e.target.value)}
                rows={7}
                className="w-full p-3 bg-transparent text-token font-mono text-xs focus:outline-none resize-y custom-scrollbar"
                placeholder="Enter SQL Query (SELECT, JOIN, GROUP BY, WINDOW, DDL)..."
              />
            </div>

            {/* Run Bar */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-muted">
                <Clock className="w-3.5 h-3.5 text-primary-token" />
                <span>
                  Execution Time:{' '}
                  <strong className="text-token">
                    {executionResult ? `${executionResult.durationMs}ms` : '--'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Rows:{' '}
                  <strong className="text-token">
                    {executionResult ? executionResult.rowCount : 0}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setEditorSql(
                      "INSERT INTO TEAM (TeamID, Name, ShortTag, Region, Coach, Captain, ELO, Wins, Losses)\nVALUES ('T17', 'Sentinels Nova', 'NOVA', 'Americas', 'kaplan', 'zekken', 1780, 14, 5);"
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg font-mono text-[11px] bg-surface-2 text-primary-token border border-token hover:border-primary-token transition-colors cursor-pointer"
                  title="Load sample INSERT statement into editor"
                >
                  + Sample INSERT
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditorSql(
                      "UPDATE TEAM SET ELO = ELO + 50, Wins = Wins + 1 WHERE TeamID = 'T01';"
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg font-mono text-[11px] bg-surface-2 text-accent-token border border-token hover:border-accent-token transition-colors cursor-pointer"
                  title="Load sample UPDATE statement into editor"
                >
                  ✎ Sample UPDATE
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSql(currentBenchmark.sql)}
                  className="px-3 py-1.5 rounded-lg font-mono text-xs text-muted hover:text-token border border-transparent hover:border-token transition-colors cursor-pointer"
                >
                  Reset SQL
                </button>
                <button
                  type="button"
                  onClick={() => handleRunQuery()}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Execute Query'}</span>
                </button>
              </div>
            </div>
          </HudCard>

          {/* Results & Execution Profiler Card */}
          <HudCard
            action={
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-surface-2 p-0.5 border border-token">
                  <button
                    type="button"
                    onClick={() => setActiveTab('results')}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                      activeTab === 'results'
                        ? 'bg-surface text-primary-token font-bold shadow-sm'
                        : 'text-muted hover:text-token'
                    }`}
                  >
                    Results Table ({executionResult?.rowCount ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('explain')}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                      activeTab === 'explain'
                        ? 'bg-surface text-accent-token font-bold shadow-sm'
                        : 'text-muted hover:text-token'
                    }`}
                  >
                    EXPLAIN Plan
                  </button>
                </div>

                {activeTab === 'results' && executionResult && executionResult.rows.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyResultsCsv}
                    className="p-1.5 rounded-lg bg-surface-2 border border-token hover:border-token-strong font-mono text-xs text-token transition-colors cursor-pointer shadow-sm"
                    title="Copy CSV to clipboard"
                  >
                    {copiedResults ? (
                      <Check className="w-3.5 h-3.5 text-success-token" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            }
          >
            {/* Live Mutation Banner */}
            {executionResult?.isMutation && (
              <div className="mb-3 p-3 rounded-lg bg-success-soft border border-success-token text-xs font-mono text-success-token flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold">Committed directly to DuckDB-Wasm Tables:</span>
                  <span className="ml-1 opacity-90">All changes persisted to browser storage and synchronized live across Data Vault, Command Center, and Bracket.</span>
                </div>
              </div>
            )}
            {activeTab === 'results' ? (
              <div className="overflow-x-auto max-h-[380px] custom-scrollbar border border-token rounded-lg">
                {!executionResult ? (
                  <div className="py-12 text-center text-xs font-mono text-muted">
                    Click "Execute Query" to run.
                  </div>
                ) : executionResult.error ? (
                  <div className="p-4 text-xs font-mono text-danger-token bg-danger-soft border border-danger-token">
                    {executionResult.error}
                  </div>
                ) : executionResult.rows.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-muted">
                    0 rows returned.
                  </div>
                ) : (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="bg-surface-2 border-b border-token text-muted uppercase">
                        {executionResult.columns.map((col, idx) => (
                          <th key={idx} className="py-2 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-token">
                      {executionResult.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="hover:bg-surface-2 transition-colors"
                        >
                          {row.map((val, cIdx) => (
                            <td
                              key={cIdx}
                              className="py-2 px-3 whitespace-nowrap text-token"
                            >
                              {val !== undefined && val !== null ? String(val) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              /* EXPLAIN Plan Viewer */
              <div className="rounded-lg border border-token bg-surface-2 p-3">
                <pre className="font-mono text-xs text-accent-token overflow-x-auto max-h-[360px] custom-scrollbar whitespace-pre">
                  {executionResult?.explainPlan ||
                    currentBenchmark.explainPlan ||
                    'EXPLAIN plan not available for custom ad-hoc query.'}
                </pre>
              </div>
            )}
          </HudCard>
        </div>
      </div>
    </div>
  );
};
