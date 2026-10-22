import React, { useState, useMemo } from 'react';
import { HudCard } from '../ui/HudCard';
import { StatusChip } from '../ui/StatusChip';
import { acs, adr, kd, acsBand, impactIndex } from '../../engine/scoring';

export const MapStatLineCard: React.FC = () => {
  // Inputs with string state to allow clear/typing without NaN
  const [roundsStr, setRoundsStr] = useState<string>('24');
  const [scoreStr, setScoreStr] = useState<string>('5400');
  const [damageStr, setDamageStr] = useState<string>('3600');
  const [killsStr, setKillsStr] = useState<string>('22');
  const [deathsStr, setDeathsStr] = useState<string>('14');
  const [kastStr, setKastStr] = useState<string>('74');
  const [fkStr, setFkStr] = useState<string>('4');
  const [fdStr, setFdStr] = useState<string>('2');

  // Parsed numerical values (guarded against negative or invalid)
  const rounds = useMemo(() => {
    const val = parseInt(roundsStr, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [roundsStr]);

  const totalScore = useMemo(() => {
    const val = parseInt(scoreStr, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [scoreStr]);

  const damage = useMemo(() => {
    const val = parseInt(damageStr, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [damageStr]);

  const kills = useMemo(() => {
    const val = parseInt(killsStr, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [killsStr]);

  const deaths = useMemo(() => {
    const val = parseInt(deathsStr, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [deathsStr]);

  const kastPct = useMemo(() => {
    const val = parseFloat(kastStr);
    return isNaN(val) ? 0 : Math.min(100, Math.max(0, val));
  }, [kastStr]);

  const firstKills = useMemo(() => {
    const val = parseInt(fkStr, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [fkStr]);

  const firstDeaths = useMemo(() => {
    const val = parseInt(fdStr, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [fdStr]);

  // Single-source engine calculations
  const calcAcs = useMemo(() => acs(totalScore, rounds), [totalScore, rounds]);
  const calcAdr = useMemo(() => adr(damage, rounds), [damage, rounds]);
  const calcKd = useMemo(() => kd(kills, deaths), [kills, deaths]);
  const band = useMemo(() => acsBand(calcAcs), [calcAcs]);

  const fkDiff = firstKills - firstDeaths;

  const calcImpact = useMemo(() => {
    if (rounds <= 0 || calcAcs === null || calcAdr === null) return null;
    return impactIndex({
      acs: calcAcs,
      adr: calcAdr,
      kastPct,
      kd: calcKd,
      firstKills,
      firstDeaths
    });
  }, [rounds, calcAcs, calcAdr, kastPct, calcKd, firstKills, firstDeaths]);

  // Presets
  const handleLoadPreset = (
    r: number,
    s: number,
    d: number,
    k: number,
    dt: number,
    kast: number,
    fk: number,
    fd: number
  ) => {
    setRoundsStr(String(r));
    setScoreStr(String(s));
    setDamageStr(String(d));
    setKillsStr(String(k));
    setDeathsStr(String(dt));
    setKastStr(String(kast));
    setFkStr(String(fk));
    setFdStr(String(fd));
  };

  return (
    <div id="sec-statline" className="scroll-mt-28">
      <HudCard
        title="Map Stat Line Calculator"
        subtitle="Compute official ACS, ADR, K/D, FK-Diff, and ArenaDB Impact Index from complete map stat inputs"
        badge={
          <StatusChip
            label={band === 'n/a' ? 'INPUT ERROR' : band.toUpperCase()}
            variant={band === 'n/a' ? 'dim' : 'cyan'}
          />
        }
      >
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-token text-xs font-mono">
            <span className="text-muted mr-1">Load Presets:</span>
            <button
              onClick={() => handleLoadPreset(24, 5400, 3600, 22, 14, 74, 4, 2)}
              className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token transition-colors"
            >
              Champions Standard (225.0 ACS)
            </button>
            <button
              onClick={() => handleLoadPreset(24, 6960, 4320, 28, 14, 79, 7, 2)}
              className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token transition-colors"
            >
              aspas Map 3 Split (290.0 ACS)
            </button>
            <button
              onClick={() => handleLoadPreset(23, 6900, 4140, 27, 13, 83, 7, 1)}
              className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token transition-colors"
            >
              Sayf Map 2 Sunset (300.0 ACS)
            </button>
            <button
              onClick={() => handleLoadPreset(26, 6240, 3900, 23, 15, 77, 3, 1)}
              className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token transition-colors"
            >
              Less Ascent Overtime (240.0 ACS)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Rounds */}
                <div className="p-3 rounded-xl bg-surface-2 border border-token space-y-1">
                  <label className="text-xs font-mono text-muted uppercase block">
                    Rounds (R)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={roundsStr}
                    onChange={(e) => setRoundsStr(e.target.value)}
                    className="w-full bg-surface border border-token rounded px-2 py-1 text-sm font-mono font-bold text-token focus:outline-none focus:border-token-strong"
                  />
                  <span className="text-xs font-mono text-muted">Map length</span>
                </div>

                {/* Combat Score */}
                <div className="p-3 rounded-xl bg-surface-2 border border-token space-y-1">
                  <label className="text-xs font-mono text-muted uppercase block">
                    Score (TCS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={scoreStr}
                    onChange={(e) => setScoreStr(e.target.value)}
                    className="w-full bg-surface border border-token rounded px-2 py-1 text-sm font-mono font-bold text-token focus:outline-none focus:border-token-strong"
                  />
                  <span className="text-xs font-mono text-muted">Total points</span>
                </div>

                {/* Damage */}
                <div className="p-3 rounded-xl bg-surface-2 border border-token space-y-1">
                  <label className="text-xs font-mono text-muted uppercase block">
                    Damage (HP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={damageStr}
                    onChange={(e) => setDamageStr(e.target.value)}
                    className="w-full bg-surface border border-token rounded px-2 py-1 text-sm font-mono font-bold text-token focus:outline-none focus:border-token-strong"
                  />
                  <span className="text-xs font-mono text-muted">Hitpoints dealt</span>
                </div>

                {/* KAST % */}
                <div className="p-3 rounded-xl bg-surface-2 border border-token space-y-1">
                  <label className="text-xs font-mono text-muted uppercase block">
                    KAST %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={kastStr}
                    onChange={(e) => setKastStr(e.target.value)}
                    className="w-full bg-surface border border-token rounded px-2 py-1 text-sm font-mono font-bold text-token focus:outline-none focus:border-token-strong"
                  />
                  <span className="text-xs font-mono text-muted">Participation %</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Kills */}
                <div className="p-3 rounded-xl bg-surface-2 border border-token space-y-1">
                  <label className="text-xs font-mono text-muted uppercase block">
                    Kills (K)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={killsStr}
                    onChange={(e) => setKillsStr(e.target.value)}
                    className="w-full bg-surface border border-token rounded px-2 py-1 text-sm font-mono font-bold text-token focus:outline-none focus:border-token-strong"
                  />
                </div>

                {/* Deaths */}
                <div className="p-3 rounded-xl bg-surface-2 border border-token space-y-1">
                  <label className="text-xs font-mono text-muted uppercase block">
                    Deaths (D)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={deathsStr}
                    onChange={(e) => setDeathsStr(e.target.value)}
                    className="w-full bg-surface border border-token rounded px-2 py-1 text-sm font-mono font-bold text-token focus:outline-none focus:border-token-strong"
                  />
                </div>

                {/* First Kills */}
                <div className="p-3 rounded-xl bg-surface-2 border border-token space-y-1">
                  <label className="text-xs font-mono text-muted uppercase block">
                    First Kills (FK)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={fkStr}
                    onChange={(e) => setFkStr(e.target.value)}
                    className="w-full bg-surface border border-token rounded px-2 py-1 text-sm font-mono font-bold text-token focus:outline-none focus:border-token-strong"
                  />
                </div>

                {/* First Deaths */}
                <div className="p-3 rounded-xl bg-surface-2 border border-token space-y-1">
                  <label className="text-xs font-mono text-muted uppercase block">
                    First Deaths (FD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={fdStr}
                    onChange={(e) => setFdStr(e.target.value)}
                    className="w-full bg-surface border border-token rounded px-2 py-1 text-sm font-mono font-bold text-token focus:outline-none focus:border-token-strong"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Outputs (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-surface-2 border border-token flex flex-col justify-between space-y-4">
              <div>
                <span className="font-mono text-xs text-muted uppercase tracking-wider block mb-1">
                  Calculated Map ACS
                </span>
                <div className="text-4xl font-mono font-black text-token tracking-tight">
                  {calcAcs !== null ? calcAcs.toFixed(1) : 'n/a'}
                </div>
                <div className="mt-1">
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded font-bold border ${
                      band === 'elite'
                        ? 'bg-secondary-soft text-secondary-token border-[color:color-mix(in_srgb,var(--secondary)_40%,transparent)]'
                        : band === 'great' || band === 'good'
                        ? 'bg-primary-soft text-primary-token border-[color:color-mix(in_srgb,var(--primary)_40%,transparent)]'
                        : band === 'average'
                        ? 'bg-warning-soft text-warning-token border-[color:color-mix(in_srgb,var(--warning)_40%,transparent)]'
                        : 'bg-surface-3 text-token border-strong'
                    }`}
                  >
                    Band: {band}
                  </span>
                </div>

                {/* Breakdown List */}
                <div className="mt-4 pt-3 border-t border-token space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-muted">ADR (Damage / Rounds):</span>
                    <span className="font-bold text-token">
                      {calcAdr !== null ? `${calcAdr.toFixed(1)} HP` : 'n/a'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">K/D Ratio:</span>
                    <span className="font-bold text-token">
                      {calcKd.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Opening Duel Diff (FK - FD):</span>
                    <span
                      className={`font-bold ${
                        fkDiff > 0
                          ? 'text-success-token'
                          : fkDiff < 0
                          ? 'text-danger-token'
                          : 'text-token'
                      }`}
                    >
                      {fkDiff > 0 ? `+${fkDiff}` : fkDiff}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-token">
                    <span className="text-muted">ArenaDB Impact Index:</span>
                    <span className="font-bold text-primary-token text-sm">
                      {calcImpact !== null ? calcImpact.toFixed(2) : 'n/a'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs font-mono text-muted pt-2 border-t border-token">
                Formula: <code className="text-primary-token">0.4(ACS/250) + 0.2(ADR/150) + 0.15(KAST/75) + 0.15(KD) + 0.1(1 + ΔFK/10)</code>
              </div>
            </div>
          </div>
        </div>
      </HudCard>
    </div>
  );
};
