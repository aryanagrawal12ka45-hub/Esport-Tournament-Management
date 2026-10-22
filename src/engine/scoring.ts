/**
 * ArenaDB - Single-Source Scoring Engine
 * VALORANT Champions 2026 Shanghai Scoring Specification
 *
 * NOTE: Community-documented model recognized by competitive esports.
 * Not affiliated with or endorsed by Riot Games.
 */

export const KILL_POINTS: Record<number, number> = { 5: 150, 4: 130, 3: 110, 2: 90, 1: 70 };

export interface RoundInput {
  damage: number;
  killsAtEnemiesAlive: number[];
  nonDamagingAssists: number;
}

export function roundScore(r: RoundInput) {
  const damage = Math.max(0, r.damage || 0);
  const kills = (r.killsAtEnemiesAlive || []).filter((e) => e >= 1 && e <= 5).slice(0, 5);
  const killPoints = kills.reduce((s, e) => s + KILL_POINTS[e], 0);
  const multiKillBonus = 50 * Math.max(0, kills.length - 1);
  const assistPoints = 25 * Math.max(0, r.nonDamagingAssists || 0);
  return {
    damage,
    killPoints,
    multiKillBonus,
    assistPoints,
    total: damage + killPoints + multiKillBonus + assistPoints
  };
}

export const acs = (totalCombatScore: number, rounds: number) =>
  rounds > 0 ? totalCombatScore / rounds : null;

export const adr = (damage: number, rounds: number) =>
  rounds > 0 ? damage / rounds : null;

export const kd = (kills: number, deaths: number) =>
  deaths > 0 ? kills / deaths : kills;

// Tournament ACS = SUM(total combat score) / SUM(rounds), NOT the mean of per-map ACS
export function tournamentAcs(maps: { totalCombatScore: number; rounds: number }[]) {
  const t = maps.reduce((s, m) => s + m.totalCombatScore, 0);
  const r = maps.reduce((s, m) => s + m.rounds, 0);
  return acs(t, r);
}

export function acsBand(a: number | null): string {
  if (a === null) return 'n/a';
  if (a < 100) return 'very low';
  if (a < 150) return 'below average';
  if (a < 200) return 'average';
  if (a < 250) return 'good';
  if (a < 300) return 'great';
  return 'elite';
}

// App-specific composite (NOT an official rating). 1.00 is roughly an average player.
export function impactIndex(p: {
  acs: number;
  adr: number;
  kastPct: number;
  kd: number;
  firstKills: number;
  firstDeaths: number;
}) {
  return (
    0.4 * (p.acs / 250) +
    0.2 * (p.adr / 150) +
    0.15 * (p.kastPct / 75) +
    0.15 * p.kd +
    0.1 * (1 + (p.firstKills - p.firstDeaths) / 10)
  );
}

// =========================================================================
// Backward Compatibility Wrappers (Preserving existing callers without breakage)
// =========================================================================

export const getKillPoints = (enemiesAlive: number): number => {
  return KILL_POINTS[enemiesAlive] ?? 70;
};

export const getMultiKillBonus = (killCount: number): number => {
  if (killCount <= 1) return 0;
  return Math.min(200, (killCount - 1) * 50);
};

export const calculateACS = (totalScore: number, rounds: number): number => {
  const val = acs(totalScore, rounds);
  return val === null ? 0 : Math.round(val * 10) / 10;
};

export const calculateADR = (damage: number, rounds: number): number => {
  const val = adr(damage, rounds);
  return val === null ? 0 : Math.round(val * 10) / 10;
};

export const calculateKD = (kills: number, deaths: number): number => {
  const val = kd(kills, deaths);
  return Math.round(val * 100) / 100;
};

export const calculateKDA = (kills: number, assists: number, deaths: number): number => {
  if (deaths <= 0) return kills + assists;
  return Math.round(((kills + assists) / deaths) * 100) / 100;
};

export const calculateRoundCombatScore = (r: {
  damage: number;
  killsEnemiesAlive?: number[];
  kills?: { enemiesAlive: number }[];
  nonDamageAssists?: number;
}) => {
  const killsAtEnemiesAlive = r.killsEnemiesAlive
    ? r.killsEnemiesAlive
    : r.kills ? r.kills.map((k) => k.enemiesAlive) : [];
  const res = roundScore({
    damage: r.damage,
    killsAtEnemiesAlive,
    nonDamagingAssists: r.nonDamageAssists || 0
  });
  return {
    damagePoints: res.damage,
    killPoints: res.killPoints,
    multiKillBonus: res.multiKillBonus,
    nonDamageAssistPoints: res.assistPoints,
    totalRoundCombatScore: res.total,
    killDetails: killsAtEnemiesAlive.map((e) => ({
      enemiesAlive: e,
      points: getKillPoints(e)
    }))
  };
};

export const calculateImpactIndex = (p: {
  acs: number;
  adr: number;
  kastPct: number;
  kd: number;
  fkFdDiffPerMap?: number;
  firstKills?: number;
  firstDeaths?: number;
}): number => {
  const fk = p.firstKills ?? (p.fkFdDiffPerMap ?? 0);
  const fd = p.firstDeaths ?? 0;
  const res = impactIndex({
    acs: p.acs,
    adr: p.adr,
    kastPct: p.kastPct,
    kd: p.kd,
    firstKills: fk,
    firstDeaths: fd
  });
  return Math.round(res * 100) / 100;
};

export interface ACSPerformanceBand {
  id: string;
  label: string;
  min: number;
  max: number;
  color: string;
  plsqlCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'EXCELLENT';
  description: string;
}

export const ACS_PERFORMANCE_BANDS: ACSPerformanceBand[] = [
  { id: 'very_low', label: 'Very Low', min: 0, max: 100, color: 'var(--danger)', plsqlCategory: 'LOW', description: 'Severely deficient combat presence.' },
  { id: 'below_average', label: 'Below Average', min: 100, max: 150, color: 'var(--warning)', plsqlCategory: 'LOW', description: 'Sub-par frag output.' },
  { id: 'average', label: 'Average', min: 150, max: 200, color: 'var(--accent)', plsqlCategory: 'MODERATE', description: 'Standard competitive baseline.' },
  { id: 'good', label: 'Good', min: 200, max: 250, color: 'var(--info)', plsqlCategory: 'MODERATE', description: 'Solid competitive tournament contribution.' },
  { id: 'great', label: 'Great', min: 250, max: 300, color: 'var(--chart-3)', plsqlCategory: 'HIGH', description: 'High-impact tournament playmaker.' },
  { id: 'elite', label: 'Elite', min: 300, max: 9999, color: 'var(--success)', plsqlCategory: 'EXCELLENT', description: 'Top-tier tournament MVP contender.' }
];

export const ACS_BENCHMARK_BANDS = ACS_PERFORMANCE_BANDS;

export const getACSPerformanceBand = (acsVal: number): ACSPerformanceBand => {
  const found = ACS_PERFORMANCE_BANDS.find((b) => acsVal >= b.min && acsVal < b.max);
  return found || ACS_PERFORMANCE_BANDS[ACS_PERFORMANCE_BANDS.length - 1];
};
