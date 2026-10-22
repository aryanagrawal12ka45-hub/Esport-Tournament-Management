import React, { useState, useRef, useMemo } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Key,
  Link as LinkIcon,
  Copy,
  Check,
  Download,
  FileCode,
  ExternalLink
} from 'lucide-react';
import { useDatabase } from '../store/databaseContext';
import type { TableRelation, SubsystemCategory } from '../data/schema';
import { SUBSYSTEMS_META } from '../data/schema';
import { Drawer } from './ui/Drawer';

export const SchemaMap: React.FC = () => {
  const { tables, relations, tableData, setSelectedTableId, setActiveTab } = useDatabase();

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 80, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // DDL Drawer
  const [ddlDrawerOpen, setDdlDrawerOpen] = useState(false);
  const [ddlCopied, setDdlCopied] = useState(false);

  const nodeWidth = 230;

  // Zoom / Pan handlers
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(1.5, Math.max(0.35, prev + delta)));
  };

  const handleResetView = () => {
    setZoom(0.8);
    setPan({ x: 80, y: 50 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.table-node') || (e.target as HTMLElement).closest('.canvas-ui')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Filter tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.columns.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [tables, selectedCategory, searchQuery]);

  const isRelationHighlighted = (rel: TableRelation) => {
    const target = hoveredTableId || activeTableId;
    if (!target) return false;
    return rel.sourceTable === target || rel.targetTable === target;
  };

  // Orthogonal right-angle connector lines
  const renderOrthogonalConnections = () => {
    return relations.map((rel) => {
      const source = tables.find((t) => t.id === rel.sourceTable);
      const target = tables.find((t) => t.id === rel.targetTable);
      if (!source || !target) return null;

      const isFiltered =
        (selectedCategory !== 'All' &&
          source.category !== selectedCategory &&
          target.category !== selectedCategory) ||
        (searchQuery &&
          !filteredTables.some((t) => t.id === source.id) &&
          !filteredTables.some((t) => t.id === target.id));

      if (isFiltered) return null;

      const sourceHeight = 45 + source.columns.length * 24;
      const targetHeight = 45 + target.columns.length * 24;

      let sx = source.canvasPos.x + nodeWidth;
      let sy = source.canvasPos.y + Math.min(60, sourceHeight / 2);
      let tx = target.canvasPos.x;
      let ty = target.canvasPos.y + Math.min(60, targetHeight / 2);

      if (source.canvasPos.x > target.canvasPos.x) {
        sx = source.canvasPos.x;
        tx = target.canvasPos.x + nodeWidth;
      }

      const midX = (sx + tx) / 2;
      const pathD = `M ${sx} ${sy} H ${midX} V ${ty} H ${tx}`;
      const highlighted = isRelationHighlighted(rel);

      return (
        <g key={rel.id} className="transition-opacity duration-200">
          <path
            d={pathD}
            fill="none"
            stroke={highlighted ? 'var(--primary)' : 'var(--border-strong)'}
            strokeWidth={highlighted ? 2.5 : 1.2}
            strokeDasharray={highlighted ? '4 3' : 'none'}
            style={highlighted ? { filter: 'drop-shadow(0 0 6px var(--primary))' } : {}}
          />
          {/* Start and end node terminals */}
          <circle
            cx={sx}
            cy={sy}
            r={highlighted ? 3.5 : 2}
            fill={highlighted ? 'var(--primary)' : 'var(--text-muted)'}
          />
          <circle
            cx={tx}
            cy={ty}
            r={highlighted ? 3.5 : 2}
            fill={highlighted ? 'var(--primary)' : 'var(--text-muted)'}
          />
          {/* Cardinality badge on highlight */}
          {highlighted && (
            <g transform={`translate(${midX}, ${(sy + ty) / 2})`}>
              <rect
                x="-28"
                y="-10"
                width="56"
                height="20"
                rx="4"
                fill="var(--surface)"
                stroke="var(--primary)"
                strokeWidth="1"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fill="var(--primary)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fontWeight="700"
              >
                1 : N
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  // Generate Oracle 19c DDL
  const ddlScript = useMemo(() => {
    let script = `-- ====================================================================\n`;
    script += `-- ARENADB: TOURNAMENT OPERATIONS ORACLE 19c DDL SCHEMA SCRIPT\n`;
    script += `-- Relational Entities Normalized in 3rd Normal Form (3NF)\n`;
    script += `-- ====================================================================\n\n`;

    tables.forEach((table) => {
      script += `-- TABLE: ${table.name} (${table.category})\n`;
      script += `CREATE TABLE ${table.name} (\n`;
      const colDefs = table.columns.map((col) => {
        let def = `    ${col.name.padEnd(24)} ${col.type}`;
        if (!col.isNullable) def += ` NOT NULL`;
        return def;
      });

      const pkCol = table.columns.find((c) => c.isPrimaryKey);
      if (pkCol) {
        colDefs.push(`    CONSTRAINT pk_${table.name.toLowerCase()} PRIMARY KEY (${pkCol.name})`);
      }

      // Foreign keys
      table.columns
        .filter((c) => c.isForeignKey && c.referencesTable && c.referencesColumn)
        .forEach((c) => {
          colDefs.push(
            `    CONSTRAINT fk_${table.name.toLowerCase()}_${c.name.toLowerCase()} FOREIGN KEY (${c.name}) REFERENCES ${c.referencesTable}(${c.referencesColumn})`
          );
        });

      script += colDefs.join(',\n');
      script += `\n);\n\n`;
    });

    return script;
  }, [tables]);

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(ddlScript);
    setDdlCopied(true);
    setTimeout(() => setDdlCopied(false), 2000);
  };

  const handleDownloadDdl = () => {
    const blob = new Blob([ddlScript], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arenadb_oracle19c_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeTableObj = tables.find((t) => t.id === activeTableId);

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Top Header & Category Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Network className="w-7 h-7 md:w-8 md:h-8 text-primary-token flex-shrink-0" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-wider text-token">
              Schema Map (Interactive ERD)
            </h2>
          </div>
          <p className="text-xs text-muted font-mono mt-1">
            Orthogonal Relational Topology • 11 Entities • 3NF Normalized Architecture
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Table */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted" />
            <input
              type="text"
              placeholder="Search table or attribute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-surface border border-token font-mono text-xs text-token placeholder-muted focus:outline-none focus:border-primary-token w-48 sm:w-56"
            />
          </div>

          {/* DDL Script Generator Button */}
          <button
            type="button"
            onClick={() => setDdlDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-token hover:border-token-strong font-mono text-xs text-token transition-colors cursor-pointer shadow-sm"
          >
            <FileCode className="w-3.5 h-3.5 text-accent-token" />
            <span>Generate DDL</span>
          </button>
        </div>
      </div>

      {/* Subsystem Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'bg-surface text-muted border border-token hover:text-token hover:border-token-strong'
          }`}
        >
          ALL SUBSYSTEMS
        </button>
        {(Object.keys(SUBSYSTEMS_META) as SubsystemCategory[]).map((cat) => {
          const meta = SUBSYSTEMS_META[cat];
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap border cursor-pointer ${
                isSelected
                  ? 'bg-surface-2 border-primary text-token font-bold'
                  : 'bg-surface border-token text-muted hover:text-token hover:border-token-strong'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
              <span>{meta.label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* Main ERD Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-[620px] rounded-xl border-2 border-token bg-token relative overflow-hidden select-none cursor-grab active:cursor-grabbing shadow-inner"
      >
        {/* Cyber Grid Canvas Backdrop */}
        <div className="absolute inset-0 bg-cyber-grid bg-[size:32px_32px] opacity-40 pointer-events-none" />

        {/* Floating Zoom & Pan Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-surface border border-token p-1 rounded-lg shadow-lg canvas-ui">
          <button
            type="button"
            onClick={() => handleZoom(0.1)}
            className="p-1.5 text-muted hover:text-primary-token rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.1)}
            className="p-1.5 text-muted hover:text-primary-token rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-xs text-muted">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 text-muted hover:text-primary-token rounded-md hover:bg-surface-2 transition-colors cursor-pointer"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Canvas Plane */}
        <div
          className="absolute inset-0 origin-top-left transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          {/* SVG Connector Layer */}
          <svg className="absolute inset-0 w-[2400px] h-[1600px] pointer-events-none overflow-visible">
            {renderOrthogonalConnections()}
          </svg>

          {/* Table Entity Cards */}
          {filteredTables.map((table) => {
            const rowCount = tableData[table.id]?.length || 0;
            const meta = SUBSYSTEMS_META[table.category];
            const isHovered = hoveredTableId === table.id;
            const isActive = activeTableId === table.id;

            return (
              <div
                key={table.id}
                onMouseEnter={() => setHoveredTableId(table.id)}
                onMouseLeave={() => setHoveredTableId(null)}
                onClick={() => setActiveTableId(table.id)}
                style={{
                  left: table.canvasPos.x,
                  top: table.canvasPos.y,
                  width: nodeWidth
                }}
                className={`table-node absolute rounded-lg bg-surface border transition-all cursor-pointer shadow-lg ${
                  isActive
                    ? 'border-2 border-primary shadow-xl z-20'
                    : isHovered
                    ? 'border-token-strong shadow-md z-10'
                    : 'border-token'
                }`}
              >
                {/* Header */}
                <div
                  className="p-2.5 rounded-t-lg border-b border-token flex items-center justify-between"
                  style={{ borderTop: `3px solid ${meta.color}`, background: 'var(--surface-2)' }}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-xs font-bold text-token truncate block">
                      {table.name}
                    </span>
                    <span className="text-xs font-mono text-muted truncate block">
                      {table.category}
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface text-muted border border-token">
                    {rowCount}
                  </span>
                </div>

                {/* Column List */}
                <div className="p-2 space-y-1 font-mono text-xs max-h-56 overflow-y-auto custom-scrollbar">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-surface-2"
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        {col.isPrimaryKey ? (
                          <Key className="w-3.5 h-3.5 text-primary-token flex-shrink-0" />
                        ) : col.isForeignKey ? (
                          <LinkIcon className="w-3.5 h-3.5 text-accent-token flex-shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 inline-block" />
                        )}
                        <span
                          className={`truncate ${
                            col.isPrimaryKey
                              ? 'font-bold text-primary-token'
                              : col.isForeignKey
                              ? 'font-bold text-accent-token'
                              : 'text-token'
                          }`}
                        >
                          {col.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted ml-1 flex-shrink-0">
                        {col.type.split('(')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Minimap in Bottom-Right Corner */}
        <div className="absolute bottom-4 right-4 z-10 w-44 h-28 bg-surface border border-token rounded-lg shadow-xl overflow-hidden canvas-ui flex flex-col">
          <div className="px-2 py-1 bg-surface-2 border-b border-token text-xs font-mono text-muted uppercase">
            Minimap
          </div>
          <div className="flex-1 relative bg-surface">
            {tables.map((t) => (
              <div
                key={t.id}
                style={{
                  left: `${(t.canvasPos.x / 1400) * 100}%`,
                  top: `${(t.canvasPos.y / 900) * 100}%`,
                  width: 14,
                  height: 10
                }}
                className={`absolute rounded-[2px] ${
                  t.id === activeTableId
                    ? 'bg-primary'
                    : 'bg-border-strong'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected Table Inspector Card */}
      {activeTableObj && (
        <div className="p-4 rounded-xl bg-surface border border-token flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-token">
                Selected: {activeTableObj.name}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary-soft text-primary-token font-bold border border-token">
                {activeTableObj.category}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {activeTableObj.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedTableId(activeTableObj.id);
              setActiveTab('vault');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold uppercase tracking-wider hover:bg-primary-hover transition-all self-start md:self-center cursor-pointer shadow-sm"
          >
            <span>Open in Data Vault</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* DDL Script Generator Drawer */}
      <Drawer
        isOpen={ddlDrawerOpen}
        onClose={() => setDdlDrawerOpen(false)}
        title="Oracle 19c DDL Schema Script"
        subtitle="Complete Enterprise Relational Table & Constraint Definitions"
        widthClass="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-token">
            <span className="text-xs font-mono text-muted">
              11 CREATE TABLE statements • Foreign Key Constraints
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyDdl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-token font-mono text-xs text-token hover:border-token-strong transition-colors cursor-pointer"
              >
                {ddlCopied ? <Check className="w-3.5 h-3.5 text-success-token" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{ddlCopied ? 'Copied!' : 'Copy Script'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadDdl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary-hover transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .SQL</span>
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-lg bg-surface-2 border border-token font-mono text-xs text-token overflow-x-auto max-h-[600px] custom-scrollbar">
            {ddlScript}
          </pre>
        </div>
      </Drawer>
    </div>
  );
};
