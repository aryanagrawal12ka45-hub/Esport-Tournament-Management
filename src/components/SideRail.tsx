import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Database,
  Network,
  Terminal,
  Code2,
  ShieldAlert,
  GraduationCap,
  Sun,
  Moon,
  Monitor,
  ChevronLeft,
  Search,
  Zap,
  Menu,
  X,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { useDatabase, type ThemeMode } from '../store/databaseContext';
import { ROUTES } from '../constants/routes';

interface SideRailProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badge: string | null;
  isLive?: boolean;
}

export const SideRail: React.FC<SideRailProps> = ({ collapsed, onToggleCollapse }) => {
  const {
    activeTab,
    setActiveTab,
    themeMode,
    setThemeMode,
    cycleTheme,
    resolvedTheme,
    isLiveSimulating,
    setIsLiveSimulating,
    setCommandPaletteOpen,
    stats,
    tables,
    isAdmin,
    setAdminModalOpen
  } = useDatabase();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // Group 1: "Operate"
  const operateGroup: NavItemConfig[] = [
    {
      id: ROUTES.command_center,
      label: 'Command Center',
      shortLabel: 'Hub',
      icon: LayoutDashboard,
      badge: isLiveSimulating ? 'LIVE' : null,
      isLive: isLiveSimulating
    },
    {
      id: ROUTES.bracket,
      label: 'Bracket & Schedule',
      shortLabel: 'Bracket',
      icon: GitBranch,
      badge: 'STG03'
    },
    {
      id: ROUTES.integrity,
      label: 'Integrity Desk',
      shortLabel: 'Integrity',
      icon: ShieldAlert,
      badge: stats.underReviewCount > 0 ? String(stats.underReviewCount) : null
    }
  ];

  // Group 2: "Learn and analyse"
  const learnGroup: NavItemConfig[] = [
    {
      id: ROUTES.academy,
      label: 'Scoring Academy',
      shortLabel: 'Academy',
      icon: GraduationCap,
      badge: 'GUIDE'
    },
    {
      id: ROUTES.vault,
      label: 'Data Vault',
      shortLabel: 'Vault',
      icon: Database,
      badge: String(tables.length)
    },
    {
      id: ROUTES.schema,
      label: 'Schema Map',
      shortLabel: 'Schema',
      icon: Network,
      badge: '3NF'
    },
    {
      id: ROUTES.query,
      label: 'Query Lab',
      shortLabel: 'Queries',
      icon: Terminal,
      badge: 'DuckDB'
    },
    {
      id: ROUTES.plsql,
      label: 'PL/SQL Lab',
      shortLabel: 'PL/SQL',
      icon: Code2,
      badge: '19c'
    }
  ];

  // Handler to select a route and close mobile drawer
  const handleSelectRoute = (routeId: string) => {
    setActiveTab(routeId);
    setMobileDrawerOpen(false);
  };

  // Close mobile drawer on Escape key & manage focus trap
  useEffect(() => {
    if (!mobileDrawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
        mobileToggleRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        const drawer = mobileDrawerRef.current;
        if (!drawer) return;
        const focusable = drawer.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus into drawer
    const timer = setTimeout(() => {
      const drawer = mobileDrawerRef.current;
      if (!drawer) return;
      const firstFocusable = drawer.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [mobileDrawerOpen]);

  const themeSegments: Array<{
    id: ThemeMode;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }> = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor }
  ];

  // Helper renderer for a single Nav item (expanded mode)
  const renderExpandedNavItem = (item: NavItemConfig, onSelect?: () => void) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setActiveTab(item.id);
          if (onSelect) onSelect();
        }}
        className={`w-full h-[44px] flex items-center px-3 rounded-[10px] text-xs font-mono relative cursor-pointer sb-nav-item sb-focus-visible ${
          isActive ? 'font-semibold' : ''
        }`}
        style={
          isActive
            ? {
                backgroundColor: 'var(--sb-active-bg)',
                color: 'var(--sb-active-text)'
              }
            : {
                color: 'var(--sb-text)'
              }
        }
        title={item.label}
      >
        {/* Active 4px accent bar on left edge */}
        {isActive && (
          <span
            className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full pointer-events-none"
            style={{ backgroundColor: 'var(--sb-active-bar)' }}
          />
        )}

        <Icon
          className="w-[18px] h-[18px] flex-shrink-0"
          style={{
            color: isActive ? 'var(--sb-active-text)' : 'var(--sb-text-muted)'
          }}
        />

        <span
          className="ml-3 flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            color: isActive ? 'var(--sb-active-text)' : 'var(--sb-text)'
          }}
        >
          {item.label}
        </span>

        {item.badge && (
          <span
            className="ml-1.5 px-1.5 py-0.5 rounded-[6px] text-[11px] font-mono font-semibold tabular-nums flex-shrink-0 flex items-center"
            style={
              isActive
                ? {
                    backgroundColor: 'var(--sb-badge-active-bg)',
                    color: 'var(--sb-active-text)'
                  }
                : item.isLive
                ? {
                    backgroundColor: 'var(--sb-badge-live-bg)',
                    color: 'var(--sb-badge-live-text)'
                  }
                : {
                    backgroundColor: 'var(--sb-badge-bg)',
                    color: 'var(--sb-badge-text)'
                  }
            }
          >
            {item.isLive && (
              <span
                className="w-1.5 h-1.5 rounded-full sb-pulse-dot mr-1 flex-shrink-0"
                style={{
                  backgroundColor: isActive
                    ? 'var(--sb-active-text)'
                    : 'var(--sb-badge-live-text)'
                }}
              />
            )}
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  // Helper renderer for a single Nav item (collapsed icon rail mode: 72px)
  const renderCollapsedNavItem = (item: NavItemConfig) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <div key={item.id} className="relative flex justify-center group my-1">
        <button
          type="button"
          onClick={() => setActiveTab(item.id)}
          className="w-10 h-10 rounded-[10px] flex items-center justify-center relative cursor-pointer sb-nav-item sb-focus-visible"
          style={
            isActive
              ? {
                  backgroundColor: 'var(--sb-active-bg)',
                  color: 'var(--sb-active-text)'
                }
              : {
                  color: 'var(--sb-text-muted)'
                }
          }
          title={item.label}
          aria-label={item.label}
        >
          <Icon
            className="w-[18px] h-[18px] flex-shrink-0"
            style={{
              color: isActive ? 'var(--sb-active-text)' : 'var(--sb-text-muted)'
            }}
          />

          {/* Badge Dot indicator for collapsed rail */}
          {item.badge && (
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                item.isLive ? 'sb-pulse-dot' : ''
              }`}
              style={{
                backgroundColor: isActive
                  ? 'var(--sb-active-bar)'
                  : item.isLive
                  ? 'var(--sb-badge-live-text)'
                  : 'var(--sb-active-bg)'
              }}
            />
          )}
        </button>

        {/* Collapsed Tooltip on hover / focus */}
        <div
          className="hidden group-hover:flex group-focus-within:flex absolute left-full ml-3 px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium shadow-2xl pointer-events-none whitespace-nowrap z-50 items-center gap-1.5"
          style={{
            background: 'var(--sb-bg)',
            color: 'var(--sb-text)',
            border: '1px solid var(--sb-border)',
            boxShadow: 'var(--sb-shadow)'
          }}
        >
          <span>{item.label}</span>
          {item.badge && (
            <span
              className="text-[10px] font-bold px-1 rounded tabular-nums"
              style={{
                backgroundColor: 'var(--sb-badge-bg)',
                color: 'var(--sb-badge-text)'
              }}
            >
              {item.badge}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* =========================================================================
          Desktop / Tablet Rail: 264px (Expanded) or 72px (Collapsed)
          ========================================================================= */}
      <aside
        className={`hidden md:flex flex-col select-none relative z-30 transition-all duration-200 sidebar-panel ${
          collapsed ? 'w-[72px]' : 'w-[264px]'
        }`}
      >
        {/* Brand Block */}
        <div
          className={`h-16 flex items-center px-3 border-b ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          style={{ borderColor: 'var(--sb-divider)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            {/* Logo Tile */}
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: 'var(--sb-logo-bg)' }}
            >
              <Zap
                className="w-5 h-5 flex-shrink-0"
                style={{ color: 'var(--sb-logo-icon)' }}
              />
            </div>

            {/* Brand Title & LAB Pill */}
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-heading text-lg font-black tracking-wider"
                    style={{ color: 'var(--sb-text)' }}
                  >
                    ARENADB
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--sb-badge-bg)',
                      color: 'var(--sb-badge-text)'
                    }}
                  >
                    LAB
                  </span>
                </div>
                <p
                  className="text-[11px] font-mono truncate font-medium"
                  style={{ color: 'var(--sb-text-muted)' }}
                >
                  TOURNAMENT OPS DB
                </p>
              </div>
            )}
          </div>

          {/* Collapse Chevron Ghost Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-[8px] transition-colors cursor-pointer sb-focus-visible"
            style={{ color: 'var(--sb-text-muted)' }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-200 ${
                collapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Quick Search (Command Palette Trigger) */}
        <div
          className="p-3 border-b"
          style={{ borderColor: 'var(--sb-divider)' }}
        >
          {collapsed ? (
            <div className="relative flex justify-center group">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer sb-search-field sb-focus-visible"
                style={{
                  backgroundColor: 'var(--sb-field-bg)',
                  border: '1px solid var(--sb-field-border)',
                  color: 'var(--sb-text-muted)'
                }}
                aria-label="Quick Search (Ctrl+K)"
                title="Quick Search (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>
              <div
                className="hidden group-hover:flex group-focus-within:flex absolute left-full ml-3 px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium shadow-2xl pointer-events-none whitespace-nowrap z-50 items-center gap-1.5"
                style={{
                  background: 'var(--sb-bg)',
                  color: 'var(--sb-text)',
                  border: '1px solid var(--sb-border)',
                  boxShadow: 'var(--sb-shadow)'
                }}
              >
                <span>Quick Search (Ctrl+K)</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full h-9 flex items-center justify-between px-3 rounded-[8px] text-xs font-mono transition-all cursor-pointer sb-search-field sb-focus-visible"
              style={{
                backgroundColor: 'var(--sb-field-bg)',
                border: '1px solid var(--sb-field-border)',
                color: 'var(--sb-text)'
              }}
              title="Search or jump (Ctrl+K)"
            >
              <div className="flex items-center gap-2">
                <Search
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: 'var(--sb-text-muted)' }}
                />
                <span
                  className="font-mono font-medium"
                  style={{ color: 'var(--sb-text-muted)' }}
                >
                  Quick Search...
                </span>
              </div>
              <kbd
                className="font-mono text-[11px] px-1.5 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: 'var(--sb-badge-bg)',
                  color: 'var(--sb-badge-text)',
                  border: '1px solid var(--sb-border)'
                }}
              >
                Ctrl+K
              </kbd>
            </button>
          )}
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 custom-scrollbar">
          {collapsed ? (
            <>
              {operateGroup.map(renderCollapsedNavItem)}
              <div
                className="my-2 border-t mx-2"
                style={{ borderColor: 'var(--sb-divider)' }}
              />
              {learnGroup.map(renderCollapsedNavItem)}
            </>
          ) : (
            <>
              {/* Group 1: Operate */}
              <div
                className="px-2 pt-2 pb-1 text-[11px] font-mono font-semibold tracking-wider"
                style={{ color: 'var(--sb-text-muted)' }}
              >
                Operate
              </div>
              {operateGroup.map((item) => renderExpandedNavItem(item))}

              {/* 1px divider between groups */}
              <div
                className="my-2 border-t mx-2"
                style={{ borderColor: 'var(--sb-divider)' }}
              />

              {/* Group 2: Learn and analyse */}
              <div
                className="px-2 pt-1 pb-1 text-[11px] font-mono font-semibold tracking-wider"
                style={{ color: 'var(--sb-text-muted)' }}
              >
                Learn and analyse
              </div>
              {learnGroup.map((item) => renderExpandedNavItem(item))}
            </>
          )}
        </nav>

        {/* Bottom Area: Simulation Status Card & Theme Control */}
        <div
          className="p-3 space-y-2 border-t"
          style={{ borderColor: 'var(--sb-divider)' }}
        >
          {/* Simulation Status Card */}
          {collapsed ? (
            <div className="relative flex justify-center group">
              <button
                type="button"
                onClick={() => setIsLiveSimulating((prev) => !prev)}
                className="w-10 h-10 rounded-[8px] flex items-center justify-center transition-all cursor-pointer sb-focus-visible"
                style={
                  isLiveSimulating
                    ? {
                        backgroundColor: 'var(--sb-sim-active-bg)',
                        color: 'var(--sb-sim-active-text)',
                        border: '1px solid var(--sb-sim-active-border)'
                      }
                    : {
                        backgroundColor: 'var(--sb-sim-paused-bg)',
                        color: 'var(--sb-sim-paused-text)',
                        border: '1px solid var(--sb-sim-paused-border)'
                      }
                }
                title={
                  isLiveSimulating
                    ? 'Simulation: ACTIVE (Click to pause)'
                    : 'Simulation: PAUSED (Click to resume)'
                }
                aria-label={
                  isLiveSimulating ? 'Simulation: ACTIVE' : 'Simulation: PAUSED'
                }
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isLiveSimulating ? 'sb-pulse-dot' : ''
                  }`}
                  style={{
                    backgroundColor: isLiveSimulating
                      ? 'var(--sb-sim-active-text)'
                      : 'var(--sb-sim-paused-text)'
                  }}
                />
              </button>
              <div
                className="hidden group-hover:flex group-focus-within:flex absolute left-full ml-3 px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium shadow-2xl pointer-events-none whitespace-nowrap z-50 items-center gap-1.5"
                style={{
                  background: 'var(--sb-bg)',
                  color: 'var(--sb-text)',
                  border: '1px solid var(--sb-border)',
                  boxShadow: 'var(--sb-shadow)'
                }}
              >
                <span>
                  {isLiveSimulating
                    ? 'Simulation: ACTIVE'
                    : 'Simulation: PAUSED'}
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsLiveSimulating((prev) => !prev)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer sb-focus-visible shadow-sm"
              style={
                isLiveSimulating
                  ? {
                      backgroundColor: 'var(--sb-sim-active-bg)',
                      color: 'var(--sb-sim-active-text)',
                      border: '1px solid var(--sb-sim-active-border)'
                    }
                  : {
                      backgroundColor: 'var(--sb-sim-paused-bg)',
                      color: 'var(--sb-sim-paused-text)',
                      border: '1px solid var(--sb-sim-paused-border)'
                    }
              }
              title={
                isLiveSimulating
                  ? 'Pause Match Telemetry Simulation'
                  : 'Resume Match Telemetry Simulation'
              }
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isLiveSimulating ? 'sb-pulse-dot' : ''
                }`}
                style={{
                  backgroundColor: isLiveSimulating
                    ? 'var(--sb-sim-active-text)'
                    : 'var(--sb-sim-paused-text)'
                }}
              />
              <span className="truncate flex-1 text-left">
                {isLiveSimulating ? 'Simulation: ACTIVE' : 'Simulation: PAUSED'}
              </span>
              <span
                className="text-[10px] font-normal font-mono opacity-80"
                style={{
                  color: isLiveSimulating
                    ? 'var(--sb-sim-active-text)'
                    : 'var(--sb-sim-paused-text)'
                }}
              >
                {isLiveSimulating ? 'LIVE' : 'PAUSED'}
              </span>
            </button>
          )}

          {/* Theme Control: Segmented (Expanded) or Icon (Collapsed) */}
          {collapsed ? (
            <div className="relative flex justify-center group">
              <button
                type="button"
                onClick={cycleTheme}
                className="w-10 h-10 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer sb-focus-visible"
                style={{
                  backgroundColor: 'var(--sb-field-bg)',
                  border: '1px solid var(--sb-field-border)',
                  color: 'var(--sb-text)'
                }}
                aria-label={`Current theme: ${themeMode} (${resolvedTheme}). Click to cycle.`}
                title={`Current theme: ${themeMode} (${resolvedTheme}). Click to cycle.`}
              >
                {themeMode === 'light' ? (
                  <Sun
                    className="w-4 h-4"
                    style={{ color: 'var(--sb-active-bg)' }}
                  />
                ) : themeMode === 'dark' ? (
                  <Moon
                    className="w-4 h-4"
                    style={{ color: 'var(--sb-active-bg)' }}
                  />
                ) : (
                  <Monitor
                    className="w-4 h-4"
                    style={{ color: 'var(--sb-active-bg)' }}
                  />
                )}
              </button>
              <div
                className="hidden group-hover:flex group-focus-within:flex absolute left-full ml-3 px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium shadow-2xl pointer-events-none whitespace-nowrap z-50 items-center gap-1.5"
                style={{
                  background: 'var(--sb-bg)',
                  color: 'var(--sb-text)',
                  border: '1px solid var(--sb-border)',
                  boxShadow: 'var(--sb-shadow)'
                }}
              >
                <span className="capitalize">Theme: {themeMode}</span>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-3 gap-1 p-1 rounded-[8px]"
              style={{
                backgroundColor: 'var(--sb-field-bg)',
                border: '1px solid var(--sb-field-border)'
              }}
            >
              {themeSegments.map((seg) => {
                const isSelected = themeMode === seg.id;
                const SegIcon = seg.icon;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setThemeMode(seg.id)}
                    className="h-7 px-2 rounded-[6px] text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer sb-focus-visible"
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--sb-active-bg)',
                            color: 'var(--sb-active-text)',
                            fontWeight: 600
                          }
                        : {
                            backgroundColor: 'transparent',
                            color: 'var(--sb-text)',
                            fontWeight: 500
                          }
                    }
                    title={`Switch theme to ${seg.label}`}
                  >
                    <SegIcon
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{
                        color: isSelected
                          ? 'var(--sb-active-text)'
                          : 'var(--sb-text-muted)'
                      }}
                    />
                    <span>{seg.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Admin Mode Trigger: Full Width (Expanded) or Icon (Collapsed) */}
          {collapsed ? (
            <div className="relative group flex justify-center mt-1">
              <button
                type="button"
                onClick={() => setAdminModalOpen(true)}
                className="w-10 h-10 rounded-[8px] flex items-center justify-center transition-all cursor-pointer sb-focus-visible"
                style={{
                  backgroundColor: isAdmin ? 'var(--sb-active-bg)' : 'transparent',
                  color: isAdmin ? 'var(--sb-active-text)' : 'var(--sb-text-muted)',
                  border: '1px solid var(--sb-border)'
                }}
                title={isAdmin ? 'Administrator Mode (Active)' : 'Admin Login'}
                aria-label={isAdmin ? 'Administrator Mode: Active' : 'Admin Login'}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
              <div
                className="hidden group-hover:flex group-focus-within:flex absolute left-full ml-3 px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium shadow-2xl pointer-events-none whitespace-nowrap z-50 items-center gap-1.5"
                style={{
                  background: 'var(--sb-bg)',
                  color: 'var(--sb-text)',
                  border: '1px solid var(--sb-border)',
                  boxShadow: 'var(--sb-shadow)'
                }}
              >
                <span>{isAdmin ? 'Admin: ACTIVE' : 'Admin Login'}</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer sb-focus-visible mt-1"
              style={{
                backgroundColor: isAdmin ? 'var(--sb-active-bg)' : 'var(--sb-field-bg)',
                color: isAdmin ? 'var(--sb-active-text)' : 'var(--sb-text)',
                border: '1px solid var(--sb-field-border)'
              }}
              title={isAdmin ? 'Manage Admin Access & Privileges' : 'Log in as Administrator'}
            >
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5 opacity-70" />
                )}
                <span>{isAdmin ? 'Admin Active' : 'Admin Login'}</span>
              </div>
              <span className="text-[10px] font-normal uppercase opacity-85">
                {isAdmin ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* =========================================================================
          Mobile Slide-Over Drawer (< 768px)
          ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Scrim Overlay */}
          <div
            className="fixed inset-0 transition-opacity"
            style={{ backgroundColor: 'var(--sb-scrim)' }}
            onClick={() => {
              setMobileDrawerOpen(false);
              mobileToggleRef.current?.focus();
            }}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <aside
            ref={mobileDrawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
            className="relative z-10 w-[264px] max-w-[85vw] h-full flex flex-col shadow-2xl sidebar-panel"
          >
            {/* Drawer Header */}
            <div
              className="h-16 flex items-center justify-between px-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--sb-divider)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: 'var(--sb-logo-bg)' }}
                >
                  <Zap
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: 'var(--sb-logo-icon)' }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="font-heading text-lg font-black tracking-wider"
                      style={{ color: 'var(--sb-text)' }}
                    >
                      ARENADB
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: 'var(--sb-badge-bg)',
                        color: 'var(--sb-badge-text)'
                      }}
                    >
                      LAB
                    </span>
                  </div>
                  <p
                    className="text-[11px] font-mono truncate font-medium"
                    style={{ color: 'var(--sb-text-muted)' }}
                  >
                    TOURNAMENT OPS DB
                  </p>
                </div>
              </div>

              {/* Close Drawer Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  mobileToggleRef.current?.focus();
                }}
                className="p-2 rounded-[8px] transition-colors cursor-pointer sb-focus-visible"
                style={{ color: 'var(--sb-text-muted)' }}
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search */}
            <div
              className="p-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--sb-divider)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setCommandPaletteOpen(true);
                }}
                className="w-full h-9 flex items-center justify-between px-3 rounded-[8px] text-xs font-mono transition-all cursor-pointer sb-search-field sb-focus-visible"
                style={{
                  backgroundColor: 'var(--sb-field-bg)',
                  border: '1px solid var(--sb-field-border)',
                  color: 'var(--sb-text)'
                }}
                title="Search or jump (Ctrl+K)"
              >
                <div className="flex items-center gap-2">
                  <Search
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: 'var(--sb-text-muted)' }}
                  />
                  <span
                    className="font-mono font-medium"
                    style={{ color: 'var(--sb-text-muted)' }}
                  >
                    Quick Search...
                  </span>
                </div>
                <kbd
                  className="font-mono text-[11px] px-1.5 py-0.5 rounded font-bold"
                  style={{
                    backgroundColor: 'var(--sb-badge-bg)',
                    color: 'var(--sb-badge-text)',
                    border: '1px solid var(--sb-border)'
                  }}
                >
                  Ctrl+K
                </kbd>
              </button>
            </div>

            {/* Nav List */}
            <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1 custom-scrollbar">
              <div
                className="px-2 pt-2 pb-1 text-[11px] font-mono font-semibold tracking-wider"
                style={{ color: 'var(--sb-text-muted)' }}
              >
                Operate
              </div>
              {operateGroup.map((item) =>
                renderExpandedNavItem(item, () => handleSelectRoute(item.id))
              )}

              <div
                className="my-2 border-t mx-2"
                style={{ borderColor: 'var(--sb-divider)' }}
              />

              <div
                className="px-2 pt-1 pb-1 text-[11px] font-mono font-semibold tracking-wider"
                style={{ color: 'var(--sb-text-muted)' }}
              >
                Learn and analyse
              </div>
              {learnGroup.map((item) =>
                renderExpandedNavItem(item, () => handleSelectRoute(item.id))
              )}
            </nav>

            {/* Bottom Controls */}
            <div
              className="p-3 space-y-2 border-t flex-shrink-0"
              style={{ borderColor: 'var(--sb-divider)' }}
            >
              <button
                type="button"
                onClick={() => setIsLiveSimulating((prev) => !prev)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer sb-focus-visible shadow-sm"
                style={
                  isLiveSimulating
                    ? {
                        backgroundColor: 'var(--sb-sim-active-bg)',
                        color: 'var(--sb-sim-active-text)',
                        border: '1px solid var(--sb-sim-active-border)'
                      }
                    : {
                        backgroundColor: 'var(--sb-sim-paused-bg)',
                        color: 'var(--sb-sim-paused-text)',
                        border: '1px solid var(--sb-sim-paused-border)'
                      }
                }
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isLiveSimulating ? 'sb-pulse-dot' : ''
                  }`}
                  style={{
                    backgroundColor: isLiveSimulating
                      ? 'var(--sb-sim-active-text)'
                      : 'var(--sb-sim-paused-text)'
                  }}
                />
                <span className="truncate flex-1 text-left">
                  {isLiveSimulating
                    ? 'Simulation: ACTIVE'
                    : 'Simulation: PAUSED'}
                </span>
                <span
                  className="text-[10px] font-normal font-mono opacity-80"
                  style={{
                    color: isLiveSimulating
                      ? 'var(--sb-sim-active-text)'
                      : 'var(--sb-sim-paused-text)'
                  }}
                >
                  {isLiveSimulating ? 'LIVE' : 'PAUSED'}
                </span>
              </button>

              <div
                className="grid grid-cols-3 gap-1 p-1 rounded-[8px]"
                style={{
                  backgroundColor: 'var(--sb-field-bg)',
                  border: '1px solid var(--sb-field-border)'
                }}
              >
                {themeSegments.map((seg) => {
                  const isSelected = themeMode === seg.id;
                  const SegIcon = seg.icon;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setThemeMode(seg.id)}
                      className="h-7 px-2 rounded-[6px] text-xs font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer sb-focus-visible"
                      style={
                        isSelected
                          ? {
                              backgroundColor: 'var(--sb-active-bg)',
                              color: 'var(--sb-active-text)',
                              fontWeight: 600
                            }
                          : {
                              backgroundColor: 'transparent',
                              color: 'var(--sb-text)',
                              fontWeight: 500
                            }
                      }
                      title={`Switch theme to ${seg.label}`}
                    >
                      <SegIcon
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{
                          color: isSelected
                            ? 'var(--sb-active-text)'
                            : 'var(--sb-text-muted)'
                        }}
                      />
                      <span>{seg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Admin Mode Trigger in Mobile Drawer */}
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setAdminModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer sb-focus-visible mt-2"
                style={{
                  backgroundColor: isAdmin ? 'var(--sb-active-bg)' : 'var(--sb-field-bg)',
                  color: isAdmin ? 'var(--sb-active-text)' : 'var(--sb-text)',
                  border: '1px solid var(--sb-field-border)'
                }}
                title={isAdmin ? 'Manage Admin Access' : 'Log in as Administrator'}
              >
                <div className="flex items-center gap-2">
                  {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 opacity-70" />}
                  <span>{isAdmin ? 'Admin Console' : 'Admin Login'}</span>
                </div>
                <span className="text-[10px] font-normal uppercase opacity-85">
                  {isAdmin ? 'ACTIVE' : 'LOCKED'}
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* =========================================================================
          Mobile Bottom Navigation Bar (< 768px) with Menu Trigger
          ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 z-40 flex items-center justify-around px-1 select-none sidebar-mobile-bar"
      >
        {/* Core Nav items in mobile bottom strip */}
        {[
          operateGroup[0], // Command Center
          operateGroup[1], // Bracket
          learnGroup[0],   // Academy
          learnGroup[1],   // Data Vault
          operateGroup[2]  // Integrity
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectRoute(item.id)}
              className="flex flex-col items-center justify-center min-w-[54px] flex-1 h-full py-1 text-xs font-mono transition-colors relative cursor-pointer sb-focus-visible"
              style={{
                color: isActive ? 'var(--sb-active-bg)' : 'var(--sb-text-muted)'
              }}
              title={item.label}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{
                  color: isActive
                    ? 'var(--sb-active-bg)'
                    : 'var(--sb-text-muted)'
                }}
              />
              <span
                className="truncate mt-0.5 text-[10px]"
                style={{
                  color: isActive ? 'var(--sb-text)' : 'var(--sb-text-muted)',
                  fontWeight: isActive ? 700 : 500
                }}
              >
                {item.shortLabel}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 w-8 h-1 rounded-full shadow-sm"
                  style={{ backgroundColor: 'var(--sb-active-bg)' }}
                />
              )}
            </button>
          );
        })}

        {/* Mobile Slide-Over Drawer Menu Toggle */}
        <button
          ref={mobileToggleRef}
          id="mobile-menu-toggle"
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center min-w-[54px] flex-1 h-full py-1 text-xs font-mono transition-colors relative cursor-pointer sb-focus-visible"
          style={{ color: 'var(--sb-text)' }}
          aria-label="Open full navigation drawer"
          title="Open full navigation drawer"
        >
          <Menu
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--sb-text)' }}
          />
          <span
            className="truncate mt-0.5 text-[10px] font-bold"
            style={{ color: 'var(--sb-text)' }}
          >
            Menu
          </span>
        </button>
      </nav>
    </>
  );
};

export default SideRail;
