import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { useDatabase } from '../../store/databaseContext';
import { ROUTES } from '../../constants/routes';

export type ScoringMetricType = 'acs' | 'adr' | 'kast' | 'impact' | 'rcs';

interface MetricInfo {
  title: string;
  badge: string;
  formula: string;
  description: string;
  academySectionId: string;
}

const METRIC_DETAILS: Record<ScoringMetricType, MetricInfo> = {
  acs: {
    title: 'Average Combat Score (ACS)',
    badge: 'CORE FRAG RATING',
    formula: 'SUM(Round Combat Scores) / Total Rounds',
    description: 'The standard competitive rating measuring per-round damage, early opening eliminations (70–150 pts), and multi-kill bonuses.',
    academySectionId: 'sec-acs-formula'
  },
  adr: {
    title: 'Average Damage per Round (ADR)',
    badge: 'LETHALITY EFFICIENCY',
    formula: 'Total Damage Dealt / Total Rounds',
    description: 'Average hitpoints dealt per round directly to enemy armor and health. 150+ ADR indicates top-tier damage output.',
    academySectionId: 'sec-secondary-metrics'
  },
  kast: {
    title: 'KAST % Percentage',
    badge: 'CONSISTENCY INDEX',
    formula: '(Rounds with Kill, Assist, Survived, or Traded) / Total Rounds × 100%',
    description: 'Percentage of rounds where an athlete had active tangible value. Elite anchors and IGLs routinely maintain 75%+ KAST.',
    academySectionId: 'sec-secondary-metrics'
  },
  impact: {
    title: 'ArenaDB Impact Index',
    badge: 'COMPOSITE METRIC',
    formula: '0.40(ACS/250) + 0.20(ADR/150) + 0.15(KAST/75) + 0.15(KD) + 0.10(1 + FK-FD/10)',
    description: 'Normalized multi-factor composite rating calibrating combat, utility efficiency, and opening duel swing probability.',
    academySectionId: 'sec-impact-index'
  },
  rcs: {
    title: 'Round Combat Score (RCS)',
    badge: 'ROUND BUILDING BLOCK',
    formula: 'Damage (1 pt/HP) + Kill Points (70–150) + Multi-Kill Bonus (+50) + Assists (+25)',
    description: 'The raw points earned inside an individual round that aggregate into map and tournament ACS.',
    academySectionId: 'sec-combat-score'
  }
};

interface ScoringPopoverProps {
  metric: ScoringMetricType;
  label?: string;
  className?: string;
}

export const ScoringPopover: React.FC<ScoringPopoverProps> = ({ metric, label, className = '' }) => {
  const { setActiveTab } = useDatabase();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const info = METRIC_DETAILS[metric];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenAcademy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTab(ROUTES.academy);
    setIsOpen(false);
    setTimeout(() => {
      const container = document.querySelector('.arenadb-main');
      const el = document.getElementById(info.academySectionId);
      if (container && el) {
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const offset = elRect.top - containerRect.top + container.scrollTop - 24;
        container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
      } else if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <span ref={containerRef} className={`relative inline-flex items-center gap-1 ${className}`}>
      {label && <span>{label}</span>}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onMouseEnter={() => setIsOpen(true)}
        className="p-0.5 text-muted hover:text-primary-token transition-colors rounded cursor-pointer"
        title={`Click or hover to learn how ${info.title} is calculated`}
        aria-label={`Learn how ${info.title} is calculated`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 p-3.5 rounded-xl bg-surface border border-token-strong shadow-2xl text-left font-sans text-xs space-y-2.5 pointer-events-auto animate-fadeIn"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-token">
            <span className="font-heading font-bold uppercase text-token text-xs">
              {info.title}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary-soft text-primary-token font-bold border border-token">
              {info.badge}
            </span>
          </div>

          <div className="p-2 rounded bg-surface-2 font-mono text-xs text-primary-token border border-token">
            {info.formula}
          </div>

          <p className="text-xs text-muted leading-relaxed">
            {info.description}
          </p>

          <div className="pt-1.5 border-t border-token flex justify-end">
            <button
              type="button"
              onClick={handleOpenAcademy}
              className="text-xs font-mono text-primary-token hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <span>Explore in Academy</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </span>
  );
};
