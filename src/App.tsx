import React, { useState, Suspense } from 'react';
import { DatabaseProvider, useDatabase } from './store/databaseContext';
import { ROUTES } from './constants/routes';
import { SideRail } from './components/SideRail';
import { TopStatusStrip } from './components/TopStatusStrip';
import { CommandPalette } from './components/CommandPalette';
import { CommandCenter } from './components/CommandCenter';
import { BracketSchedule } from './components/BracketSchedule';
import { DataVault } from './components/DataVault';
import { SchemaMap } from './components/SchemaMap';
import { QueryLab } from './components/QueryLab';
import { PlSqlLab } from './components/PlSqlLab';
import { IntegrityDesk } from './components/IntegrityDesk';
import { ScoringAcademy } from './components/ScoringAcademy';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AdminLoginModal } from './components/AdminLoginModal';

const AppContent: React.FC = () => {
  const { activeTab } = useDatabase();
  const [railCollapsed, setRailCollapsed] = useState(false);

  return (
    <div className="arenadb-shell flex h-screen w-full overflow-hidden bg-token text-token select-none">
      {/* Collapsible Left Rail / Mobile Bottom Sheet */}
      <SideRail
        collapsed={railCollapsed}
        onToggleCollapse={() => setRailCollapsed((prev) => !prev)}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Persistent Top Strip with Marquee & Controls */}
        <TopStatusStrip />

        {/* Dynamic Viewport Container */}
        <main className="arenadb-main flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-24 md:pb-8">
          {activeTab === ROUTES.command_center && <CommandCenter />}
          {activeTab === ROUTES.bracket && <BracketSchedule />}
          {activeTab === ROUTES.academy && (
            <ErrorBoundary sectionName="Scoring Academy">
              <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-primary-token animate-pulse">Loading Scoring Academy...</div>}>
                <ScoringAcademy />
              </Suspense>
            </ErrorBoundary>
          )}
          {activeTab === ROUTES.vault && <DataVault />}
          {activeTab === ROUTES.schema && <SchemaMap />}
          {activeTab === ROUTES.query && <QueryLab />}
          {activeTab === ROUTES.plsql && <PlSqlLab />}
          {activeTab === ROUTES.integrity && <IntegrityDesk />}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette />

      {/* Admin Authentication & Console Modal */}
      <AdminLoginModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
};

export default App;
