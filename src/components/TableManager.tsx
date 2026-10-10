import React, { useState, useMemo } from 'react';
import type { DatabaseTable } from '../data/databaseData';
import {
  Search,
  Plus,
  Trash2,
  Download,
  ArrowUpDown,
  Key,
  Link,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

interface Props {
  tables: DatabaseTable[];
  selectedTableId: string;
  onSelectTable: (tableId: string) => void;
  tableData: Record<string, any[]>;
  onOpenInsertModal: (tableId: string) => void;
  onDeleteRow: (tableId: string, rowPrimaryKey: string) => void;
}

export const TableManager: React.FC<Props> = ({
  tables,
  selectedTableId,
  onSelectTable,
  tableData,
  onOpenInsertModal,
  onDeleteRow,
}) => {
  const isMobile = useIsMobile(900);
  const currentTable = tables.find((t) => t.id === selectedTableId) || tables[0];
  const rows = tableData[currentTable.id] || [];

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColumn, setFilterColumn] = useState<string>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const pkCol = currentTable.columns.find((c) => c.isPrimaryKey)?.name || currentTable.columns[0].name;

  // Filtering & Sorting
  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          typeof val === 'object' ? JSON.stringify(val).toLowerCase().includes(term) : String(val).toLowerCase().includes(term)
        )
      );
    }

    if (filterColumn !== 'all' && filterValue.trim()) {
      const fTerm = filterValue.toLowerCase();
      result = result.filter((row) =>
        String(row[filterColumn] ?? '').toLowerCase().includes(fTerm)
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const comp = valA < valB ? -1 : 1;
        return sortDirection === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [rows, searchTerm, filterColumn, filterValue, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  // Robust RFC 4180 CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    if (!rows.length) return;
    const headers = currentTable.columns.map((c) => c.name);

    const escapeCsvField = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeCsvField).join(',');
    const dataLines = rows.map((row) =>
      headers.map((h) => escapeCsvField(row[h])).join(',')
    );

    const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTable.name.toLowerCase()}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: isMobile ? 'calc(100vh - 54px - 56px)' : 'calc(100vh - 60px)',
        backgroundColor: '#000000',
        overflow: 'hidden'
      }}
    >
      {/* Left Sidebar: 15 Tables Selector (Desktop only) */}
      {!isMobile && (
        <div
          style={{
            width: 310,
            borderRight: '1px solid var(--border)',
            backgroundColor: '#08080a',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 11.5, fontWeight: 600 }}>
              <Database size={13} style={{ color: 'var(--accent-silver)' }} />
              Relational Schema Tables ({tables.length})
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
            {tables.map((table) => {
              const isSelected = table.id === currentTable.id;
              const rowCount = (tableData[table.id] || []).length;

              return (
                <button
                  key={table.id}
                  onClick={() => {
                    onSelectTable(table.id);
                    setCurrentPage(1);
                    setSearchTerm('');
                    setFilterColumn('all');
                    setFilterValue('');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 3,
                    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-metallic)' : '1px solid transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#ffffff' : 'var(--text-dim)',
                        flexShrink: 0
                      }}
                    />
                    <span
                      title={table.name}
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                        flex: 1
                      }}
                    >
                      {table.name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 10.5,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                      marginLeft: 6
                    }}
                  >
                    {rowCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content: Table Explorer & CRUD Operations */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile-Only Active Table Selector Dropdown */}
        {isMobile && (
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: '#08080a',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11.5, whiteSpace: 'nowrap' }}>
              <Database size={13} style={{ color: 'var(--accent-silver)' }} />
              Active Table:
            </div>
            <select
              value={currentTable.id}
              onChange={(e) => {
                onSelectTable(e.target.value);
                setCurrentPage(1);
                setSearchTerm('');
                setFilterColumn('all');
                setFilterValue('');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-metallic)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                outline: 'none'
              }}
            >
              {tables.map((t) => (
                <option key={t.id} value={t.id} style={{ background: '#08080a', color: '#ffffff' }}>
                  {t.name} ({(tableData[t.id] || []).length} rows)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Table Header Bar */}
        <div
          style={{
            padding: isMobile ? '12px 16px' : '16px 24px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: '#08080a',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: isMobile ? 15 : 16,
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em'
                }}
              >
                {currentTable.name}
              </h2>
              <span
                className="tag-wafer"
                style={{
                  fontSize: 10.5,
                  padding: '3px 8px'
                }}
              >
                {currentTable.category} Domain
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              {currentTable.description}
            </p>
          </div>

          {/* Action Buttons - Smooth Organic Radii */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '100%' : 'auto' }}>
            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 500,
                flex: isMobile ? 1 : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Download size={13} />
              Export CSV
            </button>

            <button
              onClick={() => onOpenInsertModal(currentTable.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#ffffff',
                border: '1px solid #ffffff',
                color: '#000000',
                fontSize: 12,
                fontWeight: 600,
                flex: isMobile ? 1 : 'none',
                boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={14} />
              Insert Record
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            padding: isMobile ? '10px 16px' : '12px 24px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between',
            gap: 10
          }}
        >
          {/* Global Fuzzy Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid var(--border)',
              width: isMobile ? '100%' : 300
            }}
          >
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={`Search in ${currentTable.name}...`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 12,
                width: '100%',
                outline: 'none'
              }}
            />
          </div>

          {/* Column-Specific Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '100%' : 'auto' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter:</span>
            <select
              value={filterColumn}
              onChange={(e) => {
                setFilterColumn(e.target.value);
                setFilterValue('');
                setCurrentPage(1);
              }}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: 12
              }}
            >
              <option value="all">All columns</option>
              {currentTable.columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {filterColumn !== 'all' && (
              <input
                type="text"
                placeholder={`Value...`}
                value={filterValue}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  flex: isMobile ? 1 : 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  width: isMobile ? 'auto' : 180
                }}
              />
            )}
          </div>
        </div>

        {/* Data Grid Table View */}
        <div
          className="touch-scroll"
          style={{
            flex: 1,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            backgroundColor: '#000000',
            padding: isMobile ? '0 10px' : '0 16px'
          }}
        >
          <div
            style={{
              margin: isMobile ? '10px 0' : '16px 0',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              overflowX: 'auto',
              backgroundColor: 'rgba(10, 10, 13, 0.8)'
            }}
          >
            <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  {currentTable.columns.map((col) => {
                    const isSorted = sortColumn === col.name;
                    return (
                      <th
                        key={col.name}
                        onClick={() => handleSort(col.name)}
                        style={{
                          padding: '10px 14px',
                          color: isSorted ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: 600,
                          fontSize: 11.5,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {col.isPrimaryKey ? (
                            <span title="Primary Key" style={{ color: '#fbbf24', display: 'flex' }}>
                              <Key size={11} />
                            </span>
                          ) : col.isForeignKey ? (
                            <span title={`Foreign Key -> ${col.referencesTable}`} style={{ color: '#d4d4d8', display: 'flex' }}>
                              <Link size={11} />
                            </span>
                          ) : null}

                          <span>{col.name}</span>
                          <ArrowUpDown size={11} style={{ opacity: isSorted ? 1 : 0.3 }} />
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)', fontSize: 11.5 }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={currentTable.columns.length + 1}
                      style={{
                        padding: 40,
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                      }}
                    >
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => {
                    const pkValue = row[pkCol];

                    return (
                      <tr
                        key={rIdx}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                        }}
                      >
                        {currentTable.columns.map((col) => {
                          const val = row[col.name];
                          const isStatusCol = col.name.toLowerCase().includes('status');

                          let statusColor = 'green';
                          if (String(val).toLowerCase().includes('maint') || String(val).toLowerCase().includes('standby')) {
                            statusColor = 'amber';
                          }

                          return (
                            <td
                              key={col.name}
                              style={{
                                padding: '9px 14px',
                                color: col.isPrimaryKey ? '#ffffff' : 'var(--text-secondary)',
                                fontFamily:
                                  col.type.includes('DECIMAL') || col.type.includes('TIMESTAMP') || col.isPrimaryKey
                                    ? 'var(--font-mono)'
                                    : 'inherit',
                                whiteSpace: 'nowrap',
                                maxWidth: 320,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {isStatusCol ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <span className={`status-dot ${statusColor}`} />
                                  {String(val)}
                                </span>
                              ) : typeof val === 'object' && val !== null ? (
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    color: '#d4d4d8',
                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid var(--border)',
                                    padding: '2px 7px',
                                    borderRadius: 'var(--radius-xs)'
                                  }}
                                >
                                  {JSON.stringify(val)}
                                </span>
                              ) : val === null || val === undefined ? (
                                <span style={{ color: 'var(--text-muted)' }}>NULL</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}

                        {/* Row Delete Action */}
                        <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete record with ${pkCol} = "${pkValue}"?`)) {
                                onDeleteRow(currentTable.id, pkValue);
                              }
                            }}
                            title="Delete row"
                            style={{
                              color: 'var(--text-muted)',
                              padding: 5,
                              borderRadius: 'var(--radius-xs)',
                              transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            padding: isMobile ? '10px 16px' : '12px 24px',
            borderTop: '1px solid var(--border)',
            backgroundColor: '#08080a',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 8,
            justifyContent: 'space-between',
            alignItems: isMobile ? 'center' : 'center',
            fontSize: 11.5,
            color: 'var(--text-secondary)'
          }}
        >
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              style={{
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                opacity: currentPage === 1 ? 0.35 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              style={{
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                opacity: currentPage === totalPages ? 0.35 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
