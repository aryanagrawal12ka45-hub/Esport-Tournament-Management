import React, { useState, useMemo } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Lock
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import { SUBSYSTEMS_META, type SubsystemCategory } from '../data/schema';
import { HudCard } from './ui/HudCard';
import { StatusPill } from './ui/StatusPill';
import { RecordDrawer } from './RecordDrawer';
import { ScoringPopover } from './ui/ScoringPopover';

export const DataVault: React.FC = () => {
  const {
    tables,
    tableData,
    selectedTableId,
    setSelectedTableId,
    deleteRow,
    relations,
    isAdmin,
    setAdminModalOpen
  } = useDatabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRow, setSelectedRow] = useState<Record<string, any>>({});

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<Record<string, any>>({});

  const activeTable = tables.find((t) => t.id === selectedTableId) || tables[0];
  const rows = tableData[activeTable.id] || [];
  const pkCol = activeTable.columns.find((c) => c.isPrimaryKey);

  // Filter & Sort
  const filteredRows = useMemo(() => {
    let result = rows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    return result;
  }, [rows, searchQuery, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  const handleDelete = (row: Record<string, any>) => {
    if (!isAdmin) {
      setAdminModalOpen(true);
      return;
    }
    if (!pkCol) return;
    const pkVal = String(row[pkCol.name]);
    if (window.confirm(`Delete record where ${pkCol.name} = '${pkVal}'?`)) {
      const res = deleteRow(activeTable.id, pkVal);
      if (!res.success) {
        alert(res.error || 'Failed to delete row.');
      } else if (selectedRow && String(selectedRow[pkCol.name]) === pkVal) {
        setSelectedRow({});
      }
    }
  };

  const handleExportCsv = () => {
    if (rows.length === 0) return;
    const headers = activeTable.columns.map((c) => c.name);
    const csvLines = [headers.join(',')];
    rows.forEach((r) => {
      const line = headers.map((h) => {
        const val = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvLines.push(line.join(','));
    });
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTable.id.toLowerCase()}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find child relations and linked child records for the selected row
  const childRelations = relations.filter((rel) => rel.sourceTable === activeTable.id);
  const childInspectionData = useMemo(() => {
    if (!selectedRow || !pkCol) return [];
    const pkVal = String(selectedRow[pkCol.name] || '');
    if (!pkVal) return [];

    return childRelations.map((rel) => {
      const targetTableObj = tables.find((t) => t.id === rel.targetTable);
      const childRows = (tableData[rel.targetTable] || []).filter(
        (cr) => String(cr[rel.targetColumn]) === pkVal
      );
      return {
        relation: rel,
        targetTable: targetTableObj,
        childRows
      };
    });
  }, [selectedRow, pkCol, childRelations, tables, tableData]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Database className="w-7 h-7 md:w-8 md:h-8 text-primary-token flex-shrink-0" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-token">
              Data Vault & Relational CRUD Explorer
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted font-mono">
              Browse, Filter, Inspect Cascade Dependencies & Manage Schema Entities
            </p>
            <StatusPill
              label={isAdmin ? 'ADMIN: WRITE UNLOCKED' : 'READ-ONLY MODE'}
              variant={isAdmin ? 'success' : 'neutral'}
              size="sm"
              title={isAdmin ? 'Administrator write access active' : 'Read-only view. Admin login required to insert, edit or delete.'}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-token hover:border-token-strong font-mono text-xs text-token transition-colors cursor-pointer shadow-sm"
            title="Export Active Table to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAdmin) {
                setAdminModalOpen(true);
                return;
              }
              setDrawerMode('create');
              setDrawerOpen(true);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
              isAdmin
                ? 'bg-primary text-on-primary hover:bg-primary-hover'
                : 'bg-surface-2 text-token border border-token hover:bg-surface-3'
            }`}
            title={isAdmin ? 'Insert New Record' : 'Admin Login Required to Insert Records'}
          >
            {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-primary-token" />}
            <span>Insert Record</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Subsystem & Table Navigation (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <HudCard title="Tables Directory" subtitle="Grouped by subsystem">
            <div className="space-y-4">
              {(Object.keys(SUBSYSTEMS_META) as SubsystemCategory[]).map((cat) => {
                const meta = SUBSYSTEMS_META[cat];
                const catTables = tables.filter((t) => t.category === cat);

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center gap-2 px-1 text-xs font-mono font-bold uppercase tracking-wider text-muted">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span>{meta.label}</span>
                    </div>

                    <div className="space-y-0.5">
                      {catTables.map((t) => {
                        const isSelected = t.id === activeTable.id;
                        const rowCount = tableData[t.id]?.length || 0;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedTableId(t.id);
                              setPage(1);
                              setSortColumn(null);
                              setSelectedRow({});
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-mono text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-primary-soft text-primary-token font-bold border-l-2 border-primary'
                                : 'text-token hover:bg-surface-2'
                            }`}
                          >
                            <span className="truncate">{t.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-surface text-muted border border-token">
                              {rowCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </HudCard>
        </div>

        {/* Middle Pane: High-Density Interactive Data Grid (6 or 9 cols) */}
        <div className={Object.keys(selectedRow).length > 0 ? 'lg:col-span-6' : 'lg:col-span-9'}>
          <HudCard
            title={activeTable.name}
            subtitle={activeTable.description}
            badge={<StatusPill variant="primary" size="sm">{rows.length} ROWS</StatusPill>}
          >
            {/* Search and Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-token">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted" />
                <input
                  type="text"
                  placeholder={`Search in ${activeTable.name}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-2 border border-token font-mono text-xs text-token placeholder-muted focus:outline-none focus:border-primary-token"
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono text-muted">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-lg bg-surface-2 border border-token text-xs font-mono text-token focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Data Grid Table */}
            <div className="overflow-x-auto border border-token rounded-lg custom-scrollbar">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-surface-2 border-b border-token text-muted uppercase">
                    {activeTable.columns.map((col) => (
                      <th
                        key={col.name}
                        onClick={() => handleSort(col.name)}
                        className="py-2.5 px-3 cursor-pointer hover:text-primary-token select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.name}</span>
                          {col.isPrimaryKey && (
                            <span className="text-xs text-primary-token font-bold">PK</span>
                          )}
                          {col.isForeignKey && (
                            <span className="text-xs text-accent-token font-bold">FK</span>
                          )}
                          {col.name === 'ACS' && <ScoringPopover metric="acs" />}
                          {col.name === 'ADR' && <ScoringPopover metric="adr" />}
                          {col.name === 'ImpactIndex' && <ScoringPopover metric="impact" />}
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        </div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-token">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeTable.columns.length + 1}
                        className="py-8 text-center text-xs font-mono text-muted"
                      >
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, idx) => {
                      const isRowSelected =
                        pkCol && String(selectedRow[pkCol.name]) === String(row[pkCol.name]);
                      const isSimulatedRow =
                        String(row.GameplayAnalytics || '').toLowerCase().includes('simulated') ||
                        String(row.Notes || '').toLowerCase().includes('illustrative');
                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedRow(row)}
                          className={`cursor-pointer transition-colors ${
                            isRowSelected
                              ? 'bg-primary-soft border-l-2 border-primary'
                              : 'hover:bg-surface-2'
                          }`}
                        >
                          {activeTable.columns.map((col) => (
                            <td
                              key={col.name}
                              className={`py-2 px-3 whitespace-nowrap max-w-xs truncate ${
                                col.isPrimaryKey
                                  ? 'font-bold text-primary-token'
                                  : ['ACS', 'Score'].includes(col.name)
                                  ? 'font-bold text-warning-token'
                                  : col.name === 'ImpactIndex'
                                  ? 'font-bold text-accent-token'
                                  : 'text-token'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>
                                  {row[col.name] !== undefined && row[col.name] !== null
                                    ? String(row[col.name])
                                    : 'NULL'}
                                </span>
                                {col.isPrimaryKey && isSimulatedRow && (
                                  <span className="text-xs font-sans px-1.5 py-0.5 rounded bg-warning-soft text-warning-token border border-warning-token font-semibold" title="Simulated demo telemetry modeled for competitive analysis">
                                    Illustrative
                                  </span>
                                )}
                              </div>
                            </td>
                          ))}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isAdmin) {
                                    setAdminModalOpen(true);
                                    return;
                                  }
                                  setEditingRecord(row);
                                  setDrawerMode('edit');
                                  setDrawerOpen(true);
                                }}
                                className="p-1 text-muted hover:text-primary-token rounded-md hover:bg-surface transition-colors cursor-pointer"
                                title={isAdmin ? 'Edit Record' : 'Admin Login Required to Edit Record'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isAdmin) {
                                    setAdminModalOpen(true);
                                    return;
                                  }
                                  handleDelete(row);
                                }}
                                className="p-1 text-muted hover:text-danger-token rounded-md hover:bg-surface transition-colors cursor-pointer"
                                title={isAdmin ? 'Delete Record' : 'Admin Login Required to Delete Record'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-token text-xs font-mono text-muted">
              <div>
                Page {page} of {totalPages} ({filteredRows.length} total rows)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-token hover:border-token-strong disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-token hover:border-token-strong disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </HudCard>
        </div>

        {/* Right Pane: Child Record Inspector Drawer (3 cols) */}
        {Object.keys(selectedRow).length > 0 && (
          <div className="lg:col-span-3 space-y-4">
            <HudCard
              title="Child Dependencies"
              subtitle={`Linked to ${pkCol?.name} = ${selectedRow[pkCol?.name || '']}`}
              action={
                <button
                  type="button"
                  onClick={() => setSelectedRow({})}
                  className="text-xs font-mono text-muted hover:text-token cursor-pointer"
                >
                  Close
                </button>
              }
            >
              {childInspectionData.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-muted">
                  No child tables reference {activeTable.name}.
                </div>
              ) : (
                <div className="space-y-4">
                  {childInspectionData.map(({ relation, targetTable, childRows }) => (
                    <div
                      key={relation.id}
                      className="p-2.5 rounded-lg bg-surface-2 border border-token space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="font-bold text-accent-token">
                          {targetTable?.name || relation.targetTable}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-muted border border-token">
                          {childRows.length} linked
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted">
                        FK: {relation.targetColumn}
                      </p>

                      {childRows.length > 0 ? (
                        <div className="max-h-36 overflow-y-auto space-y-1 pt-1 custom-scrollbar">
                          {childRows.slice(0, 5).map((cr, idx) => (
                            <div
                              key={idx}
                              className="text-xs font-mono p-1.5 rounded bg-surface text-token truncate border border-token"
                            >
                              {Object.entries(cr)
                                .slice(0, 3)
                                .map(([k, v]) => `${k}:${v}`)
                                .join(' | ')}
                            </div>
                          ))}
                          {childRows.length > 5 && (
                            <div className="text-xs font-mono text-primary-token text-center pt-0.5">
                              +{childRows.length - 5} more records
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-muted italic">
                          0 referencing records
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </HudCard>
          </div>
        )}
      </div>

      {/* Record Insert / Edit Drawer */}
      <RecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tableId={activeTable.id}
        mode={drawerMode}
        initialRecord={editingRecord}
      />
    </div>
  );
};
