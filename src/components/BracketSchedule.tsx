import React, { useState } from 'react';
import {
  GitBranch,
  Trophy,
  ExternalLink
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import { HudCard } from './ui/HudCard';
import { StatusPill } from './ui/StatusPill';

export const BracketSchedule: React.FC = () => {
  const { tableData, setActiveTab, setSelectedTableId } = useDatabase();
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  const matches = tableData['MATCH'] || [];
  const stages = tableData['TOURNAMENT_STAGE'] || [];
  const teams = tableData['TEAM'] || [];
  const participations = tableData['TEAM_MATCH_PARTICIPATION'] || [];
  const referees = tableData['REFEREE'] || [];

  // Helper to get teams & scores for a match
  const getMatchPairing = (matchId: string) => {
    const match = matches.find((m) => m.MatchID === matchId);
    const parts = participations.filter((p) => p.MatchID === matchId);
    const team1 = teams.find((t) => t.TeamID === (parts[0]?.TeamID || match?.Team1ID));
    const team2 = teams.find((t) => t.TeamID === (parts[1]?.TeamID || match?.Team2ID));

    const score1 = parts[0]?.TeamScore ?? (match?.MatchScore ? parseInt(match.MatchScore.split('-')[0], 10) : 0);
    const score2 = parts[1]?.TeamScore ?? (match?.MatchScore ? parseInt(match.MatchScore.split('-')[1], 10) : 0);

    return {
      part1: parts[0] || { TeamScore: score1, Result: score1 > score2 ? 'Win' : 'Loss' },
      part2: parts[1] || { TeamScore: score2, Result: score2 > score1 ? 'Win' : 'Loss' },
      team1: team1 || { TeamName: 'TBD', TeamTag: 'TBD', Ranking: 0 },
      team2: team2 || { TeamName: 'TBD', TeamTag: 'TBD', Ranking: 0 }
    };
  };

  // Bracket Structure (Quarterfinals -> Semifinals -> Grand Finals)
  const playoffMatches = matches.filter((m) => m.StageID !== 'STG01');
  const qfMatches = playoffMatches.filter((m) => ['M13', 'M14', 'M15', 'M16'].includes(m.MatchID));
  const sfMatches = playoffMatches.filter((m) => ['M17', 'M18'].includes(m.MatchID));
  const gfMatches = playoffMatches.filter((m) => m.MatchID === 'M22');

  // Filtered Schedule List
  const filteredMatches = matches.filter((m) => {
    if (selectedStage === 'ALL') return true;
    return m.StageID === selectedStage;
  });

  const handleInspectMatch = (_matchId: string) => {
    setSelectedTableId('MATCH');
    setActiveTab('vault');
  };

  const renderBracketMatchCard = (match: any, roundLabel: string) => {
    if (!match) {
      return (
        <div className="w-64 p-3 rounded-lg bg-surface border border-dashed border-token-strong text-center text-xs font-mono text-muted">
          TBD Matchup
        </div>
      );
    }

    const { part1, part2, team1, team2 } = getMatchPairing(match.MatchID);
    const isLive = match.MatchStatus === 'Live' || match.MatchStatus === 'In Progress';
    const isCompleted = match.MatchStatus === 'Completed';

    return (
      <div
        key={match.MatchID}
        onClick={() => handleInspectMatch(match.MatchID)}
        className={`w-64 rounded-lg p-3 transition-all cursor-pointer relative ${
          isLive
            ? 'bg-surface border-2 border-primary shadow-md'
            : 'bg-surface border border-token hover:border-token-strong shadow-sm'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between text-xs font-mono mb-2 pb-1.5 border-b border-token">
          <span className="text-muted">{match.MatchID} • {roundLabel}</span>
          {isLive ? (
            <StatusPill variant="live" size="sm">LIVE</StatusPill>
          ) : isCompleted ? (
            <span className="text-success-token font-bold text-xs">FINAL</span>
          ) : (
            <span className="text-muted text-xs">{match.MatchTime}</span>
          )}
        </div>

        {/* Team 1 */}
        <div
          className={`flex items-center justify-between py-1.5 px-2 rounded-md font-mono text-xs mb-1 ${
            part1.Result === 'Win'
              ? 'bg-primary-soft text-primary-token font-bold'
              : 'text-token'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted w-4">#{team1.Ranking || '-'}</span>
            <span className="truncate">{team1.TeamName}</span>
          </div>
          <span className="font-heading text-sm font-bold flex-shrink-0 ml-2">
            {part1.TeamScore ?? 0}
          </span>
        </div>

        {/* Team 2 */}
        <div
          className={`flex items-center justify-between py-1.5 px-2 rounded-md font-mono text-xs ${
            part2.Result === 'Win'
              ? 'bg-primary-soft text-primary-token font-bold'
              : 'text-token'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted w-4">#{team2.Ranking || '-'}</span>
            <span className="truncate">{team2.TeamName}</span>
          </div>
          <span className="font-heading text-sm font-bold flex-shrink-0 ml-2">
            {part2.TeamScore ?? 0}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <GitBranch className="w-7 h-7 md:w-8 md:h-8 text-primary-token flex-shrink-0" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-token">
              Playoff Bracket & Match Schedule
            </h2>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            Championship Single-Elimination Tournament Tree & Fixture Grid
          </p>
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedStage('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              selectedStage === 'ALL'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'bg-surface text-muted border border-token hover:text-token hover:border-token-strong'
            }`}
          >
            ALL STAGES
          </button>
          {stages.map((stg) => (
            <button
              key={stg.StageID}
              type="button"
              onClick={() => setSelectedStage(stg.StageID)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                selectedStage === stg.StageID
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface text-muted border border-token hover:text-token hover:border-token-strong'
              }`}
            >
              {stg.StageName.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Tournament Bracket Tree */}
      <HudCard
        title="Playoff Championship Tree"
        subtitle="Single-elimination road to Grand Finals • First team to 13 rounds advances"
        badge={<StatusPill variant="primary" size="sm">STAGE 03 / 04</StatusPill>}
      >
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-[850px] flex items-center justify-between gap-8 py-4 relative">
            {/* Quarterfinals Column */}
            <div className="flex flex-col gap-6">
              <div className="text-xs font-mono font-bold text-primary-token uppercase tracking-wider pb-2 border-b border-token">
                Quarterfinals (BO1)
              </div>
              <div className="space-y-4">
                {qfMatches.map((m) => renderBracketMatchCard(m, 'QF'))}
              </div>
            </div>

            {/* Semifinals Column */}
            <div className="flex flex-col gap-16">
              <div className="text-xs font-mono font-bold text-accent-token uppercase tracking-wider pb-2 border-b border-token">
                Semifinals (BO3)
              </div>
              <div className="space-y-12">
                {sfMatches.map((m) => renderBracketMatchCard(m, 'SF'))}
              </div>
            </div>

            {/* Grand Finals Column */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-warning-token uppercase tracking-wider pb-2 border-b border-token">
                <Trophy className="w-4 h-4 text-warning-token" />
                Grand Finals (BO5)
              </div>
              <div>
                {gfMatches.map((m) => renderBracketMatchCard(m, 'GRAND FINAL'))}
              </div>
            </div>
          </div>
        </div>
      </HudCard>

      {/* Master Match Fixture Schedule Table */}
      <HudCard
        title="Championship Fixtures Grid"
        subtitle={`Showing ${filteredMatches.length} tournament matches across all venues`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-token text-muted uppercase tracking-wider">
                <th className="py-2.5 px-3">Match ID</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Matchup</th>
                <th className="py-2.5 px-3">Score / Result</th>
                <th className="py-2.5 px-3">Referee</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-token">
              {filteredMatches.map((match) => {
                const { part1, part2, team1, team2 } = getMatchPairing(match.MatchID);
                const stage = stages.find((s) => s.StageID === match.StageID);
                const ref = referees.find((r) => r.RefereeID === match.RefereeID);
                const isLive = match.MatchStatus === 'Live' || match.MatchStatus === 'In Progress';

                return (
                  <tr
                    key={match.MatchID}
                    className="hover:bg-surface-2 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-primary-token">
                      {match.MatchID}
                    </td>
                    <td className="py-2.5 px-3 text-token">
                      {stage?.StageName || match.StageID}
                    </td>
                    <td className="py-2.5 px-3 text-muted">
                      {match.MatchDate} • {match.MatchTime}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-token">{team1.TeamName}</span>
                        <span className="text-muted">vs</span>
                        <span className="text-token">{team2.TeamName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-token">
                      {match.MatchResult || `${part1.TeamScore} - ${part2.TeamScore}`}
                    </td>
                    <td className="py-2.5 px-3 text-muted">
                      {ref ? `${ref.RefereeName} (${ref.CertificationLevel})` : match.RefereeID}
                    </td>
                    <td className="py-2.5 px-3">
                      {isLive ? (
                        <StatusPill variant="live" size="sm">LIVE</StatusPill>
                      ) : match.MatchStatus === 'Completed' ? (
                        <StatusPill variant="success" size="sm">FINAL</StatusPill>
                      ) : (
                        <StatusPill variant="neutral" size="sm">SCHEDULED</StatusPill>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleInspectMatch(match.MatchID)}
                        className="p-1 text-muted hover:text-primary-token rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
                        title="View records in Data Vault"
                      >
                        <ExternalLink className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </HudCard>
    </div>
  );
};
