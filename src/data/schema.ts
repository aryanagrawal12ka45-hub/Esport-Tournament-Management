export interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  referencesTable?: string;
  referencesColumn?: string;
  isNullable?: boolean;
  defaultValue?: string;
  description?: string;
}

export type SubsystemCategory =
  | 'Organization'
  | 'Match Telemetry'
  | 'Finance & Results'
  | 'Broadcast & Audience'
  | 'Integrity & Officials';

export interface SubsystemMeta {
  id: SubsystemCategory;
  label: string;
  color: string;
  accentBg: string;
  iconName: string;
  description: string;
}

export const SUBSYSTEMS_META: Record<SubsystemCategory, SubsystemMeta> = {
  Organization: {
    id: 'Organization',
    label: 'Organization',
    color: 'var(--chart-1)',
    accentBg: 'var(--primary-soft)',
    iconName: 'Users',
    description: 'Tournaments, game titles, stages, teams, players, staff & certified equipment.'
  },
  'Match Telemetry': {
    id: 'Match Telemetry',
    label: 'Match Telemetry',
    color: 'var(--chart-3)',
    accentBg: 'var(--surface-2)',
    iconName: 'Activity',
    description: 'Fixtures, team match participation scores, and real-time player combat telemetry.'
  },
  'Finance & Results': {
    id: 'Finance & Results',
    label: 'Finance & Results',
    color: 'var(--chart-2)',
    accentBg: 'var(--accent-soft)',
    iconName: 'Trophy',
    description: 'Corporate sponsors, tournament sponsorships, prize escrow, ledger & awards.'
  },
  'Broadcast & Audience': {
    id: 'Broadcast & Audience',
    label: 'Broadcast & Audience',
    color: 'var(--chart-5)',
    accentBg: 'var(--surface-2)',
    iconName: 'Tv',
    description: 'Streaming platforms, peak concurrent viewer metrics, registered fans & MVP votes.'
  },
  'Integrity & Officials': {
    id: 'Integrity & Officials',
    label: 'Integrity & Officials',
    color: 'var(--chart-4)',
    accentBg: 'var(--success-soft)',
    iconName: 'Shield',
    description: 'Tournament administrators, referees, anti-cheat surveillance & disciplinary actions.'
  }
};

export interface DatabaseTable {
  id: string;
  name: string;
  category: SubsystemCategory;
  description: string;
  iconName: string;
  columns: TableColumn[];
  initialRows: Record<string, any>[];
  canvasPos: { x: number; y: number };
}

export interface TableRelation {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  type: 'one-to-many' | 'many-to-one';
  label: string;
}

export const INITIAL_RELATIONS: TableRelation[] = [
  // Organization Relations
  { id: 'rel_admin_tournament', sourceTable: 'ADMINISTRATOR', sourceColumn: 'AdminID', targetTable: 'TOURNAMENT', targetColumn: 'AdminID', type: 'one-to-many', label: 'manages' },
  { id: 'rel_tournament_stage', sourceTable: 'TOURNAMENT', sourceColumn: 'TournamentID', targetTable: 'TOURNAMENT_STAGE', targetColumn: 'TournamentID', type: 'one-to-many', label: 'contains' },
  { id: 'rel_team_player', sourceTable: 'TEAM', sourceColumn: 'TeamID', targetTable: 'PLAYER', targetColumn: 'TeamID', type: 'one-to-many', label: 'contracts' },
  { id: 'rel_team_staff', sourceTable: 'TEAM', sourceColumn: 'TeamID', targetTable: 'TEAM_STAFF', targetColumn: 'TeamID', type: 'one-to-many', label: 'employs' },

  // Match Telemetry Relations
  { id: 'rel_stage_match', sourceTable: 'TOURNAMENT_STAGE', sourceColumn: 'StageID', targetTable: 'MATCH', targetColumn: 'StageID', type: 'one-to-many', label: 'schedules' },
  { id: 'rel_game_match', sourceTable: 'GAME', sourceColumn: 'GameID', targetTable: 'MATCH', targetColumn: 'GameID', type: 'one-to-many', label: 'played in' },
  { id: 'rel_referee_match', sourceTable: 'REFEREE', sourceColumn: 'RefereeID', targetTable: 'MATCH', targetColumn: 'RefereeID', type: 'one-to-many', label: 'officiates' },
  { id: 'rel_match_team_part', sourceTable: 'MATCH', sourceColumn: 'MatchID', targetTable: 'TEAM_MATCH_PARTICIPATION', targetColumn: 'MatchID', type: 'one-to-many', label: 'includes' },
  { id: 'rel_team_part_team', sourceTable: 'TEAM', sourceColumn: 'TeamID', targetTable: 'TEAM_MATCH_PARTICIPATION', targetColumn: 'TeamID', type: 'one-to-many', label: 'competes in' },
  { id: 'rel_match_map', sourceTable: 'MATCH', sourceColumn: 'MatchID', targetTable: 'MATCH_MAP', targetColumn: 'MatchID', type: 'one-to-many', label: 'maps played' },
  { id: 'rel_map_winner_team', sourceTable: 'TEAM', sourceColumn: 'TeamID', targetTable: 'MATCH_MAP', targetColumn: 'WinnerTeamID', type: 'one-to-many', label: 'won by' },
  { id: 'rel_player_perf', sourceTable: 'PLAYER', sourceColumn: 'PlayerID', targetTable: 'PLAYER_PERFORMANCE', targetColumn: 'PlayerID', type: 'one-to-many', label: 'records' },
  { id: 'rel_match_perf', sourceTable: 'MATCH', sourceColumn: 'MatchID', targetTable: 'PLAYER_PERFORMANCE', targetColumn: 'MatchID', type: 'one-to-many', label: 'telemetry for' },
  { id: 'rel_map_player_perf', sourceTable: 'MATCH_MAP', sourceColumn: 'MapID', targetTable: 'PLAYER_PERFORMANCE', targetColumn: 'MapID', type: 'one-to-many', label: 'map telemetry' },
  { id: 'rel_equip_perf', sourceTable: 'EQUIPMENT', sourceColumn: 'EquipmentID', targetTable: 'PLAYER_PERFORMANCE', targetColumn: 'EquipmentID', type: 'one-to-many', label: 'equipped' },

  // Integrity Relations
  { id: 'rel_match_anticheat', sourceTable: 'MATCH', sourceColumn: 'MatchID', targetTable: 'ANTI_CHEAT', targetColumn: 'MatchID', type: 'one-to-many', label: 'monitors' },
  { id: 'rel_player_anticheat', sourceTable: 'PLAYER', sourceColumn: 'PlayerID', targetTable: 'ANTI_CHEAT', targetColumn: 'PlayerID', type: 'one-to-many', label: 'audited' },
  { id: 'rel_match_disc', sourceTable: 'MATCH', sourceColumn: 'MatchID', targetTable: 'DISCIPLINARY_ACTION', targetColumn: 'MatchID', type: 'one-to-many', label: 'infraction in' },
  { id: 'rel_player_disc', sourceTable: 'PLAYER', sourceColumn: 'PlayerID', targetTable: 'DISCIPLINARY_ACTION', targetColumn: 'PlayerID', type: 'one-to-many', label: 'penalized' },
  { id: 'rel_team_disc', sourceTable: 'TEAM', sourceColumn: 'TeamID', targetTable: 'DISCIPLINARY_ACTION', targetColumn: 'TeamID', type: 'one-to-many', label: 'sanctioned' },

  // Finance & Results Relations
  { id: 'rel_tourn_prizepool', sourceTable: 'TOURNAMENT', sourceColumn: 'TournamentID', targetTable: 'PRIZE_POOL', targetColumn: 'TournamentID', type: 'one-to-many', label: 'funds' },
  { id: 'rel_tourn_sponsor_t', sourceTable: 'TOURNAMENT', sourceColumn: 'TournamentID', targetTable: 'TOURNAMENT_SPONSOR', targetColumn: 'TournamentID', type: 'one-to-many', label: 'funded by' },
  { id: 'rel_tourn_sponsor_s', sourceTable: 'SPONSOR', sourceColumn: 'SponsorID', targetTable: 'TOURNAMENT_SPONSOR', targetColumn: 'SponsorID', type: 'one-to-many', label: 'allocates' },
  { id: 'rel_tourn_finrecord', sourceTable: 'TOURNAMENT', sourceColumn: 'TournamentID', targetTable: 'FINANCIAL_RECORD', targetColumn: 'TournamentID', type: 'one-to-many', label: 'ledger for' },
  { id: 'rel_tourn_award', sourceTable: 'TOURNAMENT', sourceColumn: 'TournamentID', targetTable: 'AWARD', targetColumn: 'TournamentID', type: 'one-to-many', label: 'presents' },
  { id: 'rel_player_award', sourceTable: 'PLAYER', sourceColumn: 'PlayerID', targetTable: 'AWARD', targetColumn: 'PlayerID', type: 'one-to-many', label: 'awarded to' },
  { id: 'rel_team_award', sourceTable: 'TEAM', sourceColumn: 'TeamID', targetTable: 'AWARD', targetColumn: 'TeamID', type: 'one-to-many', label: 'conferred on' },
  { id: 'rel_tourn_rank_t', sourceTable: 'TOURNAMENT', sourceColumn: 'TournamentID', targetTable: 'TOURNAMENT_RANKING', targetColumn: 'TournamentID', type: 'one-to-many', label: 'ranks' },
  { id: 'rel_tourn_rank_tm', sourceTable: 'TEAM', sourceColumn: 'TeamID', targetTable: 'TOURNAMENT_RANKING', targetColumn: 'TeamID', type: 'one-to-many', label: 'placed in' },

  // Broadcast & Audience Relations
  { id: 'rel_match_stream_m', sourceTable: 'MATCH', sourceColumn: 'MatchID', targetTable: 'MATCH_STREAM', targetColumn: 'MatchID', type: 'one-to-many', label: 'broadcasts' },
  { id: 'rel_plat_stream_p', sourceTable: 'STREAMING_PLATFORM', sourceColumn: 'PlatformID', targetTable: 'MATCH_STREAM', targetColumn: 'PlatformID', type: 'one-to-many', label: 'streams on' },
  { id: 'rel_aud_vote', sourceTable: 'AUDIENCE', sourceColumn: 'AudienceID', targetTable: 'VOTE', targetColumn: 'AudienceID', type: 'one-to-many', label: 'casts' },
  { id: 'rel_match_vote', sourceTable: 'MATCH', sourceColumn: 'MatchID', targetTable: 'VOTE', targetColumn: 'MatchID', type: 'one-to-many', label: 'voted on' }
];
