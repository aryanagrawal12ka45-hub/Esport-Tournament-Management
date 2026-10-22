import React from 'react';
import { Radio, Zap, ShieldAlert, Cpu } from 'lucide-react';
import { useDatabase } from '../../store/databaseContext';

export const Ticker: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { liveMatchDetails, stats, duckDbStatus } = useDatabase();

  const matchLabel = liveMatchDetails
    ? `${liveMatchDetails.team1.TeamName} [${liveMatchDetails.part1.TeamScore} - ${liveMatchDetails.part2.TeamScore}] ${liveMatchDetails.team2.TeamName}`
    : 'Waiting for live match feed...';

  const engineLabel =
    duckDbStatus === 'ready'
      ? 'DuckDB-WASM: Online (Columnar Engine)'
      : duckDbStatus === 'loading'
      ? 'DuckDB-WASM: Ingesting...'
      : duckDbStatus === 'fallback'
      ? 'DuckDB-WASM: In-Memory Relay'
      : 'DuckDB-WASM: Standby';

  const items = [
    {
      icon: <Radio className="w-3.5 h-3.5 text-danger-token" />,
      text: `TOURNAMENT MATCH: ${matchLabel}`
    },
    {
      icon: <Zap className="w-3.5 h-3.5 text-info-token" />,
      text: `GLOBAL TELEMETRY: ${stats.liveViewers.toLocaleString()} Registered Viewers | ${stats.avgLatency}ms Engine Latency`
    },
    {
      icon: <Cpu className="w-3.5 h-3.5 text-success-token" />,
      text: engineLabel
    },
    {
      icon: <ShieldAlert className="w-3.5 h-3.5 text-warning-token" />,
      text: `INTEGRITY DESK: ${stats.underReviewCount} Telemetry Anomaly Flags Under Review`
    }
  ];

  return (
    <div
      className={`h-8 w-full bg-surface-2 border-b border-token overflow-hidden flex items-center select-none relative z-10 ${className}`}
    >
      {/* Fixed label chip at left */}
      <div className="flex-shrink-0 px-3 h-full flex items-center bg-primary-soft border-r border-token text-xs font-mono tracking-wider uppercase font-bold text-primary-token z-20 shadow-sm">
        ARENADB TOURNAMENT
      </div>

      {/* Marquee viewport with soft gradient fade masks on both edges */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {/* Left Fade Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-r from-[var(--surface-2)] to-transparent" />
        {/* Right Fade Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-l from-[var(--surface-2)] to-transparent" />

        <div className="flex items-center gap-8 whitespace-nowrap animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused] py-1 pl-4">
          {[...items, ...items, ...items].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs font-mono text-token font-medium">
              {item.icon}
              <span>{item.text}</span>
              <span className="text-border-strong mx-3 font-bold opacity-60">/</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
