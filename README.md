<div align="center">

# ArenaDB: Tournament Operations Database Lab
### High-Throughput Relational Engine, Client-Side DuckDB-Wasm Analytics, Live Telemetry Stream & Oracle 19c Workbench

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![DuckDB-Wasm](https://img.shields.io/badge/DuckDB--Wasm-1.33-FFF000?style=flat-square&logo=duckdb&logoColor=black)](https://duckdb.org/docs/api/wasm/overview)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)

<p align="center">
  A state-of-the-art competitive e-sports tournament operations database simulator and analytical engineering workbench. Built with React 19, TypeScript, client-side <strong>DuckDB-Wasm</strong>, and an <strong>Arena Neon HUD</strong> design system. Features live match combat telemetry, interactive 3NF schema topology with orthogonal connectors and minimap, 3-pane Data Vault with cascade dependency inspection, visual playoff bracket tree, anti-cheat Kanban surveillance desk, and an emulated Oracle 19c PL/SQL lab.
</p>

[Scoring Academy Guide](docs/SCORING_GUIDE.md) | [Database Schema Docs](docs/DATABASE_SCHEMA.md) | [Analytical Queries](docs/ANALYTICAL_QUERIES.md) | [System Architecture](docs/ARCHITECTURE.md) | [Deployment Guide](docs/DEPLOYMENT.md)

---

</div>

## Key Operations Modules

### 0. Scoring Academy (Tactical Combat Score & Analytics Engine)
* **Comprehensive 13-Chapter Curriculum**: Teaches the mathematics of Round Combat Score (RCS), Average Combat Score (ACS), ADR, KAST%, and the ArenaDB Impact Index.
* **Harmonic Aggregation Proof**: Demonstrates why averaging map ACS causes statistical distortion across asymmetric round lengths and provides the true weighted tournament formula $\frac{\sum \text{TotalCombatScore}}{\sum \text{RoundsPlayed}}$.
* **Official Performance Benchmark Bands**: Standardized brackets calibrated from international Tier-1 VCT competition (`Low` <150 to `Elite` 300+).
* **5 Interactive Embedded Calculators**:
  1. *Round Combat Score Builder*: Interactive damage slider, enemies-alive dropdowns (5 to 1), multi-kill escalation (+50 to +125), and non-damaging assist toggles with animated breakdown.
  2. *Map ACS & Efficiency Simulator*: Full map stat simulator calculating ACS, ADR, K/D, KDA, and composite ArenaDB Impact Index.
  3. *Real Champions 2026 Athlete Lookup*: Per-map performance records and calculation delta verification across 80 athletes.
  4. *Series ACS & Map Variance Analyzer*: Match fixture viewer comparing true series ACS with arithmetic map means.
  5. *"What Changed My ACS?" Sensitivity Panel*: Sliders calculating marginal ACS uplift per point of damage vs entry frags.

### 1. Command Center & Hero Scoreboard
* **Tournament Spotlight Banner**: Real-time overview of VALORANT Champions 2026 Shanghai ($2,250,000 USD Purse, 16 Teams, Champion: LOUD) with direct link to the Scoring Academy.
* **Hero Scoreboard Banner**: Real-time broadcast scoreboard showcasing live match combat telemetry, round score progression towards 13, peak multi-platform viewership, and arena venue metadata.
* **Combat Frag Leaderboard**: Top athletes ranked by True Tournament ACS with an active 40+ rounds endurance filter toggle.
* **Asymmetric Bento Grid**:
  * **Tournament Pace Radial Gauge**: Circular SVG progress gauge showing completed fixtures versus remaining bracket stages.
  * **Broadcast Audience Sparkline**: Dynamic SVG gradient sparkline tracking Twitch/YouTube stream viewership drift and latency jitter.
  * **Combat Frag Leaderboard**: Top athletes ranked by mean combat frag score, kill totals, and K/D ratio.
  * **Subsystem Relational Matrix**: 3NF health monitor with row counts and status indicators across all 5 operational categories.

### 2. Bracket & Fixture Schedule
* **Championship Elimination Tree**: Interactive visual bracket routing matches through Quarterfinals (BO1), Semifinals (BO3), and Grand Finals (BO5).
* **Live Fixture Grid**: Sortable and filterable master schedule by tournament stage (`STG01` Swiss, `STG02` Groups, `STG03` Playoffs, `STG04` Grand Finals), assigned certified referees, scheduled times, and match outcomes.
* **Direct Telemetry Links**: Jump directly from any match card to its associated records in the Data Vault.

### 3. Data Vault (3-Pane Explorer & Slide-Out Drawer)
* **3-Pane Split Architecture**:
  * *Left Rail*: Categorized subsystem accordion with table row badges.
  * *Center Grid*: High-density sortable and searchable data grid with pagination, quick search, and CSV export.
  * *Right Pane*: **Child Record Inspector** displaying all child records linked to the selected row with cascade dependency checks.
* **Record Drawer**: Smooth slide-out side drawer for inserting and editing records with foreign-key dropdown pickers and primary-key collision validation.
* **Cascade Delete Protection**: Strict referential integrity enforcement preventing accidental orphaned records.

### 4. Schema Map (Interactive ERD)
* **Orthogonal Circuit Connectors**: Stepped right-angle circuit connectors with neon cyan glow and cardinality badges (`1:N`, `1:1`).
* **Minimap HUD**: Live minimap in the bottom-right corner with real-time viewport positioning and canvas tracking.
* **Subsystem Category Filtering**: Filter between `Organization`, `Match Telemetry`, `Finance & Results`, `Broadcast & Audience`, and `Integrity & Officials`.
* **Oracle 19c DDL Generator**: Export production-ready DDL schema with primary and foreign key constraints and copy-to-clipboard functionality.

### 5. Query Lab & DuckDB-Wasm Analytics Engine
* **DuckDB-Wasm Columnar OLAP**: Client-side execution of complex SQL queries directly in the browser using WebAssembly.
* **11 Pre-Engineered Benchmarks**:
  * Single-table lookups, group aggregations, and multi-table joins.
  * Nested and correlated subqueries calculating above-average performances.
  * Disciplinary union reports isolating sanctioned athletes and organizations.
  * Relational view queries (`CREATE VIEW TOURNAMENT_MATCH_DETAILS` and `CREATE VIEW PLAYER_PERFORMANCE_DETAILS`).
* **Execution Profiler**: In-depth `EXPLAIN` query breakdown showing scan operators, hash joins, and cost estimates.
* **Tabular Results & CSV Export**: Instant copy to clipboard in CSV format.

### 6. PL/SQL Lab (Oracle 19c Workbench)
* **10 Procedural Units**: Anonymous blocks, stored procedures, and functions with dynamic parameter inputs.
* **Simulated DBMS_OUTPUT Console**: Real-time terminal output with execution timestamps and server messages.
* **Database Commit Actions**: Procedures write directly into the in-memory database with integrity checks.

### 7. Integrity Desk (Surveillance & Anti-Cheat)
* **4-Column Kanban Adjudication Board**: Track cases across `Under Review`, `Cleared`, `Warning / Fine`, and `Suspended / Banned`.
* **One-Click Adjudication**: Transition cases between statuses instantly updating the registry.
* **Telemetry Outlier Scatter Plot**: Visual audit plotting player latency against combat score with automated anomaly detection threshold flags.

---

## Global HUD Features

* **Persistent Top Strip**: Scrolling marquee broadcast ticker showing live match status, peak viewership, DuckDB status, and active anomaly alerts.
* **Command Palette (`Ctrl+K` / `Cmd+K`)**: Instant search and navigation across all 7 views, 11 database tables, and system controls.
* **Theme Toggle**: Switch between **Arena HUD** (Void Navy & Neon) and **Broadcast** (Clean high-contrast Light Theme).
* **Live Telemetry Engine**: Autonomous 2.8s tick engine simulating round progression, kills, assists, deaths, latency jitter, and stream viewer drift.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/rudy-07/Renewable-Energy-Simulator.git
cd Renewable-Energy-Simulator

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build

# Run linter
npm run lint
```

---

## Attribution & License

* Originally scaffolded from [`rudy-07/Renewable-Energy-Simulator`](https://github.com/rudy-07/Renewable-Energy-Simulator) under the **MIT License**.
* Substantially modified and redesigned into **ArenaDB** with DuckDB-Wasm columnar analytics, Arena HUD design system, and global e-sports tournament operations architecture.
* Distributed under the [MIT License](LICENSE).
