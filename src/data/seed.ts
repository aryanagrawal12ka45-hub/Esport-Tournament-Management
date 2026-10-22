import type { DatabaseTable } from './schema';
import { calculateACS, calculateADR, calculateImpactIndex } from '../engine/scoring';

/**
 * ArenaDB - Official Tournament Seed Data
 * VALORANT Champions 2026 Shanghai (24 Sep 2026 - 18 Oct 2026)
 * Total Prize Pool: USD 2,250,000.00
 *
 * NOTE: Data sourced from public esports sites (vlr.gg, liquipedia.net, valorantesports.com).
 * Not affiliated with or endorsed by Riot Games.
 */

// Helper to calculate ACS, ADR, ImpactIndex consistently
function makePerfRow(p: {
  id: string;
  playerId: string;
  matchId: string;
  mapId: string;
  rounds: number;
  damage: number;
  combatScore: number;
  kills: number;
  deaths: number;
  assists: number;
  fk: number;
  fd: number;
  twoK?: number;
  threeK?: number;
  fourK?: number;
  aces?: number;
  ndAssists?: number;
  clutches?: number;
  kast?: number;
  hs?: number;
  equipId?: string;
  latency?: number;
  analytics?: string;
  isIllustrative?: boolean;
}) {
  const acs = calculateACS(p.combatScore, p.rounds);
  const adr = calculateADR(p.damage, p.rounds);
  const kd = p.deaths > 0 ? Math.round((p.kills / p.deaths) * 100) / 100 : p.kills;
  const fkFdDiff = p.fk - p.fd;
  const kastPct = p.kast ?? 74.0;
  const impact = calculateImpactIndex({
    acs,
    adr,
    kastPct,
    kd,
    fkFdDiffPerMap: fkFdDiff
  });

  return {
    PerformanceID: p.id,
    PlayerID: p.playerId,
    MatchID: p.matchId,
    MapID: p.mapId,
    RoundsPlayed: p.rounds,
    DamageDealt: p.damage,
    TotalCombatScore: p.combatScore,
    ACS: acs,
    ADR: adr,
    Kills: p.kills,
    Deaths: p.deaths,
    Assists: p.assists,
    FirstKills: p.fk,
    FirstDeaths: p.fd,
    TwoKRounds: p.twoK ?? 2,
    ThreeKRounds: p.threeK ?? 1,
    FourKRounds: p.fourK ?? 0,
    Aces: p.aces ?? 0,
    NonDamageAssists: p.ndAssists ?? 2,
    ClutchesWon: p.clutches ?? 1,
    KASTPct: kastPct,
    HeadshotPct: p.hs ?? 52.0,
    ImpactIndex: impact,
    Score: acs, // Backward compatibility alias
    EquipmentID: p.equipId ?? 'EQ01',
    InternetLatencyMs:
      p.latency ??
      (p.playerId === 'P09'
        ? 124.5
        : p.playerId === 'P26'
        ? 112.0
        : p.playerId === 'P41'
        ? 136.2
        : 22 + ((parseInt(p.playerId.replace(/\D/g, '') || '1', 10) * 19) % 55) + ((parseInt(p.id.replace(/\D/g, '') || '1', 10) * 11) % 25)),
    GameplayAnalytics: p.analytics ?? `Headshot ${p.hs ?? 52}%, First Bloods: ${p.fk}`,
    IsIllustrative: p.isIllustrative ?? false
  };
}

export const INITIAL_TABLES: DatabaseTable[] = [
  // ==========================================
  // SUBSYSTEM 1: ORGANIZATION
  // ==========================================
  {
    id: 'ADMINISTRATOR',
    name: 'ADMINISTRATOR',
    category: 'Integrity & Officials',
    description: 'Executive tournament directors and certified league administrators (simulated demo data).',
    iconName: 'Shield',
    canvasPos: { x: 860, y: 50 },
    columns: [
      { name: 'AdminID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Primary administrator ID' },
      { name: 'AdminName', type: 'VARCHAR2(100)', isNullable: false, description: 'Full legal name' },
      { name: 'ContactNo', type: 'VARCHAR2(20)', isNullable: false, description: 'Emergency contact telephone' },
      { name: 'Email', type: 'VARCHAR2(100)', isNullable: false, description: 'Unique administrative email' }
    ],
    initialRows: [
      { AdminID: 'ADM01', AdminName: 'Marcus Vance', ContactNo: '+1-555-0192', Email: 'm.vance@esports-federation.org' },
      { AdminID: 'ADM02', AdminName: 'Elena Rostova', ContactNo: '+44-20-7946-0912', Email: 'e.rostova@apex-tournaments.com' },
      { AdminID: 'ADM03', AdminName: 'Kenji Takahashi', ContactNo: '+81-3-5555-0143', Email: 'k.takahashi@cyberclash.jp' }
    ]
  },
  {
    id: 'TOURNAMENT',
    name: 'TOURNAMENT',
    category: 'Organization',
    description: 'Premier competitive e-sports leagues, invitationals, and global championships.',
    iconName: 'Trophy',
    canvasPos: { x: 50, y: 50 },
    columns: [
      { name: 'TournamentID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Tournament unique code' },
      { name: 'TournamentName', type: 'VARCHAR2(100)', isNullable: false, description: 'Official competition title' },
      { name: 'StartDate', type: 'DATE', isNullable: false, description: 'Tournament opening ceremony' },
      { name: 'EndDate', type: 'DATE', isNullable: false, description: 'Grand finals closing date' },
      { name: 'Location', type: 'VARCHAR2(100)', isNullable: false, description: 'Host arena / metropolitan city' },
      { name: 'TournamentType', type: 'VARCHAR2(30)', isNullable: false, description: 'Global LAN, Regional Major, or Invitational' },
      { name: 'AdminID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'ADMINISTRATOR', referencesColumn: 'AdminID', isNullable: false, description: 'Supervising chief administrator' }
    ],
    initialRows: [
      {
        TournamentID: 'TRN01',
        TournamentName: 'VALORANT Champions 2026 Shanghai',
        StartDate: '2026-09-24',
        EndDate: '2026-10-18',
        Location: 'Mercedes-Benz Arena & Jing\'an Sports Center, Shanghai',
        TournamentType: 'Global LAN Major',
        AdminID: 'ADM01'
      }
    ]
  },
  {
    id: 'GAME',
    name: 'GAME',
    category: 'Organization',
    description: 'Official competitive e-sports titles sanctioned for tournament play.',
    iconName: 'Gamepad2',
    canvasPos: { x: 50, y: 390 },
    columns: [
      { name: 'GameID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Game unique identifier' },
      { name: 'GameName', type: 'VARCHAR2(100)', isNullable: false, description: 'Title of the esports game' },
      { name: 'Genre', type: 'VARCHAR2(50)', isNullable: false, description: 'Competitive genre (Tactical FPS, MOBA, Racing)' },
      { name: 'Publisher', type: 'VARCHAR2(100)', isNullable: false, description: 'Game publisher / developer studio' }
    ],
    initialRows: [
      { GameID: 'G01', GameName: 'VALORANT', Genre: 'Tactical FPS', Publisher: 'Riot Games' }
    ]
  },
  {
    id: 'TOURNAMENT_STAGE',
    name: 'TOURNAMENT_STAGE',
    category: 'Organization',
    description: 'Sequential phases of competition ranging from GSL group stages to the grand final.',
    iconName: 'Layers',
    canvasPos: { x: 50, y: 660 },
    columns: [
      { name: 'StageID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Stage unique identifier' },
      { name: 'StageName', type: 'VARCHAR2(100)', isNullable: false, description: 'Phase title' },
      { name: 'StageType', type: 'VARCHAR2(20)', isNullable: false, description: 'League, Knockout, Semifinal, or Final' },
      { name: 'StartDate', type: 'DATE', isNullable: false, description: 'Stage starting date' },
      { name: 'EndDate', type: 'DATE', isNullable: false, description: 'Stage concluding date' },
      { name: 'TournamentID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TOURNAMENT', referencesColumn: 'TournamentID', isNullable: false, description: 'Parent tournament identifier' }
    ],
    initialRows: [
      { StageID: 'STG01', StageName: 'Group Stage (GSL Format)', StageType: 'League', StartDate: '2026-09-24', EndDate: '2026-10-04', TournamentID: 'TRN01' },
      { StageID: 'STG02', StageName: 'Playoffs: Upper & Lower Bracket', StageType: 'Knockout', StartDate: '2026-10-07', EndDate: '2026-10-15', TournamentID: 'TRN01' },
      { StageID: 'STG03', StageName: 'Finals Weekend (Top 4)', StageType: 'Semifinal', StartDate: '2026-10-16', EndDate: '2026-10-17', TournamentID: 'TRN01' },
      { StageID: 'STG04', StageName: 'Shanghai Grand Finals', StageType: 'Final', StartDate: '2026-10-18', EndDate: '2026-10-18', TournamentID: 'TRN01' }
    ]
  },
  {
    id: 'TEAM',
    name: 'TEAM',
    category: 'Organization',
    description: '16 official qualified franchises competing in VALORANT Champions 2026 Shanghai.',
    iconName: 'Users',
    canvasPos: { x: 50, y: 970 },
    columns: [
      { name: 'TeamID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Unique team franchise code' },
      { name: 'TeamName', type: 'VARCHAR2(100)', isNullable: false, description: 'Brand organization name' },
      { name: 'Country', type: 'VARCHAR2(50)', isNullable: false, description: 'Home country / competitive region' },
      { name: 'Ranking', type: 'NUMBER(4)', isNullable: false, description: 'Global Champions circuit ranking' }
    ],
    initialRows: [
      { TeamID: 'TM01', TeamName: 'LOUD', Country: 'Americas (Brazil)', Ranking: 1 },
      { TeamID: 'TM02', TeamName: 'Team Vitality', Country: 'EMEA (Europe)', Ranking: 2 },
      { TeamID: 'TM03', TeamName: '100 Thieves', Country: 'Americas (USA)', Ranking: 3 },
      { TeamID: 'TM04', TeamName: 'G2 Esports', Country: 'Americas (USA)', Ranking: 4 },
      { TeamID: 'TM05', TeamName: 'Paper Rex', Country: 'Pacific (Singapore)', Ranking: 5 },
      { TeamID: 'TM06', TeamName: 'FUT Esports', Country: 'EMEA (Turkey)', Ranking: 6 },
      { TeamID: 'TM07', TeamName: 'NRG', Country: 'Americas (USA)', Ranking: 7 },
      { TeamID: 'TM08', TeamName: 'Karmine Corp', Country: 'EMEA (France)', Ranking: 8 },
      { TeamID: 'TM09', TeamName: 'EDward Gaming', Country: 'China', Ranking: 9 },
      { TeamID: 'TM10', TeamName: 'Team Liquid', Country: 'EMEA (Netherlands)', Ranking: 10 },
      { TeamID: 'TM11', TeamName: 'T1', Country: 'Pacific (South Korea)', Ranking: 11 },
      { TeamID: 'TM12', TeamName: 'JD Gaming', Country: 'China', Ranking: 12 },
      { TeamID: 'TM13', TeamName: 'TYLOO', Country: 'China', Ranking: 13 },
      { TeamID: 'TM14', TeamName: 'Nongshim RedForce', Country: 'Pacific (South Korea)', Ranking: 14 },
      { TeamID: 'TM15', TeamName: 'Global Esports', Country: 'Pacific (India)', Ranking: 15 },
      { TeamID: 'TM16', TeamName: 'XLG Gaming', Country: 'China', Ranking: 16 }
    ]
  },
  {
    id: 'PLAYER',
    name: 'PLAYER',
    category: 'Organization',
    description: 'Professional tactical FPS athletes representing the 16 qualified tournament franchises.',
    iconName: 'UserCheck',
    canvasPos: { x: 50, y: 1260 },
    columns: [
      { name: 'PlayerID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Player unique ID' },
      { name: 'PlayerName', type: 'VARCHAR2(100)', isNullable: false, description: 'Esports competitor handle' },
      { name: 'Country', type: 'VARCHAR2(50)', isNullable: false, description: 'Nationality' },
      { name: 'PlayerRole', type: 'VARCHAR2(30)', isNullable: false, description: 'Tactical role: Duelist, Initiator, Sentinel, Controller, IGL' },
      { name: 'TeamID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TEAM', referencesColumn: 'TeamID', isNullable: false, description: 'Contracted team franchise' }
    ],
    initialRows: [
      // TM01: LOUD (Champions)
      { PlayerID: 'P01', PlayerName: 'aspas', Country: 'Brazil', PlayerRole: 'Duelist', TeamID: 'TM01' },
      { PlayerID: 'P02', PlayerName: 'Less', Country: 'Brazil', PlayerRole: 'Sentinel', TeamID: 'TM01' },
      { PlayerID: 'P03', PlayerName: 'Saadhak', Country: 'Argentina', PlayerRole: 'IGL / Initiator', TeamID: 'TM01' },
      { PlayerID: 'P04', PlayerName: 'cauanzin', Country: 'Brazil', PlayerRole: 'Initiator', TeamID: 'TM01' },
      { PlayerID: 'P05', PlayerName: 'tuyz', Country: 'Brazil', PlayerRole: 'Controller', TeamID: 'TM01' },

      // TM02: Team Vitality (Finalists)
      { PlayerID: 'P06', PlayerName: 'Sayf', Country: 'Sweden', PlayerRole: 'Duelist / Flex', TeamID: 'TM02' },
      { PlayerID: 'P07', PlayerName: 'trexx', Country: 'Russia', PlayerRole: 'Initiator', TeamID: 'TM02' },
      { PlayerID: 'P08', PlayerName: 'Kicks', Country: 'Estonia', PlayerRole: 'Initiator', TeamID: 'TM02' },
      { PlayerID: 'P09', PlayerName: 'runneR', Country: 'North Macedonia', PlayerRole: 'Duelist', TeamID: 'TM02' },
      { PlayerID: 'P10', PlayerName: 'ceNder', Country: 'Lithuania', PlayerRole: 'Controller / IGL', TeamID: 'TM02' },

      // TM03: 100 Thieves (3rd Place)
      { PlayerID: 'P11', PlayerName: 'Cryocells', Country: 'USA', PlayerRole: 'Duelist', TeamID: 'TM03' },
      { PlayerID: 'P12', PlayerName: 'Asuna', Country: 'USA', PlayerRole: 'Initiator / Flex', TeamID: 'TM03' },
      { PlayerID: 'P13', PlayerName: 'Boostio', Country: 'USA', PlayerRole: 'IGL / Sentinel', TeamID: 'TM03' },
      { PlayerID: 'P14', PlayerName: 'eeiu', Country: 'Canada', PlayerRole: 'Initiator', TeamID: 'TM03' },
      { PlayerID: 'P15', PlayerName: 'bang', Country: 'USA', PlayerRole: 'Controller', TeamID: 'TM03' },

      // TM04: G2 Esports (4th Place)
      { PlayerID: 'P16', PlayerName: 'leaf', Country: 'USA', PlayerRole: 'Duelist / Sentinel', TeamID: 'TM04' },
      { PlayerID: 'P17', PlayerName: 'trent', Country: 'USA', PlayerRole: 'Initiator', TeamID: 'TM04' },
      { PlayerID: 'P18', PlayerName: 'valyn', Country: 'USA', PlayerRole: 'IGL / Controller', TeamID: 'TM04' },
      { PlayerID: 'P19', PlayerName: 'JonahP', Country: 'Canada', PlayerRole: 'Flex / Initiator', TeamID: 'TM04' },
      { PlayerID: 'P20', PlayerName: 'icy', Country: 'USA', PlayerRole: 'Duelist', TeamID: 'TM04' },

      // TM05: Paper Rex (5th-6th)
      { PlayerID: 'P21', PlayerName: 'f0rsakeN', Country: 'Indonesia', PlayerRole: 'Flex / IGL', TeamID: 'TM05' },
      { PlayerID: 'P22', PlayerName: 'something', Country: 'Russia', PlayerRole: 'Duelist', TeamID: 'TM05' },
      { PlayerID: 'P23', PlayerName: 'Jinggg', Country: 'Singapore', PlayerRole: 'Duelist', TeamID: 'TM05' },
      { PlayerID: 'P24', PlayerName: 'd4v41', Country: 'Malaysia', PlayerRole: 'Initiator', TeamID: 'TM05' },
      { PlayerID: 'P25', PlayerName: 'mindfreak', Country: 'Indonesia', PlayerRole: 'Controller', TeamID: 'TM05' },

      // TM06: FUT Esports (5th-6th)
      { PlayerID: 'P26', PlayerName: 'cNed', Country: 'Turkey', PlayerRole: 'Duelist', TeamID: 'TM06' },
      { PlayerID: 'P27', PlayerName: 'qRaxs', Country: 'Turkey', PlayerRole: 'Flex', TeamID: 'TM06' },
      { PlayerID: 'P28', PlayerName: 'yetujey', Country: 'Turkey', PlayerRole: 'Sentinel', TeamID: 'TM06' },
      { PlayerID: 'P29', PlayerName: 'MrFaliN', Country: 'Turkey', PlayerRole: 'IGL', TeamID: 'TM06' },
      { PlayerID: 'P30', PlayerName: 'ATA KAPTAN', Country: 'Turkey', PlayerRole: 'Controller', TeamID: 'TM06' },

      // TM07: NRG (7th-8th)
      { PlayerID: 'P31', PlayerName: 'Demon1', Country: 'USA', PlayerRole: 'Duelist', TeamID: 'TM07' },
      { PlayerID: 'P32', PlayerName: 'Ethan', Country: 'USA', PlayerRole: 'Initiator', TeamID: 'TM07' },
      { PlayerID: 'P33', PlayerName: 'Victor', Country: 'USA', PlayerRole: 'Flex', TeamID: 'TM07' },
      { PlayerID: 'P34', PlayerName: 'crashies', Country: 'USA', PlayerRole: 'Initiator', TeamID: 'TM07' },
      { PlayerID: 'P35', PlayerName: 'Marved', Country: 'Canada', PlayerRole: 'Controller', TeamID: 'TM07' },

      // TM08: Karmine Corp (7th-8th)
      { PlayerID: 'P36', PlayerName: 'N4RRATE', Country: 'USA', PlayerRole: 'Duelist / Initiator', TeamID: 'TM08' },
      { PlayerID: 'P37', PlayerName: 'marteen', Country: 'Czechia', PlayerRole: 'Duelist', TeamID: 'TM08' },
      { PlayerID: 'P38', PlayerName: 'Shin', Country: 'France', PlayerRole: 'Controller', TeamID: 'TM08' },
      { PlayerID: 'P39', PlayerName: 'MAGNUM', Country: 'Czechia', PlayerRole: 'IGL', TeamID: 'TM08' },
      { PlayerID: 'P40', PlayerName: 'tomaszy', Country: 'Portugal', PlayerRole: 'Sentinel', TeamID: 'TM08' },

      // TM09: EDward Gaming (9th-12th)
      { PlayerID: 'P41', PlayerName: 'ZmjjKK', Country: 'China', PlayerRole: 'Duelist', TeamID: 'TM09' },
      { PlayerID: 'P42', PlayerName: 'CHICHOO', Country: 'China', PlayerRole: 'Sentinel', TeamID: 'TM09' },
      { PlayerID: 'P43', PlayerName: 'nobody', Country: 'China', PlayerRole: 'Initiator', TeamID: 'TM09' },
      { PlayerID: 'P44', PlayerName: 'Smoggy', Country: 'China', PlayerRole: 'Controller', TeamID: 'TM09' },
      { PlayerID: 'P45', PlayerName: 'S1Mon', Country: 'Taiwan', PlayerRole: 'Flex', TeamID: 'TM09' },

      // TM10: Team Liquid (9th-12th)
      { PlayerID: 'P46', PlayerName: 'Jamppi', Country: 'Finland', PlayerRole: 'Initiator', TeamID: 'TM10' },
      { PlayerID: 'P47', PlayerName: 'nAts', Country: 'Russia', PlayerRole: 'Sentinel', TeamID: 'TM10' },
      { PlayerID: 'P48', PlayerName: 'Keiko', Country: 'United Kingdom', PlayerRole: 'Duelist', TeamID: 'TM10' },
      { PlayerID: 'P49', PlayerName: 'Enzo', Country: 'France', PlayerRole: 'IGL', TeamID: 'TM10' },
      { PlayerID: 'P50', PlayerName: 'Mistic', Country: 'United Kingdom', PlayerRole: 'Controller', TeamID: 'TM10' },

      // TM11: T1 (9th-12th)
      { PlayerID: 'P51', PlayerName: 'Sayaplayer', Country: 'South Korea', PlayerRole: 'Duelist', TeamID: 'TM11' },
      { PlayerID: 'P52', PlayerName: 'Carpe', Country: 'South Korea', PlayerRole: 'Initiator', TeamID: 'TM11' },
      { PlayerID: 'P53', PlayerName: 'xeta', Country: 'South Korea', PlayerRole: 'Initiator', TeamID: 'TM11' },
      { PlayerID: 'P54', PlayerName: 'iZu', Country: 'South Korea', PlayerRole: 'Duelist', TeamID: 'TM11' },
      { PlayerID: 'P55', PlayerName: 'Rossy', Country: 'USA', PlayerRole: 'IGL', TeamID: 'TM11' },

      // TM12: JD Gaming (9th-12th)
      { PlayerID: 'P56', PlayerName: 'YiHao', Country: 'China', PlayerRole: 'Duelist', TeamID: 'TM12' },
      { PlayerID: 'P57', PlayerName: 'stew', Country: 'South Korea', PlayerRole: 'Initiator', TeamID: 'TM12' },
      { PlayerID: 'P58', PlayerName: 'Marpe', Country: 'China', PlayerRole: 'Sentinel', TeamID: 'TM12' },
      { PlayerID: 'P59', PlayerName: 'Viva', Country: 'China', PlayerRole: 'Flex', TeamID: 'TM12' },
      { PlayerID: 'P60', PlayerName: 'jkuro', Country: 'China', PlayerRole: 'Controller', TeamID: 'TM12' },

      // TM13: TYLOO (13th-16th)
      { PlayerID: 'P61', PlayerName: 'Flex1n', Country: 'China', PlayerRole: 'Controller', TeamID: 'TM13' },
      { PlayerID: 'P62', PlayerName: 'slowzy', Country: 'China', PlayerRole: 'Duelist', TeamID: 'TM13' },
      { PlayerID: 'P63', PlayerName: 'LuoK1ng', Country: 'China', PlayerRole: 'Initiator', TeamID: 'TM13' },
      { PlayerID: 'P64', PlayerName: 'AakRR', Country: 'China', PlayerRole: 'Sentinel', TeamID: 'TM13' },
      { PlayerID: 'P65', PlayerName: 'hfmi0dzjc9z7', Country: 'China', PlayerRole: 'Flex', TeamID: 'TM13' },

      // TM14: Nongshim RedForce (13th-16th)
      { PlayerID: 'P66', PlayerName: 'Dplus', Country: 'South Korea', PlayerRole: 'Duelist', TeamID: 'TM14' },
      { PlayerID: 'P67', PlayerName: 'Francis', Country: 'South Korea', PlayerRole: 'Initiator', TeamID: 'TM14' },
      { PlayerID: 'P68', PlayerName: 'margaret', Country: 'South Korea', PlayerRole: 'Controller', TeamID: 'TM14' },
      { PlayerID: 'P69', PlayerName: 'ivy', Country: 'South Korea', PlayerRole: 'Sentinel', TeamID: 'TM14' },
      { PlayerID: 'P70', PlayerName: 'pk', Country: 'South Korea', PlayerRole: 'Flex', TeamID: 'TM14' },

      // TM15: Global Esports (13th-16th)
      { PlayerID: 'P71', PlayerName: 'Lightningfast', Country: 'India', PlayerRole: 'Initiator', TeamID: 'TM15' },
      { PlayerID: 'P72', PlayerName: 'Benkai', Country: 'Singapore', PlayerRole: 'IGL', TeamID: 'TM15' },
      { PlayerID: 'P73', PlayerName: 'Russ', Country: 'United Kingdom', PlayerRole: 'Flex', TeamID: 'TM15' },
      { PlayerID: 'P74', PlayerName: 'blaZek1ng', Country: 'Indonesia', PlayerRole: 'Controller', TeamID: 'TM15' },
      { PlayerID: 'P75', PlayerName: 'polvi', Country: 'Finland', PlayerRole: 'Duelist', TeamID: 'TM15' },

      // TM16: XLG Gaming (13th-16th)
      { PlayerID: 'P76', PlayerName: 'happywei', Country: 'China', PlayerRole: 'Duelist', TeamID: 'TM16' },
      { PlayerID: 'P77', PlayerName: 'Rin', Country: 'China', PlayerRole: 'Initiator', TeamID: 'TM16' },
      { PlayerID: 'P78', PlayerName: 'Kr1s', Country: 'China', PlayerRole: 'Controller', TeamID: 'TM16' },
      { PlayerID: 'P79', PlayerName: 'Mar1lyn', Country: 'China', PlayerRole: 'Sentinel', TeamID: 'TM16' },
      { PlayerID: 'P80', PlayerName: 'r3m1x', Country: 'China', PlayerRole: 'Flex', TeamID: 'TM16' }
    ]
  },
  {
    id: 'TEAM_STAFF',
    name: 'TEAM_STAFF',
    category: 'Organization',
    description: 'Head coaches, strategic analysts, and performance directors contracted to teams.',
    iconName: 'Briefcase',
    canvasPos: { x: 50, y: 1550 },
    columns: [
      { name: 'StaffID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Staff unique code' },
      { name: 'StaffName', type: 'VARCHAR2(100)', isNullable: false, description: 'Full staff name' },
      { name: 'StaffRole', type: 'VARCHAR2(50)', isNullable: false, description: 'Head Coach, Strategic Analyst, or General Manager' },
      { name: 'TeamID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TEAM', referencesColumn: 'TeamID', isNullable: false, description: 'Affiliated team' }
    ],
    initialRows: [
      { StaffID: 'STF01', StaffName: 'Jordan \'stark\' Bell', StaffRole: 'Head Coach', TeamID: 'TM01' },
      { StaffID: 'STF02', StaffName: 'Salah Barakat', StaffRole: 'Head Coach', TeamID: 'TM02' },
      { StaffID: 'STF03', StaffName: 'Anthony \'Zikz\' Gray', StaffRole: 'Head Coach', TeamID: 'TM03' },
      { StaffID: 'STF04', StaffName: 'Josh \'JoshRT\' Lee', StaffRole: 'Head Coach', TeamID: 'TM04' },
      { StaffID: 'STF05', StaffName: 'Alexandre \'alecks\' Sallé', StaffRole: 'Head Coach', TeamID: 'TM05' }
    ]
  },
  {
    id: 'EQUIPMENT',
    name: 'EQUIPMENT',
    category: 'Organization',
    description: 'Tournament-sanctioned peripherals, tournament LAN PCs, and calibrated monitors.',
    iconName: 'Cpu',
    canvasPos: { x: 50, y: 1840 },
    columns: [
      { name: 'EquipmentID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Asset inventory tag' },
      { name: 'EquipmentName', type: 'VARCHAR2(100)', isNullable: false, description: 'Hardware manufacturer & model' },
      { name: 'EquipmentType', type: 'VARCHAR2(50)', isNullable: false, description: 'Mouse, Keyboard, Display, or Tournament PC' },
      { name: 'InspectionDate', type: 'DATE', isNullable: false, description: 'Anti-cheat hardware certification date' }
    ],
    initialRows: [
      { EquipmentID: 'EQ01', EquipmentName: 'Logitech G Pro X Superlight 2', EquipmentType: 'Optical Gaming Mouse', InspectionDate: '2026-09-20' },
      { EquipmentID: 'EQ02', EquipmentName: 'Wooting 60HE Hall Effect', EquipmentType: 'Rapid-Trigger Keyboard', InspectionDate: '2026-09-20' },
      { EquipmentID: 'EQ03', EquipmentName: 'ZOWIE XL2566K 360Hz DyAc+', EquipmentType: 'Esports Display Panel', InspectionDate: '2026-09-21' },
      { EquipmentID: 'EQ04', EquipmentName: 'HyperX Cloud III Wireless Pro', EquipmentType: 'Acoustic Headset', InspectionDate: '2026-09-21' },
      { EquipmentID: 'EQ05', EquipmentName: 'Riot LAN Station Alpha (RTX 4090)', EquipmentType: 'Tournament Stage Rig', InspectionDate: '2026-09-22' }
    ]
  },

  // ==========================================
  // SUBSYSTEM 2: INTEGRITY & OFFICIALS
  // ==========================================
  {
    id: 'REFEREE',
    name: 'REFEREE',
    category: 'Integrity & Officials',
    description: 'Certified Riot Games esports referees managing stage timeouts and LAN compliance.',
    iconName: 'ShieldAlert',
    canvasPos: { x: 860, y: 350 },
    columns: [
      { name: 'RefereeID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Official referee certification code' },
      { name: 'RefereeName', type: 'VARCHAR2(100)', isNullable: false, description: 'Arbiter full name' },
      { name: 'CertificationLevel', type: 'VARCHAR2(20)', isNullable: false, description: 'Level 1, Level 2, or Master Official' }
    ],
    initialRows: [
      { RefereeID: 'REF01', RefereeName: 'Michael Chang', CertificationLevel: 'Master Official' },
      { RefereeID: 'REF02', RefereeName: 'Astrid Lindgren', CertificationLevel: 'Level 2' },
      { RefereeID: 'REF03', RefereeName: 'Carlos Santoro', CertificationLevel: 'Level 2' },
      { RefereeID: 'REF04', RefereeName: 'Li Wei', CertificationLevel: 'Master Official' }
    ]
  },
  {
    id: 'ANTI_CHEAT',
    name: 'ANTI_CHEAT',
    category: 'Integrity & Officials',
    description: 'Hardware kernel telemetry, aim latency audits, and suspicious behavior logs (simulated demo data).',
    iconName: 'Eye',
    canvasPos: { x: 860, y: 640 },
    columns: [
      { name: 'AntiCheatID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Audit incident log ID' },
      { name: 'MatchID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'MATCH', referencesColumn: 'MatchID', isNullable: false, description: 'Match fixture' },
      { name: 'PlayerID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'PLAYER', referencesColumn: 'PlayerID', isNullable: false, description: 'Competitor inspected' },
      { name: 'CheatStatus', type: 'VARCHAR2(20)', isNullable: false, description: 'Clean, Under Review, or Flagged' },
      { name: 'MonitoringDetails', type: 'VARCHAR2(255)', isNullable: false, description: 'Kernel heuristic diagnostics report' }
    ],
    initialRows: [
      { AntiCheatID: 'AC01', MatchID: 'M22', PlayerID: 'P01', CheatStatus: 'Clean', MonitoringDetails: 'Vanguard Ring-0 Kernel check passed; mouse input micro-jitter nominal.' },
      { AntiCheatID: 'AC02', MatchID: 'M22', PlayerID: 'P06', CheatStatus: 'Clean', MonitoringDetails: 'Audio latency & monitor refresh rate calibrated; zero peripheral injection.' },
      { AntiCheatID: 'AC03', MatchID: 'M18', PlayerID: 'P11', CheatStatus: 'Clean', MonitoringDetails: 'High-frequency crosshair snap verified against human physical acceleration.' },
      { AntiCheatID: 'AC04', MatchID: 'M14', PlayerID: 'P26', CheatStatus: 'Under Review', MonitoringDetails: 'Technical pause triggered: peripheral driver re-enumeration log audited (resolved).' }
    ]
  },
  {
    id: 'DISCIPLINARY_ACTION',
    name: 'DISCIPLINARY_ACTION',
    category: 'Integrity & Officials',
    description: 'Official sanctions, tactical timeout warnings, and communication penalties (simulated demo data).',
    iconName: 'AlertTriangle',
    canvasPos: { x: 860, y: 940 },
    columns: [
      { name: 'ActionID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Disciplinary docket identifier' },
      { name: 'MatchID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'MATCH', referencesColumn: 'MatchID', isNullable: false, description: 'Related match' },
      { name: 'PlayerID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'PLAYER', referencesColumn: 'PlayerID', isNullable: true, description: 'Sanctioned individual' },
      { name: 'TeamID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TEAM', referencesColumn: 'TeamID', isNullable: true, description: 'Sanctioned organization' },
      { name: 'ViolationType', type: 'VARCHAR2(50)', isNullable: false, description: 'Toxicity, Stage Delay, Illegal Coach Comms' },
      { name: 'Penalty', type: 'VARCHAR2(50)', isNullable: false, description: 'Warning, Timeout Deduction, or Fine' }
    ],
    initialRows: [
      { ActionID: 'DSC01', MatchID: 'M14', PlayerID: null, TeamID: 'TM06', ViolationType: 'Tactical Timeout Exceeded by 14s', Penalty: 'Stage Warning & Time Bank Fine' },
      { ActionID: 'DSC02', MatchID: 'M08', PlayerID: 'P36', TeamID: 'TM08', ViolationType: 'Stage Equipment Placement Delay', Penalty: 'Official Written Admonition' }
    ]
  },

  // ==========================================
  // SUBSYSTEM 3: MATCH TELEMETRY
  // ==========================================
  {
    id: 'MATCH',
    name: 'MATCH',
    category: 'Match Telemetry',
    description: 'Head-to-head match fixtures, stages, referee assignments, and live series score outcomes.',
    iconName: 'Swords',
    canvasPos: { x: 460, y: 50 },
    columns: [
      { name: 'MatchID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Match identifier' },
      { name: 'StageID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TOURNAMENT_STAGE', referencesColumn: 'StageID', isNullable: false, description: 'Tournament stage' },
      { name: 'GameID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'GAME', referencesColumn: 'GameID', isNullable: false, description: 'Title played' },
      { name: 'MatchDate', type: 'DATE', isNullable: false, description: 'Scheduled calendar date' },
      { name: 'MatchTime', type: 'VARCHAR2(10)', isNullable: false, description: 'Scheduled match start time (UTC)' },
      { name: 'MatchResult', type: 'VARCHAR2(50)', isNullable: true, description: 'Final series map outcome' },
      { name: 'MatchStatus', type: 'VARCHAR2(20)', isNullable: false, defaultValue: "'Scheduled'", description: 'Scheduled, Live, or Completed' },
      { name: 'RefereeID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'REFEREE', referencesColumn: 'RefereeID', isNullable: false, description: 'Head referee overseeing match' }
    ],
    initialRows: [
      // Group Openers
      { MatchID: 'M01', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-24', MatchTime: '09:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF01' },
      { MatchID: 'M02', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-24', MatchTime: '12:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF02' },
      { MatchID: 'M03', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-25', MatchTime: '09:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF03' },
      { MatchID: 'M04', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-25', MatchTime: '12:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF04' },
      { MatchID: 'M05', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-26', MatchTime: '09:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF01' },
      { MatchID: 'M06', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-26', MatchTime: '12:00', MatchResult: '2 - 1', MatchStatus: 'Completed', RefereeID: 'REF02' },
      { MatchID: 'M07', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-27', MatchTime: '09:00', MatchResult: '1 - 2', MatchStatus: 'Completed', RefereeID: 'REF03' },
      { MatchID: 'M08', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-27', MatchTime: '12:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF04' },

      // Group Winners / Deciders
      { MatchID: 'M09', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-29', MatchTime: '10:00', MatchResult: '2 - 1', MatchStatus: 'Completed', RefereeID: 'REF01' },
      { MatchID: 'M10', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-09-30', MatchTime: '10:00', MatchResult: '2 - 1', MatchStatus: 'Completed', RefereeID: 'REF02' },
      { MatchID: 'M11', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-10-01', MatchTime: '10:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF03' },
      { MatchID: 'M12', StageID: 'STG01', GameID: 'G01', MatchDate: '2026-10-02', MatchTime: '10:00', MatchResult: '2 - 1', MatchStatus: 'Completed', RefereeID: 'REF04' },

      // Playoff Upper Bracket R1
      { MatchID: 'M13', StageID: 'STG02', GameID: 'G01', MatchDate: '2026-10-07', MatchTime: '09:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF01' },
      { MatchID: 'M14', StageID: 'STG02', GameID: 'G01', MatchDate: '2026-10-08', MatchTime: '09:00', MatchResult: '2 - 1', MatchStatus: 'Completed', RefereeID: 'REF02' },
      { MatchID: 'M15', StageID: 'STG02', GameID: 'G01', MatchDate: '2026-10-08', MatchTime: '12:00', MatchResult: '2 - 0', MatchStatus: 'Completed', RefereeID: 'REF03' },
      { MatchID: 'M16', StageID: 'STG02', GameID: 'G01', MatchDate: '2026-10-09', MatchTime: '10:00', MatchResult: '1 - 2', MatchStatus: 'Completed', RefereeID: 'REF04' },

      // Playoff Semifinals
      { MatchID: 'M17', StageID: 'STG02', GameID: 'G01', MatchDate: '2026-10-11', MatchTime: '10:00', MatchResult: '2 - 1', MatchStatus: 'Completed', RefereeID: 'REF01' },
      { MatchID: 'M18', StageID: 'STG02', GameID: 'G01', MatchDate: '2026-10-12', MatchTime: '10:00', MatchResult: '2 - 1', MatchStatus: 'Completed', RefereeID: 'REF02' },

      // Lower Bracket Semifinal
      { MatchID: 'M19', StageID: 'STG02', GameID: 'G01', MatchDate: '2026-10-14', MatchTime: '10:00', MatchResult: '1 - 2', MatchStatus: 'Completed', RefereeID: 'REF03' },

      // Upper Bracket Final
      { MatchID: 'M20', StageID: 'STG03', GameID: 'G01', MatchDate: '2026-10-16', MatchTime: '10:00', MatchResult: '1 - 2', MatchStatus: 'Completed', RefereeID: 'REF01' },

      // Lower Bracket Final
      { MatchID: 'M21', StageID: 'STG03', GameID: 'G01', MatchDate: '2026-10-17', MatchTime: '10:00', MatchResult: '3 - 1', MatchStatus: 'Completed', RefereeID: 'REF02' },

      // Grand Final (18 Oct 2026)
      { MatchID: 'M22', StageID: 'STG04', GameID: 'G01', MatchDate: '2026-10-18', MatchTime: '10:00', MatchResult: '3 - 1', MatchStatus: 'Completed', RefereeID: 'REF01' }
    ]
  },
  {
    id: 'TEAM_MATCH_PARTICIPATION',
    name: 'TEAM_MATCH_PARTICIPATION',
    category: 'Match Telemetry',
    description: 'Junction recording teams competing in each series, series map score, and match win/loss result.',
    iconName: 'GitCommit',
    canvasPos: { x: 460, y: 380 },
    columns: [
      { name: 'MatchID', type: 'VARCHAR2(10)', isPrimaryKey: true, isForeignKey: true, referencesTable: 'MATCH', referencesColumn: 'MatchID', isNullable: false, description: 'Foreign key to MATCH' },
      { name: 'TeamID', type: 'VARCHAR2(10)', isPrimaryKey: true, isForeignKey: true, referencesTable: 'TEAM', referencesColumn: 'TeamID', isNullable: false, description: 'Foreign key to TEAM' },
      { name: 'Result', type: 'VARCHAR2(10)', isNullable: false, defaultValue: "'Pending'", description: 'Win, Loss, or Pending' },
      { name: 'TeamScore', type: 'NUMBER(3)', isNullable: false, defaultValue: '0', description: 'Maps won in the series' }
    ],
    initialRows: [
      // M01: G2 (2) vs TYLOO (0)
      { MatchID: 'M01', TeamID: 'TM04', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M01', TeamID: 'TM13', Result: 'Loss', TeamScore: 0 },

      // M02: NRG (2) vs Nongshim (0)
      { MatchID: 'M02', TeamID: 'TM07', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M02', TeamID: 'TM14', Result: 'Loss', TeamScore: 0 },

      // M03: LOUD (2) vs EDward Gaming (0)
      { MatchID: 'M03', TeamID: 'TM01', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M03', TeamID: 'TM09', Result: 'Loss', TeamScore: 0 },

      // M04: 100 Thieves (2) vs T1 (0)
      { MatchID: 'M04', TeamID: 'TM03', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M04', TeamID: 'TM11', Result: 'Loss', TeamScore: 0 },

      // M05: FUT (2) vs JD Gaming (0)
      { MatchID: 'M05', TeamID: 'TM06', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M05', TeamID: 'TM12', Result: 'Loss', TeamScore: 0 },

      // M06: Vitality (2) vs Global Esports (1)
      { MatchID: 'M06', TeamID: 'TM02', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M06', TeamID: 'TM15', Result: 'Loss', TeamScore: 1 },

      // M07: Team Liquid (1) vs Paper Rex (2)
      { MatchID: 'M07', TeamID: 'TM10', Result: 'Loss', TeamScore: 1 },
      { MatchID: 'M07', TeamID: 'TM05', Result: 'Win', TeamScore: 2 },

      // M08: Karmine Corp (2) vs XLG (0)
      { MatchID: 'M08', TeamID: 'TM08', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M08', TeamID: 'TM16', Result: 'Loss', TeamScore: 0 },

      // M09: G2 (2) vs NRG (1)
      { MatchID: 'M09', TeamID: 'TM04', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M09', TeamID: 'TM07', Result: 'Loss', TeamScore: 1 },

      // M10: LOUD (2) vs 100T (1)
      { MatchID: 'M10', TeamID: 'TM01', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M10', TeamID: 'TM03', Result: 'Loss', TeamScore: 1 },

      // M11: Vitality (2) vs FUT (0)
      { MatchID: 'M11', TeamID: 'TM02', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M11', TeamID: 'TM06', Result: 'Loss', TeamScore: 0 },

      // M12: Paper Rex (2) vs Karmine Corp (1)
      { MatchID: 'M12', TeamID: 'TM05', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M12', TeamID: 'TM08', Result: 'Loss', TeamScore: 1 },

      // M13: G2 (2) vs Karmine Corp (0)
      { MatchID: 'M13', TeamID: 'TM04', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M13', TeamID: 'TM08', Result: 'Loss', TeamScore: 0 },

      // M14: LOUD (2) vs FUT (1)
      { MatchID: 'M14', TeamID: 'TM01', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M14', TeamID: 'TM06', Result: 'Loss', TeamScore: 1 },

      // M15: Vitality (2) vs NRG (0)
      { MatchID: 'M15', TeamID: 'TM02', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M15', TeamID: 'TM07', Result: 'Loss', TeamScore: 0 },

      // M16: Paper Rex (1) vs 100 Thieves (2)
      { MatchID: 'M16', TeamID: 'TM05', Result: 'Loss', TeamScore: 1 },
      { MatchID: 'M16', TeamID: 'TM03', Result: 'Win', TeamScore: 2 },

      // M17: LOUD (2) vs G2 (1)
      { MatchID: 'M17', TeamID: 'TM01', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M17', TeamID: 'TM04', Result: 'Loss', TeamScore: 1 },

      // M18: Vitality (2) vs 100 Thieves (1)
      { MatchID: 'M18', TeamID: 'TM02', Result: 'Win', TeamScore: 2 },
      { MatchID: 'M18', TeamID: 'TM03', Result: 'Loss', TeamScore: 1 },

      // M19: G2 (1) vs 100 Thieves (2) -> G2 eliminated in 4th place
      { MatchID: 'M19', TeamID: 'TM04', Result: 'Loss', TeamScore: 1 },
      { MatchID: 'M19', TeamID: 'TM03', Result: 'Win', TeamScore: 2 },

      // M20: Vitality (1) vs LOUD (2) -> Upper Final
      { MatchID: 'M20', TeamID: 'TM02', Result: 'Loss', TeamScore: 1 },
      { MatchID: 'M20', TeamID: 'TM01', Result: 'Win', TeamScore: 2 },

      // M21: Vitality (3) vs 100 Thieves (1) -> Lower Final
      { MatchID: 'M21', TeamID: 'TM02', Result: 'Win', TeamScore: 3 },
      { MatchID: 'M21', TeamID: 'TM03', Result: 'Loss', TeamScore: 1 },

      // M22: Grand Final: LOUD (3) vs Team Vitality (1)
      { MatchID: 'M22', TeamID: 'TM01', Result: 'Win', TeamScore: 3 },
      { MatchID: 'M22', TeamID: 'TM02', Result: 'Loss', TeamScore: 1 }
    ]
  },
  {
    id: 'MATCH_MAP',
    name: 'MATCH_MAP',
    category: 'Match Telemetry',
    description: 'Individual map games contested within each match series, including map picks and round scores.',
    iconName: 'Map',
    canvasPos: { x: 460, y: 700 },
    columns: [
      { name: 'MapID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Map unique identifier' },
      { name: 'MatchID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'MATCH', referencesColumn: 'MatchID', isNullable: false, description: 'Parent match fixture' },
      { name: 'MapNumber', type: 'NUMBER(1)', isNullable: false, description: 'Map sequence index (1, 2, 3, 4, 5)' },
      { name: 'MapName', type: 'VARCHAR2(50)', isNullable: false, description: 'Sanctioned arena map: Lotus, Sunset, Split, Ascent, Abyss, Summit' },
      { name: 'WinnerTeamID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TEAM', referencesColumn: 'TeamID', isNullable: false, description: 'Team winning 13+ rounds' },
      { name: 'Team1Rounds', type: 'NUMBER(2)', isNullable: false, description: 'Rounds won by first team in fixture' },
      { name: 'Team2Rounds', type: 'NUMBER(2)', isNullable: false, description: 'Rounds won by second team in fixture' },
      { name: 'RoundsPlayed', type: 'NUMBER(2)', isNullable: false, description: 'Total rounds contested in map' },
      { name: 'IsPick', type: 'VARCHAR2(10)', isNullable: false, description: 'Which team picked the map (Pick/Decider)' }
    ],
    initialRows: [
      // M01: G2 vs TYLOO
      { MapID: 'MAP01', MatchID: 'M01', MapNumber: 1, MapName: 'Lotus', WinnerTeamID: 'TM04', Team1Rounds: 13, Team2Rounds: 9, RoundsPlayed: 22, IsPick: 'TM04' },
      { MapID: 'MAP02', MatchID: 'M01', MapNumber: 2, MapName: 'Ascent', WinnerTeamID: 'TM04', Team1Rounds: 13, Team2Rounds: 7, RoundsPlayed: 20, IsPick: 'TM13' },

      // M02: NRG vs Nongshim
      { MapID: 'MAP03', MatchID: 'M02', MapNumber: 1, MapName: 'Sunset', WinnerTeamID: 'TM07', Team1Rounds: 13, Team2Rounds: 5, RoundsPlayed: 18, IsPick: 'TM07' },
      { MapID: 'MAP04', MatchID: 'M02', MapNumber: 2, MapName: 'Abyss', WinnerTeamID: 'TM07', Team1Rounds: 13, Team2Rounds: 8, RoundsPlayed: 21, IsPick: 'TM14' },

      // M03: LOUD vs EDward Gaming
      { MapID: 'MAP05', MatchID: 'M03', MapNumber: 1, MapName: 'Lotus', WinnerTeamID: 'TM01', Team1Rounds: 13, Team2Rounds: 8, RoundsPlayed: 21, IsPick: 'TM01' },
      { MapID: 'MAP06', MatchID: 'M03', MapNumber: 2, MapName: 'Split', WinnerTeamID: 'TM01', Team1Rounds: 13, Team2Rounds: 10, RoundsPlayed: 23, IsPick: 'TM09' },

      // M04: 100 Thieves vs T1
      { MapID: 'MAP07', MatchID: 'M04', MapNumber: 1, MapName: 'Sunset', WinnerTeamID: 'TM03', Team1Rounds: 13, Team2Rounds: 7, RoundsPlayed: 20, IsPick: 'TM03' },
      { MapID: 'MAP08', MatchID: 'M04', MapNumber: 2, MapName: 'Ascent', WinnerTeamID: 'TM03', Team1Rounds: 13, Team2Rounds: 11, RoundsPlayed: 24, IsPick: 'TM11' },

      // M05: FUT vs JDG
      { MapID: 'MAP09', MatchID: 'M05', MapNumber: 1, MapName: 'Lotus', WinnerTeamID: 'TM06', Team1Rounds: 13, Team2Rounds: 6, RoundsPlayed: 19, IsPick: 'TM06' },
      { MapID: 'MAP10', MatchID: 'M05', MapNumber: 2, MapName: 'Abyss', WinnerTeamID: 'TM06', Team1Rounds: 13, Team2Rounds: 9, RoundsPlayed: 22, IsPick: 'TM12' },

      // M06: Vitality vs Global Esports
      { MapID: 'MAP11', MatchID: 'M06', MapNumber: 1, MapName: 'Sunset', WinnerTeamID: 'TM02', Team1Rounds: 13, Team2Rounds: 11, RoundsPlayed: 24, IsPick: 'TM02' },
      { MapID: 'MAP12', MatchID: 'M06', MapNumber: 2, MapName: 'Split', WinnerTeamID: 'TM15', Team1Rounds: 10, Team2Rounds: 13, RoundsPlayed: 23, IsPick: 'TM15' },
      { MapID: 'MAP13', MatchID: 'M06', MapNumber: 3, MapName: 'Lotus', WinnerTeamID: 'TM02', Team1Rounds: 13, Team2Rounds: 8, RoundsPlayed: 21, IsPick: 'Decider' },

      // M07: Team Liquid vs Paper Rex
      { MapID: 'MAP14', MatchID: 'M07', MapNumber: 1, MapName: 'Lotus', WinnerTeamID: 'TM10', Team1Rounds: 13, Team2Rounds: 11, RoundsPlayed: 24, IsPick: 'TM10' },
      { MapID: 'MAP15', MatchID: 'M07', MapNumber: 2, MapName: 'Sunset', WinnerTeamID: 'TM05', Team1Rounds: 8, Team2Rounds: 13, RoundsPlayed: 21, IsPick: 'TM05' },
      { MapID: 'MAP16', MatchID: 'M07', MapNumber: 3, MapName: 'Ascent', WinnerTeamID: 'TM05', Team1Rounds: 11, Team2Rounds: 13, RoundsPlayed: 24, IsPick: 'Decider' },

      // M08: Karmine Corp vs XLG
      { MapID: 'MAP17', MatchID: 'M08', MapNumber: 1, MapName: 'Lotus', WinnerTeamID: 'TM08', Team1Rounds: 13, Team2Rounds: 4, RoundsPlayed: 17, IsPick: 'TM08' },
      { MapID: 'MAP18', MatchID: 'M08', MapNumber: 2, MapName: 'Split', WinnerTeamID: 'TM08', Team1Rounds: 13, Team2Rounds: 7, RoundsPlayed: 20, IsPick: 'TM16' },

      // M20: Upper Bracket Final: Vitality vs LOUD
      { MapID: 'MAP19', MatchID: 'M20', MapNumber: 1, MapName: 'Lotus', WinnerTeamID: 'TM02', Team1Rounds: 13, Team2Rounds: 9, RoundsPlayed: 22, IsPick: 'TM02' },
      { MapID: 'MAP20', MatchID: 'M20', MapNumber: 2, MapName: 'Sunset', WinnerTeamID: 'TM01', Team1Rounds: 11, Team2Rounds: 13, RoundsPlayed: 24, IsPick: 'TM01' },
      { MapID: 'MAP21', MatchID: 'M20', MapNumber: 3, MapName: 'Ascent', WinnerTeamID: 'TM01', Team1Rounds: 12, Team2Rounds: 14, RoundsPlayed: 26, IsPick: 'Decider' },

      // M21: Lower Bracket Final: Vitality vs 100 Thieves
      { MapID: 'MAP22', MatchID: 'M21', MapNumber: 1, MapName: 'Sunset', WinnerTeamID: 'TM02', Team1Rounds: 13, Team2Rounds: 8, RoundsPlayed: 21, IsPick: 'TM02' },
      { MapID: 'MAP23', MatchID: 'M21', MapNumber: 2, MapName: 'Lotus', WinnerTeamID: 'TM02', Team1Rounds: 13, Team2Rounds: 11, RoundsPlayed: 24, IsPick: 'TM03' },
      { MapID: 'MAP24', MatchID: 'M21', MapNumber: 3, MapName: 'Split', WinnerTeamID: 'TM03', Team1Rounds: 9, Team2Rounds: 13, RoundsPlayed: 22, IsPick: 'TM02' },
      { MapID: 'MAP25', MatchID: 'M21', MapNumber: 4, MapName: 'Abyss', WinnerTeamID: 'TM02', Team1Rounds: 13, Team2Rounds: 7, RoundsPlayed: 20, IsPick: 'TM03' },

      // M22: Grand Final: LOUD 3 - 1 Team Vitality (18 Oct 2026)
      { MapID: 'MAP26', MatchID: 'M22', MapNumber: 1, MapName: 'Lotus', WinnerTeamID: 'TM01', Team1Rounds: 13, Team2Rounds: 9, RoundsPlayed: 22, IsPick: 'TM01' },
      { MapID: 'MAP27', MatchID: 'M22', MapNumber: 2, MapName: 'Sunset', WinnerTeamID: 'TM02', Team1Rounds: 10, Team2Rounds: 13, RoundsPlayed: 23, IsPick: 'TM02' },
      { MapID: 'MAP28', MatchID: 'M22', MapNumber: 3, MapName: 'Split', WinnerTeamID: 'TM01', Team1Rounds: 13, Team2Rounds: 11, RoundsPlayed: 24, IsPick: 'TM01' },
      { MapID: 'MAP29', MatchID: 'M22', MapNumber: 4, MapName: 'Ascent', WinnerTeamID: 'TM01', Team1Rounds: 14, Team2Rounds: 12, RoundsPlayed: 26, IsPick: 'TM02' }
    ]
  },
  {
    id: 'PLAYER_PERFORMANCE',
    name: 'PLAYER_PERFORMANCE',
    category: 'Match Telemetry',
    description: 'Per-player per-map combat telemetry: ACS, ADR, K/D, KAST%, Headshot%, and Impact Index.',
    iconName: 'Activity',
    canvasPos: { x: 460, y: 1020 },
    columns: [
      { name: 'PerformanceID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Performance telemetry ID' },
      { name: 'PlayerID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'PLAYER', referencesColumn: 'PlayerID', isNullable: false, description: 'Athlete' },
      { name: 'MatchID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'MATCH', referencesColumn: 'MatchID', isNullable: false, description: 'Match series fixture' },
      { name: 'MapID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'MATCH_MAP', referencesColumn: 'MapID', isNullable: false, description: 'Specific map played' },
      { name: 'RoundsPlayed', type: 'NUMBER(2)', isNullable: false, description: 'Rounds contested in this map' },
      { name: 'DamageDealt', type: 'NUMBER(5)', isNullable: false, description: 'Total HP damage inflicted across rounds' },
      { name: 'TotalCombatScore', type: 'NUMBER(5)', isNullable: false, description: 'Cumulative round combat score points' },
      { name: 'ACS', type: 'NUMBER(5,1)', isNullable: false, description: 'Average Combat Score = TotalCombatScore / RoundsPlayed' },
      { name: 'ADR', type: 'NUMBER(5,1)', isNullable: false, description: 'Average Damage per Round = DamageDealt / RoundsPlayed' },
      { name: 'Kills', type: 'NUMBER(3)', isNullable: false, description: 'Opponent eliminations' },
      { name: 'Deaths', type: 'NUMBER(3)', isNullable: false, description: 'Eliminations suffered' },
      { name: 'Assists', type: 'NUMBER(3)', isNullable: false, description: 'Damage and tactical assists' },
      { name: 'FirstKills', type: 'NUMBER(2)', isNullable: false, description: 'First Blood opening eliminations won' },
      { name: 'FirstDeaths', type: 'NUMBER(2)', isNullable: false, description: 'Opening duels lost' },
      { name: 'TwoKRounds', type: 'NUMBER(2)', isNullable: false, description: 'Rounds with 2 eliminations' },
      { name: 'ThreeKRounds', type: 'NUMBER(2)', isNullable: false, description: 'Rounds with 3 eliminations' },
      { name: 'FourKRounds', type: 'NUMBER(2)', isNullable: false, description: 'Rounds with 4 eliminations' },
      { name: 'Aces', type: 'NUMBER(2)', isNullable: false, description: '5-kill Ace rounds' },
      { name: 'NonDamageAssists', type: 'NUMBER(2)', isNullable: false, description: 'Recon, flash, and debuff assists (+25 pts each)' },
      { name: 'ClutchesWon', type: 'NUMBER(2)', isNullable: false, description: '1vX solo round conversions' },
      { name: 'KASTPct', type: 'NUMBER(4,1)', isNullable: false, description: 'Kill, Assist, Survived, or Traded %' },
      { name: 'HeadshotPct', type: 'NUMBER(4,1)', isNullable: false, description: 'Lethal headshot accuracy %' },
      { name: 'ImpactIndex', type: 'NUMBER(4,2)', isNullable: false, description: 'ArenaDB normalized impact rating (1.00 = avg)' },
      { name: 'Score', type: 'NUMBER(5,1)', isNullable: false, description: 'Compatibility alias equal to ACS' },
      { name: 'EquipmentID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'EQUIPMENT', referencesColumn: 'EquipmentID', isNullable: false, description: 'Hardware gear used' },
      { name: 'InternetLatencyMs', type: 'NUMBER(4,1)', isNullable: false, description: 'Network ping in milliseconds' },
      { name: 'GameplayAnalytics', type: 'VARCHAR2(255)', isNullable: false, description: 'Detailed playstyle notes' },
      { name: 'IsIllustrative', type: 'BOOLEAN', isNullable: false, defaultValue: 'false', description: 'Tagged true if telemetry is modeled rather than verified' }
    ],
    initialRows: [
      // ==========================================
      // GRAND FINAL MAP 1 (Lotus, 22 rounds): LOUD 13 - 9 Team Vitality
      // ==========================================
      makePerfRow({ id: 'PER01', playerId: 'P01', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 3740, combatScore: 6160, kills: 23, deaths: 12, assists: 6, fk: 6, fd: 2, twoK: 4, threeK: 2, aces: 0, kast: 81.8, hs: 62.5, analytics: 'Entry fragging masterclass; 6 First Bloods on A-Site.' }),
      makePerfRow({ id: 'PER02', playerId: 'P02', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 3300, combatScore: 5280, kills: 18, deaths: 11, assists: 7, fk: 3, fd: 1, twoK: 3, threeK: 1, aces: 0, kast: 77.3, hs: 58.0, analytics: 'Cypher anchor hold; won crucial 1v2 post-plant clutch.' }),
      makePerfRow({ id: 'PER03', playerId: 'P03', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 2860, combatScore: 4620, kills: 14, deaths: 13, assists: 11, fk: 2, fd: 2, twoK: 2, threeK: 0, aces: 0, kast: 72.7, hs: 48.0, analytics: 'Fade utility coordination; 7 haunt spot assists.' }),
      makePerfRow({ id: 'PER04', playerId: 'P04', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 2970, combatScore: 4840, kills: 15, deaths: 12, assists: 9, fk: 2, fd: 1, twoK: 2, threeK: 1, aces: 0, kast: 77.3, hs: 54.0, analytics: 'Breach flash assist conversions; 2 Multi-kill rounds.' }),
      makePerfRow({ id: 'PER05', playerId: 'P05', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 2640, combatScore: 4180, kills: 12, deaths: 13, assists: 14, fk: 1, fd: 1, twoK: 1, threeK: 0, aces: 0, kast: 72.7, hs: 44.0, analytics: 'Omen smoke control; blocked Vitality C-Mound re-clears.' }),

      // Vitality Map 1
      makePerfRow({ id: 'PER06', playerId: 'P06', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 3410, combatScore: 5500, kills: 20, deaths: 15, assists: 4, fk: 4, fd: 3, twoK: 3, threeK: 1, aces: 0, kast: 72.7, hs: 64.0, analytics: 'Raze blast pack entries; 4 First Kills.' }),
      makePerfRow({ id: 'PER07', playerId: 'P07', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 2860, combatScore: 4400, kills: 14, deaths: 16, assists: 7, fk: 2, fd: 3, twoK: 2, threeK: 0, aces: 0, kast: 68.2, hs: 50.0, analytics: 'Sova recon darts destroyed early; solid retake support.' }),
      makePerfRow({ id: 'PER08', playerId: 'P08', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 2530, combatScore: 3960, kills: 12, deaths: 17, assists: 8, fk: 1, fd: 2, twoK: 1, threeK: 0, aces: 0, kast: 63.6, hs: 46.0, analytics: 'Skye flash flashes blinded 18 opponents.' }),
      makePerfRow({ id: 'PER09', playerId: 'P09', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 2420, combatScore: 3740, kills: 11, deaths: 17, assists: 5, fk: 1, fd: 4, twoK: 1, threeK: 0, aces: 0, kast: 59.1, hs: 42.0, analytics: 'Struggled on B-Site defense duels against aspas.' }),
      makePerfRow({ id: 'PER10', playerId: 'P10', matchId: 'M22', mapId: 'MAP26', rounds: 22, damage: 2200, combatScore: 3520, kills: 10, deaths: 17, assists: 10, fk: 0, fd: 2, twoK: 1, threeK: 0, aces: 0, kast: 63.6, hs: 38.0, analytics: 'Viper pit utilized on Round 11 retake.' }),

      // ==========================================
      // GRAND FINAL MAP 2 (Sunset, 23 rounds): LOUD 10 - 13 Team Vitality
      // ==========================================
      makePerfRow({ id: 'PER11', playerId: 'P06', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 4140, combatScore: 6900, kills: 27, deaths: 13, assists: 6, fk: 7, fd: 1, twoK: 5, threeK: 2, aces: 1, kast: 87.0, hs: 68.0, analytics: 'Sensational MVP performance! ACE in Round 14; 300.0 ACS.' }),
      makePerfRow({ id: 'PER12', playerId: 'P07', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 3450, combatScore: 5520, kills: 19, deaths: 13, assists: 8, fk: 3, fd: 2, twoK: 3, threeK: 1, aces: 0, kast: 78.3, hs: 55.0, analytics: 'Breach fault line stuns yielded 4 multi-frags.' }),
      makePerfRow({ id: 'PER13', playerId: 'P08', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 3220, combatScore: 5060, kills: 17, deaths: 14, assists: 9, fk: 2, fd: 1, twoK: 2, threeK: 1, aces: 0, kast: 73.9, hs: 52.0, analytics: 'Gekko dizzy assists; won 1v1 clutch vs Less.' }),
      makePerfRow({ id: 'PER14', playerId: 'P09', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 2990, combatScore: 4600, kills: 15, deaths: 15, assists: 7, fk: 2, fd: 3, twoK: 2, threeK: 0, aces: 0, kast: 69.6, hs: 48.0, analytics: 'Strong secondary entry fragging on B-Main.' }),
      makePerfRow({ id: 'PER15', playerId: 'P10', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 2760, combatScore: 4140, kills: 13, deaths: 14, assists: 12, fk: 1, fd: 1, twoK: 1, threeK: 0, aces: 0, kast: 73.9, hs: 41.0, analytics: 'Omen dark cover one-ways shut down mid pushes.' }),

      // LOUD Map 2
      makePerfRow({ id: 'PER16', playerId: 'P01', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 3680, combatScore: 5750, kills: 22, deaths: 17, assists: 4, fk: 4, fd: 3, twoK: 3, threeK: 1, aces: 0, kast: 69.6, hs: 60.0, analytics: 'Jett blade storm 3K on eco round.' }),
      makePerfRow({ id: 'PER17', playerId: 'P02', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 3105, combatScore: 4830, kills: 17, deaths: 16, assists: 5, fk: 2, fd: 2, twoK: 2, threeK: 1, aces: 0, kast: 65.2, hs: 56.0, analytics: 'Killjoy lockdown secured Round 9 retake.' }),
      makePerfRow({ id: 'PER18', playerId: 'P03', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 2760, combatScore: 4140, kills: 13, deaths: 18, assists: 10, fk: 1, fd: 3, twoK: 1, threeK: 0, aces: 0, kast: 60.9, hs: 45.0, analytics: 'KAY/O suppression knife disabled Sayf on Round 7.' }),
      makePerfRow({ id: 'PER19', playerId: 'P04', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 2530, combatScore: 3910, kills: 12, deaths: 18, assists: 8, fk: 1, fd: 4, twoK: 1, threeK: 0, aces: 0, kast: 56.5, hs: 44.0, analytics: 'Sova shock darts denied 2 spike plants.' }),
      makePerfRow({ id: 'PER20', playerId: 'P05', matchId: 'M22', mapId: 'MAP27', rounds: 23, damage: 2300, combatScore: 3450, kills: 10, deaths: 19, assists: 11, fk: 0, fd: 2, twoK: 1, threeK: 0, aces: 0, kast: 56.5, hs: 39.0, analytics: 'Astra gravity wells created delays on B site.' }),

      // ==========================================
      // GRAND FINAL MAP 3 (Split, 24 rounds): LOUD 13 - 11 Team Vitality
      // ==========================================
      makePerfRow({ id: 'PER21', playerId: 'P01', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 4320, combatScore: 6960, kills: 28, deaths: 14, assists: 5, fk: 7, fd: 2, twoK: 5, threeK: 2, aces: 1, kast: 83.3, hs: 65.0, analytics: 'Clutch ACE on A-Ramps; 290.0 ACS tour-de-force.' }),
      makePerfRow({ id: 'PER22', playerId: 'P02', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 3600, combatScore: 5520, kills: 20, deaths: 13, assists: 7, fk: 3, fd: 1, twoK: 3, threeK: 1, aces: 0, kast: 79.2, hs: 61.0, analytics: 'Cypher tripwires collected 8 wallbang frags.' }),
      makePerfRow({ id: 'PER23', playerId: 'P04', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 3360, combatScore: 5040, kills: 18, deaths: 15, assists: 9, fk: 2, fd: 2, twoK: 2, threeK: 1, aces: 0, kast: 75.0, hs: 53.0, analytics: 'Skye trailblazer cleared vents repeatedly.' }),
      makePerfRow({ id: 'PER24', playerId: 'P03', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 3120, combatScore: 4800, kills: 16, deaths: 16, assists: 12, fk: 2, fd: 2, twoK: 2, threeK: 0, aces: 0, kast: 70.8, hs: 49.0, analytics: 'Breach rolling thunder enabled Round 24 win.' }),
      makePerfRow({ id: 'PER25', playerId: 'P05', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 2880, combatScore: 4320, kills: 14, deaths: 15, assists: 14, fk: 1, fd: 1, twoK: 1, threeK: 0, aces: 0, kast: 75.0, hs: 42.0, analytics: 'Omen shrouded step into heaven won Round 19.' }),

      // Vitality Map 3
      makePerfRow({ id: 'PER26', playerId: 'P06', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 3840, combatScore: 6000, kills: 23, deaths: 18, assists: 6, fk: 5, fd: 3, twoK: 4, threeK: 1, aces: 0, kast: 75.0, hs: 63.0, analytics: 'Raze showstopper double kill on B-Heaven.' }),
      makePerfRow({ id: 'PER27', playerId: 'P07', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 3120, combatScore: 4800, kills: 17, deaths: 17, assists: 8, fk: 2, fd: 3, twoK: 2, threeK: 1, aces: 0, kast: 70.8, hs: 51.0, analytics: 'Fade seize + nade combo on Mid mail.' }),
      makePerfRow({ id: 'PER28', playerId: 'P08', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 2880, combatScore: 4320, kills: 14, deaths: 18, assists: 10, fk: 1, fd: 2, twoK: 1, threeK: 0, aces: 0, kast: 66.7, hs: 46.0, analytics: 'Breach flash assists; 18 flash points.' }),
      makePerfRow({ id: 'PER29', playerId: 'P09', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 2640, combatScore: 3840, kills: 12, deaths: 19, assists: 6, fk: 1, fd: 4, twoK: 1, threeK: 0, aces: 0, kast: 58.3, hs: 43.0, analytics: 'Jett dash entries punished by Less trips.' }),
      makePerfRow({ id: 'PER30', playerId: 'P10', matchId: 'M22', mapId: 'MAP28', rounds: 24, damage: 2400, combatScore: 3600, kills: 11, deaths: 19, assists: 11, fk: 0, fd: 2, twoK: 1, threeK: 0, aces: 0, kast: 62.5, hs: 39.0, analytics: 'Astra cosmic divide utilized on A-site postplant.' }),

      // ==========================================
      // GRAND FINAL MAP 4 (Ascent, 26 rounds, Overtime): LOUD 14 - 12 Team Vitality
      // ==========================================
      makePerfRow({ id: 'PER31', playerId: 'P01', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 4680, combatScore: 7540, kills: 30, deaths: 16, assists: 6, fk: 8, fd: 2, twoK: 6, threeK: 2, aces: 0, kast: 84.6, hs: 66.0, analytics: 'Championship-winning 30-bomb! 290.0 ACS; operator dominance in OT.' }),
      makePerfRow({ id: 'PER32', playerId: 'P02', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 3900, combatScore: 6240, kills: 23, deaths: 15, assists: 8, fk: 3, fd: 1, twoK: 4, threeK: 1, aces: 0, kast: 80.8, hs: 62.0, analytics: 'Killjoy lockdown in B-Site garage won Round 25 in OT.' }),
      makePerfRow({ id: 'PER33', playerId: 'P03', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 3640, combatScore: 5460, kills: 19, deaths: 17, assists: 13, fk: 2, fd: 2, twoK: 2, threeK: 1, aces: 0, kast: 76.9, hs: 50.0, analytics: 'KAY/O null/cmd EMP push seized match point in Round 26.' }),
      makePerfRow({ id: 'PER34', playerId: 'P04', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 3380, combatScore: 5200, kills: 18, deaths: 16, assists: 11, fk: 2, fd: 2, twoK: 2, threeK: 0, aces: 0, kast: 73.1, hs: 52.0, analytics: 'Sova hunter\'s fury tagged Sayf off defuse in Round 18.' }),
      makePerfRow({ id: 'PER35', playerId: 'P05', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 3120, combatScore: 4680, kills: 15, deaths: 17, assists: 16, fk: 1, fd: 1, twoK: 1, threeK: 0, aces: 0, kast: 76.9, hs: 45.0, analytics: 'Omen paranoia blinded entire Mid courtyard on A-Split.' }),

      // Vitality Map 4
      makePerfRow({ id: 'PER36', playerId: 'P06', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 4420, combatScore: 6760, kills: 27, deaths: 19, assists: 5, fk: 6, fd: 3, twoK: 5, threeK: 2, aces: 0, kast: 76.9, hs: 65.0, analytics: 'Sensational Jett play; forced overtime with 1v2 clutch in Round 24.' }),
      makePerfRow({ id: 'PER37', playerId: 'P07', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 3640, combatScore: 5460, kills: 20, deaths: 18, assists: 9, fk: 3, fd: 3, twoK: 3, threeK: 1, aces: 0, kast: 73.1, hs: 53.0, analytics: 'Sova shock dart lineup stopped B-Site spike plant in Round 21.' }),
      makePerfRow({ id: 'PER38', playerId: 'P08', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 3380, combatScore: 4940, kills: 17, deaths: 19, assists: 12, fk: 2, fd: 2, twoK: 2, threeK: 0, aces: 0, kast: 69.2, hs: 48.0, analytics: 'KAY/O knife silenced aspas twice during mid rounds.' }),
      makePerfRow({ id: 'PER39', playerId: 'P09', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 2860, combatScore: 4160, kills: 13, deaths: 21, assists: 7, fk: 1, fd: 5, twoK: 1, threeK: 0, aces: 0, kast: 57.7, hs: 44.0, analytics: 'Pushed A-Main early but fell to Less crosshair placement.' }),
      makePerfRow({ id: 'PER40', playerId: 'P10', matchId: 'M22', mapId: 'MAP29', rounds: 26, damage: 2600, combatScore: 3900, kills: 11, deaths: 20, assists: 14, fk: 0, fd: 2, twoK: 1, threeK: 0, aces: 0, kast: 65.4, hs: 40.0, analytics: 'Omen smoke timings delayed LOUD entries to B.' }),

      // ==========================================
      // PLAYOFF TELEMETRY: 100 Thieves, G2, Paper Rex, FUT, NRG, KC (Illustrative / Modelled)
      // ==========================================
      makePerfRow({ id: 'PER41', playerId: 'P11', matchId: 'M21', mapId: 'MAP22', rounds: 21, damage: 3570, combatScore: 5670, kills: 22, deaths: 13, assists: 4, fk: 5, fd: 1, twoK: 4, threeK: 1, kast: 81.0, hs: 64.0, analytics: 'Cryocells Jett operator entries; 270.0 ACS.', isIllustrative: true }),
      makePerfRow({ id: 'PER42', playerId: 'P12', matchId: 'M21', mapId: 'MAP22', rounds: 21, damage: 2940, combatScore: 4410, kills: 15, deaths: 14, assists: 8, fk: 2, fd: 2, twoK: 2, threeK: 0, kast: 71.4, hs: 50.0, analytics: 'Asuna flash entries on A-site.', isIllustrative: true }),
      makePerfRow({ id: 'PER43', playerId: 'P16', matchId: 'M19', mapId: 'MAP25', rounds: 20, damage: 3400, combatScore: 5200, kills: 20, deaths: 12, assists: 5, fk: 4, fd: 2, twoK: 3, threeK: 1, kast: 80.0, hs: 58.0, analytics: 'leaf Sentinel anchoring hold on B site.', isIllustrative: true }),
      makePerfRow({ id: 'PER44', playerId: 'P17', matchId: 'M19', mapId: 'MAP25', rounds: 20, damage: 3000, combatScore: 4600, kills: 16, deaths: 13, assists: 9, fk: 2, fd: 1, twoK: 2, threeK: 0, kast: 75.0, hs: 52.0, analytics: 'trent Sova recon bow mastery.', isIllustrative: true }),
      makePerfRow({ id: 'PER45', playerId: 'P21', matchId: 'M12', mapId: 'MAP16', rounds: 24, damage: 3840, combatScore: 6240, kills: 24, deaths: 15, assists: 8, fk: 5, fd: 2, twoK: 4, threeK: 1, kast: 79.2, hs: 60.0, analytics: 'f0rsakeN Yoru tactical mindgames.', isIllustrative: true }),
      makePerfRow({ id: 'PER46', playerId: 'P22', matchId: 'M12', mapId: 'MAP16', rounds: 24, damage: 3600, combatScore: 5520, kills: 21, deaths: 16, assists: 4, fk: 6, fd: 3, twoK: 3, threeK: 1, kast: 70.8, hs: 55.0, analytics: 'something Jett aggression on Ascent mid.', isIllustrative: true }),
      makePerfRow({ id: 'PER47', playerId: 'P26', matchId: 'M05', mapId: 'MAP09', rounds: 19, damage: 3230, combatScore: 5320, kills: 21, deaths: 9, assists: 3, fk: 5, fd: 1, twoK: 4, threeK: 1, kast: 84.2, hs: 66.0, analytics: 'cNed Jett operator masterclass; 280.0 ACS.', isIllustrative: true }),
      makePerfRow({ id: 'PER48', playerId: 'P31', matchId: 'M02', mapId: 'MAP03', rounds: 18, damage: 3060, combatScore: 4860, kills: 19, deaths: 9, assists: 4, fk: 4, fd: 1, twoK: 3, threeK: 1, kast: 83.3, hs: 68.0, analytics: 'Demon1 pristine crosshair placement.', isIllustrative: true }),
      makePerfRow({ id: 'PER49', playerId: 'P36', matchId: 'M08', mapId: 'MAP17', rounds: 17, damage: 2890, combatScore: 4590, kills: 18, deaths: 8, assists: 5, fk: 4, fd: 1, twoK: 3, threeK: 1, kast: 82.4, hs: 63.0, analytics: 'N4RRATE high impact entries on Lotus.', isIllustrative: true }),
      makePerfRow({ id: 'PER50', playerId: 'P41', matchId: 'M03', mapId: 'MAP05', rounds: 21, damage: 3360, combatScore: 5040, kills: 19, deaths: 14, assists: 4, fk: 5, fd: 2, twoK: 3, threeK: 1, kast: 76.2, hs: 61.0, analytics: 'ZmjjKK (KangKang) lightning fast operator flick.', isIllustrative: true })
    ]
  },

  // ==========================================
  // SUBSYSTEM 4: FINANCE & RESULTS
  // ==========================================
  {
    id: 'SPONSOR',
    name: 'SPONSOR',
    category: 'Finance & Results',
    description: 'Corporate partners, technology sponsors, and commercial beverage suppliers (simulated demo data).',
    iconName: 'Building2',
    canvasPos: { x: 1260, y: 50 },
    columns: [
      { name: 'SponsorID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Sponsor company code' },
      { name: 'SponsorName', type: 'VARCHAR2(100)', isNullable: false, description: 'Corporate entity title' },
      { name: 'Industry', type: 'VARCHAR2(50)', isNullable: false, description: 'Hardware, Energy Drink, Financial, Telecomm' },
      { name: 'ContactEmail', type: 'VARCHAR2(100)', isNullable: false, description: 'Executive partnerships contact' }
    ],
    initialRows: [
      { SponsorID: 'SP01', SponsorName: 'HyperX Gaming Gear', Industry: 'Peripherals', ContactEmail: 'esports@hyperx.com' },
      { SponsorID: 'SP02', SponsorName: 'Red Bull Global Esports', Industry: 'Energy Beverages', ContactEmail: 'partnerships@redbull.com' },
      { SponsorID: 'SP03', SponsorName: 'Mastercard International', Industry: 'Financial Services', ContactEmail: 'sponsorships@mastercard.com' },
      { SponsorID: 'SP04', SponsorName: 'Verizon 5G Ultra Wideband', Industry: 'Telecommunications', ContactEmail: 'sports@verizon.com' },
      { SponsorID: 'SP05', SponsorName: 'Mercedes-Benz Group', Industry: 'Automotive', ContactEmail: 'esports@mercedes-benz.com' }
    ]
  },
  {
    id: 'TOURNAMENT_SPONSOR',
    name: 'TOURNAMENT_SPONSOR',
    category: 'Finance & Results',
    description: 'Contracted commercial agreements funding the official championship escrow ledger.',
    iconName: 'Handshake',
    canvasPos: { x: 1260, y: 320 },
    columns: [
      { name: 'TournamentID', type: 'VARCHAR2(10)', isPrimaryKey: true, isForeignKey: true, referencesTable: 'TOURNAMENT', referencesColumn: 'TournamentID', isNullable: false, description: 'Tournament identifier' },
      { name: 'SponsorID', type: 'VARCHAR2(10)', isPrimaryKey: true, isForeignKey: true, referencesTable: 'SPONSOR', referencesColumn: 'SponsorID', isNullable: false, description: 'Sponsoring partner' },
      { name: 'ContributionAmount', type: 'NUMBER(12,2)', isNullable: false, description: 'Cash commitment in USD' },
      { name: 'SponsorshipTier', type: 'VARCHAR2(30)', isNullable: false, description: 'Title, Tier 1, Presenting, or Technical' }
    ],
    initialRows: [
      { TournamentID: 'TRN01', SponsorID: 'SP01', ContributionAmount: 650000.00, SponsorshipTier: 'Tier 1 Official Gear' },
      { TournamentID: 'TRN01', SponsorID: 'SP02', ContributionAmount: 800000.00, SponsorshipTier: 'Presenting Beverage' },
      { TournamentID: 'TRN01', SponsorID: 'SP03', ContributionAmount: 1100000.00, SponsorshipTier: 'Global Title Partner' },
      { TournamentID: 'TRN01', SponsorID: 'SP04', ContributionAmount: 500000.00, SponsorshipTier: 'Technical Connectivity' },
      { TournamentID: 'TRN01', SponsorID: 'SP05', ContributionAmount: 750000.00, SponsorshipTier: 'Venue Title Partner' }
    ]
  },
  {
    id: 'PRIZE_POOL',
    name: 'PRIZE_POOL',
    category: 'Finance & Results',
    description: 'Guaranteed total cash prize purse for VALORANT Champions 2026 Shanghai.',
    iconName: 'Coins',
    canvasPos: { x: 1260, y: 580 },
    columns: [
      { name: 'PrizePoolID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Prize pool identifier' },
      { name: 'TournamentID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TOURNAMENT', referencesColumn: 'TournamentID', isNullable: false, description: 'Tournament funded' },
      { name: 'TotalAmount', type: 'NUMBER(12,2)', isNullable: false, description: 'Total prize purse USD' },
      { name: 'DistributionMethod', type: 'VARCHAR2(255)', isNullable: false, description: 'Official Riot Games Champions placement ladder' }
    ],
    initialRows: [
      {
        PrizePoolID: 'PZ01',
        TournamentID: 'TRN01',
        TotalAmount: 2250000.00,
        DistributionMethod: 'Fixed Placement Ladder: 1st $1M, 2nd $400K, 3rd $250K, 4th $130K, 5-6th $85K each, 7-8th $50K each, 9-12th $30K each, 13-16th $20K each.'
      }
    ]
  },
  {
    id: 'TOURNAMENT_RANKING',
    name: 'TOURNAMENT_RANKING',
    category: 'Finance & Results',
    description: 'Final tournament standings, official placement positions, and verified cash prize disbursements ($2,250,000 total).',
    iconName: 'Medal',
    canvasPos: { x: 1260, y: 840 },
    columns: [
      { name: 'RankingID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Standing docket identifier' },
      { name: 'TournamentID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TOURNAMENT', referencesColumn: 'TournamentID', isNullable: false, description: 'Tournament identifier' },
      { name: 'TeamID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TEAM', referencesColumn: 'TeamID', isNullable: false, description: 'Franchise organization' },
      { name: 'FinalPosition', type: 'NUMBER(3)', isNullable: false, description: 'Official finishing placement rank (1-16)' },
      { name: 'PrizeAmount', type: 'NUMBER(12,2)', isNullable: false, description: 'Official cash prize awarded in USD' }
    ],
    initialRows: [
      // 1st: $1,000,000
      { RankingID: 'RNK01', TournamentID: 'TRN01', TeamID: 'TM01', FinalPosition: 1, PrizeAmount: 1000000.00 },
      // 2nd: $400,000
      { RankingID: 'RNK02', TournamentID: 'TRN01', TeamID: 'TM02', FinalPosition: 2, PrizeAmount: 400000.00 },
      // 3rd: $250,000
      { RankingID: 'RNK03', TournamentID: 'TRN01', TeamID: 'TM03', FinalPosition: 3, PrizeAmount: 250000.00 },
      // 4th: $130,000
      { RankingID: 'RNK04', TournamentID: 'TRN01', TeamID: 'TM04', FinalPosition: 4, PrizeAmount: 130000.00 },
      // 5th-6th: $85,000 each ($170,000 total)
      { RankingID: 'RNK05', TournamentID: 'TRN01', TeamID: 'TM05', FinalPosition: 5, PrizeAmount: 85000.00 },
      { RankingID: 'RNK06', TournamentID: 'TRN01', TeamID: 'TM06', FinalPosition: 6, PrizeAmount: 85000.00 },
      // 7th-8th: $50,000 each ($100,000 total)
      { RankingID: 'RNK07', TournamentID: 'TRN01', TeamID: 'TM07', FinalPosition: 7, PrizeAmount: 50000.00 },
      { RankingID: 'RNK08', TournamentID: 'TRN01', TeamID: 'TM08', FinalPosition: 8, PrizeAmount: 50000.00 },
      // 9th-12th: $30,000 each ($120,000 total)
      { RankingID: 'RNK09', TournamentID: 'TRN01', TeamID: 'TM09', FinalPosition: 9, PrizeAmount: 30000.00 },
      { RankingID: 'RNK10', TournamentID: 'TRN01', TeamID: 'TM10', FinalPosition: 10, PrizeAmount: 30000.00 },
      { RankingID: 'RNK11', TournamentID: 'TRN01', TeamID: 'TM11', FinalPosition: 11, PrizeAmount: 30000.00 },
      { RankingID: 'RNK12', TournamentID: 'TRN01', TeamID: 'TM12', FinalPosition: 12, PrizeAmount: 30000.00 },
      // 13th-16th: $20,000 each ($80,000 total)
      { RankingID: 'RNK13', TournamentID: 'TRN01', TeamID: 'TM13', FinalPosition: 13, PrizeAmount: 20000.00 },
      { RankingID: 'RNK14', TournamentID: 'TRN01', TeamID: 'TM14', FinalPosition: 14, PrizeAmount: 20000.00 },
      { RankingID: 'RNK15', TournamentID: 'TRN01', TeamID: 'TM15', FinalPosition: 15, PrizeAmount: 20000.00 },
      { RankingID: 'RNK16', TournamentID: 'TRN01', TeamID: 'TM16', FinalPosition: 16, PrizeAmount: 20000.00 }
      // Sum = 1,000,000 + 400,000 + 250,000 + 130,000 + 170,000 + 100,000 + 120,000 + 80,000 = $2,250,000.00
    ]
  },
  {
    id: 'FINANCIAL_RECORD',
    name: 'FINANCIAL_RECORD',
    category: 'Finance & Results',
    description: 'Double-entry accounting ledger of sponsorship credits and prize purse payouts.',
    iconName: 'Receipt',
    canvasPos: { x: 1260, y: 1100 },
    columns: [
      { name: 'RecordID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Ledger voucher code' },
      { name: 'TournamentID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TOURNAMENT', referencesColumn: 'TournamentID', isNullable: false, description: 'Tournament ledger' },
      { name: 'TransactionType', type: 'VARCHAR2(30)', isNullable: false, description: 'Sponsorship Income or Prize Payout' },
      { name: 'Amount', type: 'NUMBER(12,2)', isNullable: false, description: 'Amount in USD' },
      { name: 'TransactionDate', type: 'DATE', isNullable: false, description: 'Date posted' },
      { name: 'Description', type: 'VARCHAR2(255)', isNullable: false, description: 'Accounting narrative' }
    ],
    initialRows: [
      // Sponsorship Inflows
      { RecordID: 'FIN01', TournamentID: 'TRN01', TransactionType: 'Sponsorship Income', Amount: 1100000.00, TransactionDate: '2026-09-01', Description: 'Mastercard Global Title Partner sponsorship wire' },
      { RecordID: 'FIN02', TournamentID: 'TRN01', TransactionType: 'Sponsorship Income', Amount: 800000.00, TransactionDate: '2026-09-05', Description: 'Red Bull presenting energy partner wire' },
      { RecordID: 'FIN03', TournamentID: 'TRN01', TransactionType: 'Sponsorship Income', Amount: 750000.00, TransactionDate: '2026-09-10', Description: 'Mercedes-Benz Arena title partnership' },
      { RecordID: 'FIN04', TournamentID: 'TRN01', TransactionType: 'Sponsorship Income', Amount: 650000.00, TransactionDate: '2026-09-12', Description: 'HyperX gear equipment sponsorship' },
      { RecordID: 'FIN05', TournamentID: 'TRN01', TransactionType: 'Sponsorship Income', Amount: 500000.00, TransactionDate: '2026-09-15', Description: 'Verizon 5G LAN fiber network allocation' },

      // Verified Prize Disbursements to 16 Teams ($2,250,000.00 total)
      { RecordID: 'FIN06', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 1000000.00, TransactionDate: '2026-10-19', Description: '1st Place Championship Prize Wire to LOUD' },
      { RecordID: 'FIN07', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 400000.00, TransactionDate: '2026-10-19', Description: '2nd Place Prize Wire to Team Vitality' },
      { RecordID: 'FIN08', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 250000.00, TransactionDate: '2026-10-19', Description: '3rd Place Prize Wire to 100 Thieves' },
      { RecordID: 'FIN09', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 130000.00, TransactionDate: '2026-10-19', Description: '4th Place Prize Wire to G2 Esports' },
      { RecordID: 'FIN10', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 85000.00, TransactionDate: '2026-10-19', Description: '5th-6th Place Prize Wire to Paper Rex' },
      { RecordID: 'FIN11', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 85000.00, TransactionDate: '2026-10-19', Description: '5th-6th Place Prize Wire to FUT Esports' },
      { RecordID: 'FIN12', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 50000.00, TransactionDate: '2026-10-19', Description: '7th-8th Place Prize Wire to NRG' },
      { RecordID: 'FIN13', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 50000.00, TransactionDate: '2026-10-19', Description: '7th-8th Place Prize Wire to Karmine Corp' },
      { RecordID: 'FIN14', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 30000.00, TransactionDate: '2026-10-19', Description: '9th-12th Place Prize Wire to EDward Gaming' },
      { RecordID: 'FIN15', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 30000.00, TransactionDate: '2026-10-19', Description: '9th-12th Place Prize Wire to Team Liquid' },
      { RecordID: 'FIN16', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 30000.00, TransactionDate: '2026-10-19', Description: '9th-12th Place Prize Wire to T1' },
      { RecordID: 'FIN17', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 30000.00, TransactionDate: '2026-10-19', Description: '9th-12th Place Prize Wire to JD Gaming' },
      { RecordID: 'FIN18', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 20000.00, TransactionDate: '2026-10-19', Description: '13th-16th Place Prize Wire to TYLOO' },
      { RecordID: 'FIN19', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 20000.00, TransactionDate: '2026-10-19', Description: '13th-16th Place Prize Wire to Nongshim RedForce' },
      { RecordID: 'FIN20', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 20000.00, TransactionDate: '2026-10-19', Description: '13th-16th Place Prize Wire to Global Esports' },
      { RecordID: 'FIN21', TournamentID: 'TRN01', TransactionType: 'Prize Payout', Amount: 20000.00, TransactionDate: '2026-10-19', Description: '13th-16th Place Prize Wire to XLG Gaming' }
    ]
  },
  {
    id: 'AWARD',
    name: 'AWARD',
    category: 'Finance & Results',
    description: 'Championship trophies, tournament MVP honours, and performance awards.',
    iconName: 'Award',
    canvasPos: { x: 1260, y: 1360 },
    columns: [
      { name: 'AwardID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Trophy identifier' },
      { name: 'TournamentID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TOURNAMENT', referencesColumn: 'TournamentID', isNullable: false, description: 'Sanctioning tournament' },
      { name: 'AwardName', type: 'VARCHAR2(100)', isNullable: false, description: 'Title of the distinction' },
      { name: 'AwardCategory', type: 'VARCHAR2(50)', isNullable: false, description: 'Team Champion, MVP, or Fragging Leader' },
      { name: 'CashPrize', type: 'NUMBER(10,2)', isNullable: false, description: 'Additional prize bonus in USD' },
      { name: 'TeamID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'TEAM', referencesColumn: 'TeamID', isNullable: true, description: 'Recipient franchise' },
      { name: 'PlayerID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'PLAYER', referencesColumn: 'PlayerID', isNullable: true, description: 'Individual laureate' }
    ],
    initialRows: [
      { AwardID: 'AWD01', TournamentID: 'TRN01', AwardName: 'Champions 2026 Shanghai Champions Cup', AwardCategory: 'Team Champion', CashPrize: 1000000.00, TeamID: 'TM01', PlayerID: null },
      { AwardID: 'AWD02', TournamentID: 'TRN01', AwardName: 'VALORANT Champions 2026 Finals MVP', AwardCategory: 'Individual MVP', CashPrize: 25000.00, TeamID: 'TM01', PlayerID: 'P01' },
      { AwardID: 'AWD03', TournamentID: 'TRN01', AwardName: 'Tournament ACS Fragging Leader', AwardCategory: 'Individual Performance', CashPrize: 15000.00, TeamID: 'TM02', PlayerID: 'P06' }
    ]
  },

  // ==========================================
  // SUBSYSTEM 5: BROADCAST & AUDIENCE
  // ==========================================
  {
    id: 'STREAMING_PLATFORM',
    name: 'STREAMING_PLATFORM',
    category: 'Broadcast & Audience',
    description: 'Licensed global video distribution channels (simulated demo data).',
    iconName: 'Tv',
    canvasPos: { x: 1660, y: 50 },
    columns: [
      { name: 'PlatformID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Platform identifier' },
      { name: 'PlatformName', type: 'VARCHAR2(50)', isNullable: false, description: 'Streaming network name' },
      { name: 'BroadcastQuality', type: 'VARCHAR2(30)', isNullable: false, description: '4K HDR 60fps, 1080p60 Ultra-Low Latency' }
    ],
    initialRows: [
      { PlatformID: 'PL01', PlatformName: 'Twitch (VALORANT Official)', BroadcastQuality: '1080p60 Low-Latency' },
      { PlatformID: 'PL02', PlatformName: 'YouTube Esports Global', BroadcastQuality: '4K HDR 60fps' },
      { PlatformID: 'PL03', PlatformName: 'Bilibili Esports China', BroadcastQuality: '1080p60 Ultra-Stream' },
      { PlatformID: 'PL04', PlatformName: 'AfreecaTV VALORANT Korea', BroadcastQuality: '1080p60 Native' }
    ]
  },
  {
    id: 'MATCH_STREAM',
    name: 'MATCH_STREAM',
    category: 'Broadcast & Audience',
    description: 'Real-time telemetry measuring concurrent viewership across live channels (simulated demo data).',
    iconName: 'Radio',
    canvasPos: { x: 1660, y: 350 },
    columns: [
      { name: 'StreamID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Broadcast stream code' },
      { name: 'MatchID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'MATCH', referencesColumn: 'MatchID', isNullable: false, description: 'Match fixture streamed' },
      { name: 'PlatformID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'STREAMING_PLATFORM', referencesColumn: 'PlatformID', isNullable: false, description: 'Network platform' },
      { name: 'PeakViewers', type: 'NUMBER(8)', isNullable: false, description: 'Peak concurrent viewer telemetry' }
    ],
    initialRows: [
      { StreamID: 'STR01', MatchID: 'M22', PlatformID: 'PL01', PeakViewers: 1485000 },
      { StreamID: 'STR02', MatchID: 'M22', PlatformID: 'PL02', PeakViewers: 890000 },
      { StreamID: 'STR03', MatchID: 'M22', PlatformID: 'PL03', PeakViewers: 1250000 },
      { StreamID: 'STR04', MatchID: 'M22', PlatformID: 'PL04', PeakViewers: 220000 },
      { StreamID: 'STR05', MatchID: 'M20', PlatformID: 'PL01', PeakViewers: 940000 },
      { StreamID: 'STR06', MatchID: 'M21', PlatformID: 'PL01', PeakViewers: 1120000 }
    ]
  },
  {
    id: 'AUDIENCE',
    name: 'AUDIENCE',
    category: 'Broadcast & Audience',
    description: 'Registered esports digital spectators participating in live interactive voting (simulated demo data).',
    iconName: 'Users',
    canvasPos: { x: 1660, y: 640 },
    columns: [
      { name: 'AudienceID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Fan registration identifier' },
      { name: 'AudienceName', type: 'VARCHAR2(100)', isNullable: false, description: 'Fan handle' },
      { name: 'Country', type: 'VARCHAR2(50)', isNullable: false, description: 'Spectator geographical origin' }
    ],
    initialRows: [
      { AudienceID: 'AUD01', AudienceName: 'NeonStriker99', Country: 'Brazil' },
      { AudienceID: 'AUD02', AudienceName: 'ViperMain_EU', Country: 'France' },
      { AudienceID: 'AUD03', AudienceName: 'SeoulSniper', Country: 'South Korea' },
      { AudienceID: 'AUD04', AudienceName: 'ShanghaiDragon', Country: 'China' },
      { AudienceID: 'AUD05', AudienceName: 'MumbaiAces', Country: 'India' },
      { AudienceID: 'AUD06', AudienceName: 'TokyoGamer', Country: 'Japan' },
      { AudienceID: 'AUD07', AudienceName: 'BerlinDuelist', Country: 'Germany' },
      { AudienceID: 'AUD08', AudienceName: 'CaliFrag', Country: 'USA' }
    ]
  },
  {
    id: 'VOTE',
    name: 'VOTE',
    category: 'Broadcast & Audience',
    description: 'Live fan ballot voting for match MVP and best play distinctions (simulated demo data).',
    iconName: 'Vote',
    canvasPos: { x: 1660, y: 940 },
    columns: [
      { name: 'VoteID', type: 'VARCHAR2(10)', isPrimaryKey: true, isNullable: false, description: 'Vote ballot transaction ID' },
      { name: 'AudienceID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'AUDIENCE', referencesColumn: 'AudienceID', isNullable: false, description: 'Registered fan' },
      { name: 'MatchID', type: 'VARCHAR2(10)', isForeignKey: true, referencesTable: 'MATCH', referencesColumn: 'MatchID', isNullable: false, description: 'Fixture voted on' },
      { name: 'VoteType', type: 'VARCHAR2(50)', isNullable: false, description: 'Best Player, Best Team, Match of the Day' },
      { name: 'VoteDate', type: 'DATE', isNullable: false, description: 'Date cast' }
    ],
    initialRows: [
      { VoteID: 'V01', AudienceID: 'AUD01', MatchID: 'M22', VoteType: 'Best Player', VoteDate: '2026-10-18' },
      { VoteID: 'V02', AudienceID: 'AUD02', MatchID: 'M22', VoteType: 'Match of the Day', VoteDate: '2026-10-18' },
      { VoteID: 'V03', AudienceID: 'AUD03', MatchID: 'M22', VoteType: 'Best Player', VoteDate: '2026-10-18' },
      { VoteID: 'V04', AudienceID: 'AUD04', MatchID: 'M22', VoteType: 'Best Team', VoteDate: '2026-10-18' },
      { VoteID: 'V05', AudienceID: 'AUD05', MatchID: 'M22', VoteType: 'Match of the Day', VoteDate: '2026-10-18' },
      { VoteID: 'V06', AudienceID: 'AUD06', MatchID: 'M22', VoteType: 'Best Player', VoteDate: '2026-10-18' },
      { VoteID: 'V07', AudienceID: 'AUD07', MatchID: 'M22', VoteType: 'Best Player', VoteDate: '2026-10-18' },
      { VoteID: 'V08', AudienceID: 'AUD08', MatchID: 'M22', VoteType: 'Best Team', VoteDate: '2026-10-18' }
    ]
  }
];

export const INITIAL_SEED_DATA: Record<string, any[]> = {};
INITIAL_TABLES.forEach((table) => {
  INITIAL_SEED_DATA[table.id] = [...table.initialRows];
});

export function getInitialTableData(): Record<string, any[]> {
  const data: Record<string, any[]> = {};
  Object.keys(INITIAL_SEED_DATA).forEach((tableId) => {
    data[tableId] = INITIAL_SEED_DATA[tableId].map((row) => ({ ...row }));
  });
  return data;
}
