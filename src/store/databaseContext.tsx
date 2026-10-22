import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { DatabaseTable, TableRelation } from '../data/schema';
import { INITIAL_RELATIONS } from '../data/schema';
import { INITIAL_TABLES, getInitialTableData } from '../data/seed';
import { initDuckDB, subscribeDuckDbStatus, syncTablesToDuckDB, subscribeDuckDbMutation, type DuckDBStatus } from '../duckdb';
import { stepLiveSimulation, getSimulationStats, getActiveLiveMatch, type SimulationStats } from '../engine/liveMatch';
import { calculateACS, calculateADR, calculateImpactIndex } from '../engine/scoring';

export type AppTabId =
  | 'command_center'
  | 'bracket'
  | 'vault'
  | 'schema'
  | 'query'
  | 'plsql'
  | 'integrity'
  | 'academy'
  // Legacy aliases
  | 'dashboard'
  | 'manager'
  | 'queries';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DatabaseContextType {
  // Navigation & UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedTableId: string;
  setSelectedTableId: (id: string) => void;
  selectedBenchmarkId: string;
  setSelectedBenchmarkId: (id: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  cycleTheme: () => void;
  theme: 'arena' | 'broadcast';
  resolvedTheme: 'light' | 'dark';
  isLight: boolean;
  toggleTheme: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Simulation & Engine
  isLiveSimulating: boolean;
  setIsLiveSimulating: React.Dispatch<React.SetStateAction<boolean>>;
  duckDbStatus: DuckDBStatus;
  isDuckDbPrimary: boolean;
  syncWithDuckDb: () => Promise<void>;
  stats: SimulationStats;
  liveMatchDetails: ReturnType<typeof getActiveLiveMatch>;

  // Data
  tableData: Record<string, any[]>;
  tables: DatabaseTable[];
  relations: TableRelation[];

  // CRUD & Permissions
  isAdmin: boolean;
  adminModalOpen: boolean;
  setAdminModalOpen: (open: boolean) => void;
  adminLogin: (password: string) => { success: boolean; error?: string };
  adminLogout: () => void;
  insertRow: (tableId: string, newRow: Record<string, any>) => { success: boolean; error?: string };
  updateRow: (
    tableId: string,
    primaryKeyValue: string,
    updatedFields: Record<string, any>
  ) => { success: boolean; error?: string };
  deleteRow: (
    tableId: string,
    primaryKeyValue: string
  ) => { success: boolean; error?: string; cascadeBlockedBy?: string };
  resetDatabase: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialTab = (): string => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const validTabs = ['command_center', 'bracket', 'vault', 'schema', 'query', 'plsql', 'integrity', 'academy'];
      if (validTabs.includes(hash)) return hash;
      if (hash === 'dashboard') return 'command_center';
      if (hash === 'manager') return 'vault';
      if (hash === 'queries') return 'query';
    }
    return 'command_center';
  };

  const STORAGE_KEY = 'arenadb_duckdb_persistent_tables';

  const loadPersistedTableData = (): Record<string, any[]> => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[ArenaDB] Failed to load persisted table data, using seed data:', err);
      }
    }
    return getInitialTableData();
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);
  const [selectedTableId, setSelectedTableId] = useState<string>('MATCH');
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string>('q01');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(true);
  const [duckDbStatus, setDuckDbStatus] = useState<DuckDBStatus>('uninitialized');
  const [tableData, setTableData] = useState<Record<string, any[]>>(() => loadPersistedTableData());
  const [tables] = useState<DatabaseTable[]>(INITIAL_TABLES);
  const [relations] = useState<TableRelation[]>(INITIAL_RELATIONS);

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('arenadb_is_admin') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

  const adminLogin = useCallback((password: string): { success: boolean; error?: string } => {
    if (password === 'aryan@12345') {
      setIsAdmin(true);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('arenadb_is_admin', 'true');
        } catch {}
      }
      return { success: true };
    }
    return { success: false, error: 'Authentication failed: Invalid administrator credentials.' };
  }, []);

  const adminLogout = useCallback(() => {
    setIsAdmin(false);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('arenadb_is_admin');
      } catch {}
    }
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  }, []);
  const getInitialThemeMode = (): ThemeMode => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('arenadb_theme_mode') as ThemeMode | null;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          return saved;
        }
      } catch {
        // Fallback
      }
    }
    return 'system';
  };

  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialThemeMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen to OS system color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (themeMode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemPrefersDark]);

  const isLight = resolvedTheme === 'light';
  // Backward compatibility alias: 'arena' (dark) | 'broadcast' (light)
  const theme = useMemo<'arena' | 'broadcast'>(
    () => (resolvedTheme === 'light' ? 'broadcast' : 'arena'),
    [resolvedTheme]
  );

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('arenadb_theme_mode', mode);
      } catch {
        // Fallback
      }
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('arenadb_theme_mode', next);
        } catch {
          // Fallback
        }
      }
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    cycleTheme();
  }, [cycleTheme]);

  // Synchronize DOM data-theme attribute with resolvedTheme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  // Listen for database mutations executed directly inside DuckDB-Wasm (e.g. from SQL editor)
  useEffect(() => {
    const unsubMutation = subscribeDuckDbMutation((updated) => {
      setTableData(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn('[ArenaDB] LocalStorage save error:', e);
        }
      }
    });
    return () => unsubMutation();
  }, []);

  // Initialize DuckDB-Wasm in background & perform initial table synchronization
  useEffect(() => {
    const unsub = subscribeDuckDbStatus((status) => {
      setDuckDbStatus(status);
      if (status === 'ready') {
        syncTablesToDuckDB(tableData).catch((err) => {
          console.warn('[ArenaDB] Initial DuckDB table sync error:', err);
        });
      }
    });

    initDuckDB().catch((err) => {
      console.warn('[ArenaDB] DuckDB async init caught:', err);
    });

    return () => unsub();
  }, []);

  // Synchronize tableData to persistent storage and live DuckDB tables on modification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tableData));
      } catch (err) {
        console.warn('[ArenaDB] LocalStorage write caught:', err);
      }
    }
    syncTablesToDuckDB(tableData).catch((err) => {
      console.warn('[ArenaDB] DuckDB syncTables catch:', err);
    });
  }, [tableData]);

  // Live simulation tick interval
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      setTableData((prev) => stepLiveSimulation(prev));
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K for Command Palette)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper to validate and enforce integrity constraints
  const validateAndEnforceIntegrity = useCallback(
    (tableId: string, row: Record<string, any>, currentData: Record<string, any[]>): { sanitized: Record<string, any>; error?: string } => {
      const sanitized = { ...row };

      if (tableId === 'MATCH_MAP') {
        const t1 = Number(sanitized.Team1Rounds) || 0;
        const t2 = Number(sanitized.Team2Rounds) || 0;
        const rounds = Number(sanitized.RoundsPlayed) || 0;
        if (rounds !== t1 + t2) {
          return {
            sanitized,
            error: `Integrity Constraint Violation: RoundsPlayed (${rounds}) must strictly equal Team1Rounds (${t1}) + Team2Rounds (${t2}).`
          };
        }
      }

      if (tableId === 'PLAYER_PERFORMANCE') {
        const rounds = Number(sanitized.RoundsPlayed) || 0;
        const damage = Number(sanitized.DamageDealt) || 0;
        const combatScore = Number(sanitized.TotalCombatScore) || 0;

        if (combatScore < damage) {
          return {
            sanitized,
            error: `Integrity Constraint Violation: TotalCombatScore (${combatScore}) cannot be less than DamageDealt (${damage}). Combat score must equal damage plus kill and assist bonuses.`
          };
        }

        if (sanitized.MapID) {
          const parentMap = (currentData['MATCH_MAP'] || []).find((m) => m.MapID === sanitized.MapID);
          if (parentMap && Number(parentMap.RoundsPlayed) !== rounds) {
            return {
              sanitized,
              error: `Integrity Constraint Violation: RoundsPlayed (${rounds}) must strictly equal parent MATCH_MAP ${sanitized.MapID} RoundsPlayed (${parentMap.RoundsPlayed}).`
            };
          }
        }

        // Always recompute ACS and ADR (never manually edited)
        const acs = calculateACS(combatScore, rounds);
        const adr = calculateADR(damage, rounds);
        const kills = Number(sanitized.Kills) || 0;
        const deaths = Number(sanitized.Deaths) || 0;
        const kd = deaths > 0 ? Math.round((kills / deaths) * 100) / 100 : kills;
        const fk = Number(sanitized.FirstKills) || 0;
        const fd = Number(sanitized.FirstDeaths) || 0;
        const kast = Number(sanitized.KASTPct) || 75.0;

        sanitized.ACS = acs;
        sanitized.Score = acs; // Alias
        sanitized.ADR = adr;
        sanitized.ImpactIndex = calculateImpactIndex({
          acs,
          adr,
          kastPct: kast,
          kd,
          fkFdDiffPerMap: fk - fd
        });
      }

      return { sanitized };
    },
    []
  );

  // CRUD: Insert
  const insertRow = useCallback(
    (tableId: string, newRow: Record<string, any>): { success: boolean; error?: string } => {
      if (!isAdmin) {
        return {
          success: false,
          error: 'Unauthorized: Administrator privileges required to insert records. Please log in as Admin.'
        };
      }

      const table = tables.find((t) => t.id === tableId);
      if (!table) return { success: false, error: `Table ${tableId} not found.` };

      const pkCol = table.columns.find((c) => c.isPrimaryKey);
      if (pkCol) {
        const pkVal = newRow[pkCol.name];
        if (!pkVal) return { success: false, error: `Primary key ${pkCol.name} cannot be empty.` };
        const existing = (tableData[tableId] || []).some((r) => String(r[pkCol.name]) === String(pkVal));
        if (existing) {
          return { success: false, error: `Primary key violation: ${pkCol.name} = '${pkVal}' already exists.` };
        }
      }

      const check = validateAndEnforceIntegrity(tableId, newRow, tableData);
      if (check.error) {
        return { success: false, error: check.error };
      }

      setTableData((prev) => ({
        ...prev,
        [tableId]: [check.sanitized, ...(prev[tableId] || [])]
      }));

      return { success: true };
    },
    [tables, tableData, validateAndEnforceIntegrity, isAdmin]
  );

  // CRUD: Update
  const updateRow = useCallback(
    (
      tableId: string,
      primaryKeyValue: string,
      updatedFields: Record<string, any>
    ): { success: boolean; error?: string } => {
      if (!isAdmin) {
        return {
          success: false,
          error: 'Unauthorized: Administrator privileges required to modify records. Please log in as Admin.'
        };
      }

      const table = tables.find((t) => t.id === tableId);
      if (!table) return { success: false, error: `Table ${tableId} not found.` };

      const pkCol = table.columns.find((c) => c.isPrimaryKey);
      if (!pkCol) return { success: false, error: `Table ${tableId} does not have a primary key.` };

      const currentRow = (tableData[tableId] || []).find((r) => String(r[pkCol.name]) === String(primaryKeyValue));
      if (!currentRow) return { success: false, error: `Record with ${pkCol.name} = '${primaryKeyValue}' not found.` };

      const merged = { ...currentRow, ...updatedFields };
      const check = validateAndEnforceIntegrity(tableId, merged, tableData);
      if (check.error) {
        return { success: false, error: check.error };
      }

      setTableData((prev) => {
        const rows = prev[tableId] || [];
        const updated = rows.map((r) => {
          if (String(r[pkCol.name]) === String(primaryKeyValue)) {
            return check.sanitized;
          }
          return r;
        });
        return { ...prev, [tableId]: updated };
      });

      return { success: true };
    },
    [tables, tableData, validateAndEnforceIntegrity, isAdmin]
  );

  // CRUD: Delete with referential integrity cascade protection
  const deleteRow = useCallback(
    (
      tableId: string,
      primaryKeyValue: string
    ): { success: boolean; error?: string; cascadeBlockedBy?: string } => {
      if (!isAdmin) {
        return {
          success: false,
          error: 'Unauthorized: Administrator privileges required to delete records. Please log in as Admin.'
        };
      }

      const table = tables.find((t) => t.id === tableId);
      if (!table) return { success: false, error: `Table ${tableId} not found.` };

      const pkCol = table.columns.find((c) => c.isPrimaryKey);
      if (!pkCol) return { success: false, error: `Table ${tableId} lacks a primary key.` };

      // Check dependent child tables
      const dependentRelations = relations.filter((rel) => rel.sourceTable === tableId);
      for (const rel of dependentRelations) {
        const childRows = tableData[rel.targetTable] || [];
        const hasChildren = childRows.some((cr) => String(cr[rel.targetColumn]) === String(primaryKeyValue));
        if (hasChildren) {
          return {
            success: false,
            error: `Foreign Key Integrity Violation: Cannot delete ${tableId} row because child records exist in ${rel.targetTable}.${rel.targetColumn}.`,
            cascadeBlockedBy: rel.targetTable
          };
        }
      }

      setTableData((prev) => ({
        ...prev,
        [tableId]: (prev[tableId] || []).filter((r) => String(r[pkCol.name]) !== String(primaryKeyValue))
      }));

      return { success: true };
    },
    [tables, relations, tableData, isAdmin]
  );

  // Reset to initial seed
  const resetDatabase = useCallback(() => {
    if (!isAdmin) {
      setAdminModalOpen(true);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    const freshSeed = getInitialTableData();
    setTableData(freshSeed);
    syncTablesToDuckDB(freshSeed).catch(() => {});
  }, [isAdmin]);

  const syncWithDuckDb = useCallback(async () => {
    await syncTablesToDuckDB(tableData);
  }, [tableData]);

  const isDuckDbPrimary = duckDbStatus === 'ready';

  const stats = useMemo(() => getSimulationStats(tableData), [tableData]);
  const liveMatchDetails = useMemo(() => getActiveLiveMatch(tableData), [tableData]);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      selectedTableId,
      setSelectedTableId,
      selectedBenchmarkId,
      setSelectedBenchmarkId,
      themeMode,
      setThemeMode,
      cycleTheme,
      theme,
      resolvedTheme,
      isLight,
      toggleTheme,
      commandPaletteOpen,
      setCommandPaletteOpen,
      isLiveSimulating,
      setIsLiveSimulating,
      duckDbStatus,
      isDuckDbPrimary,
      syncWithDuckDb,
      stats,
      liveMatchDetails,
      tableData,
      tables,
      relations,
      isAdmin,
      adminModalOpen,
      setAdminModalOpen,
      adminLogin,
      adminLogout,
      insertRow,
      updateRow,
      deleteRow,
      resetDatabase
    }),
    [
      activeTab,
      setActiveTab,
      selectedTableId,
      setSelectedTableId,
      selectedBenchmarkId,
      setSelectedBenchmarkId,
      themeMode,
      setThemeMode,
      cycleTheme,
      theme,
      resolvedTheme,
      isLight,
      toggleTheme,
      commandPaletteOpen,
      setCommandPaletteOpen,
      isLiveSimulating,
      setIsLiveSimulating,
      duckDbStatus,
      isDuckDbPrimary,
      syncWithDuckDb,
      stats,
      liveMatchDetails,
      tableData,
      tables,
      relations,
      isAdmin,
      adminModalOpen,
      setAdminModalOpen,
      adminLogin,
      adminLogout,
      insertRow,
      updateRow,
      deleteRow,
      resetDatabase
    ]
  );

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
