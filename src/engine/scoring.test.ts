import { describe, it, expect } from 'vitest';
import {
  roundScore,
  acs,
  adr,
  kd,
  tournamentAcs,
  acsBand,
  impactIndex
} from './scoring';

describe('Scoring Engine - Mandatory Specifications (Step 5)', () => {
  it('calculates official worked example: 210 damage, kills at 5 & 4 alive, 1 non-damaging assist = 565 total', () => {
    const result = roundScore({
      damage: 210,
      killsAtEnemiesAlive: [5, 4],
      nonDamagingAssists: 1
    });
    expect(result.damage).toBe(210);
    expect(result.killPoints).toBe(280); // 150 + 130
    expect(result.multiKillBonus).toBe(50);
    expect(result.assistPoints).toBe(25);
    expect(result.total).toBe(565);
  });

  it('calculates standard map ACS: acs(5400, 24) === 225', () => {
    expect(acs(5400, 24)).toBe(225);
  });

  it('awards 70 points for a single kill at 1 enemy alive with 0 damage', () => {
    const result = roundScore({
      damage: 0,
      killsAtEnemiesAlive: [1],
      nonDamagingAssists: 0
    });
    expect(result.killPoints).toBe(70);
    expect(result.damage).toBe(0);
    expect(result.multiKillBonus).toBe(0);
    expect(result.total).toBe(70);
  });

  it('awards 550 kill points + 200 multi-kill bonus for an Ace (5 kills at 5,4,3,2,1 alive)', () => {
    const result = roundScore({
      damage: 0,
      killsAtEnemiesAlive: [5, 4, 3, 2, 1],
      nonDamagingAssists: 0
    });
    // 150 + 130 + 110 + 90 + 70 = 550
    expect(result.killPoints).toBe(550);
    expect(result.multiKillBonus).toBe(200);
    expect(result.total).toBe(750);
  });

  it('returns null for acs(100, 0) and formats band as n/a', () => {
    const acsVal = acs(100, 0);
    expect(acsVal).toBeNull();
    expect(acsBand(acsVal)).toBe('n/a');
  });

  it('proves tournamentAcs differs from arithmetic mean of per-map ACS when round counts vary', () => {
    // Map 1: 13 rounds @ 300 ACS = 3,900 Total Score
    // Map 2: 24 rounds @ 200 ACS = 4,800 Total Score
    const maps = [
      { totalCombatScore: 3900, rounds: 13 },
      { totalCombatScore: 4800, rounds: 24 }
    ];

    const trueAcs = tournamentAcs(maps);
    // True: (3900 + 4800) / (13 + 24) = 8700 / 37 ≈ 235.135
    expect(trueAcs).toBeCloseTo(235.135, 2);

    // Arithmetic mean of map ACS: (300 + 200) / 2 = 250
    const meanOfMapAcs = (300 + 200) / 2;
    expect(trueAcs).not.toBe(meanOfMapAcs);
    expect(Math.abs(trueAcs! - meanOfMapAcs)).toBeGreaterThan(14);
  });
});

describe('Scoring Engine - Secondary Metrics & Impact Index', () => {
  it('calculates adr and kd with division guards', () => {
    expect(adr(3600, 24)).toBe(150);
    expect(adr(1000, 0)).toBeNull();
    expect(kd(20, 10)).toBe(2);
    expect(kd(15, 0)).toBe(15);
  });

  it('calculates composite impactIndex properly', () => {
    const val = impactIndex({
      acs: 250,
      adr: 150,
      kastPct: 75,
      kd: 1.0,
      firstKills: 3,
      firstDeaths: 3
    });
    // 0.40*(250/250) + 0.20*(150/150) + 0.15*(75/75) + 0.15*(1.0) + 0.10*(1 + 0) = 0.40 + 0.20 + 0.15 + 0.15 + 0.10 = 1.00
    expect(val).toBeCloseTo(1.00, 2);
  });
});
