import React, { useState, useEffect } from 'react';
import {
  Trophy,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  GraduationCap,
  LayoutDashboard,
  GitBranch,
  Database,
  Network,
  Terminal,
  Code2,
  ShieldAlert,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import { ROUTES } from '../constants/routes';
import { Ticker } from './ui/Ticker';
import { StatusPill } from './ui/StatusPill';

export const TopStatusStrip: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    duckDbStatus,
    resetDatabase,
    themeMode,
    cycleTheme,
    resolvedTheme,
    setCommandPaletteOpen,
    isAdmin,
    setAdminModalOpen
  } = useDatabase();

  const navTabs = [
    { id: ROUTES.command_center, label: 'Command Center', icon: LayoutDashboard },
    { id: ROUTES.bracket, label: 'Bracket & Schedule', icon: GitBranch },
    { id: ROUTES.academy, label: 'Scoring Academy', icon: GraduationCap, badge: 'GUIDE' },
    { id: ROUTES.vault, label: 'Data Vault', icon: Database },
    { id: ROUTES.schema, label: 'Schema Map', icon: Network },
    { id: ROUTES.query, label: 'Query Lab', icon: Terminal },
    { id: ROUTES.plsql, label: 'PL/SQL Lab', icon: Code2 },
    { id: ROUTES.integrity, label: 'Integrity Desk', icon: ShieldAlert }
  ];

  const [currentTime, setCurrentTime] = useState<string>('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    if (!isAdmin) {
      setAdminModalOpen(true);
      return;
    }
    if (window.confirm('Reset all relational tables back to tournament initial seed state?')) {
      setResetting(true);
      resetDatabase();
      setTimeout(() => setResetting(false), 600);
    }
  };

  return (
    <header className="flex flex-col bg-surface border-b border-token sticky top-0 z-20 shadow-sm">
      {/* Broadcast Marquee Ticker with fade mask and accessibility */}
      <Ticker />

      {/* Main Status Bar */}
      <div className="min-h-16 py-2 px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left: Tournament Badge & UTC Clock */}
        <div className="flex items-center gap-3 md:gap-5 min-w-0">
          <div className="flex items-center gap-3 flex-shrink-0">
            <Trophy className="w-6 h-6 md:w-7 md:h-7 text-accent-token" />
            <div className="min-w-0">
              <h1 className="font-heading text-lg sm:text-xl md:text-2xl font-black tracking-wider uppercase text-token truncate">
                VALORANT Champions 2026 Shanghai
              </h1>
              <p className="text-xs font-mono text-muted truncate">
                MERCEDES-BENZ ARENA SHANGHAI • GRAND FINALS LAN
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-token font-mono text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Center: Prominent Scoring Academy Trigger (Visible in Normal Desktop View) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab(ROUTES.academy)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
              activeTab === ROUTES.academy
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-2 text-token border border-token hover:bg-surface-3 hover:border-strong'
            }`}
            title="Open Scoring Academy (Competitive Combat Math & Calculators)"
          >
            <GraduationCap className="w-4 h-4 flex-shrink-0" />
            <span>Scoring Academy</span>
            <StatusPill label="GUIDE" variant={activeTab === ROUTES.academy ? 'neutral' : 'primary'} size="sm" />
          </button>
        </div>

        {/* Right: Engine Badges & Controls */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* DuckDB Status Badge */}
          <div className="hidden sm:flex items-center">
            <StatusPill
              label={
                duckDbStatus === 'ready'
                  ? 'DUCKDB-WASM DB'
                  : duckDbStatus === 'loading'
                  ? 'WASM LOADING'
                  : 'ENGINE RELAY'
              }
              variant={duckDbStatus === 'ready' ? 'info' : 'warning'}
              icon={
                duckDbStatus === 'ready'
                  ? CheckCircle2
                  : duckDbStatus === 'loading'
                  ? Loader2
                  : AlertTriangle
              }
              title={
                duckDbStatus === 'ready'
                  ? 'DuckDB-Wasm active as primary in-browser persistent database'
                  : 'Engine Relay active'
              }
            />
          </div>

          {/* Quick Search */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="p-2 text-muted hover:text-token hover:bg-surface-3 rounded border border-token transition-colors cursor-pointer"
            title="Open Command Palette (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Reset DB */}
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-2 border border-token text-xs font-mono text-muted hover:text-danger-token hover:border-danger-token transition-colors cursor-pointer"
            title="Reset Database to Initial Seed"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">RESET</span>
          </button>

          {/* Admin Login / Status Trigger */}
          <button
            type="button"
            onClick={() => setAdminModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ${
              isAdmin
                ? 'bg-success-soft text-success-token border-success-token hover:bg-surface-3'
                : 'bg-surface-2 text-token border-token hover:bg-surface-3 hover:border-strong'
            }`}
            title={isAdmin ? 'Administrator active (Full write/delete access)' : 'Admin Login (Required for write & delete)'}
          >
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-success-token" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-primary-token" />
            )}
            <span>{isAdmin ? 'ADMIN' : 'ADMIN LOGIN'}</span>
          </button>

          {/* Theme Switcher: Light / Dark / System */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-2 border border-token text-xs font-mono text-token hover:bg-surface-3 transition-colors cursor-pointer shadow-sm"
            title={`Current theme: ${themeMode} (${resolvedTheme}). Click to cycle Light → Dark → System.`}
          >
            {themeMode === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-warning-token" />
            ) : themeMode === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-primary-token" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-info-token" />
            )}
            <span className="capitalize font-semibold">{themeMode}</span>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tab Strip */}
      <nav className="hidden md:flex items-center px-4 md:px-6 bg-surface-2 border-t border-token overflow-x-auto custom-scrollbar select-none">
        {navTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 font-mono text-xs transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                isActive
                  ? 'bg-primary text-on-primary font-bold border-b-primary shadow-sm'
                  : 'border-b-transparent text-muted hover:text-token hover:bg-surface-3'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <StatusPill
                  label={item.badge}
                  variant={isActive ? 'neutral' : 'primary'}
                  size="sm"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
