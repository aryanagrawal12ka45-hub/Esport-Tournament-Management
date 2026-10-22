/**
 * Pure simulation tick engine for ArenaDB Tournament Operations.
 * Simulates match progression, round scores (first to 13), latency jitter,
 * combat kills/deaths/assists, anti-cheat anomaly flags, and stream viewership.
 */

import {
  calculateRoundCombatScore,
  calculateACS,
  calculateADR,
  calculateImpactIndex
} from './scoring';

export interface SimulationStats {
  liveViewers: number;
  activeMatches: number;
  avgLatency: number;
  underReviewCount: number;
}

export function stepLiveSimulation(prevData: Record<string, any[]>): Record<string, any[]> {
  const copy: Record<string, any[]> = {};
  for (const key of Object.keys(prevData)) {
    copy[key] = [...(prevData[key] || [])];
  }

  const matches = copy['MATCH'] || [];
  const liveMatchIndex = matches.findIndex((m) => m.MatchStatus === 'Live' || m.MatchStatus === 'In Progress');

  if (liveMatchIndex !== -1) {
    const liveMatch = { ...matches[liveMatchIndex] };
    const matchId = liveMatch.MatchID;

    // 1. Get and update Team Participation for Live Match
    const participations = copy['TEAM_MATCH_PARTICIPATION'] || [];
    const matchPartsIndices = participations
      .map((p, idx) => (p.MatchID === matchId ? idx : -1))
      .filter((idx) => idx !== -1);

    if (matchPartsIndices.length >= 2) {
      const idx1 = matchPartsIndices[0];
      const idx2 = matchPartsIndices[1];
      const part1 = { ...participations[idx1] };
      const part2 = { ...participations[idx2] };

      // Award a round win to one of the teams randomly
      const team1Scores = Math.random() > 0.48;
      if (team1Scores) {
        part1.TeamScore = (Number(part1.TeamScore) || 0) + 1;
      } else {
        part2.TeamScore = (Number(part2.TeamScore) || 0) + 1;
      }

      // Check if victory threshold of 13 rounds is achieved
      if (part1.TeamScore >= 13 || part2.TeamScore >= 13) {
        if (part1.TeamScore >= 13) {
          part1.Result = 'Win';
          part2.Result = 'Loss';
        } else {
          part1.Result = 'Loss';
          part2.Result = 'Win';
        }
        liveMatch.MatchResult = `${part1.TeamScore} - ${part2.TeamScore}`;
        liveMatch.MatchStatus = 'Completed';

        // Advance next Scheduled match to Live if available
        const nextScheduledIdx = matches.findIndex(
          (m, i) => i !== liveMatchIndex && m.MatchStatus === 'Scheduled'
        );
        if (nextScheduledIdx !== -1) {
          matches[nextScheduledIdx] = {
            ...matches[nextScheduledIdx],
            MatchStatus: 'Live',
            MatchResult: '0 - 0'
          };
        }
      } else {
        liveMatch.MatchResult = `${part1.TeamScore} - ${part2.TeamScore}`;
      }

      participations[idx1] = part1;
      participations[idx2] = part2;
      copy['TEAM_MATCH_PARTICIPATION'] = participations;
    }

    matches[liveMatchIndex] = liveMatch;
    copy['MATCH'] = matches;

    // 2. Jitter Player Latency and Combat Telemetry for Live Match using official scoring model
    const performances = copy['PLAYER_PERFORMANCE'] || [];
    let hasLatencySpike = false;
    let spikedPlayerId = '';
    let spikedLatency = 0;

    const updatedPerformances = performances.map((perf) => {
      if (perf.MatchID !== matchId) return perf;

      // Base latency 9-32ms, occasional spikes up to 148ms
      const isSpike = Math.random() < 0.05;
      let newLatency = Math.round((9 + Math.random() * 22) * 10) / 10;
      if (isSpike) {
        newLatency = Math.round((120 + Math.random() * 28) * 10) / 10;
        hasLatencySpike = true;
        spikedPlayerId = perf.PlayerID;
        spikedLatency = newLatency;
      }

      // Generate round combat events
      const getsKill = Math.random() < 0.32;
      const getsSecondKill = getsKill && Math.random() < 0.28;
      const getsThirdKill = getsSecondKill && Math.random() < 0.15;
      const getsNonDamageAssist = Math.random() < 0.20;
      const getsDamageAssist = Math.random() < 0.16;
      const getsDeath = Math.random() < 0.28;

      const killsList: number[] = [];
      if (getsKill) killsList.push(Math.floor(Math.random() * 3) + 3); // 3-5 alive
      if (getsSecondKill) killsList.push(Math.floor(Math.random() * 2) + 2); // 2-3 alive
      if (getsThirdKill) killsList.push(1); // 1 alive

      const roundDamage = Math.round(70 + killsList.length * 90 + (getsDamageAssist ? 60 : 0) + Math.random() * 40);

      const roundBreakdown = calculateRoundCombatScore({
        damage: roundDamage,
        killsEnemiesAlive: killsList,
        nonDamageAssists: getsNonDamageAssist ? 1 : 0
      });

      const newRounds = (Number(perf.RoundsPlayed) || 20) + 1;
      const newTotalCombatScore = (Number(perf.TotalCombatScore) || 4500) + roundBreakdown.totalRoundCombatScore;
      const newDamageDealt = (Number(perf.DamageDealt) || 3000) + roundBreakdown.damagePoints;
      const newKills = (Number(perf.Kills) || 0) + killsList.length;
      const newDeaths = (Number(perf.Deaths) || 0) + (getsDeath ? 1 : 0);
      const newAssists = (Number(perf.Assists) || 0) + (getsDamageAssist ? 1 : 0) + (getsNonDamageAssist ? 1 : 0);
      const newFk = (Number(perf.FirstKills) || 0) + (killsList.includes(5) ? 1 : 0);
      const newFd = (Number(perf.FirstDeaths) || 0) + (getsDeath && Math.random() < 0.15 ? 1 : 0);
      const newTwoK = (Number(perf.TwoKRounds) || 0) + (killsList.length === 2 ? 1 : 0);
      const newThreeK = (Number(perf.ThreeKRounds) || 0) + (killsList.length === 3 ? 1 : 0);

      const newAcs = calculateACS(newTotalCombatScore, newRounds);
      const newAdr = calculateADR(newDamageDealt, newRounds);
      const newKd = newDeaths > 0 ? Math.round((newKills / newDeaths) * 100) / 100 : newKills;
      const newImpact = calculateImpactIndex({
        acs: newAcs,
        adr: newAdr,
        kastPct: Number(perf.KASTPct) || 75.0,
        kd: newKd,
        fkFdDiffPerMap: newFk - newFd
      });

      return {
        ...perf,
        InternetLatencyMs: newLatency,
        RoundsPlayed: newRounds,
        TotalCombatScore: newTotalCombatScore,
        DamageDealt: newDamageDealt,
        ACS: newAcs,
        Score: newAcs,
        ADR: newAdr,
        Kills: newKills,
        Assists: newAssists,
        Deaths: newDeaths,
        FirstKills: newFk,
        FirstDeaths: newFd,
        TwoKRounds: newTwoK,
        ThreeKRounds: newThreeK,
        ImpactIndex: newImpact
      };
    });

    copy['PLAYER_PERFORMANCE'] = updatedPerformances;

    // 3. ~1 in 25 ticks: Create Anti-Cheat 'Under Review' inspection flag on latency anomaly
    if (hasLatencySpike && (Math.random() < 0.15 || Math.random() < 0.04)) {
      const antiCheats = copy['ANTI_CHEAT'] || [];
      const newAcId = `AC${String(antiCheats.length + 1).padStart(2, '0')}`;
      const newIncident = {
        AntiCheatID: newAcId,
        MatchID: matchId,
        PlayerID: spikedPlayerId || 'P02',
        CheatStatus: 'Under Review',
        MonitoringDetails: `Telemetry anomaly: Latency burst to ${spikedLatency}ms during rapid target tracking sequence`
      };
      copy['ANTI_CHEAT'] = [newIncident, ...antiCheats];
    }

    // 4. Random-walk Live Match Stream Viewership
    const streams = copy['MATCH_STREAM'] || [];
    const updatedStreams = streams.map((s) => {
      if (s.MatchID === matchId) {
        const delta = Math.round((Math.random() - 0.48) * 8000);
        return {
          ...s,
          PeakViewers: Math.max(45000, (Number(s.PeakViewers) || 120000) + delta)
        };
      }
      return s;
    });
    copy['MATCH_STREAM'] = updatedStreams;
  }

  return copy;
}

export function getActiveLiveMatch(tableData: Record<string, any[]>) {
  const matches = tableData['MATCH'] || [];
  const liveMatch = matches.find((m) => m.MatchStatus === 'Live' || m.MatchStatus === 'In Progress') || matches[0];
  if (!liveMatch) return null;

  const participations = (tableData['TEAM_MATCH_PARTICIPATION'] || []).filter(
    (p) => p.MatchID === liveMatch.MatchID
  );
  const teams = tableData['TEAM'] || [];
  const team1 = teams.find((t) => t.TeamID === participations[0]?.TeamID);
  const team2 = teams.find((t) => t.TeamID === participations[1]?.TeamID);

  return {
    match: liveMatch,
    part1: participations[0] || { TeamScore: 0, Result: 'In Progress' },
    part2: participations[1] || { TeamScore: 0, Result: 'In Progress' },
    team1: team1 || { TeamName: 'Team Alpha', TeamTag: 'ALP' },
    team2: team2 || { TeamName: 'Team Omega', TeamTag: 'OMG' }
  };
}

export function getSimulationStats(tableData: Record<string, any[]>): SimulationStats {
  const streams = tableData['MATCH_STREAM'] || [];
  const liveViewers = streams.reduce((acc, s) => acc + (Number(s.PeakViewers) || 0), 0);

  const matches = tableData['MATCH'] || [];
  const activeMatches = matches.filter((m) => m.MatchStatus === 'Live' || m.MatchStatus === 'In Progress').length;

  const perfs = tableData['PLAYER_PERFORMANCE'] || [];
  const avgLatency =
    perfs.length > 0
      ? Math.round(
          perfs.reduce((acc, p) => acc + (Number(p.InternetLatencyMs) || 20), 0) / perfs.length
        )
      : 22;

  const antiCheat = tableData['ANTI_CHEAT'] || [];
  const underReviewCount = antiCheat.filter((a) => a.CheatStatus === 'Under Review').length;

  return {
    liveViewers,
    activeMatches,
    avgLatency,
    underReviewCount
  };
}
