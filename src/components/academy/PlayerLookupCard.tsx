import React, { useState, useMemo } from 'react';
import {
  User,
  Trophy
} from 'lucide-react';
import { HudCard } from '../ui/HudCard';
import { StatusChip } from '../ui/StatusChip';
import { useDatabase } from '../../store/databaseContext';
import { tournamentAcs, acsBand } from '../../engine/scoring';

export const PlayerLookupCard: React.FC = () => {
  const { tableData } = useDatabase();

  const players = tableData['PLAYER'] || [];
  const teams = tableData['TEAM'] || [];
  const perfs = tableData['PLAYER_PERFORMANCE'] || [];
  const maps = tableData['MATCH_MAP'] || [];

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('P01');

  // Selected player object & team
  const player = useMemo(() => {
    return players.find((p) => p.PlayerID === selectedPlayerId);
  }, [players, selectedPlayerId]);

  const team = useMemo(() => {
    return teams.find((t) => t.TeamID === player?.TeamID);
  }, [teams, player]);

  // Player map performances
  const playerPerfs = useMemo(() => {
    return perfs
      .filter((p) => p.PlayerID === selectedPlayerId)
      .map((p) => {
        const score = p.TotalCombatScore ?? p.Score ?? 0;
        const rounds = p.RoundsPlayed ?? 0;
        const mapAcs = rounds > 0 ? Math.round((score / rounds) * 10) / 10 : (p.ACS ?? 0);
        return {
          ...p,
          score,
          rounds,
          mapAcs
        };
      });
  }, [perfs, selectedPlayerId]);

  // Aggregate stats via single-source engine tournamentAcs()
  const mapDataForTournament = useMemo(() => {
    return playerPerfs.map((p) => ({
      totalCombatScore: p.score,
      rounds: p.rounds
    }));
  }, [playerPerfs]);

  const totalScore = useMemo(() => {
    return playerPerfs.reduce((s, p) => s + p.score, 0);
  }, [playerPerfs]);

  const totalRounds = useMemo(() => {
    return playerPerfs.reduce((s, p) => s + p.rounds, 0);
  }, [playerPerfs]);

  // Single-source Tournament ACS = SUM(score) / SUM(rounds)
  const trueTourneyAcs = useMemo(() => {
    return tournamentAcs(mapDataForTournament);
  }, [mapDataForTournament]);

  // Naive mean of map ACS = (ACS_1 + ACS_2 + ...) / N
  const meanMapAcs = useMemo(() => {
    if (playerPerfs.length === 0) return null;
    const sumAcs = playerPerfs.reduce((s, p) => s + p.mapAcs, 0);
    return sumAcs / playerPerfs.length;
  }, [playerPerfs]);

  // Delta between true tournament ACS and naive arithmetic mean
  const delta = useMemo(() => {
    if (trueTourneyAcs === null || meanMapAcs === null) return null;
    return trueTourneyAcs - meanMapAcs;
  }, [trueTourneyAcs, meanMapAcs]);

  const band = useMemo(() => acsBand(trueTourneyAcs), [trueTourneyAcs]);

  return (
    <div id="sec-player-lookup" className="scroll-mt-28">
      <HudCard
        title="Database-Wired Player Lookup & Arithmetic Proof"
        subtitle="Inspect real athlete performances from VALORANT Champions 2026 Shanghai with exact mathematical proofs"
        badge={
          <StatusChip
            label={band === 'n/a' ? 'NO DATA' : band.toUpperCase()}
            variant={band === 'elite' ? 'magenta' : band === 'great' || band === 'good' ? 'cyan' : 'amber'}
          />
        }
      >
        <div className="space-y-6">
          {/* Athlete Selector Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-2 border border-token">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary-token" />
              <label htmlFor="athlete-select" className="text-xs font-mono font-bold text-token uppercase">
                Select Athlete:
              </label>
            </div>
            <select
              id="athlete-select"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="bg-surface border border-token rounded-lg px-3 py-1.5 text-xs font-mono text-token focus:outline-none focus:border-token-strong max-w-sm"
            >
              <optgroup label="Grand Finals & Playoff Athletes">
                {players
                  .filter((p) => perfs.some((pf) => pf.PlayerID === p.PlayerID))
                  .map((pl) => {
                    const tm = teams.find((t) => t.TeamID === pl.TeamID);
                    return (
                      <option key={pl.PlayerID} value={pl.PlayerID}>
                        {pl.PlayerName} — {tm?.TeamName || 'Free Agent'} ({pl.PlayerRole})
                      </option>
                    );
                  })}
              </optgroup>
              <optgroup label="Other Tournament Athletes">
                {players
                  .filter((p) => !perfs.some((pf) => pf.PlayerID === p.PlayerID))
                  .map((pl) => {
                    const tm = teams.find((t) => t.TeamID === pl.TeamID);
                    return (
                      <option key={pl.PlayerID} value={pl.PlayerID}>
                        {pl.PlayerName} — {tm?.TeamName || 'Free Agent'} ({pl.PlayerRole}) [Bench/Roster]
                      </option>
                    );
                  })}
              </optgroup>
            </select>
          </div>

          {player && (
            <div className="space-y-6">
              {/* Profile & Running Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-surface-2 border border-token">
                  <span className="text-xs font-mono text-muted uppercase block mb-1">
                    Athlete & Team
                  </span>
                  <div className="font-heading text-base font-bold text-token truncate">
                    {player.PlayerName}
                  </div>
                  <div className="text-xs font-mono text-primary-token">
                    {team?.TeamName || 'Free Agent'} • {player.PlayerRole}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-2 border border-token">
                  <span className="text-xs font-mono text-muted uppercase block mb-1">
                    Maps / Total Rounds
                  </span>
                  <div className="text-xl font-mono font-bold text-token">
                    {playerPerfs.length} Maps
                  </div>
                  <div className="text-xs font-mono text-muted">
                    {totalRounds} Rounds Played
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-2 border border-token">
                  <span className="text-xs font-mono text-muted uppercase block mb-1">
                    True Tournament ACS
                  </span>
                  <div className="text-2xl font-mono font-black text-token">
                    {trueTourneyAcs !== null ? trueTourneyAcs.toFixed(1) : 'n/a'}
                  </div>
                  <div className="text-xs font-mono text-muted">
                    SUM(Scores) / SUM(Rounds)
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-2 border border-token">
                  <span className="text-xs font-mono text-muted uppercase block mb-1">
                    Mean of Map ACS
                  </span>
                  <div className="text-xl font-mono font-bold text-muted">
                    {meanMapAcs !== null ? meanMapAcs.toFixed(1) : 'n/a'}
                  </div>
                  {delta !== null && (
                    <div
                      className={`text-xs font-mono font-bold ${
                        Math.abs(delta) < 0.05
                          ? 'text-muted'
                          : delta > 0
                          ? 'text-success-token'
                          : 'text-warning-token'
                      }`}
                    >
                      {delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} Δ vs Naive Mean
                    </div>
                  )}
                </div>
              </div>

              {/* Per-Map Performance Table */}
              {playerPerfs.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted">
                    Recorded Map Performances ({playerPerfs.length} Maps)
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-token">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-surface-2 text-muted border-b border-token text-left uppercase text-xs">
                          <th className="p-2.5">Match</th>
                          <th className="p-2.5">Map Name</th>
                          <th className="p-2.5 text-center">Rounds</th>
                          <th className="p-2.5 text-right">Combat Score</th>
                          <th className="p-2.5 text-right">Map ACS</th>
                          <th className="p-2.5 text-right">Damage</th>
                          <th className="p-2.5 text-center">K / D / A</th>
                          <th className="p-2.5 text-center">FK / FD</th>
                          <th className="p-2.5 text-right">Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-token">
                        {playerPerfs.map((p) => {
                          const mapObj = maps.find((m) => m.MapID === p.MapID);
                          return (
                            <tr key={p.PerformanceID} className="hover:bg-surface-2 transition-colors">
                              <td className="p-2.5 font-bold text-primary-token">{p.MatchID}</td>
                              <td className="p-2.5 text-token font-semibold">
                                {mapObj ? mapObj.MapName : p.MapID}
                              </td>
                              <td className="p-2.5 text-center text-muted">{p.rounds}</td>
                              <td className="p-2.5 text-right font-bold text-token">{p.score}</td>
                              <td className="p-2.5 text-right font-bold text-token">
                                {p.mapAcs.toFixed(1)}
                              </td>
                              <td className="p-2.5 text-right text-primary-token">{p.DamageDealt}</td>
                              <td className="p-2.5 text-center text-token">
                                {p.Kills} / {p.Deaths} / {p.Assists}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="text-success-token font-bold">{p.FirstKills || 0}</span> /{' '}
                                <span className="text-danger-token font-bold">{p.FirstDeaths || 0}</span>
                              </td>
                              <td className="p-2.5 text-right font-bold text-token">
                                {p.ImpactIndex?.toFixed(2) || '1.00'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-surface-2 border border-dashed border-strong text-center font-mono text-xs text-muted">
                  No individual map performances recorded yet for {player.PlayerName}. Select a Grand Finalist above (e.g. aspas or Sayf) to inspect multi-map proofs.
                </div>
              )}

              {/* Step-by-Step Substituted Arithmetic Proof */}
              {playerPerfs.length > 0 && trueTourneyAcs !== null && (
                <div className="p-5 rounded-xl bg-surface-2 border border-token space-y-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-warning-token" />
                    <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-token">
                      Substituted Step-by-Step Arithmetic Proof for {player.PlayerName}
                    </h4>
                  </div>

                  <p className="text-xs text-muted leading-relaxed">
                    Tournament ACS is defined as the total combat score across all maps divided by total rounds played, 
                    <strong className="text-token"> not</strong> the arithmetic mean of per-map ACS.
                    Here is the exact formula with {player.PlayerName}'s match telemetry substituted:
                  </p>

                  <div className="p-4 rounded-xl bg-surface border border-token font-mono text-xs space-y-3">
                    {/* Step 1 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-token">
                      <span className="text-muted">Step 1: Sum of Combat Scores</span>
                      <span className="text-primary-token font-bold">
                        {playerPerfs.map((p) => p.score).join(' + ')} = {totalScore} Pts
                      </span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-token">
                      <span className="text-muted">Step 2: Sum of Rounds Played</span>
                      <span className="text-token font-bold">
                        {playerPerfs.map((p) => p.rounds).join(' + ')} = {totalRounds} Rounds
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-token">
                      <span className="text-muted">Step 3: Official Tournament ACS</span>
                      <span className="text-token font-black text-sm">
                        {totalScore} / {totalRounds} = {trueTourneyAcs.toFixed(3)} ≈ {trueTourneyAcs.toFixed(1)} ACS
                      </span>
                    </div>

                    {/* Step 4: Comparison */}
                    {meanMapAcs !== null && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="text-muted">Contrast with Naive Unweighted Mean</span>
                        <span className="text-muted">
                          ({playerPerfs.map((p) => p.mapAcs.toFixed(1)).join(' + ')}) / {playerPerfs.length} = {meanMapAcs.toFixed(3)} ACS
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-xs font-mono text-muted leading-relaxed">
                    <strong className="text-token">Mathematical Rationale:</strong> A 13-round sweep has far fewer rounds than a 26-round double-overtime thriller.
                    Weighting by round count guarantees that every single round played contributes identically to the athlete's overall tournament standing.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </HudCard>
    </div>
  );
};
