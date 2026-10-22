import React, { useState } from 'react';
import {
  Tv,
  Activity,
  ShieldCheck,
  ChevronRight,
  Radio,
  ArrowUpRight,
  ArrowRight,
  GraduationCap,
  Filter
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import { SUBSYSTEMS_META, type SubsystemCategory } from '../data/schema';
import { HudCard } from './ui/HudCard';
import { StatusPill } from './ui/StatusPill';
import { RadialGauge } from './ui/RadialGauge';
import { Sparkline } from './ui/Sparkline';
import { ScoringPopover } from './ui/ScoringPopover';
import { Button } from './ui/Button';

export const CommandCenter: React.FC = () => {
  const {
    tableData,
    stats,
    liveMatchDetails,
    tables,
    setActiveTab,
    setSelectedTableId
  } = useDatabase();

  const [minRoundsFilter, setMinRoundsFilter] = useState(true);

  const matches = tableData['MATCH'] || [];
  const players = tableData['PLAYER'] || [];
  const perfs = tableData['PLAYER_PERFORMANCE'] || [];
  const teams = tableData['TEAM'] || [];
  const games = tableData['GAME'] || [];
  const antiCheats = tableData['ANTI_CHEAT'] || [];

  const completedMatches = matches.filter((m) => m.MatchStatus === 'Completed').length;
  const tournamentProgress = matches.length > 0 ? (completedMatches / matches.length) * 100 : 0;

  // Active game title
  const activeGame = games.find((g) => g.GameID === liveMatchDetails?.match?.GameID) || {
    GameName: 'Valorant Champions Tour',
    Genre: 'Tactical FPS'
  };

  // Sparkline data for viewer trend
  const viewerTrend = [
    stats.liveViewers * 0.85,
    stats.liveViewers * 0.9,
    stats.liveViewers * 0.88,
    stats.liveViewers * 0.94,
    stats.liveViewers * 0.98,
    stats.liveViewers * 0.95,
    stats.liveViewers
  ];

  // Leaderboard: Top performers by True Tournament Average Combat Score (weighted by rounds)
  const playerScores = players.map((pl) => {
    const plPerfs = perfs.filter((p) => p.PlayerID === pl.PlayerID);
    const totalScore = plPerfs.reduce((a, b) => a + (Number(b.TotalCombatScore ?? b.Score) || 0), 0);
    const totalRounds = plPerfs.reduce((a, b) => a + (Number(b.RoundsPlayed) || 0), 0);
    const totalDamage = plPerfs.reduce((a, b) => a + (Number(b.DamageDealt) || 0), 0);
    const trueAcs = totalRounds > 0 ? Math.round((totalScore / totalRounds) * 10) / 10 : 0;
    const adr = totalRounds > 0 ? (totalDamage / totalRounds).toFixed(1) : '0.0';
    const totalKills = plPerfs.reduce((a, b) => a + (Number(b.Kills) || 0), 0);
    const totalDeaths = plPerfs.reduce((a, b) => a + (Number(b.Deaths) || 0), 0);
    const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
    const team = teams.find((t) => t.TeamID === pl.TeamID);
    return { player: pl, team, trueAcs, totalRounds, adr, kills: totalKills, kd };
  });

  const filteredPerformers = minRoundsFilter
    ? playerScores.filter((p) => p.totalRounds >= 40)
    : playerScores;

  filteredPerformers.sort((a, b) => b.trueAcs - a.trueAcs);
  const topPerformers = filteredPerformers.slice(0, 5);

  // Jump helper
  const handleJumpToTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setActiveTab('vault');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Tournament Spotlight Card */}
      <div className="p-4 md:p-5 rounded-lg bg-surface border border-token flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary-soft border border-strong flex items-center justify-center flex-shrink-0 text-primary-token">
            <GraduationCap className="w-6 h-6 text-primary-token" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill label="NEW FEATURE" variant="primary" size="sm" />
              <span className="font-heading text-sm md:text-base font-bold text-token">
                VALORANT Champions 2026 Shanghai ($2,250,000 USD Prize Pool)
              </span>
            </div>
            <p className="text-xs text-muted mt-1 font-medium leading-relaxed">
              16 teams, GSL groups, 8-team double-elimination bracket (Champion: LOUD). Explore the in-app Scoring Academy for full combat math & interactive calculators.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setActiveTab('academy')}
          iconRight={ArrowRight}
          className="whitespace-nowrap"
        >
          Open Scoring Academy
        </Button>
      </div>

      {/* Hero Scoreboard Banner */}
      <div className="relative rounded-lg overflow-hidden bg-surface border border-token p-5 md:p-7 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Match Info & Status */}
          <div className="flex-1 w-full text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-2">
              <StatusPill
                label="OFFICIAL MATCH"
                variant="primary"
                pulse={false}
              />
              <span className="font-mono text-xs text-primary-token uppercase tracking-wider font-bold">
                {activeGame.GameName}
              </span>
              <span className="text-border-strong hidden sm:inline">•</span>
              <span className="font-mono text-xs text-muted hidden sm:inline font-medium">
                Match ID: {liveMatchDetails?.match?.MatchID || 'M01'}
              </span>
            </div>

            {/* Teams & Score Display */}
            <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-8 my-4">
              {/* Team 1 */}
              <div className="text-right flex-1 min-w-0">
                <div className="font-heading text-xl md:text-3xl font-black uppercase text-token truncate">
                  {liveMatchDetails?.team1?.TeamName || 'Sentinels'}
                </div>
                <div className="text-xs font-mono text-primary-token font-bold mt-0.5">
                  TAG: {liveMatchDetails?.team1?.TeamTag || 'SEN'}
                </div>
              </div>

              {/* Score Numerals */}
              <div className="px-5 py-2.5 rounded-lg bg-surface-2 border border-token flex items-center gap-3 shadow-sm">
                <span className="font-heading text-3xl md:text-5xl font-black text-primary-token">
                  {liveMatchDetails?.part1?.TeamScore ?? 0}
                </span>
                <span className="font-heading text-2xl md:text-4xl font-light text-muted">
                  :
                </span>
                <span className="font-heading text-3xl md:text-5xl font-black text-secondary-token">
                  {liveMatchDetails?.part2?.TeamScore ?? 0}
                </span>
              </div>

              {/* Team 2 */}
              <div className="text-left flex-1 min-w-0">
                <div className="font-heading text-xl md:text-3xl font-black uppercase text-token truncate">
                  {liveMatchDetails?.team2?.TeamName || 'Fnatic'}
                </div>
                <div className="text-xs font-mono text-secondary-token font-bold mt-0.5">
                  TAG: {liveMatchDetails?.team2?.TeamTag || 'FNC'}
                </div>
              </div>
            </div>

            {/* Match Meta Footer */}
            <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-mono text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-primary-token" />
                {stats.liveViewers.toLocaleString()} Peak Concurrent
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-success-token" />
                {stats.avgLatency}ms Server Latency
              </span>
              <span>•</span>
              <span className="hidden sm:inline">First to 13 Rounds Wins</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-row lg:flex-col gap-2.5 w-full lg:w-auto flex-shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => setActiveTab('bracket')}
              iconRight={ArrowUpRight}
            >
              View Bracket
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleJumpToTable('PLAYER_PERFORMANCE')}
              iconRight={Activity}
            >
              Match Telemetry
            </Button>
          </div>
        </div>
      </div>

      {/* Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* Bento Tile 1: Tournament Completion Radial Gauge (4 cols) */}
        <div className="lg:col-span-4">
          <HudCard
            title="Tournament Pace"
            subtitle="Grand Finals Bracket Progression"
            clipCorner="tl-br"
            className="h-full flex flex-col justify-between"
          >
            <div className="py-4 flex flex-col items-center">
              <RadialGauge
                value={tournamentProgress}
                label="Matches Completed"
                sublabel={`${completedMatches}/${matches.length}`}
                size={120}
                color="var(--primary)"
              />
            </div>
            <div className="pt-3 border-t border-token grid grid-cols-2 gap-2 text-center font-mono text-xs">
              <div className="bg-surface-2 p-2.5 rounded border border-token">
                <span className="text-xs text-muted uppercase block font-semibold">
                  Active
                </span>
                <span className="font-bold text-primary-token mt-0.5 block">
                  {stats.activeMatches} Matches
                </span>
              </div>
              <div className="bg-surface-2 p-2.5 rounded border border-token">
                <span className="text-xs text-muted uppercase block font-semibold">
                  Athletes
                </span>
                <span className="font-bold text-token mt-0.5 block">
                  {players.length} Registered
                </span>
              </div>
            </div>
          </HudCard>
        </div>

        {/* Bento Tile 2: Live Viewership Broadcast Sparkline (4 cols) */}
        <div className="lg:col-span-4">
          <HudCard
            title="Broadcast Audience"
            subtitle="Global Stream Telemetry"
            clipCorner="tr-bl"
            badge={<StatusPill label="LIVE FEED" variant="live" size="sm" />}
            className="h-full flex flex-col justify-between"
          >
            <div className="my-2">
              <div className="font-heading text-3xl font-black text-token">
                {stats.liveViewers.toLocaleString()}
              </div>
              <div className="text-xs font-mono text-success-token flex items-center gap-1.5 mt-1 font-semibold">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Multi-Platform Twitch/YouTube Aggregate
              </div>
            </div>

            <div className="py-2">
              <Sparkline data={viewerTrend} height={55} color="var(--primary)" />
            </div>

            <div className="pt-3 border-t border-token flex items-center justify-between text-xs font-mono text-muted font-medium">
              <span>Avg Latency: {stats.avgLatency}ms</span>
              <button
                onClick={() => handleJumpToTable('MATCH_STREAM')}
                className="text-primary-token hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                Inspect Streams <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </HudCard>
        </div>

        {/* Bento Tile 3: Integrity & Anti-Cheat Status (4 cols) */}
        <div className="lg:col-span-4">
          <HudCard
            title="Integrity Surveillance"
            subtitle="Referee Flags & Latency Audits"
            clipCorner="tl-br"
            indicatorColor="warning"
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-2.5 my-2">
              <div className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-token">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success-token" />
                  <span className="font-mono text-xs text-token font-medium">
                    Hardware Inspections
                  </span>
                </div>
                <StatusPill label="PASS" variant="success" size="sm" />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-surface-2 border border-token">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                  <span className="font-mono text-xs text-token font-medium">
                    Flags Under Review
                  </span>
                </div>
                <StatusPill label={`${stats.underReviewCount} Cases`} variant="warning" size="sm" />
              </div>
            </div>

            <div className="pt-3 border-t border-token flex items-center justify-between text-xs font-mono font-medium">
              <span className="text-muted">
                {antiCheats.length} total surveillance logs
              </span>
              <button
                onClick={() => setActiveTab('integrity')}
                className="text-warning-token hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                Integrity Desk <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </HudCard>
        </div>

        {/* Bento Tile 4: Top Combat Performers Leaderboard (7 cols) */}
        <div className="lg:col-span-7">
          <HudCard
            title="Combat Telemetry Leaderboard"
            subtitle="Top athletes ranked by True Tournament ACS (SUM(Score) / SUM(Rounds))"
            badge={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMinRoundsFilter(!minRoundsFilter)}
                  className={`text-xs font-mono px-2 py-0.5 rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                    minRoundsFilter
                      ? 'bg-primary-soft text-primary-token border-primary-token font-bold'
                      : 'bg-surface-2 text-muted border-token'
                  }`}
                  title="Toggle 40+ rounds threshold to eliminate single-map outlier skew"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Min 40 Rds: {minRoundsFilter ? 'ON' : 'OFF'}</span>
                </button>
                <StatusPill label="TOP 5" variant="primary" size="sm" />
              </div>
            }
            clipCorner="all"
          >
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-surface-3 border-b border-token text-muted uppercase font-semibold">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Athlete</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-2 text-center">Rounds</th>
                    <th className="py-2.5 px-2 text-center">K/D</th>
                    <th className="py-2.5 px-2 text-center">
                      <span className="inline-flex items-center justify-center gap-1">
                        <span>ADR</span>
                        <ScoringPopover metric="adr" />
                      </span>
                    </th>
                    <th className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center justify-end gap-1">
                        <span>Tournament ACS</span>
                        <ScoringPopover metric="acs" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-token">
                  {topPerformers.map((row, idx) => (
                    <tr
                      key={row.player.PlayerID}
                      className="hover:bg-surface-2 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-primary-token">
                        #{idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-token">
                          {row.player.PlayerName}
                        </div>
                        <div className="text-xs text-muted font-medium">
                          {row.player.PlayerRole} • {row.player.Country}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-muted font-medium">
                        {row.team?.TeamName || 'Free Agent'}
                      </td>
                      <td className="py-2.5 px-2 text-center text-muted font-medium">
                        {row.totalRounds}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-success-token">
                        {row.kd}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-warning-token">
                        {row.adr}
                      </td>
                      <td className="py-2.5 px-3 text-right font-heading text-base font-black text-primary-token">
                        {row.trueAcs.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </HudCard>
        </div>

        {/* Bento Tile 5: Subsystem Relational Health Matrix (5 cols) */}
        <div className="lg:col-span-5">
          <HudCard
            title="Database Subsystem Health"
            subtitle="11 relational entities verified in 3rd Normal Form"
            badge={<StatusPill label="3NF VALID" variant="success" size="sm" />}
            clipCorner="tl-br"
          >
            <div className="space-y-2.5">
              {(Object.keys(SUBSYSTEMS_META) as SubsystemCategory[]).map((catKey) => {
                const meta = SUBSYSTEMS_META[catKey];
                const catTables = tables.filter((t) => t.category === catKey);
                const totalRows = catTables.reduce(
                  (sum, t) => sum + (tableData[t.id]?.length || 0),
                  0
                );

                return (
                  <div
                    key={catKey}
                    onClick={() => {
                      if (catTables[0]) handleJumpToTable(catTables[0].id);
                    }}
                    className="p-3 rounded-lg bg-surface-2 border border-token hover:border-strong cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-bold text-token truncate group-hover:text-primary-token transition-colors">
                          {meta.label}
                        </div>
                        <div className="text-xs font-mono text-muted truncate font-medium">
                          {catTables.length} tables • {catTables.map((t) => t.name).join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 font-mono text-xs font-bold text-token">
                      {totalRows} rows
                    </div>
                  </div>
                );
              })}
            </div>
          </HudCard>
        </div>
      </div>
    </div>
  );
};
