import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calculator,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { StatusChip } from './ui/StatusChip';
import { RoundBuilderCard, type SimulatedRound } from './academy/RoundBuilderCard';
import { MapLedgerCard } from './academy/MapLedgerCard';
import { MapStatLineCard } from './academy/MapStatLineCard';
import { PlayerLookupCard } from './academy/PlayerLookupCard';
import { TournamentStandingsCard } from './academy/TournamentStandingsCard';

interface SectionLink {
  id: string;
  title: string;
  category: string;
}

const ACADEMY_SECTIONS: SectionLink[] = [
  { id: 'sec-overview', title: '1. Framework & Disclaimer', category: 'Overview' },
  { id: 'sec-rules', title: '2. Scoring Rules & Formulas', category: 'Fundamentals' },
  { id: 'sec-round-builder', title: '3. Round Score Builder (RCS)', category: 'Interactive' },
  { id: 'sec-map-ledger', title: '4. Map Ledger & 0–400 Gauge', category: 'Interactive' },
  { id: 'sec-statline', title: '5. Map Stat Line Calculator', category: 'Interactive' },
  { id: 'sec-player-lookup', title: '6. Database Player Lookup & Proof', category: 'Database' },
  { id: 'sec-standings', title: '7. Tiebreak Standings Math', category: 'Tournament' },
  { id: 'sec-champions-format', title: '8. Champions 2026 Format', category: 'Tournament' }
];

// Preloaded standard 24-round map profile (averaging 225.0 ACS)
const INITIAL_STANDARD_MAP_ROUNDS: SimulatedRound[] = [
  { id: 1, damage: 210, killsAtEnemiesAlive: [5, 4], assists: 1, score: 565 },
  { id: 2, damage: 150, killsAtEnemiesAlive: [5], assists: 0, score: 300 },
  { id: 3, damage: 70, killsAtEnemiesAlive: [2], assists: 0, score: 160 },
  { id: 4, damage: 0, killsAtEnemiesAlive: [], assists: 2, score: 50 },
  { id: 5, damage: 185, killsAtEnemiesAlive: [4], assists: 1, score: 340 },
  { id: 6, damage: 95, killsAtEnemiesAlive: [1], assists: 0, score: 165 },
  { id: 7, damage: 450, killsAtEnemiesAlive: [5, 4, 3, 2], assists: 0, score: 1080 },
  { id: 8, damage: 40, killsAtEnemiesAlive: [], assists: 1, score: 65 },
  { id: 9, damage: 120, killsAtEnemiesAlive: [3], assists: 0, score: 230 },
  { id: 10, damage: 0, killsAtEnemiesAlive: [], assists: 0, score: 0 },
  { id: 11, damage: 160, killsAtEnemiesAlive: [5], assists: 1, score: 335 },
  { id: 12, damage: 80, killsAtEnemiesAlive: [2], assists: 0, score: 170 },
  { id: 13, damage: 220, killsAtEnemiesAlive: [4, 3], assists: 0, score: 510 },
  { id: 14, damage: 130, killsAtEnemiesAlive: [4], assists: 1, score: 285 },
  { id: 15, damage: 50, killsAtEnemiesAlive: [], assists: 2, score: 100 },
  { id: 16, damage: 110, killsAtEnemiesAlive: [3], assists: 0, score: 220 },
  { id: 17, damage: 0, killsAtEnemiesAlive: [], assists: 0, score: 0 },
  { id: 18, damage: 190, killsAtEnemiesAlive: [5], assists: 0, score: 340 },
  { id: 19, damage: 75, killsAtEnemiesAlive: [1], assists: 1, score: 170 },
  { id: 20, damage: 140, killsAtEnemiesAlive: [4], assists: 0, score: 270 },
  { id: 21, damage: 60, killsAtEnemiesAlive: [], assists: 1, score: 85 },
  { id: 22, damage: 180, killsAtEnemiesAlive: [5], assists: 0, score: 330 },
  { id: 23, damage: 0, killsAtEnemiesAlive: [], assists: 0, score: 0 },
  { id: 24, damage: 110, killsAtEnemiesAlive: [2], assists: 1, score: 225 }
];

export const ScoringAcademy: React.FC = () => {
  const [activeSection, setActiveSection] = useState('sec-overview');

  // Shared map rounds state for Round Builder & Map Ledger
  const [mapRounds, setMapRounds] = useState<SimulatedRound[]>(INITIAL_STANDARD_MAP_ROUNDS);

  const handleAddRoundToMap = (round: SimulatedRound) => {
    setMapRounds((prev) => [...prev, { ...round, id: prev.length + 1 }]);
  };

  const handleRemoveRound = (id: number) => {
    setMapRounds((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearMap = () => {
    setMapRounds([]);
  };

  const handleLoadStandardMap = () => {
    setMapRounds(INITIAL_STANDARD_MAP_ROUNDS);
  };

  // Smooth scroll handler inside the .arenadb-main scroll container
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const container = document.querySelector('.arenadb-main');
    const el = document.getElementById(id);
    if (container && el) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop - 24;
      container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Auto-track active section on scroll
  useEffect(() => {
    const container = document.querySelector('.arenadb-main');
    if (!container) return;

    const handleScroll = () => {
      const allIds = ACADEMY_SECTIONS.map((s) => s.id);
      const containerTop = container.getBoundingClientRect().top;

      for (let i = allIds.length - 1; i >= 0; i--) {
        const id = allIds[i];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top - containerTop <= 160) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col xl:flex-row gap-6 pb-20 animate-fadeIn">
      {/* Table of Contents Sticky Rail (Visible on extra-wide screens) */}
      <aside className="w-full xl:w-72 flex-shrink-0">
        <div className="xl:sticky xl:top-4 rounded-2xl p-4 shadow-md transition-colors bg-surface border border-token">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-token">
            <GraduationCap className="w-5 h-5 text-warning-token" />
            <h2 className="font-heading text-sm font-bold tracking-wider uppercase text-token">
              Scoring Academy
            </h2>
          </div>
          <p className="text-xs mb-4 leading-relaxed text-muted">
            Official VALORANT competitive scoring playbook, mathematical proofs, and interactive simulators.
          </p>

          <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar pr-1">
            {ACADEMY_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                  activeSection === sec.id
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-muted hover:text-token hover:bg-surface-2 font-medium'
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <ChevronRight
                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                    activeSection === sec.id ? 'text-on-primary' : 'text-muted'
                  }`}
                />
              </button>
            ))}
          </nav>

          <div className="mt-4 pt-3 border-t border-token">
            <button
              type="button"
              onClick={() => scrollToSection('sec-round-builder')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-primary text-on-primary hover:bg-primary-hover transition-all cursor-pointer shadow-sm"
            >
              <Calculator className="w-4 h-4" />
              <span>Launch Simulators</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-8">
        {/* Sticky Horizontal Quick Jump Bar */}
        <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md py-2.5 px-3 rounded-xl border border-token flex items-center gap-2 overflow-x-auto custom-scrollbar shadow-md">
          <span className="text-xs font-mono text-muted uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 mr-1 font-bold">
            <GraduationCap className="w-4 h-4 text-warning-token" />
            <span>Academy Chapters:</span>
          </span>
          {ACADEMY_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToSection(sec.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                activeSection === sec.id
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'bg-surface-2 text-muted hover:text-token border border-token'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* Welcome & Public Data Disclaimer */}
        <section id="sec-overview" className="scroll-mt-28 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-surface border border-token p-6 md:p-8 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <StatusChip label="OFFICIAL GUIDE" variant="emerald" />
                <span className="font-mono text-xs text-warning-token font-bold tracking-widest uppercase">
                  VALORANT Champions 2026 Shanghai
                </span>
              </div>
              <span className="font-mono text-xs text-muted">
                Single-Source Scoring Engine
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-token mb-3">
              Competitive Scoring Academy
            </h1>
            <p className="text-sm md:text-base text-muted max-w-3xl leading-relaxed">
              Master the mechanics of professional tactical shooter analytics. Learn exactly how Combat Score (RCS),
              Average Combat Score (ACS), ADR, K/D, KAST%, and the ArenaDB Impact Index are calculated, audited,
              and queried across real VALORANT Champions Tour Shanghai matches.
            </p>

            {/* Legal / Attribution Alert */}
            <div className="mt-6 p-4 rounded-xl bg-warning-soft border border-warning-token flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-token flex-shrink-0 mt-0.5" />
              <div className="text-xs text-token leading-relaxed">
                <span className="font-bold text-warning-token uppercase tracking-wider block mb-1">
                  Esports Community Attribution & Data Disclosure
                </span>
                Match outcomes, rosters, maps, and series scores are verified from public esports reporting
                sources (vlr.gg, Liquipedia VALORANT, thespike.gg, Riot Games broadcast archives).
                This educational application is <span className="text-token font-semibold">not affiliated with, sponsored by, or endorsed by Riot Games</span>.
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 & Standings & Format */}
        <TournamentStandingsCard />

        {/* Section 3: Round Score Builder (RCS) */}
        <RoundBuilderCard
          onAddRoundToMap={handleAddRoundToMap}
          onClearMap={handleClearMap}
          mapRoundCount={mapRounds.length}
        />

        {/* Section 4: Map Ledger & 0-400 Performance Gauge */}
        <MapLedgerCard
          rounds={mapRounds}
          onRemoveRound={handleRemoveRound}
          onClearMap={handleClearMap}
          onLoadStandardMap={handleLoadStandardMap}
        />

        {/* Section 5: Map Stat Line Calculator */}
        <MapStatLineCard />

        {/* Section 6: Database Player Lookup & Arithmetic Proof */}
        <PlayerLookupCard />
      </div>
    </div>
  );
};

export default ScoringAcademy;
