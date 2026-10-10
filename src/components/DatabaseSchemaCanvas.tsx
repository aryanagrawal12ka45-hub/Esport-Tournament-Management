import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  DatabaseTable,
  TableRelation,
  SubsystemCategory
} from '../data/databaseData';
import {
  Zap,
  Cpu,
  Sun,
  Activity,
  Radio,
  Layers,
  BatteryCharging,
  Wrench,
  FileText,
  Building,
  ShieldCheck,
  Send,
  Award,
  ClipboardCheck,
  Leaf,
  Key,
  Link,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Filter,
  X,
  ExternalLink,
  Hash,
  Database
} from 'lucide-react';

interface Props {
  tables: DatabaseTable[];
  relations: TableRelation[];
  onSelectTableForManagement: (tableId: string) => void;
}

// Metallic, Silverish Subsystem Colors (No Purple, No Vibe Neon)
const getCategoryColor = (cat: SubsystemCategory) => {
  switch (cat) {
    case 'Assets': return { border: 'rgba(255, 255, 255, 0.22)', bg: 'rgba(255, 255, 255, 0.05)', text: '#f4f4f5' };
    case 'Telemetry': return { border: 'rgba(212, 212, 216, 0.22)', bg: 'rgba(212, 212, 216, 0.05)', text: '#e4e4e7' };
    case 'Storage': return { border: 'rgba(245, 158, 11, 0.25)', bg: 'rgba(245, 158, 11, 0.06)', text: '#fbbf24' };
    case 'Grid': return { border: 'rgba(161, 161, 170, 0.22)', bg: 'rgba(161, 161, 170, 0.05)', text: '#d4d4d8' };
    case 'Compliance': return { border: 'rgba(16, 185, 129, 0.25)', bg: 'rgba(16, 185, 129, 0.06)', text: '#34d399' };
    default: return { border: 'rgba(255, 255, 255, 0.15)', bg: 'rgba(255, 255, 255, 0.04)', text: '#a1a1aa' };
  }
};

const getIcon = (name: string, size = 15) => {
  switch (name) {
    case 'Zap': return <Zap size={size} />;
    case 'Cpu': return <Cpu size={size} />;
    case 'Sun': return <Sun size={size} />;
    case 'Activity': return <Activity size={size} />;
    case 'Radio': return <Radio size={size} />;
    case 'Layers': return <Layers size={size} />;
    case 'BatteryCharging': return <BatteryCharging size={size} />;
    case 'Wrench': return <Wrench size={size} />;
    case 'FileText': return <FileText size={size} />;
    case 'Building': return <Building size={size} />;
    case 'ShieldCheck': return <ShieldCheck size={size} />;
    case 'Send': return <Send size={size} />;
    case 'Award': return <Award size={size} />;
    case 'ClipboardCheck': return <ClipboardCheck size={size} />;
    case 'Leaf': return <Leaf size={size} />;
    default: return <Database size={size} />;
  }
};

export const DatabaseSchemaCanvas: React.FC<Props> = ({
  tables,
  relations,
  onSelectTableForManagement
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom State
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const panRef = useRef({ x: 30, y: 30 });
  const zoomRef = useRef(0.8);

  panRef.current = pan;
  zoomRef.current = zoom;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filtering & Selection
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'columns' | 'relations' | 'rows'>('columns');

  // Node Dimensions
  const nodeWidth = 330;

  // Fit & Center View Calculation
  const handleFitView = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vpW = rect.width;
    const vpH = rect.height;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    tables.forEach((t) => {
      minX = Math.min(minX, t.canvasPos.x);
      minY = Math.min(minY, t.canvasPos.y);
      maxX = Math.max(maxX, t.canvasPos.x + nodeWidth);
      const nodeH = 75 + t.columns.length * 28;
      maxY = Math.max(maxY, t.canvasPos.y + nodeH);
    });

    const contentW = maxX - minX + 80;
    const contentH = maxY - minY + 80;

    const scaleX = (vpW - 100) / contentW;
    const scaleY = (vpH - 120) / contentH;
    const fitZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.45), 1.0);

    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    const newPanX = Math.round(vpW / 2 - contentCenterX * fitZoom);
    const newPanY = Math.round((vpH + 40) / 2 - contentCenterY * fitZoom);

    setZoom(fitZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [tables, nodeWidth]);

  // Initial auto-centering on mount
  useEffect(() => {
    handleFitView();
  }, [handleFitView]);

  // NON-PASSIVE wheel listener: completely PREVENTS browser page pinch-zoom!
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      // Critical: prevent browser page zoom on pinch in / pinch out
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch-to-zoom
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;

        // Controlled zoom delta
        const zoomDelta = e.deltaY * -0.0025;
        const newZoom = Math.min(Math.max(currentZoom + zoomDelta, 0.4), 1.6);

        if (newZoom !== currentZoom) {
          const canvasX = (cursorX - currentPan.x) / currentZoom;
          const canvasY = (cursorY - currentPan.y) / currentZoom;

          const nextPanX = Math.round(cursorX - canvasX * newZoom);
          const nextPanY = Math.round(cursorY - canvasY * newZoom);

          setZoom(newZoom);
          setPan({ x: nextPanX, y: nextPanY });
        }
      } else {
        // Dual-axis trackpad & wheel pan
        const dx = e.shiftKey ? e.deltaY : e.deltaX;
        const dy = e.shiftKey ? 0 : e.deltaY;

        setPan((prev) => ({
          x: prev.x - dx,
          y: prev.y - dy
        }));
      }
    };

    // Prevent Safari/Mac gesture zoom
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    window.addEventListener('gesturestart', preventGesture, { passive: false } as any);
    window.addEventListener('gesturechange', preventGesture, { passive: false } as any);

    return () => {
      container.removeEventListener('wheel', onWheelNative);
      window.removeEventListener('gesturestart', preventGesture as any);
      window.removeEventListener('gesturechange', preventGesture as any);
    };
  }, []);

  // Zoom button helper (centers on viewport)
  const handleZoomButton = (delta: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const currentZoom = zoomRef.current;
    const currentPan = panRef.current;
    const newZoom = Math.min(Math.max(currentZoom + delta, 0.4), 1.6);

    if (newZoom !== currentZoom) {
      const canvasX = (centerX - currentPan.x) / currentZoom;
      const canvasY = (centerY - currentPan.y) / currentZoom;

      setZoom(newZoom);
      setPan({
        x: Math.round(centerX - canvasX * newZoom),
        y: Math.round(centerY - canvasY * newZoom)
      });
    }
  };

  // Drag Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.table-node') ||
      (e.target as HTMLElement).closest('.canvas-ui') ||
      (e.target as HTMLElement).closest('.slide-over-drawer')
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const activeTable = tables.find((t) => t.id === activeTableId);

  const filteredTables = tables.filter((t) => {
    const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.columns.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const isRelationHighlighted = (rel: TableRelation) => {
    if (!hoveredTableId && !activeTableId) return false;
    const targetId = hoveredTableId || activeTableId;
    return rel.sourceTable === targetId || rel.targetTable === targetId;
  };

  const renderRelations = () => {
    return relations.map((rel) => {
      const source = tables.find((t) => t.id === rel.sourceTable);
      const target = tables.find((t) => t.id === rel.targetTable);
      if (!source || !target) return null;

      const isFiltered =
        (selectedCategory !== 'All' && (source.category !== selectedCategory || target.category !== selectedCategory)) ||
        (searchQuery && !filteredTables.some((t) => t.id === source.id) && !filteredTables.some((t) => t.id === target.id));

      if (isFiltered) return null;

      const nodeHeight = 50 + source.columns.length * 28;
      const targetHeight = 50 + target.columns.length * 28;

      let sx = source.canvasPos.x + nodeWidth;
      let sy = source.canvasPos.y + Math.min(70, nodeHeight / 2);

      let tx = target.canvasPos.x;
      let ty = target.canvasPos.y + Math.min(70, targetHeight / 2);

      if (source.canvasPos.x > target.canvasPos.x) {
        sx = source.canvasPos.x;
        tx = target.canvasPos.x + nodeWidth;
      }

      const dx = Math.abs(tx - sx) * 0.52;
      const pathD = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

      const highlighted = isRelationHighlighted(rel);

      return (
        <g key={rel.id} className="relation-group">
          {/* Metallic bezier curve */}
          <path
            d={pathD}
            fill="none"
            stroke={highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.16)'}
            strokeWidth={highlighted ? 2.2 : 1.3}
            strokeDasharray={highlighted ? '5 4' : 'none'}
            strokeLinecap="round"
          />

          <circle cx={sx} cy={sy} r={highlighted ? 3.5 : 2.5} fill={highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'} />
          <circle cx={tx} cy={ty} r={highlighted ? 3.5 : 2.5} fill={highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'} />
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="schema-canvas-wrapper"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        backgroundColor: '#000000',
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Top Floating Control Bar - Organic Luxury Styling */}
      <div
        className="canvas-ui"
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 30
        }}
      >
        {/* Domain Category Filter Segmented Wafers */}
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 6px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(12, 12, 16, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: 'var(--text-muted)' }}>
            <Filter size={13} />
          </div>
          {(['All', 'Assets', 'Telemetry', 'Storage', 'Grid', 'Compliance'] as const).map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 400,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.09)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--border-metallic)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
                {cat === 'All' && ` (${tables.length})`}
              </button>
            );
          })}
        </div>

        {/* Right: Search & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          {/* Quick Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(12, 12, 16, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <Search size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter table or column..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 12,
                width: 175,
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ color: 'var(--text-muted)' }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Zoom controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: '4px 6px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(12, 12, 16, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <button
              onClick={() => handleZoomButton(-0.15)}
              title="Zoom Out"
              style={{ padding: '5px 8px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', minWidth: 38, textAlign: 'center', color: 'var(--text-muted)' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => handleZoomButton(0.15)}
              title="Zoom In"
              style={{ padding: '5px 8px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}
            >
              <ZoomIn size={14} />
            </button>
            <div style={{ width: 1, height: 16, backgroundColor: 'var(--border)', margin: '0 2px' }} />
            <button
              onClick={handleFitView}
              title="Fit & Center View"
              style={{ padding: '5px 8px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: 2600,
          height: 1700,
          transition: isDragging ? 'none' : 'transform 0.05s ease-out'
        }}
      >
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 5
          }}
        >
          {renderRelations()}
        </svg>

        {/* Database Table Nodes - Smooth Organic Radii (20px), Zero Boxy Look */}
        {tables.map((table) => {
          const isSelected = activeTableId === table.id;
          const isHovered = hoveredTableId === table.id;
          const catColors = getCategoryColor(table.category);

          const isVisible =
            (selectedCategory === 'All' || table.category === selectedCategory) &&
            (!searchQuery ||
              table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              table.columns.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())));

          return (
            <motion.div
              key={table.id}
              className="table-node"
              onMouseEnter={() => setHoveredTableId(table.id)}
              onMouseLeave={() => setHoveredTableId(null)}
              onClick={() => setActiveTableId(table.id)}
              initial={false}
              animate={{
                opacity: isVisible ? 1 : 0.25
              }}
              style={{
                position: 'absolute',
                left: table.canvasPos.x,
                top: table.canvasPos.y,
                width: nodeWidth,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(14, 14, 18, 0.92)',
                backdropFilter: 'blur(24px)',
                border: isSelected
                  ? `1px solid #ffffff`
                  : isHovered
                  ? `1px solid var(--border-metallic)`
                  : '1px solid var(--border)',
                boxShadow: isSelected
                  ? '0 16px 40px rgba(0, 0, 0, 0.9), 0 0 1px #ffffff'
                  : 'var(--shadow-card)',
                zIndex: isSelected ? 25 : isHovered ? 20 : 10,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Subtle Metallic Top Indicator */}
              <div style={{ height: 2, backgroundColor: isSelected ? '#ffffff' : catColors.border, width: '100%' }} />

              {/* Node Header */}
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'rgba(255, 255, 255, 0.015)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, marginRight: 8 }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      color: '#ffffff',
                      flexShrink: 0
                    }}
                  >
                    {getIcon(table.iconName, 13)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      title={table.name}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {table.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                      {table.category} Subsystem
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 7px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border)',
                    fontSize: 10.5,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    flexShrink: 0
                  }}
                >
                  <Hash size={10} />
                  {table.initialRows.length}
                </div>
              </div>

              {/* Column Schema Rows */}
              <div style={{ padding: '6px 8px', maxHeight: 250, overflowY: 'auto' }}>
                {table.columns.map((col) => {
                  return (
                    <div
                      key={col.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: 11.5,
                        gap: 6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                        {col.isPrimaryKey ? (
                          <span title="Primary Key" style={{ color: '#fbbf24', display: 'flex', flexShrink: 0 }}>
                            <Key size={11} />
                          </span>
                        ) : col.isForeignKey ? (
                          <span title={`Foreign Key -> ${col.referencesTable}`} style={{ color: '#d4d4d8', display: 'flex', flexShrink: 0 }}>
                            <Link size={11} />
                          </span>
                        ) : (
                          <span style={{ width: 11, height: 11, display: 'inline-block', flexShrink: 0 }} />
                        )}

                        <span
                          title={col.name}
                          style={{
                            fontWeight: col.isPrimaryKey ? 600 : 400,
                            color: col.isPrimaryKey ? '#ffffff' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {col.name}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          color: col.type.startsWith('STRUCT')
                            ? '#d4d4d8'
                            : col.type.startsWith('DECIMAL')
                            ? '#a1a1aa'
                            : 'var(--text-muted)',
                          flexShrink: 0,
                          textAlign: 'right'
                        }}
                      >
                        {col.type}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Node Footer */}
              <div
                style={{
                  padding: '8px 14px',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  Click to inspect
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTableForManagement(table.id);
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    color: '#ffffff'
                  }}
                >
                  Manage Data
                  <ExternalLink size={11} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Slide-over Table Inspector Drawer */}
      <AnimatePresence>
        {activeTable && (
          <motion.div
            initial={{ x: 460, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 460, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="slide-over-drawer"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 440,
              backgroundColor: '#08080a',
              borderLeft: '1px solid var(--border)',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderBottomLeftRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 40,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border)',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  {getIcon(activeTable.iconName, 15)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3
                    title={activeTable.name}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {activeTable.name}
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {activeTable.category} Domain &bull; {activeTable.columns.length} Columns
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTableId(null)}
                style={{
                  color: 'var(--text-muted)',
                  padding: 6,
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Description note */}
            <div
              style={{
                padding: '12px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.015)',
                borderBottom: '1px solid var(--border)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: '1.45'
              }}
            >
              {activeTable.description}
            </div>

            {/* Tab navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border)',
                padding: '0 20px',
                gap: 8
              }}
            >
              {[
                { id: 'columns', label: 'Columns Schema' },
                { id: 'relations', label: 'Foreign Keys' },
                { id: 'rows', label: `Rows (${activeTable.initialRows.length})` }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDrawerTab(t.id as any)}
                  style={{
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: drawerTab === t.id ? 600 : 400,
                    color: drawerTab === t.id ? '#ffffff' : 'var(--text-muted)',
                    borderBottom: drawerTab === t.id ? '2px solid #ffffff' : '2px solid transparent',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {drawerTab === 'columns' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeTable.columns.map((col) => (
                    <div
                      key={col.name}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.025)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {col.isPrimaryKey ? (
                            <span style={{ color: '#fbbf24', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Key size={11} /> PK
                            </span>
                          ) : col.isForeignKey ? (
                            <span style={{ color: '#d4d4d8', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Link size={11} /> FK
                            </span>
                          ) : null}
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#ffffff' }}>
                            {col.name}
                          </span>
                        </div>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {col.type}
                        </span>
                      </div>
                      {col.description && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {col.description}
                        </p>
                      )}
                      {col.referencesTable && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                          References: {col.referencesTable}({col.referencesColumn})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'relations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {relations
                    .filter((r) => r.sourceTable === activeTable.id || r.targetTable === activeTable.id)
                    .map((rel) => {
                      const isOutbound = rel.sourceTable === activeTable.id;
                      return (
                        <div
                          key={rel.id}
                          style={{
                            padding: '11px 14px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.025)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>{isOutbound ? 'Outgoing Link' : 'Incoming Link'}</span>
                            <span>&bull;</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{rel.type}</span>
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#ffffff', marginTop: 4 }}>
                            {rel.sourceTable}.{rel.sourceColumn} &rarr; {rel.targetTable}.{rel.targetColumn}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--accent-silver)', marginTop: 2 }}>
                            {rel.label}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {drawerTab === 'rows' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeTable.initialRows.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.025)',
                        border: '1px solid var(--border)',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {Object.entries(row).slice(0, 4).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                          <span style={{ color: '#ffffff', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                onClick={() => onSelectTableForManagement(activeTable.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontSize: 12.5,
                  fontWeight: 600,
                  boxShadow: '0 2px 10px rgba(255, 255, 255, 0.15)'
                }}
              >
                Open in Data Management Studio &rarr;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
