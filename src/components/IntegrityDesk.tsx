import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import { HudCard } from './ui/HudCard';
import { StatusPill } from './ui/StatusPill';
import { Button } from './ui/Button';

type KanbanColumnId = 'Under Review' | 'Cleared' | 'Warning / Fine' | 'Suspended';

export const IntegrityDesk: React.FC = () => {
  const { tableData, updateRow } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMatch] = useState('ALL');

  const antiCheats = tableData['ANTI_CHEAT'] || [];
  const disciplinary = tableData['DISCIPLINARY_ACTION'] || [];
  const players = tableData['PLAYER'] || [];
  const teams = tableData['TEAM'] || [];
  const perfs = tableData['PLAYER_PERFORMANCE'] || [];

  // Group anti-cheat cases into Kanban columns
  const getColumnCases = (col: KanbanColumnId) => {
    return antiCheats.filter((item) => {
      const status = item.CheatStatus || 'Under Review';
      const matchesSearch =
        searchQuery === '' ||
        String(item.AntiCheatID).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.PlayerID).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.MonitoringDetails).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMatchFilter = filterMatch === 'ALL' || item.MatchID === filterMatch;

      if (!matchesSearch || !matchesMatchFilter) return false;

      if (col === 'Under Review') return status === 'Under Review';
      if (col === 'Cleared') return status === 'Cleared';
      if (col === 'Warning / Fine') return status === 'Warning' || status === 'Fine';
      if (col === 'Suspended') return status === 'Suspended' || status === 'Banned';
      return false;
    });
  };

  const handleUpdateStatus = (antiCheatId: string, newStatus: string) => {
    updateRow('ANTI_CHEAT', antiCheatId, { CheatStatus: newStatus });
  };

  // Telemetry Scatter Plot Data Points: Latency vs Score across 0-150ms domain
  const scatterPoints = perfs.slice(0, 35).map((p) => {
    const player = players.find((pl) => pl.PlayerID === p.PlayerID);
    const antiCheatCase = antiCheats.find((ac) => ac.PlayerID === p.PlayerID);
    const hasAnomaly = !!antiCheatCase;
    const status = antiCheatCase?.CheatStatus || 'Clean';

    return {
      id: p.PerformanceID,
      playerId: p.PlayerID,
      playerName: player?.PlayerName || p.PlayerID,
      latency: Math.max(5, Math.min(145, Number(p.InternetLatencyMs) || 25)),
      score: Math.max(10, Math.min(390, Number(p.Score) || 220)),
      kills: Number(p.Kills) || 0,
      hasAnomaly,
      status
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 md:w-8 md:h-8 text-danger-token flex-shrink-0" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-token">
              Integrity & Anti-Cheat Surveillance Desk
            </h2>
          </div>
          <p className="text-xs text-muted font-mono mt-1 font-medium">
            Real-time Telemetry Audits, Referee Sanctions & Disciplinary Adjudication
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search case or player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded bg-surface border-strong font-mono text-xs text-token placeholder:text-faint focus:border-primary-token w-48 sm:w-60 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards: Legible var(--text) figures with 4px semantic indicator borders */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HudCard clipCorner="tl-br" indicatorColor="info">
          <div className="text-xs font-mono text-muted uppercase font-semibold">
            Surveillance Flags
          </div>
          <div className="font-heading text-3xl font-black text-token mt-1">
            {antiCheats.length}
          </div>
          <p className="text-xs font-mono text-muted mt-1 font-medium">
            Active telemetry alerts
          </p>
        </HudCard>

        <HudCard clipCorner="tl-br" indicatorColor="warning">
          <div className="text-xs font-mono text-muted uppercase font-semibold">
            Under Review
          </div>
          <div className="font-heading text-3xl font-black text-token mt-1">
            {antiCheats.filter((a) => a.CheatStatus === 'Under Review').length}
          </div>
          <p className="text-xs font-mono text-muted mt-1 font-medium">
            Pending referee review
          </p>
        </HudCard>

        <HudCard clipCorner="tl-br" indicatorColor="success">
          <div className="text-xs font-mono text-muted uppercase font-semibold">
            Cleared Athletes
          </div>
          <div className="font-heading text-3xl font-black text-token mt-1">
            {antiCheats.filter((a) => a.CheatStatus === 'Cleared').length}
          </div>
          <p className="text-xs font-mono text-muted mt-1 font-medium">
            Hardware verified
          </p>
        </HudCard>

        <HudCard clipCorner="tl-br" indicatorColor="danger">
          <div className="text-xs font-mono text-muted uppercase font-semibold">
            Sanctions Enforced
          </div>
          <div className="font-heading text-3xl font-black text-token mt-1">
            {disciplinary.length}
          </div>
          <p className="text-xs font-mono text-muted mt-1 font-medium">
            Fines & suspensions
          </p>
        </HudCard>
      </div>

      {/* Kanban Disciplinary Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Column 1: Under Review */}
        <div className="flex flex-col bg-surface border border-token rounded-lg overflow-hidden shadow-sm">
          <div className="p-3 bg-surface-2 border-b border-token flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning" />
              <span className="font-mono text-xs font-bold uppercase text-token">
                Under Review
              </span>
            </div>
            <StatusPill
              label={String(getColumnCases('Under Review').length)}
              variant="warning"
              size="sm"
            />
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {getColumnCases('Under Review').length === 0 ? (
              <div className="p-8 border border-dashed border-strong rounded-lg flex flex-col items-center justify-center text-center text-muted font-mono text-xs">
                <Inbox className="w-6 h-6 mb-2 opacity-50 text-faint" />
                <p>No cases in this column</p>
              </div>
            ) : (
              getColumnCases('Under Review').map((c) => {
                const player = players.find((p) => p.PlayerID === c.PlayerID);
                const team = teams.find((t) => t.TeamID === player?.TeamID);

                return (
                  <div
                    key={c.AntiCheatID}
                    className="p-3.5 rounded-lg bg-surface-2 border border-token hover:border-strong transition-all font-mono text-xs space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-danger-token">{c.AntiCheatID}</span>
                      <StatusPill label={`Match ${c.MatchID}`} variant="neutral" size="sm" />
                    </div>
                    <div>
                      <div className="font-bold text-token text-sm">
                        {player?.PlayerName || c.PlayerID}
                      </div>
                      <div className="text-xs text-muted font-medium">
                        {team?.TeamName || 'Free Agent'} • {player?.PlayerRole || 'Roster'}
                      </div>
                    </div>
                    <p className="text-xs text-muted bg-surface-3 p-2 rounded border border-token leading-relaxed font-medium">
                      {c.MonitoringDetails}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleUpdateStatus(c.AntiCheatID, 'Cleared')}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handleUpdateStatus(c.AntiCheatID, 'Warning')}
                        className="flex-1"
                      >
                        Warn
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUpdateStatus(c.AntiCheatID, 'Suspended')}
                        className="flex-1"
                      >
                        Suspend
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Cleared */}
        <div className="flex flex-col bg-surface border border-token rounded-lg overflow-hidden shadow-sm">
          <div className="p-3 bg-surface-2 border-b border-token flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="font-mono text-xs font-bold uppercase text-token">
                Cleared Cases
              </span>
            </div>
            <StatusPill
              label={String(getColumnCases('Cleared').length)}
              variant="success"
              size="sm"
            />
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {getColumnCases('Cleared').length === 0 ? (
              <div className="p-8 border border-dashed border-strong rounded-lg flex flex-col items-center justify-center text-center text-muted font-mono text-xs">
                <Inbox className="w-6 h-6 mb-2 opacity-50 text-faint" />
                <p>No cases in this column</p>
              </div>
            ) : (
              getColumnCases('Cleared').map((c) => {
                const player = players.find((p) => p.PlayerID === c.PlayerID);
                return (
                  <div
                    key={c.AntiCheatID}
                    className="p-3.5 rounded-lg bg-surface-2 border border-token font-mono text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-success-token">{c.AntiCheatID}</span>
                      <StatusPill label={c.MatchID} variant="neutral" size="sm" />
                    </div>
                    <div className="font-bold text-token text-sm">
                      {player?.PlayerName || c.PlayerID}
                    </div>
                    <p className="text-xs text-muted truncate">
                      {c.MonitoringDetails}
                    </p>
                    <div className="text-xs text-success-token flex items-center gap-1.5 mt-1 font-semibold">
                      <ShieldCheck className="w-4 h-4" /> Hardware & Telemetry Validated
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Warning / Fine */}
        <div className="flex flex-col bg-surface border border-token rounded-lg overflow-hidden shadow-sm">
          <div className="p-3 bg-surface-2 border-b border-token flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-warning" />
              <span className="font-mono text-xs font-bold uppercase text-token">
                Warnings & Fines
              </span>
            </div>
            <StatusPill
              label={String(getColumnCases('Warning / Fine').length)}
              variant="warning"
              size="sm"
            />
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {getColumnCases('Warning / Fine').length === 0 ? (
              <div className="p-8 border border-dashed border-strong rounded-lg flex flex-col items-center justify-center text-center text-muted font-mono text-xs">
                <Inbox className="w-6 h-6 mb-2 opacity-50 text-faint" />
                <p>No cases in this column</p>
              </div>
            ) : (
              getColumnCases('Warning / Fine').map((c) => {
                const player = players.find((p) => p.PlayerID === c.PlayerID);
                return (
                  <div
                    key={c.AntiCheatID}
                    className="p-3.5 rounded-lg bg-warning-soft border border-[color:color-mix(in_srgb,var(--warning)_40%,transparent)] font-mono text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-warning-token">{c.AntiCheatID}</span>
                      <StatusPill label="SANCTIONED" variant="warning" size="sm" />
                    </div>
                    <div className="font-bold text-token text-sm">
                      {player?.PlayerName || c.PlayerID}
                    </div>
                    <p className="text-xs text-muted leading-relaxed font-medium">
                      {c.MonitoringDetails}
                    </p>
                    <div className="text-xs text-warning-token flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4" /> Fine Issued & Match Monitored
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 4: Suspended / Banned */}
        <div className="flex flex-col bg-surface border border-token rounded-lg overflow-hidden shadow-sm">
          <div className="p-3 bg-surface-2 border-b border-token flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-danger" />
              <span className="font-mono text-xs font-bold uppercase text-token">
                Suspended / Banned
              </span>
            </div>
            <StatusPill
              label={String(getColumnCases('Suspended').length)}
              variant="danger"
              size="sm"
            />
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {getColumnCases('Suspended').length === 0 ? (
              <div className="p-8 border border-dashed border-strong rounded-lg flex flex-col items-center justify-center text-center text-muted font-mono text-xs">
                <Inbox className="w-6 h-6 mb-2 opacity-50 text-faint" />
                <p>No cases in this column</p>
              </div>
            ) : (
              getColumnCases('Suspended').map((c) => {
                const player = players.find((p) => p.PlayerID === c.PlayerID);
                return (
                  <div
                    key={c.AntiCheatID}
                    className="p-3.5 rounded-lg bg-danger-soft border border-[color:color-mix(in_srgb,var(--danger)_40%,transparent)] font-mono text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-danger-token">{c.AntiCheatID}</span>
                      <StatusPill label="BANNED" variant="danger" size="sm" />
                    </div>
                    <div className="font-bold text-token text-sm">
                      {player?.PlayerName || c.PlayerID}
                    </div>
                    <p className="text-xs text-muted leading-relaxed font-medium">
                      {c.MonitoringDetails}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Latency vs Combat Score Scatter Plot */}
      <HudCard
        title="Telemetry Outlier Scatter Analysis (Latency ms vs Combat Score)"
        subtitle="Visual audit tool detecting latency anomalies and irregular frag patterns across athletes"
        badge={<StatusPill label="LIVE AUDIT" variant="primary" size="sm" />}
        clipCorner="tl-br"
      >
        <div className="h-72 w-full relative border border-token rounded-lg bg-surface p-4 flex flex-col justify-between shadow-sm">
          {/* Y Axis Label */}
          <div className="absolute left-3 top-3 text-xs font-mono text-muted font-semibold z-10">
            Combat Score (0 - 400) ↑
          </div>
          {/* X Axis Label */}
          <div className="absolute right-4 bottom-2 text-xs font-mono text-muted font-semibold z-10">
            Latency (0 - 150 ms) →
          </div>

          {/* Plot Grid Canvas */}
          <div className="relative w-full h-full mt-6 mb-4">
            {/* Subtle Gridlines using var(--grid-line) */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-b border-r border-[var(--grid-line)] opacity-60" />
              ))}
            </div>

            {/* Threshold Translucent Danger Band for latency > 100ms */}
            <div
              className="absolute top-0 bottom-0 right-0 bg-danger-soft pointer-events-none opacity-40"
              style={{ left: `${(100 / 150) * 100}%` }}
            />

            {/* 2px solid danger threshold line with clear label */}
            <div
              className="absolute top-0 bottom-0 border-r-2 border-danger z-10 pointer-events-none"
              style={{ left: `${(100 / 150) * 100}%` }}
            >
              <span className="absolute top-1 left-2 font-mono text-xs font-bold text-danger-token bg-surface px-1.5 py-0.5 rounded border border-danger shadow-sm whitespace-nowrap">
                100 ms threshold
              </span>
            </div>

            {/* Scatter points with 8px radius, 1.5px surface stroke and status coloring */}
            {scatterPoints.map((pt) => {
              const xPercent = (pt.latency / 150) * 100;
              const yPercent = 100 - (pt.score / 400) * 100;

              let dotColor = 'bg-success';
              if (pt.status === 'Under Review') {
                dotColor = 'bg-warning';
              } else if (pt.status === 'Suspended' || pt.status === 'Warning' || pt.hasAnomaly) {
                dotColor = 'bg-danger';
              }

              return (
                <div
                  key={pt.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
                  style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-[1.5px] border-surface transition-transform hover:scale-150 shadow-sm ${dotColor}`}
                  />
                  {/* Tooltip on hover */}
                  <div className="hidden group-hover:block absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 whitespace-nowrap bg-surface-3 border border-strong p-2.5 rounded shadow-lg font-mono text-xs text-token">
                    <div className="font-bold text-primary-token">{pt.playerName}</div>
                    <div className="text-muted mt-0.5">Score: <span className="font-bold text-token">{pt.score}</span> | Latency: <span className="font-bold text-token">{pt.latency}ms</span></div>
                    <div className="text-muted">Kills: <span className="font-bold text-token">{pt.kills}</span></div>
                    {pt.hasAnomaly && (
                      <div className="text-danger-token font-bold mt-1 text-xs">
                        ANOMALY: {pt.status.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </HudCard>
    </div>
  );
};
