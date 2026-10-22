import React, { useState, useMemo } from 'react';
import {
  Flame,
  Target,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  PlusCircle
} from 'lucide-react';
import { HudCard } from '../ui/HudCard';
import { StatusChip } from '../ui/StatusChip';
import { roundScore } from '../../engine/scoring';

export interface SimulatedRound {
  id: number;
  damage: number;
  killsAtEnemiesAlive: number[];
  assists: number;
  score: number;
}

interface RoundBuilderCardProps {
  onAddRoundToMap: (round: SimulatedRound) => void;
  onClearMap: () => void;
  mapRoundCount: number;
}

export const RoundBuilderCard: React.FC<RoundBuilderCardProps> = ({
  onAddRoundToMap,
  onClearMap,
  mapRoundCount
}) => {
  // Round Builder inputs
  const [damage, setDamage] = useState<number>(210);
  const [assists, setAssists] = useState<number>(1);
  
  // 5 discrete kill selectors (values: null for None, or 5, 4, 3, 2, 1)
  const [kill1, setKill1] = useState<number | null>(5);
  const [kill2, setKill2] = useState<number | null>(4);
  const [kill3, setKill3] = useState<number | null>(null);
  const [kill4, setKill4] = useState<number | null>(null);
  const [kill5, setKill5] = useState<number | null>(null);

  // Active kills array
  const activeKills = useMemo(() => {
    const list: number[] = [];
    if (kill1 !== null) list.push(kill1);
    if (kill2 !== null) list.push(kill2);
    if (kill3 !== null) list.push(kill3);
    if (kill4 !== null) list.push(kill4);
    if (kill5 !== null) list.push(kill5);
    return list;
  }, [kill1, kill2, kill3, kill4, kill5]);

  // Chronological Inversion Check
  // In physical play, enemy headcount must decrease or stay equal monotonically
  const inversion = useMemo(() => {
    for (let i = 0; i < activeKills.length - 1; i++) {
      if (activeKills[i + 1] > activeKills[i]) {
        return {
          priorIndex: i + 1,
          priorAlive: activeKills[i],
          nextIndex: i + 2,
          nextAlive: activeKills[i + 1]
        };
      }
    }
    return null;
  }, [activeKills]);

  // Engine single-source computation
  const result = useMemo(() => {
    return roundScore({
      damage: Math.max(0, damage || 0),
      killsAtEnemiesAlive: activeKills,
      nonDamagingAssists: Math.max(0, assists || 0)
    });
  }, [damage, activeKills, assists]);

  // Proportions for 4-color stacked bar
  const total = result.total;
  const pctDamage = total > 0 ? (result.damage / total) * 100 : 0;
  const pctKill = total > 0 ? (result.killPoints / total) * 100 : 0;
  const pctMK = total > 0 ? (result.multiKillBonus / total) * 100 : 0;
  const pctAssists = total > 0 ? (result.assistPoints / total) * 100 : 0;

  // Presets
  const handleLoadWorkedExample = () => {
    setDamage(210);
    setAssists(1);
    setKill1(5);
    setKill2(4);
    setKill3(null);
    setKill4(null);
    setKill5(null);
  };

  const handleLoadSoloAce = () => {
    setDamage(475);
    setAssists(0);
    setKill1(5);
    setKill2(4);
    setKill3(3);
    setKill4(2);
    setKill5(1);
  };

  const handleLoadOpeningFrag = () => {
    setDamage(150);
    setAssists(0);
    setKill1(5);
    setKill2(null);
    setKill3(null);
    setKill4(null);
    setKill5(null);
  };

  const handleLoadSupportAnchor = () => {
    setDamage(60);
    setAssists(3);
    setKill1(null);
    setKill2(null);
    setKill3(null);
    setKill4(null);
    setKill5(null);
  };

  const handleAddRound = () => {
    onAddRoundToMap({
      id: mapRoundCount + 1,
      damage: result.damage,
      killsAtEnemiesAlive: [...activeKills],
      assists: result.assistPoints / 25,
      score: result.total
    });
  };

  return (
    <div id="sec-round-builder" className="scroll-mt-28">
      <HudCard
        title="Round Builder: Combat Score Simulator"
        subtitle="Live breakdown testing damage, 5 kill timing slots, multi-kill bonuses, and non-damaging assists"
        badge={
          <StatusChip
            label={total >= 400 ? 'HERO ROUND' : total >= 200 ? 'SOLID ROUND' : 'LOW IMPACT'}
            variant={total >= 400 ? 'live' : total >= 200 ? 'emerald' : 'dim'}
          />
        }
      >
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-token text-xs font-mono">
            <span className="text-muted mr-1">Load Presets:</span>
            <button
              onClick={handleLoadWorkedExample}
              className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token transition-colors"
            >
              Official Worked Example (565 Pts)
            </button>
            <button
              onClick={handleLoadOpeningFrag}
              className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token transition-colors"
            >
              Opening Frag (300 Pts)
            </button>
            <button
              onClick={handleLoadSoloAce}
              className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token transition-colors"
            >
              Solo ACE (1,225 Pts)
            </button>
            <button
              onClick={handleLoadSupportAnchor}
              className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token transition-colors"
            >
              Support Anchor (135 Pts)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Inputs (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Damage Input */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-token space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--chart-1)' }}>
                    <Flame className="w-3.5 h-3.5" />
                    <span>Pillar 1: Damage Dealt (1 Pt / HP)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={damage}
                      onChange={(e) => setDamage(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 px-2 py-0.5 bg-surface border border-token rounded text-right font-bold text-xs focus:outline-none focus:border-token-strong"
                      style={{ color: 'var(--chart-1)' }}
                    />
                    <span className="text-muted">HP</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={750}
                  step={5}
                  value={damage}
                  onChange={(e) => setDamage(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              {/* 5 Kill Selectors */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-token space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--chart-2)' }}>
                    <Target className="w-3.5 h-3.5" />
                    <span>Pillar 2: Eliminations (5 Timing Slots)</span>
                  </div>
                  <span className="text-xs text-muted">
                    Active: <strong className="text-token">{activeKills.length}/5</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {[
                    { label: 'Kill 1', val: kill1, setVal: setKill1 },
                    { label: 'Kill 2', val: kill2, setVal: setKill2 },
                    { label: 'Kill 3', val: kill3, setVal: setKill3 },
                    { label: 'Kill 4', val: kill4, setVal: setKill4 },
                    { label: 'Kill 5', val: kill5, setVal: setKill5 }
                  ].map((slot, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="block text-xs font-mono text-muted uppercase">
                        {slot.label}
                      </span>
                      <select
                        value={slot.val === null ? 'none' : slot.val}
                        onChange={(e) => {
                          const v = e.target.value;
                          slot.setVal(v === 'none' ? null : Number(v));
                        }}
                        className={`w-full py-1.5 px-1.5 text-xs font-mono rounded border transition-colors ${
                          slot.val !== null
                            ? 'bg-surface border-token-strong text-token font-bold'
                            : 'bg-surface border-token text-muted'
                        }`}
                      >
                        <option value="none">None</option>
                        <option value="5">5 Alive (150p)</option>
                        <option value="4">4 Alive (130p)</option>
                        <option value="3">3 Alive (110p)</option>
                        <option value="2">2 Alive (90p)</option>
                        <option value="1">1 Alive (70p)</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Multi-Kill bonus indicator */}
                {result.multiKillBonus > 0 && (
                  <div
                    className="flex items-center justify-between text-xs font-mono p-2 rounded border"
                    style={{
                      borderColor: 'var(--chart-3)',
                      color: 'var(--chart-3)',
                      backgroundColor: 'color-mix(in srgb, var(--chart-3) 12%, transparent)'
                    }}
                  >
                    <span className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      Multi-Kill Streak Bonus ({activeKills.length} frags):
                    </span>
                    <span className="font-bold">+{result.multiKillBonus} Pts (+50 per kill after 1st)</span>
                  </div>
                )}

                {/* Chronological Inversion Warning */}
                {inversion && (
                  <div className="p-3 rounded-lg bg-warning-soft border border-warning-token flex items-start gap-2 text-xs font-mono text-warning-token">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block mb-0.5">
                        Chronological Inversion Warning
                      </span>
                      Kill #{inversion.nextIndex} is set to {inversion.nextAlive} enemies alive, but Kill #{inversion.priorIndex} was at {inversion.priorAlive} alive.
                      In physical rounds, enemy headcount strictly decreases as eliminations occur.
                    </div>
                  </div>
                )}
              </div>

              {/* Pillar 3: Non-Damaging Utility Assists */}
              <div className="p-3.5 rounded-xl bg-surface-2 border border-token space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--chart-4)' }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Pillar 3: Non-Damaging Utility Assists (+25 Pts each)</span>
                  </div>
                  <span className="font-bold" style={{ color: 'var(--chart-4)' }}>
                    +{result.assistPoints} Pts ({assists} Assists)
                  </span>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAssists(num)}
                      className={`flex-1 py-1.5 rounded font-mono text-xs border transition-colors ${
                        assists === num
                          ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                          : 'bg-surface text-muted border-token hover:bg-surface-3'
                      }`}
                    >
                      {num} {num === 1 ? 'Assist' : 'Assists'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Large Round Total & 4-Color Stacked Bar (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-surface-2 border border-token flex flex-col justify-between space-y-5">
              <div>
                <span className="font-mono text-xs text-muted uppercase tracking-wider block mb-1">
                  Total Round Combat Score (RCS)
                </span>
                <div className="text-5xl font-mono font-black text-token tracking-tight">
                  {total} <span className="text-base font-sans font-normal text-muted">Points</span>
                </div>

                {/* 4-Color Stacked Progress Bar */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs font-mono text-muted">
                    <span>Point Distribution Breakdown</span>
                    <span>{total > 0 ? '100%' : '0%'}</span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-4 w-full rounded-full overflow-hidden flex bg-surface border border-token">
                    {total === 0 ? (
                      <div className="w-full h-full bg-surface-2 flex items-center justify-center text-xs font-mono text-muted">
                        0 Points
                      </div>
                    ) : (
                      <>
                        {pctDamage > 0 && (
                          <div
                            style={{ width: `${pctDamage}%`, backgroundColor: 'var(--chart-1)' }}
                            className="transition-all duration-300"
                            title={`Damage: ${result.damage} pts (${pctDamage.toFixed(1)}%)`}
                          />
                        )}
                        {pctKill > 0 && (
                          <div
                            style={{ width: `${pctKill}%`, backgroundColor: 'var(--chart-2)' }}
                            className="transition-all duration-300"
                            title={`Base Kills: ${result.killPoints} pts (${pctKill.toFixed(1)}%)`}
                          />
                        )}
                        {pctMK > 0 && (
                          <div
                            style={{ width: `${pctMK}%`, backgroundColor: 'var(--chart-3)' }}
                            className="transition-all duration-300"
                            title={`Multi-Kill: ${result.multiKillBonus} pts (${pctMK.toFixed(1)}%)`}
                          />
                        )}
                        {pctAssists > 0 && (
                          <div
                            style={{ width: `${pctAssists}%`, backgroundColor: 'var(--chart-4)' }}
                            className="transition-all duration-300"
                            title={`Assists: ${result.assistPoints} pts (${pctAssists.toFixed(1)}%)`}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Legend with exact amounts and percentages */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-token">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--chart-1)' }} />
                      <span className="text-muted text-xs">Damage:</span>
                      <strong className="ml-auto" style={{ color: 'var(--chart-1)' }}>
                        {result.damage} ({pctDamage.toFixed(0)}%)
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--chart-2)' }} />
                      <span className="text-muted text-xs">Kill Pts:</span>
                      <strong className="ml-auto" style={{ color: 'var(--chart-2)' }}>
                        {result.killPoints} ({pctKill.toFixed(0)}%)
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--chart-3)' }} />
                      <span className="text-muted text-xs">Multi-Kill:</span>
                      <strong className="ml-auto" style={{ color: 'var(--chart-3)' }}>
                        {result.multiKillBonus} ({pctMK.toFixed(0)}%)
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--chart-4)' }} />
                      <span className="text-muted text-xs">Assists:</span>
                      <strong className="ml-auto" style={{ color: 'var(--chart-4)' }}>
                        {result.assistPoints} ({pctAssists.toFixed(0)}%)
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Add round to map & Clear map */}
              <div className="pt-4 border-t border-token space-y-2">
                <button
                  type="button"
                  onClick={handleAddRound}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary hover:bg-primary-hover font-mono font-bold text-xs uppercase transition-all shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Round to Map Ledger (Round #{mapRoundCount + 1})</span>
                </button>

                <button
                  type="button"
                  onClick={onClearMap}
                  disabled={mapRoundCount === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-surface border border-token hover:border-danger-token text-muted hover:text-danger-token text-xs font-mono transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Map Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </HudCard>
    </div>
  );
};
