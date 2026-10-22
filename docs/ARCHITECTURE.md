# ArenaDB Technical Architecture and System Design

This document details the software architecture, DuckDB-Wasm integration, state synchronization mechanics, reactive live telemetry tick engine, and procedural execution subsystem powering **ArenaDB: Tournament Operations Database Lab**.

---

## 1. System Architecture Overview

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
            |    Schema Map     |         |    Data Vault     |         |     Query Lab     |
            | (Orthogonal ERD)  |         | (3-Pane Explorer) |         |   (DuckDB-Wasm)   |
            +---------+---------+         +---------+---------+         +---------+---------+
                      |                             |                             |
            +---------+---------+         +---------+---------+         +---------+---------+
            |  Command Center   |         |    PL/SQL Lab     |         |  Integrity Desk   |
            | (Scoreboard/Bento)|         | (Oracle 19c Engine|         |  (Kanban Board)   |
            +---------+---------+         +---------+---------+         +---------+---------+
                      |                             |                             |
                      +-----------------------------+-----------------------------+
                                                    |
                                                    v
                                  +------------------------------------+
                                  |      DatabaseContext Store         |
                                  |   (Relational Cache & Cascades)    |
                                  +--------+------------------+--------+
                                           |                  |
                                           v                  v
                      +--------------------+---+          +---+--------------------+
                      |   DuckDB-Wasm Engine   |          |  Live Match Tick Loop  |
                      | (Client Columnar OLAP) |          | (2.8s Simulation Tick) |
                      +------------------------+          +------------------------+
```

---

## 2. DuckDB-Wasm In-Memory Analytics Engine

ArenaDB incorporates **DuckDB-Wasm** (`@duckdb/duckdb-wasm`) client-side to execute real-time columnar analytical SQL in the browser:

1. **WebAssembly Initialization**:
   - Asynchronously loads DuckDB WebAssembly workers and module bundles (`duckdb-browser-mvp.worker.js` / `duckdb-mvp.wasm`) using jsDelivr CDN fallback.
   - Provides non-blocking execution with dedicated worker threads.
2. **Dynamic Ingestion**:
   - In-memory relational tables are serialized and registered into DuckDB via `registerFileText()` and `read_json_auto()`.
   - Hashes and syncs only when database state mutates, preventing redundant serialization overhead.
3. **Execution Profiling (`EXPLAIN`)**:
   - Executes user and benchmark SQL queries against DuckDB columnar memory.
   - Retrieves Arrow record batches and generates query execution plans breaking down scan operators and hash joins.
4. **Relay Fallback**:
   - Automatically falls back to in-memory relational relay if WebAssembly workers or Web Workers are restricted by browser policy.

---

## 3. Centralized Store & Referential Integrity

All operational database state is managed through `src/store/databaseContext.tsx`:

* **Normalized Table Data**: Keyed table records map matching schema definitions in `src/data/schema.ts`.
* **Foreign Key Cascade Protection**: Deletion transactions scan `INITIAL_RELATIONS`. If dependent child records exist, deletion is halted with an explicit integrity violation notice.
* **Primary Key Uniqueness**: Validates new inserts to guarantee absence of primary key collisions.

---

## 4. Live Match Simulation Engine (`src/engine/liveMatch.ts`)

A pure functional tick engine running on a 2.8-second cycle:

1. **Active Match Progression**: Randomly assigns round victories between participating teams. First team reaching 13 rounds triggers match victory, status transition to `Completed`, and schedule advancement.
2. **Combat Telemetry & Latency Jitter**: Jitters player ping between 9–32ms with occasional network burst spikes up to 148ms, incrementing kills, assists, and deaths while updating composite combat scores.
3. **Autonomous Anti-Cheat Surveillance**: Detects abnormal latency bursts or statistical jumps to file `Under Review` cases in `ANTI_CHEAT`.
4. **Broadcast Viewership Drift**: Computes random-walk concurrent viewer adjustments across streaming platforms.

---

## 5. Visual Identity & Design System

ArenaDB implements an **Arena Neon HUD** visual identity:
* **Color Palette**: Void Navy (`#070B14`), Neon Cyan (`#22D3EE`), Cyber Magenta (`#E879F9`), Radiant Amber (`#FBBF24`), Tactical Emerald (`#10B981`).
* **Angular Aesthetics**: Diagonal clipped corners (`clip-corner-tl-br`, `clip-corner-all`), cyber scanline overlays, and neon glow accents.
* **Dual Theme Engine**: Native support for **Arena Dark** and **Broadcast Light** themes via `data-theme` attribute.
* **Global Navigation**: Collapsible left `SideRail`, persistent `TopStatusStrip` broadcast marquee, and `Ctrl+K` `CommandPalette`.

---

## 6. Attribution

Originally scaffolded from [`rudy-07/Renewable-Energy-Simulator`](https://github.com/rudy-07/Renewable-Energy-Simulator) under the MIT License. Substantially modified and redesigned into ArenaDB.
