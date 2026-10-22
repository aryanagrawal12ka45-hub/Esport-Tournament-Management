import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  GitBranch,
  Database,
  Network,
  Terminal,
  Code2,
  ShieldAlert,
  GraduationCap,
  Calculator,
  Play,
  Pause,
  Sun,
  Moon,
  RotateCcw,
  ArrowRight,
  Table as TableIcon,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTab,
    setSelectedTableId,
    tables,
    isLiveSimulating,
    setIsLiveSimulating,
    theme,
    toggleTheme,
    resetDatabase,
    isAdmin,
    setAdminModalOpen
  } = useDatabase();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const allActions = [
    // Views
    {
      id: 'nav_command_center',
      title: 'Command Center',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => setActiveTab('command_center')
    },
    {
      id: 'nav_bracket',
      title: 'Bracket & Tournament Schedule',
      category: 'Navigation',
      icon: GitBranch,
      action: () => setActiveTab('bracket')
    },
    {
      id: 'nav_academy',
      title: 'Scoring Academy (VALORANT Math & Rulebook)',
      category: 'Navigation',
      icon: GraduationCap,
      action: () => setActiveTab('academy')
    },
    {
      id: 'nav_academy_calc1',
      title: 'Academy Calculator: Round Combat Score (RCS) Builder',
      category: 'Calculators',
      icon: Calculator,
      action: () => {
        setActiveTab('academy');
        setTimeout(() => document.getElementById('sec-calculators')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    },
    {
      id: 'nav_academy_calc2',
      title: 'Academy Calculator: Map ACS & Efficiency Simulator',
      category: 'Calculators',
      icon: Calculator,
      action: () => {
        setActiveTab('academy');
        setTimeout(() => document.getElementById('sec-calculators')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    },
    {
      id: 'nav_academy_calc3',
      title: 'Academy Calculator: Champions 2026 Athlete Lookup',
      category: 'Calculators',
      icon: Calculator,
      action: () => {
        setActiveTab('academy');
        setTimeout(() => document.getElementById('sec-calculators')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    },
    {
      id: 'nav_academy_calc5',
      title: 'Academy Calculator: "What Changed My ACS?" Sensitivity Slider',
      category: 'Calculators',
      icon: Calculator,
      action: () => {
        setActiveTab('academy');
        setTimeout(() => document.getElementById('sec-calculators')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    },
    {
      id: 'nav_vault',
      title: 'Data Vault (Relational Explorer & CRUD)',
      category: 'Navigation',
      icon: Database,
      action: () => setActiveTab('vault')
    },
    {
      id: 'nav_schema',
      title: 'Schema Map (Interactive ERD)',
      category: 'Navigation',
      icon: Network,
      action: () => setActiveTab('schema')
    },
    {
      id: 'nav_query',
      title: 'Query Lab (DuckDB-Wasm & Benchmarks)',
      category: 'Navigation',
      icon: Terminal,
      action: () => setActiveTab('query')
    },
    {
      id: 'nav_plsql',
      title: 'PL/SQL Lab (Oracle 19c Packages)',
      category: 'Navigation',
      icon: Code2,
      action: () => setActiveTab('plsql')
    },
    {
      id: 'nav_integrity',
      title: 'Integrity Desk (Anti-Cheat & Sanctions)',
      category: 'Navigation',
      icon: ShieldAlert,
      action: () => setActiveTab('integrity')
    },

    // System Controls
    {
      id: 'ctrl_admin',
      title: isAdmin ? 'Administrator Console (Active - Full Write Permissions)' : 'Administrator Login (Authenticate for Write Access)',
      category: 'System Control',
      icon: isAdmin ? ShieldCheck : Lock,
      action: () => setAdminModalOpen(true)
    },
    {
      id: 'ctrl_sim',
      title: isLiveSimulating ? 'Pause Telemetry Simulation' : 'Resume Telemetry Simulation',
      category: 'System Control',
      icon: isLiveSimulating ? Pause : Play,
      action: () => setIsLiveSimulating((prev) => !prev)
    },
    {
      id: 'ctrl_theme',
      title: theme === 'arena' ? 'Switch to Broadcast Theme (Light)' : 'Switch to Arena Theme (Dark)',
      category: 'System Control',
      icon: theme === 'arena' ? Sun : Moon,
      action: () => toggleTheme()
    },
    {
      id: 'ctrl_reset',
      title: 'Reset Database to Initial Seed',
      category: 'System Control',
      icon: RotateCcw,
      action: () => {
        if (!isAdmin) {
          setAdminModalOpen(true);
          return;
        }
        if (window.confirm('Reset all relational tables back to initial seed data?')) {
          resetDatabase();
        }
      }
    },

    // Tables
    ...tables.map((t) => ({
      id: `table_${t.id}`,
      title: `Inspect Table: ${t.name}`,
      category: 'Database Tables',
      icon: TableIcon,
      action: () => {
        setSelectedTableId(t.id);
        setActiveTab('vault');
      }
    }))
  ];

  const filtered = allActions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (idx: number) => {
    const item = filtered[idx];
    if (item) {
      item.action();
      setCommandPaletteOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-start justify-center pt-16 md:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-translucent transition-opacity cursor-pointer"
        onClick={() => setCommandPaletteOpen(false)}
        aria-hidden="true"
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-2xl bg-surface border border-strong rounded-xl shadow-2xl overflow-hidden z-10 animate-scaleUp">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-token bg-surface-2">
          <Search className="w-5 h-5 text-primary-token flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, table name, or view (e.g. 'Match', 'PL/SQL', 'Simulation')..."
            className="w-full bg-transparent text-token placeholder-muted font-mono text-sm focus:outline-none"
          />
          <kbd className="hidden sm:inline-block font-mono text-xs px-2 py-0.5 rounded bg-surface border border-token text-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-surface">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted">
              No matching commands found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors font-mono text-xs cursor-pointer ${
                    isSelected
                      ? 'bg-primary-soft text-primary-token border-l-2 border-primary font-bold'
                      : 'text-token hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 flex-shrink-0 text-muted" />
                    <span className="font-semibold truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted uppercase">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary-token" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2.5 border-t border-token bg-surface-2 flex items-center justify-between text-xs font-mono text-muted">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>ArenaDB Operations Palette</span>
        </div>
      </div>
    </div>
  );
};
