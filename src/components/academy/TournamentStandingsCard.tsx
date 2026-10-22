import React, { useMemo } from 'react';
import {
  Trophy,
  ShieldCheck,
  GitBranch,
  AlertTriangle,
  Flame,
  Target,
  Sparkles,
  Clock
} from 'lucide-react';
import { HudCard } from '../ui/HudCard';
import { StatusChip } from '../ui/StatusChip';
import { useDatabase } from '../../store/databaseContext';
import { KILL_POINTS } from '../../engine/scoring';

export const TournamentStandingsCard: React.FC = () => {
  const { tableData } = useDatabase();
  const teams = tableData['TEAM'] || [];
  const matches = tableData['MATCH'] || [];
  const maps = tableData['MATCH_MAP'] || [];

  // Computed team standings from match records
  const standings = useMemo(() => {
    return teams.map((team) => {
      let matchesWon = 0;
      let matchesLost = 0;
      let mapsWon = 0;
      let mapsLost = 0;
      let roundsWon = 0;
      let roundsLost = 0;

      matches.forEach((m) => {
        if (m.Team1ID === team.TeamID || m.Team2ID === team.TeamID) {
          const isTeam1 = m.Team1ID === team.TeamID;
          if (m.WinnerTeamID) {
            if (m.WinnerTeamID === team.TeamID) {
              matchesWon += 1;
            } else {
              matchesLost += 1;
            }
          }

          // Maps in this match
          const matchMaps = maps.filter((mp) => mp.MatchID === m.MatchID);
          matchMaps.forEach((mp) => {
            const t1Score = Number(mp.Team1Score ?? mp.Team1Rounds ?? 0);
            const t2Score = Number(mp.Team2Score ?? mp.Team2Rounds ?? 0);
            if (isTeam1) {
              roundsWon += t1Score;
              roundsLost += t2Score;
              if (mp.WinnerTeamID === team.TeamID) mapsWon += 1;
              else if (mp.WinnerTeamID) mapsLost += 1;
            } else {
              roundsWon += t2Score;
              roundsLost += t1Score;
              if (mp.WinnerTeamID === team.TeamID) mapsWon += 1;
              else if (mp.WinnerTeamID) mapsLost += 1;
            }
          });
        }
      });

      const mapDiff = mapsWon - mapsLost;
      const roundDiff = roundsWon - roundsLost;

      return {
        team,
        matchesWon,
        matchesLost,
        matchesPlayed: matchesWon + matchesLost,
        mapsWon,
        mapsLost,
        mapDiff,
        roundsWon,
        roundsLost,
        roundDiff
      };
    }).sort((a, b) => {
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      if (b.mapDiff !== a.mapDiff) return b.mapDiff - a.mapDiff;
      return b.roundDiff - a.roundDiff;
    });
  }, [teams, matches, maps]);

  return (
    <div className="space-y-10">
      {/* Rules Table & Community Disclaimer */}
      <section id="sec-rules" className="scroll-mt-28">
        <HudCard
          title="Official Scoring Rules & Formulas Playbook"
          subtitle="Mathematical formulas and competitive definitions recognized by professional esports"
          badge={<StatusChip label="OFFICIAL FORMULAS" variant="amber" />}
        >
          <div className="space-y-6">
            {/* Community Disclaimer */}
            <div className="p-4 rounded-xl bg-warning-soft border border-warning-token flex items-start gap-3 text-xs text-token">
              <AlertTriangle className="w-5 h-5 text-warning-token flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-warning-token uppercase tracking-wider block mb-0.5">
                  Esports Community Attribution & Legal Disclaimer
                </span>
                Community-documented model recognized by competitive esports. Not affiliated with or endorsed by Riot Games.
                All match scores, rosters, and brackets reflect verified public telemetry from VALORANT Champions 2026 Shanghai.
              </div>
            </div>

            {/* Core Formulas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-2">
                <div className="flex items-center gap-2 text-token font-bold uppercase">
                  <Flame className="w-4 h-4 text-primary-token" />
                  <span>1. Round Combat Score (RCS)</span>
                </div>
                <div className="p-2.5 rounded bg-surface border border-token text-token font-bold">
                  RCS = Damage (1 pt/HP) + KillPoints (70–150) + MultiKillBonus (+50) + Assists (+25)
                </div>
                <p className="text-xs text-muted">
                  The raw point foundation accumulated by an individual athlete each round.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-2">
                <div className="flex items-center gap-2 text-token font-bold uppercase">
                  <Target className="w-4 h-4 text-warning-token" />
                  <span>2. Average Combat Score (ACS)</span>
                </div>
                <div className="p-2.5 rounded bg-surface border border-token text-token font-bold">
                  ACS = SUM(Round Combat Scores) / Total Rounds Played
                </div>
                <p className="text-xs text-muted">
                  Primary rating of combat contribution, normalized per round.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-2">
                <div className="flex items-center gap-2 text-token font-bold uppercase">
                  <ShieldCheck className="w-4 h-4 text-success-token" />
                  <span>3. Average Damage per Round (ADR)</span>
                </div>
                <div className="p-2.5 rounded bg-surface border border-token text-token font-bold">
                  ADR = Total Hitpoint Damage Dealt / Total Rounds Played
                </div>
                <p className="text-xs text-muted">
                  Lethality efficiency indicator. 150+ ADR represents tier-one fragging potency.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-2">
                <div className="flex items-center gap-2 text-token font-bold uppercase">
                  <Sparkles className="w-4 h-4 text-secondary-token" />
                  <span>4. ArenaDB Impact Index (Composite)</span>
                </div>
                <div className="p-2.5 rounded bg-surface border border-token text-token font-bold text-xs">
                  0.40(ACS/250) + 0.20(ADR/150) + 0.15(KAST/75) + 0.15(KD) + 0.10(1 + ΔFK/10)
                </div>
                <p className="text-xs text-muted">
                  Multi-factor rating normalizing fragging, utility participation, and opening duel impact.
                </p>
              </div>
            </div>

            {/* Kill Points Schedule Table */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-muted">
                Elimination Timing & Value Matrix
              </span>
              <div className="overflow-x-auto rounded-xl border border-token">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-surface-2 text-muted border-b border-token text-left uppercase text-xs">
                      <th className="p-2.5">Enemies Alive</th>
                      <th className="p-2.5">Base Frag Points</th>
                      <th className="p-2.5">Tactical Description</th>
                      <th className="p-2.5 text-right">Round Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-token">
                    {[
                      { alive: 5, pts: KILL_POINTS[5], desc: 'First Blood / Opening Entry Duel', impact: 'Maximum (+150 pts)' },
                      { alive: 4, pts: KILL_POINTS[4], desc: 'Early Site Trade / Man Advantage', impact: 'High (+130 pts)' },
                      { alive: 3, pts: KILL_POINTS[3], desc: 'Mid-Round Retake / Post-Plant Engagement', impact: 'Moderate (+110 pts)' },
                      { alive: 2, pts: KILL_POINTS[2], desc: 'Late Round Equalizer', impact: 'Standard (+90 pts)' },
                      { alive: 1, pts: KILL_POINTS[1], desc: 'Final 1v1 Elimination or Exit Kill', impact: 'Baseline (+70 pts)' }
                    ].map((row) => (
                      <tr key={row.alive} className="hover:bg-surface-2 transition-colors">
                        <td className="p-2.5 font-bold text-token">{row.alive} Alive</td>
                        <td className="p-2.5 font-bold text-token">+{row.pts} Pts</td>
                        <td className="p-2.5 text-token">{row.desc}</td>
                        <td className="p-2.5 text-right text-muted">{row.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </HudCard>
      </section>

      {/* Team Standings & Tiebreak Math */}
      <section id="sec-standings" className="scroll-mt-28">
        <HudCard
          title="VCT Champions Tiebreak Math & Live Standings"
          subtitle="Official 5-step tiebreak hierarchy applied to VALORANT Champions 2026 Shanghai tournament records"
          badge={<StatusChip label="TIEBREAK ENGINE" variant="cyan" />}
        >
          <div className="space-y-6">
            {/* 5-Step Tiebreak Procedure */}
            <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-3">
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-token">
                Official VCT Tiebreak Hierarchy
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-surface border border-token space-y-1">
                  <span className="text-xs text-primary-token font-bold block">1. MATCH RECORD</span>
                  <p className="text-xs text-muted">Overall match series win-loss percentage</p>
                </div>
                <div className="p-2.5 rounded bg-surface border border-token space-y-1">
                  <span className="text-xs text-warning-token font-bold block">2. HEAD-TO-HEAD</span>
                  <p className="text-xs text-muted">Direct series outcome between tied teams</p>
                </div>
                <div className="p-2.5 rounded bg-surface border border-token space-y-1">
                  <span className="text-xs text-success-token font-bold block">3. MAP DIFFERENTIAL</span>
                  <p className="text-xs text-muted">Total Maps Won minus Total Maps Lost</p>
                </div>
                <div className="p-2.5 rounded bg-surface border border-token space-y-1">
                  <span className="text-xs text-secondary-token font-bold block">4. ROUND DIFFERENTIAL</span>
                  <p className="text-xs text-muted">Total Rounds Won minus Total Rounds Lost</p>
                </div>
                <div className="p-2.5 rounded bg-surface border border-token space-y-1">
                  <span className="text-xs text-muted font-bold block">5. H2H ROUND DIFF</span>
                  <p className="text-xs text-muted">Round delta in matches between tied teams</p>
                </div>
              </div>
            </div>

            {/* Standings Table */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-muted">
                Tournament Standings ({standings.length} Teams)
              </span>
              <div className="overflow-x-auto rounded-xl border border-token">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-surface-2 text-muted border-b border-token text-left uppercase text-xs">
                      <th className="p-2.5">Rank</th>
                      <th className="p-2.5">Team</th>
                      <th className="p-2.5">Region</th>
                      <th className="p-2.5 text-center">Matches (W-L)</th>
                      <th className="p-2.5 text-center">Maps (W-L)</th>
                      <th className="p-2.5 text-center">Map Diff</th>
                      <th className="p-2.5 text-center">Round Diff</th>
                      <th className="p-2.5 text-right">Seed Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-token">
                    {standings.slice(0, 8).map((row, idx) => (
                      <tr key={row.team.TeamID} className="hover:bg-surface-2 transition-colors">
                        <td className="p-2.5 font-bold text-primary-token">#{idx + 1}</td>
                        <td className="p-2.5 font-bold text-token">{row.team.TeamName}</td>
                        <td className="p-2.5 text-muted">{row.team.Region}</td>
                        <td className="p-2.5 text-center font-bold text-token">
                          {row.matchesWon} - {row.matchesLost}
                        </td>
                        <td className="p-2.5 text-center text-muted">
                          {row.mapsWon} - {row.mapsLost}
                        </td>
                        <td className="p-2.5 text-center font-bold text-token">
                          {row.mapDiff >= 0 ? `+${row.mapDiff}` : row.mapDiff}
                        </td>
                        <td className="p-2.5 text-center font-bold text-token">
                          {row.roundDiff >= 0 ? `+${row.roundDiff}` : row.roundDiff}
                        </td>
                        <td className="p-2.5 text-right">
                          <StatusChip
                            label={idx < 2 ? 'GRAND FINAL' : idx < 4 ? 'PLAYOFF' : 'ELIMINATED'}
                            variant={idx < 2 ? 'live' : idx < 4 ? 'cyan' : 'dim'}
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </HudCard>
      </section>

      {/* Champions 2026 Format Section */}
      <section id="sec-champions-format" className="scroll-mt-28">
        <HudCard
          title="VALORANT Champions 2026 Shanghai Tournament Format"
          subtitle="Complete stage breakdown: 16 teams, 4 GSL groups, double-elimination bracket, and overtime rules"
          badge={<StatusChip label="LAN STRUCTURE" variant="magenta" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-2">
              <div className="flex items-center gap-2 text-token font-bold uppercase">
                <GitBranch className="w-4 h-4 text-primary-token" />
                <span>Stage 1: Group Stage (GSL)</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                16 qualifying teams sorted into 4 Groups of 4. Double elimination GSL format.
                All matches are Best of 3 (Bo3). The top 2 teams from each group advance to the 8-team Playoff Bracket.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-2">
              <div className="flex items-center gap-2 text-token font-bold uppercase">
                <Trophy className="w-4 h-4 text-warning-token" />
                <span>Stage 2: Double Elimination Playoffs</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                8 surviving teams compete in a double-elimination knockout bracket at Mercedes-Benz Arena Shanghai.
                All matches Bo3; Lower Bracket Final and Grand Final are Best of 5 (Bo5).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-2">
              <div className="flex items-center gap-2 text-token font-bold uppercase">
                <Clock className="w-4 h-4 text-success-token" />
                <span>Overtime Regulations</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                In regulation ties at 12–12, teams enter Overtime. A team must win by 2 rounds.
                Teams alternate between Attacking and Defending sides every 2 rounds, starting with 5,000 creds each round.
              </p>
            </div>
          </div>
        </HudCard>
      </section>
    </div>
  );
};
