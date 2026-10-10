import React from 'react';
import { motion } from 'motion/react';
import { Network, Database, Activity, Terminal, Zap } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

export type ActiveTab = 'schema' | 'manager' | 'dashboard' | 'queries';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  tableCount: number;
}

export const Navbar: React.FC<Props> = ({ activeTab, onSelectTab, tableCount }) => {
  const isMobile = useIsMobile(768);

  const tabs = [
    { id: 'schema' as const, label: 'Schema Topology', shortLabel: 'Schema', icon: Network },
    { id: 'manager' as const, label: `Data Management (${tableCount})`, shortLabel: 'Tables', icon: Database },
    { id: 'dashboard' as const, label: 'Operations & Telemetry', shortLabel: 'Telemetry', icon: Activity },
    { id: 'queries' as const, label: 'SQL Query Console', shortLabel: 'SQL', icon: Terminal },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header
        style={{
          height: isMobile ? 54 : 60,
          backgroundColor: '#000000',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        {/* Brand Lockup - Metallic Silver & Luxury Pitch-Black */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          <div
            style={{
              width: isMobile ? 26 : 30,
              height: isMobile ? 26 : 30,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-metallic)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-silver)',
              flexShrink: 0
            }}
          >
            <Zap size={isMobile ? 13 : 15} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: isMobile ? 13 : 14,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap'
              }}
            >
              {isMobile ? 'Renewable DB' : 'Renewable Farm DB'}
            </span>
            <span
              className="tag-wafer"
              style={{
                fontSize: 10,
                padding: '2px 7px',
                color: 'var(--text-secondary)'
              }}
            >
              {isMobile ? 'DuckDB OLAP' : 'DuckDB OLAP v1.5.6'}
            </span>
          </div>
        </div>

        {/* Desktop Nav Tabs - Organic Curves */}
        {!isMobile && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%' }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 15px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={14} style={{ color: isActive ? '#ffffff' : 'var(--text-muted)' }} />
                  {tab.label}

                  {/* Active Underline - Crisp Silver Bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      style={{
                        position: 'absolute',
                        bottom: -11,
                        left: 10,
                        right: 10,
                        height: 2,
                        backgroundColor: 'var(--accent-silver)',
                        borderRadius: 1
                      }}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right System Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="tag-wafer"
            style={{
              fontSize: isMobile ? 10.5 : 11.5,
              padding: isMobile ? '3px 8px' : '5px 12px',
              color: 'var(--text-secondary)'
            }}
          >
            <span className="status-dot green" />
            <span>{isMobile ? 'Live' : 'Database Ready'}</span>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Thumb Optimized */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 56,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            backgroundColor: 'rgba(8, 8, 10, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 90,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.8)'
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  flex: 1,
                  height: '100%',
                  padding: '6px 0',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  position: 'relative'
                }}
              >
                <Icon size={17} style={{ color: isActive ? '#ffffff' : 'var(--text-muted)' }} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {tab.shortLabel}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTabDot"
                    style={{
                      position: 'absolute',
                      top: 4,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-silver)'
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
};
