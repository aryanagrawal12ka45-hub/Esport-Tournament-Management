# 🤝 Contributing to Renewable Energy DB Simulator

Thank you for your interest in contributing to the **Renewable Energy DB Simulator**! We welcome contributions from developers, database architects, and clean-tech enthusiasts of all skill levels.

---

## 🧭 Code of Conduct

This project is governed by the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🛠️ Development Workflow

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Git**

### 2. Fork & Local Setup
```bash
# 1. Clone your fork
git clone https://github.com/<your-username>/Renewable-Energy-Simulator.git
cd Renewable-Energy-Simulator

# 2. Install dependencies
npm install

# 3. Start local Vite development server
npm run dev
```

The application will be live at `http://localhost:5173`.

### 3. Branching Conventions
Create a descriptive branch for your work:
- `feat/add-carbon-trading-queries`
- `fix/erd-connector-anchor-calculation`
- `docs/clarify-asof-join-spec`
- `perf/virtualize-table-rows`

---

## 🧪 Quality Standards & Code Validation

Before opening a pull request, run all verification checks locally:

```bash
# 1. Type check and production build
npm run build

# 2. Oxlint static code analysis
npm run lint
```

### Coding Conventions:
- **TypeScript**: Strict typing without `any` where avoidable. Use interfaces in `src/data/databaseData.ts` for domain models.
- **Styling**: Maintain the established metallic obsidian palette (`#000000`, silver wafers, subtle border highlights). Avoid bright candy neon palettes or saturated purple gradients.
- **Responsiveness**: Ensure any new UI component functions seamlessly across mobile viewports ($< 768px$) and desktop ($> 1200px$).
- **Performance**: Use memoization (`useMemo`, `useCallback`) for heavy calculations such as geometric Bezier path rendering.

---

## 📥 Submitting a Pull Request (PR)

1. Commit your changes with a clear commit message:
   ```bash
   git commit -m "feat(queries): add duckdb spatial geo-indexing benchmark"
   ```
2. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
3. Open a Pull Request on GitHub against the `main` branch.
4. Fill out the PR description with:
   - Summary of changes
   - Context or motivation
   - Screenshots or screencasts (if modifying UI)
   - Testing steps performed

---

## 💡 Ideas for Contributions
- [ ] Add more analytical SQL queries (e.g., DuckDB spatial geo-fencing, geospatial distance to substations)
- [ ] Export schema as PostgreSQL `.sql` migration files or SQLite dump
- [ ] Add CSV upload to import custom facility telemetry
- [ ] Add dark/light mode toggle while preserving metallic styling
- [ ] Integrate WebAssembly DuckDB (`duckdb-wasm`) for in-browser client-side SQL execution

---

## 📜 License
By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
