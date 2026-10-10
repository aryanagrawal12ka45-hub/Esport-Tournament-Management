import React, { useState, useEffect } from 'react';
import { Navbar, type ActiveTab } from './components/Navbar';
import { DatabaseSchemaCanvas } from './components/DatabaseSchemaCanvas';
import { TableManager } from './components/TableManager';
import { DashboardOverview } from './components/DashboardOverview';
import { QueryConsole } from './components/QueryConsole';
import { RecordModal } from './components/RecordModal';
import { INITIAL_TABLES, INITIAL_RELATIONS } from './data/databaseData';
import { useIsMobile } from './hooks/useMediaQuery';

export const App: React.FC = () => {
  const isMobile = useIsMobile(768);
  const [activeTab, setActiveTab] = useState<ActiveTab>('schema');
  const [selectedTableId, setSelectedTableId] = useState<string>(INITIAL_TABLES[0].id);

  // Live in-memory table records state
  const [tableData, setTableData] = useState<Record<string, any[]>>(() => {
    const map: Record<string, any[]> = {};
    INITIAL_TABLES.forEach((t) => {
      map[t.id] = [...t.initialRows];
    });
    return map;
  });

  // Modal State
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [modalTableId, setModalTableId] = useState<string>(INITIAL_TABLES[0].id);

  // Live IoT Simulation State
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);

  // Simulate streaming IoT telemetry ticks
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      setTableData((prev) => {
        const copy = { ...prev };

        // 1. Append a simulated production reading
        const existingProd = copy['ENERGY_PRODUCTION_TIMESERIES'] || [];
        const nextId = `PRD${String(existingProd.length + 1).padStart(2, '0')}`;
        const randomKwh = Math.round((420 + Math.random() * 85) * 100) / 100;
        const newProd = {
          ProductionID: nextId,
          UnitID: 'U101',
          ProductionTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          EnergyGeneratedKWh: randomKwh,
          GridFrequencyHz: Math.round((49.95 + Math.random() * 0.1) * 100) / 100,
          CapacityFactorPct: Math.round((randomKwh / 500) * 10000) / 100
        };

        // 2. Append simulated weather reading
        const existingEnv = copy['ENVIRONMENTAL_TELEMETRY'] || [];
        const nextEnvId = `ENV${String(existingEnv.length + 1).padStart(2, '0')}`;
        const newEnv = {
          EnvLogID: nextEnvId,
          FacilityID: 'FAC01',
          LogTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          SolarIrradiance: Math.round((920 + Math.random() * 120) * 100) / 100,
          WindSpeed: Math.round((2.5 + Math.random() * 2) * 100) / 100,
          WaterFlowRate: 0.0,
          Temperature: Math.round((34 + Math.random() * 3) * 100) / 100,
          HumidityPct: Math.round((22 + Math.random() * 4) * 100) / 100
        };

        // 3. Update battery SoC fluctuation
        const existingBess = [...(copy['BATTERY_STORAGE_TELEMETRY'] || [])];
        if (existingBess.length > 0) {
          const lastBess = { ...existingBess[existingBess.length - 1] };
          lastBess.StateOfChargePct = Math.min(100, Math.max(10, Math.round((lastBess.StateOfChargePct + (Math.random() > 0.5 ? 0.3 : -0.3)) * 100) / 100));
          existingBess[existingBess.length - 1] = lastBess;
        }

        copy['ENERGY_PRODUCTION_TIMESERIES'] = [...existingProd.slice(-24), newProd];
        copy['ENVIRONMENTAL_TELEMETRY'] = [...existingEnv.slice(-24), newEnv];
        copy['BATTERY_STORAGE_TELEMETRY'] = existingBess;

        return copy;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  // Insert Row Handler
  const handleInsertRow = (tableId: string, newRow: Record<string, any>) => {
    setTableData((prev) => ({
      ...prev,
      [tableId]: [newRow, ...(prev[tableId] || [])]
    }));
  };

  // Delete Row Handler
  const handleDeleteRow = (tableId: string, primaryKeyValue: string) => {
    const table = INITIAL_TABLES.find((t) => t.id === tableId);
    if (!table) return;
    const pkCol = table.columns.find((c) => c.isPrimaryKey)?.name || table.columns[0].name;

    setTableData((prev) => ({
      ...prev,
      [tableId]: (prev[tableId] || []).filter((row) => String(row[pkCol]) !== String(primaryKeyValue))
    }));
  };

  // Switch to table in management view
  const handleSelectTableForManagement = (tableId: string) => {
    setSelectedTableId(tableId);
    setActiveTab('manager');
  };

  // Trigger Insert Modal
  const handleOpenInsertModal = (tableId: string) => {
    setModalTableId(tableId);
    setIsInsertModalOpen(true);
  };

  const modalTable = INITIAL_TABLES.find((t) => t.id === modalTableId) || INITIAL_TABLES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tableCount={INITIAL_TABLES.length}
      />

      {/* Main Tab Content */}
      <main style={{ flex: 1, position: 'relative', paddingBottom: isMobile ? 56 : 0 }}>
        {activeTab === 'schema' && (
          <DatabaseSchemaCanvas
            tables={INITIAL_TABLES}
            relations={INITIAL_RELATIONS}
            onSelectTableForManagement={handleSelectTableForManagement}
          />
        )}

        {activeTab === 'manager' && (
          <TableManager
            tables={INITIAL_TABLES}
            selectedTableId={selectedTableId}
            onSelectTable={setSelectedTableId}
            tableData={tableData}
            onOpenInsertModal={handleOpenInsertModal}
            onDeleteRow={handleDeleteRow}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardOverview
            tables={INITIAL_TABLES}
            tableData={tableData}
            isLiveSimulating={isLiveSimulating}
            onToggleLiveSimulation={() => setIsLiveSimulating(!isLiveSimulating)}
            onSelectTable={handleSelectTableForManagement}
          />
        )}

        {activeTab === 'queries' && <QueryConsole />}
      </main>

      {/* Insertion Modal */}
      <RecordModal
        isOpen={isInsertModalOpen}
        onClose={() => setIsInsertModalOpen(false)}
        table={modalTable}
        allTablesData={tableData}
        onInsertRow={handleInsertRow}
      />
    </div>
  );
};
export default App;
