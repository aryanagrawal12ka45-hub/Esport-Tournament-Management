# Technical Architecture and Design System

This document outlines the software engineering architecture, state management patterns, and graphic visualization engine powering the **Renewable Energy DB Simulator**.

---

## System Architecture Overview

```
                                  +------------------------------------+
                                  |            Browser View            |
                                  |    (React 19 + TypeScript + CSS)   |
                                  +-----------------+------------------+
                                                    |
                      +-----------------------------+-----------------------------+
                      |                             |                             |
                      v                             v                             v
            +-------------------+         +-------------------+         +-------------------+
            |  Interactive ERD  |         |   Table Manager   |         |   Query Console   |
            |   Canvas Engine   |         |    (Full CRUD)    |         |    (OLAP SQL)     |
            +---------+---------+         +---------+---------+         +---------+---------+
                      |                             |                             |
                      +-----------------------------+-----------------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |  In-Memory Relational State Layer  |
                                  |    (Live Records, Relations, PK)   |
                                  +-----------------+------------------+
                                                    ^
                                                    |
                                  +-----------------+------------------+
                                  |  Simulated IoT Telemetry Loop     |
                                  |  (2.8s Event Tick, Window Slicing)|
                                  +------------------------------------+
```

---

## In-Memory Relational Engine and Live Telemetry

### Reactive State Model
The simulator implements an in-memory transactional database engine directly in React state (`App.tsx`):
- **Table Registry**: Master dictionary storing dynamic record arrays keyed by `TableID`:
  ```typescript
  const [tableData, setTableData] = useState<Record<string, any[]>>(() => {
    const map: Record<string, any[]> = {};
    INITIAL_TABLES.forEach((t) => {
      map[t.id] = [...t.initialRows];
    });
    return map;
  });
  ```
- **Referential Integrity Enforcement**: When inserting rows via `RecordModal.tsx`, foreign-key constraints are checked against parent tables in real time.
- **Dynamic Slicing**: Telemetry tables retain the latest 24 active intervals using rolling FIFO sliding windows to maintain performance and low memory footprints.

### Asynchronous IoT Streaming Engine
A dedicated tick worker (`useEffect` in `App.tsx`) simulates live microgrid telemetry:
1. **Generation Production Tick**: Generates realistic fluctuating power outputs for Photovoltaic Arrays and Wind Turbines (420 to 505 kWh) and microgrid frequency oscillations (49.95 to 50.05 Hz).
2. **Environmental Conditions Tick**: Modulates ambient solar irradiance (920 to 1040 W/m2), ambient temperature, and wind speed.
3. **BESS Thermodynamic Update**: Simulates realistic battery State of Charge (SoC) drift and cycle increments.

---

## Interactive ERD Canvas and Math Engine

The `DatabaseSchemaCanvas.tsx` component renders an interactive infinite canvas with dynamic entity tables and vector relationship lines.

### 1. Vectorized SVG Bezier Curves
Relationships between tables are rendered dynamically as cubic Bezier SVG paths:
```
B(t) = (1-t)^3 * P0 + 3*(1-t)^2 * t * P1 + 3*(1-t) * t^2 * P2 + t^3 * P3
```
- **Connection Anchors**: Automatically calculate the closest geometric face (left/right/top/bottom) between source and target cards to prevent messy overlapping lines.
- **Directional Gradients**: Foreign key vectors are rendered with animated metallic silver or amber SVG gradients indicating data flow direction.
- **Active Cardinality Badges**: Hovering or clicking on a relation or table card highlights interconnected foreign keys with glowing borders.

### 2. Multi-Touch Gestures and Pan/Zoom
- **Desktop**: Mouse drag panning with smooth inertial dampening; mouse-wheel zooming centered around cursor coordinates.
- **Mobile Touch**: Full two-finger multi-touch pinch-to-zoom calculation with distance delta tracking.
- **Viewport Constraints**: Clamps zoom factors between 0.25x and 2.0x with single-click `Reset View` and `Center Canvas` controls.

---

## Design System and Aesthetic Principles

The application adheres to an **ultra-dark, metallic wafer and brushed steel design philosophy**:

### Design System Tokens
- **Background Palette**: Pure Obsidian Black (`#000000`, `#08080a`, `#0e0e12`) avoiding muddy grays or saturated neon purple themes.
- **Metallic Accents**: Silver wafer chrome borders (`rgba(255, 255, 255, 0.12)` to `rgba(255, 255, 255, 0.28)`).
- **Subsystem Palette**:
  - `Assets`: Brushed Steel White (`#f4f4f5`)
  - `Telemetry`: Industrial Zinc (`#d4d4d8`)
  - `Storage`: Solar Amber (`#fbbf24`)
  - `Grid`: High-Voltage Slate (`#94a3b8`)
  - `Compliance`: Emerald Green (`#34d399`)
- **Typography**: Clean monospace fonts (`JetBrains Mono`, `SF Mono`, `Fira Code`) for tables, timestamps, and keys; modern system display geometry for headers.
- **Glassmorphism**: Fine-grain backdrop filters (`backdrop-filter: blur(12px)`) with hairline specular highlights.

---

## Responsive and Mobile-First Architecture

The application provides a responsive experience across all viewports (from 320px mobile screens to 4K ultra-wide monitors):
- **Bottom Navigation Bar**: Mobile devices display an ergonomic bottom tab bar with tactile touch feedback.
- **Drawer and Canvas Controls**: Floating canvas toolbars reposition and minimize gracefully on narrow screens.
- **Table Virtualization and Horizontal Scroll**: Data grids preserve column alignment with sticky primary key indicators and horizontal touch gliding.
