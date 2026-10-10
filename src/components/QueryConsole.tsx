import React, { useState } from 'react';
import { BENCHMARK_QUERIES, type SQLBenchmarkQuery } from '../data/databaseData';
import { Play, Terminal, Clock, Copy, Check, Cpu } from 'lucide-react';

export const QueryConsole: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<SQLBenchmarkQuery>(BENCHMARK_QUERIES[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
    }, 280);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedQuery.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 60px)',
        backgroundColor: '#000000',
        overflow: 'hidden'
      }}
    >
      {/* Left Sidebar: Query Presets */}
      <div
        style={{
          width: 320,
          borderRight: '1px solid var(--border)',
          backgroundColor: '#08080a',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 11.5, fontWeight: 600 }}>
            <Terminal size={13} style={{ color: 'var(--accent-silver)' }} />
            Analytical Query Benchmarks ({BENCHMARK_QUERIES.length})
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          {BENCHMARK_QUERIES.map((q) => {
            const isSelected = q.id === selectedQuery.id;
            return (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQuery(q);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 4,
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-metallic)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#ffffff' : 'var(--text-primary)' }}>
                    {q.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {q.featureTag}
                  </span>
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  {q.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Query Console & Results Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: '#08080a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em'
                }}
              >
                {selectedQuery.name}
              </h2>
              <span
                className="tag-wafer"
                style={{
                  fontSize: 10.5,
                  padding: '3px 8px'
                }}
              >
                DuckDB Vectorized Engine
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {selectedQuery.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              {copied ? <Check size={13} style={{ color: '#ffffff' }} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy SQL'}
            </button>

            <button
              onClick={handleRun}
              disabled={isExecuting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                border: '1px solid #ffffff',
                color: '#000000',
                fontSize: 12,
                fontWeight: 600,
                boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <Play size={13} />
              {isExecuting ? 'Executing...' : 'Run Query'}
            </button>
          </div>
        </div>

        {/* SQL Code View */}
        <div style={{ padding: '16px 24px', backgroundColor: '#000000' }}>
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: '#050507',
              padding: '16px 20px',
              height: 180,
              overflowY: 'auto'
            }}
          >
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: '#e4e4e7',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                margin: 0
              }}
            >
              {selectedQuery.sql}
            </pre>
          </div>
        </div>

        {/* Query Results & Execution Benchmarks */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 24px 16px 24px' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              backgroundColor: 'rgba(10, 10, 13, 0.8)'
            }}
          >
            <div
              style={{
                padding: '10px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>Query Output</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {selectedQuery.sampleRows.length} rows returned
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ffffff' }}>
                  <Clock size={12} />
                  Execution Time: {selectedQuery.executionTimeMs}ms
                </span>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-silver)' }}>
                  <Cpu size={12} />
                  SIMD Vectorized
                </span>
              </div>
            </div>

            {/* Results Table */}
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#000000' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                    {selectedQuery.sampleColumns.map((col) => (
                      <th key={col} style={{ padding: '9px 14px', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedQuery.sampleRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                      }}
                    >
                      {row.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: '8px 14px',
                            color: '#ffffff',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {val === null ? <span style={{ color: 'var(--text-muted)' }}>NULL</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
