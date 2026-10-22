import React, { useState } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import { PLSQL_PROGRAMS } from '../data/plsql';
import { HudCard } from './ui/HudCard';
import { StatusPill } from './ui/StatusPill';

export const PlSqlLab: React.FC = () => {
  const { tableData, insertRow, updateRow } = useDatabase();

  const [selectedId, setSelectedId] = useState<string>(PLSQL_PROGRAMS[0].id);
  const [params, setParams] = useState<Record<string, any>>({
    playerId: 'P01',
    teamId: 'TM01',
    matchId: 'M01',
    stageId: 'STG03',
    gameId: 'G01',
    refereeId: 'REF01',
    team1Id: 'TM01',
    team2Id: 'TM02',
    score: 320,
    kills: 24,
    assists: 8,
    deaths: 9,
    latency: 22,
    playerName: 'Sovereign',
    playerCountry: 'Sweden',
    playerRole: 'Duelist',
    isSubstitute: 0,
    actionType: 'Fine',
    penalty: '$2,500 Fine for Comms Violation',
    equipmentId: 'EQ01'
  });

  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    'Connected to: Oracle Database 19c Enterprise Edition Release 19.0.0.0.0',
    'SQL> SET SERVEROUTPUT ON SIZE UNLIMITED;',
    'PL/SQL Lab initialized. Select a package unit or anonymous block and click Execute.'
  ]);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const currentItem = PLSQL_PROGRAMS.find((p) => p.id === selectedId) || PLSQL_PROGRAMS[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentItem.sourceCode(params));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = currentItem.execute(
        params,
        tableData,
        (tbl, row) => insertRow(tbl, row),
        (tbl, pk, fields) => updateRow(tbl, pk, fields)
      );
      setConsoleOutput((prev) => [
        ...prev,
        `\n[${new Date().toLocaleTimeString()}] Executing: ${currentItem.name}...`,
        ...res.output
      ]);
      setIsRunning(false);
    }, 120);
  };

  const handleClearConsole = () => {
    setConsoleOutput([
      'Connected to: Oracle Database 19c Enterprise Edition Release 19.0.0.0.0',
      'SQL> SET SERVEROUTPUT ON SIZE UNLIMITED;'
    ]);
  };

  const handleParamChange = (key: string, val: any) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Code2 className="w-7 h-7 md:w-8 md:h-8 text-accent-token flex-shrink-0" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-token">
              PL/SQL Lab (Oracle 19c Engine)
            </h2>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            Anonymous Blocks, Stored Procedures, Functions & DBMS_OUTPUT Terminal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill variant="primary" size="md">
            ORACLE 19c ENTERPRISE
          </StatusPill>
        </div>
      </div>

      {/* Main Grid: Left Program List, Right Code & Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Program Units (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <HudCard
            title="Program Units"
            subtitle="10 procedural units with DBMS_OUTPUT"
          >
            <div className="space-y-2 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
              {PLSQL_PROGRAMS.map((item) => {
                const isSelected = item.id === selectedId;
                const typeStyle =
                  item.type === 'procedure'
                    ? 'text-primary-token bg-primary-soft border-token'
                    : item.type === 'function'
                    ? 'text-warning-token bg-warning-soft border-token'
                    : 'text-accent-token bg-accent-soft border-token';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer font-mono text-xs ${
                      isSelected
                        ? 'bg-accent-soft border-accent shadow-sm'
                        : 'bg-surface border-token hover:border-token-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-token truncate">
                        {item.name}
                      </span>
                      <span
                        className={`text-xs uppercase px-2 py-0.5 rounded font-bold border ${typeStyle}`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </HudCard>

          {/* Interactive Parameters Configuration */}
          <HudCard title="Execution Parameters" subtitle="Dynamic IN/OUT arguments">
            <div className="space-y-2.5 font-mono text-xs">
              {Object.keys(currentItem.defaultParams).map((paramKey) => (
                <div key={paramKey} className="space-y-1">
                  <label className="text-xs text-muted uppercase block">
                    {paramKey}
                  </label>
                  <input
                    type={typeof currentItem.defaultParams[paramKey] === 'number' ? 'number' : 'text'}
                    value={params[paramKey] ?? currentItem.defaultParams[paramKey]}
                    onChange={(e) =>
                      handleParamChange(
                        paramKey,
                        typeof currentItem.defaultParams[paramKey] === 'number'
                          ? Number(e.target.value)
                          : e.target.value
                      )
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface-2 border border-token text-xs text-token focus:outline-none focus:border-accent-token"
                  />
                </div>
              ))}
            </div>
          </HudCard>
        </div>

        {/* Right Column: Source Viewer & DBMS_OUTPUT Terminal (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Source Code Card */}
          <HudCard
            title={currentItem.title}
            subtitle={currentItem.description}
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-surface-2 border border-token hover:border-token-strong font-mono text-xs text-token transition-colors cursor-pointer shadow-sm"
                  title="Copy PL/SQL Source"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success-token" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary-hover disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Execute Unit'}</span>
                </button>
              </div>
            }
          >
            <div className="rounded-lg border border-token bg-surface-2 p-3">
              <pre className="font-mono text-xs text-token overflow-x-auto max-h-[320px] custom-scrollbar whitespace-pre">
                {currentItem.sourceCode(params)}
              </pre>
            </div>
          </HudCard>

          {/* DBMS_OUTPUT Terminal Console */}
          <HudCard
            title="DBMS_OUTPUT Terminal"
            subtitle="Emulated Oracle SQL*Plus Session Console"
            action={
              <button
                type="button"
                onClick={handleClearConsole}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-2 border border-token hover:border-token-strong font-mono text-xs text-muted hover:text-token transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            }
          >
            <div className="rounded-lg border border-token bg-surface-2 p-4 min-h-[220px] max-h-[340px] overflow-y-auto custom-scrollbar font-mono text-xs text-success-token space-y-1 shadow-inner">
              {consoleOutput.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          </HudCard>
        </div>
      </div>
    </div>
  );
};
