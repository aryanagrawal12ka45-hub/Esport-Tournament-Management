import React from 'react';
import { motion } from 'motion/react';
import { Network, Database, Activity, Terminal, Zap } from 'lucide-react';

export type ActiveTab = 'schema' | 'manager' | 'dashboard' | 'queries';

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  tableCount: number;
}

export const Navbar: React.FC<Props> = ({ activeTab, onSelectTab, tableCount }) => {
  const tabs = [
    { id: 'schema', label: 'Schema Topology', icon: Network },
    { id: 'manager', label: `Data Management (${tableCount})`, icon: Database },
    { id: 'dashboard', label: 'Operations & Telemetry', icon: Activity },
    { id: 'queries', label: 'SQL Query Console', icon: Terminal },
  ] as const;

  return (
    <header
      style={{
        height: 60,
        backgroundColor: '#000000',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'relative',
        zIndex: 50
      }}
    >
      {/* Brand Lockup - Metallic Silver & Luxury Pitch-Black */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-metallic)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-silver)'
          }}
        >
          <Zap size={15} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em'
            }}
          >
            Renewable Farm DB
          </span>
          <span
            className="tag-wafer"
            style={{
              fontSize: 11,
              padding: '3px 9px',
              color: 'var(--text-secondary)'
            }}
          >
            DuckDB OLAP v1.5.6
          </span>
        </div>
      </div>

      {/* Nav Tabs - Organic Curves */}
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

      {/* Right System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          className="tag-wafer"
          style={{
            fontSize: 11.5,
            padding: '5px 12px',
            color: 'var(--text-secondary)'
          }}
        >
          <span className="status-dot green" />
          <span>Database Ready</span>
        </div>
      </div>
    </header>
  );
};
