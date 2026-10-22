import React, { useMemo } from 'react';
import {
  Layers,
  BarChart2
} from 'lucide-react';
import { HudCard } from '../ui/HudCard';
import { StatusChip } from '../ui/StatusChip';
import { acs, adr, acsBand } from '../../engine/scoring';
import type { SimulatedRound } from './RoundBuilderCard';

interface MapLedgerCardProps {
  rounds: SimulatedRound[];
  onRemoveRound: (id: number) => void;
  onClearMap: () => void;
  onLoadStandardMap: () => void;
}

export const MapLedgerCard: React.FC<MapLedgerCardProps> = ({
  rounds,
  onRemoveRound,
  onClearMap,
  onLoadStandardMap
}) => {
  const roundCount = rounds.length;
  const totalScore = useMemo(() => rounds.reduce((s, r) => s + r.score, 0), [rounds]);
  const totalDamage = useMemo(() => rounds.reduce((s, r) => s + r.damage, 0), [rounds]);

  // Single-source engine calculations
  const mapAcs = useMemo(() => acs(totalScore, roundCount), [totalScore, roundCount]);
  const mapAdr = useMemo(() => adr(totalDamage, roundCount), [totalDamage, roundCount]);
  const band = useMemo(() => acsBand(mapAcs), [mapAcs]);

  // Marker percentage on 0-400 scale
  const markerPct = useMemo(() => {
    if (mapAcs === null) return 0;
    return Math.min(100, Math.max(0, (mapAcs / 400) * 100));
  }, [mapAcs]);

  // Color styling based on band using semantic design tokens
  const bandColor = useMemo(() => {
    switch (band) {
      case 'elite':
        return 'var(--secondary)';
      case 'great':
        return 'var(--primary)';
      case 'good':
        return 'var(--success)';
      case 'average':
        return 'var(--warning)';
      case 'below average':
        return 'var(--warning)';
      case 'very low':
        return 'var(--text-faint)';
      default:
        return 'var(--text-muted)';
    }
  }, [band]);

  return (
    <div id="sec-map-ledger" className="scroll-mt-28">
      <HudCard
        title="Interactive Map Ledger & Performance Gauge"
        subtitle="Aggregate simulated round scores into an official Map ACS and benchmark on the 0–400 competitive scale"
        badge={
          <StatusChip
            label={band === 'n/a' ? 'NO ROUNDS' : band.toUpperCase()}
            variant={
              band === 'elite'
                ? 'magenta'
                : band === 'great' || band === 'good'
                ? 'cyan'
                : band === 'average'
                ? 'amber'
                : 'dim'
            }
          />
        }
      >
        <div className="space-y-6">
          {/* Top Summary Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-2 border border-token">
              <span className="text-xs font-mono text-muted uppercase block mb-1">
                Total Map Rounds
              </span>
              <div className="text-2xl font-mono font-bold text-token">
                {roundCount}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-2 border border-token">
              <span className="text-xs font-mono text-muted uppercase block mb-1">
                Total Combat Score
              </span>
              <div className="text-2xl font-mono font-bold text-token">
                {totalScore}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-2 border border-token">
              <span className="text-xs font-mono text-muted uppercase block mb-1">
                Map ACS (Score / Rds)
              </span>
              <div className="text-2xl font-mono font-bold text-token">
                {mapAcs !== null ? mapAcs.toFixed(1) : 'n/a'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-2 border border-token">
              <span className="text-xs font-mono text-muted uppercase block mb-1">
                Map ADR (Dmg / Rds)
              </span>
              <div className="text-2xl font-mono font-bold text-token">
                {mapAdr !== null ? mapAdr.toFixed(1) : 'n/a'}
              </div>
            </div>
          </div>

          {/* 0–400 Scale ACS Band Reading with Dynamic Marker */}
          <div className="p-4 rounded-xl bg-surface-2 border border-token space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary-token" />
                <span className="font-bold text-token uppercase tracking-wider">
                  0–400 Scale ACS Competitive Benchmark Gauge
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">Current Rating:</span>
                <span
                  className="font-bold font-mono px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: band !== 'n/a' ? `color-mix(in srgb, ${bandColor} 18%, transparent)` : 'transparent',
                    color: bandColor,
                    border: `1px solid color-mix(in srgb, ${bandColor} 40%, transparent)`
                  }}
                >
                  {mapAcs !== null ? `${mapAcs.toFixed(1)} ACS` : 'n/a'} — {band}
                </span>
              </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="relative pt-6 pb-2">
              {/* Pointer / Needle Marker */}
              {mapAcs !== null && (
                <div
                  className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-10"
                  style={{ left: `${markerPct}%` }}
                >
                  <span
                    className="font-mono text-xs font-bold px-1.5 py-0.5 rounded shadow-md text-white"
                    style={{ backgroundColor: bandColor }}
                  >
                    {mapAcs.toFixed(1)}
                  </span>
                  <div
                    className="w-0 h-0 border-x-4 border-x-transparent border-t-4"
                    style={{ borderTopColor: bandColor }}
                  />
                </div>
              )}

              {/* Gradient Track */}
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-surface border border-token">
                <div style={{ width: '25%', backgroundColor: 'var(--surface-3)' }} title="0-99: Very Low" />
                <div style={{ width: '12.5%', backgroundColor: 'var(--chart-4)' }} title="100-149: Below Average" />
                <div style={{ width: '12.5%', backgroundColor: 'var(--warning)' }} title="150-199: Average" />
                <div style={{ width: '12.5%', backgroundColor: 'var(--success)' }} title="200-249: Good" />
                <div style={{ width: '12.5%', backgroundColor: 'var(--primary)' }} title="250-299: Great" />
                <div style={{ width: '25%', backgroundColor: 'var(--secondary)' }} title="300-400+: Elite" />
              </div>

              {/* Scale Ticks and Labels */}
              <div className="relative flex justify-between text-xs font-mono text-muted pt-1.5">
                <span>0</span>
                <span className="absolute left-[25%] -translate-x-1/2">100</span>
                <span className="absolute left-[37.5%] -translate-x-1/2">150</span>
                <span className="absolute left-[50%] -translate-x-1/2">200</span>
                <span className="absolute left-[62.5%] -translate-x-1/2">250</span>
                <span className="absolute left-[75%] -translate-x-1/2">300</span>
                <span>400+</span>
              </div>
            </div>

            {/* Band Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-token text-xs font-mono">
              <div className="flex items-center gap-1.5 text-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-faint)' }} />
                <span>&lt;100: Very Low</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--chart-4)' }} />
                <span>100–149: Below Avg</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--warning)' }} />
                <span>150–199: Average</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--success)' }} />
                <span>200–249: Good</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                <span>250–299: Great</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--secondary)' }} />
                <span>300+: Elite</span>
              </div>
            </div>
          </div>

          {/* Added Rounds Chips Ledger */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-token" />
                <span className="text-token font-bold uppercase tracking-wider">
                  Added Round Chips ({roundCount} Rounds)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onLoadStandardMap}
                  className="px-2.5 py-1 rounded bg-surface border border-token hover:border-token-strong text-token text-xs font-mono transition-colors"
                >
                  Load Standard Map (24 Rds @ 225 ACS)
                </button>
                <button
                  type="button"
                  onClick={onClearMap}
                  disabled={roundCount === 0}
                  className="px-2.5 py-1 rounded bg-surface border border-token hover:border-danger-token text-muted hover:text-danger-token text-xs font-mono transition-colors disabled:opacity-40"
                >
                  Clear All
                </button>
              </div>
            </div>

            {roundCount === 0 ? (
              <div className="p-6 rounded-xl bg-surface-2 border border-dashed border-strong text-center font-mono text-xs text-muted space-y-2">
                <p>No rounds added to the map ledger yet.</p>
                <p className="text-xs text-primary-token">
                  Use the <strong>Round Builder</strong> above to simulate and add individual rounds, or click "Load Standard Map" to inspect a full 24-round match profile.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-2 border border-token max-h-56 overflow-y-auto custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  {rounds.map((r, idx) => (
                    <div
                      key={r.id || idx}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface border border-token font-mono text-xs hover:border-token-strong transition-colors"
                    >
                      <span className="text-primary-token font-bold">R{idx + 1}</span>
                      <span className="text-token font-bold">{r.score} pts</span>
                      <span className="text-xs text-muted">({r.damage} dmg, {r.killsAtEnemiesAlive?.length || 0}K)</span>
                      <button
                        type="button"
                        onClick={() => onRemoveRound(r.id)}
                        className="text-muted hover:text-danger-token font-bold ml-1 transition-colors cursor-pointer"
                        title="Remove round"
                        aria-label={`Remove round ${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </HudCard>
    </div>
  );
};
