# 🚀 Device Glance Dashboard: Architectural Roadmap (Git Commit Plan)

This document outlines the engineering roadmap to address the architecture assessment, focusing on stability, performance, and structure. Changes are sequenced to minimize risk and ensure a robust platform foundation.

---

## 🎯 High-Level Strategy

1. **Phase 1 (Foundation):** Focus on essential quality-of-life improvements, observability, and testing. (Low Risk)
2. **Phase 2 (Hardening):** Address major performance bottlenecks (filtering, parsing, table rendering). (Medium Risk, High Reward)
3. **Phase 3 (Structure & Extensibility):** Implement the feature-oriented refactor, caching, and advanced features. (High Risk/Impact)

---

## 🏗️ Phase 1: Foundation & Stability

Status: COMPLETE ✅ — safe to tag 1.4.0 on next release; until then, keep versions at 1.3.x

**Goal:** Establish core quality, testing, and observability.
**Branch:** All work is done sequentially on the **`feature/stabilization-v1`** branch.

| # | Commit Type | Subject | Description of Work |
| :-: | :--- | :--- | :--- |
| **1** | `feat(core)` | **Implement minimal structured logger utility** | Introduce `src/core/logging/logger.ts` with level enums (`info`, `warn`, `error`) and structured output. Replace ad hoc `console.log` calls in core utilities. |
| **2** | `fix(core)` | **Add global ErrorBoundary component** | Create `src/core/error/ErrorBoundary.tsx` and wrap the primary `<App>` component to gracefully handle UI-related runtime errors. |
| **3** | `test(domain)` | **Add unit tests for core utilities** | Write robust unit tests (using Vitest) for key domain functions: `parseInventoryFiles`, `filterDevices`, `determineLocation`, and `getUpgradeRecommendations`. |
| **4** | `feat(a11y)` | **Enhance table accessibility semantics** | Update `DeviceTable.tsx` to include necessary **ARIA roles** and use descriptive `aria-label`s on status badges to satisfy a11y requirements. |
| **5** | `feat(main)` | **Add main-process file logger with rotation + log access** | Implement `public/main-logger.js` with daily files and 5MB rotation; integrate into `public/electron.js`, add IPC handler to open logs folder, and expose via `preload` + types. |
| **6** | `docs(logging)` | **Document logging & diagnostics** | Add a Logging & Diagnostics section to `README.md` (paths, rotation behavior, and how to open the logs folder from the UI). |
| **MERGE** | `merge` | **Merge: feature/stabilization-v1 into main** | Review and merge after confirming all tests pass and stability is maintained. |

---

## 🚀 Phase 2: Hardening & Performance (Est. 2.5 Weeks)

Once complete, this will be 1.5.0. Until all is complete, keep versions to 1.4.x

**Goal:** Eliminate performance bottlenecks and introduce efficient state management.
**Branch:** All work is done sequentially on the **`feature/performance-rearchitecting`** branch.

| # | Commit Type | Subject | Description of Work |
| :-: | :--- | :--- | :--- |
| **6** | `perf(filtering)`| **Memoize device filtering logic** | Implement a `useMemo` wrapper around the `filterDevices` function. Use a stable dependency hash (e.g., `JSON.stringify(filters)`) to prevent unnecessary re-filtering on every render. |
| **7** | `feat(table)` | **Migrate to TanStack Table with virtualization** | Refactor `DeviceTable.tsx` to use **TanStack Table** for robust sorting/pagination and integrate a row virtualization library (e.g., `react-virtual`) for handling large data sets. |
| **8** | `refactor(state)`| **Introduce React Query for remote data** | Integrate and initialize **React Query**. Use it to manage fetching/caching of external configuration files and to poll IPC for Azure sync status, replacing local state polling. |
| **9** | `feat(parsing)` | **Offload inventory parsing to Web Worker** | Create and implement a **Web Worker** dedicated to running the CPU-intensive `parseInventoryFiles` function, preventing UI thread blockage during large ingestion. |
| **10** | `refactor(data-flow)`| **Unify ingestion and IPC validation** | Ensure all paths that generate device data (Web Worker, IPC sync) are routed through a single service point that enforces **Zod Schema validation** and applies unified defaults. |
| **MERGE** | `merge` | **Merge: feature/performance-rearchitecting into main** | Verify significant performance improvements (filtering, parsing) and merge. |

---

## 🧱 Phase 3: Structure & Extensibility (Est. 4–5 Weeks)

Once complete, this will be 1.5.0 Until all is complete, keep verisons to 1.4.x

**Goal:** Implement the feature-oriented structure, advanced caching, and system-level features.
**Branch:** All work is done sequentially on the **`feature/modular-structure`** branch.

| # | Commit Type | Subject | Description of Work |
| :-: | :--- | :--- | :--- |
| **11** | `refactor(architecture)`| **Transition to feature-oriented directory structure** | **Large Refactor:** Move all existing files into the new `src/features/*` (e.g., `inventory/`, `sync/`) and `src/core/*` structure. Update all imports. |
| **12** | `refactor(domain)`| **Abstract inventory ingestion service** | Define the `InventorySource` interface. Implement concrete `LocalFileSource` and `AzureBlobSource` services to decouple the UI from data access logic. |
| **13** | `feat(caching)` | **Persist devices in IndexedDB for cold starts** | Implement an IndexedDB persistence layer. Modify the core data retrieval to load normalized devices from the cache upon application startup. |
| **14** | `feat(observability)`| **Integrate structured error types** | Define and implement custom, structured error classes (`SyncError`, `DomainError`). Update services to throw these types and ensure `ErrorBoundary` handles them correctly. |
| **15** | `feat(settings)` | **Introduce UI for configuration management** | Create the `src/features/settings/` module. Build a UI/editor for users to manage and persist externalized configuration data (e.g., mappings, rules). |
| **16** | `feat(ipc)` | **Move Azure sync logic to a background Node child process** | Refactor the Azure sync service to run entirely within a separate **Node child process**, communicating status and errors via IPC to enhance stability and free the main thread. |
| **17** | `feat(trends)` | **Implement device snapshot persistence and trend charts** | Add logic to create and persist time-series snapshots of device metrics. Create a new `src/features/reporting/` view to visualize trends over time. |
| **18** | `ci(release)` | **Implement automated signing and notarization pipeline** | Update CI workflows (GitHub Actions) to include **automated code signing** and **macOS notarization** for release artifacts via `electron-builder`. |
| **MERGE** | `merge` | **Merge: feature/modular-structure into main** | Final merge. Project structure and features complete. |

### ✅ Phase 1 Completed Items

- [x] feat(core): implement minimal structured logger utility — Introduce src/core/logging/logger.ts with levels; replace console.log in utilities.
- [x] fix(core): add global ErrorBoundary component — Implement src/core/error/ErrorBoundary.tsx and wrap App to gracefully handle UI runtime errors.
- [x] test(domain): add unit tests for core utilities — parseInventoryFiles, filterDevices, determineLocation, getUpgradeRecommendations.
- [x] feat(a11y): enhance table accessibility semantics — Add ARIA roles and descriptive aria-labels.
- [x] feat(main): add main-process file logger with rotation + open-logs-folder — Implement public/main-logger.js, integrate into electron.js, IPC handler + preload exposure, UI button in Settings.
- [x] docs(logging): add README Logging & Diagnostics section — Document log file locations, rotation rules, and access path.

### 🟡 Phase 2 In-Progress / Pending

- [ ] perf(filtering): memoize device filtering logic — useMemo + dependency hash (JSON.stringify(filters)).
- [ ] feat(table): migrate to TanStack Table with virtualization — replace manual table logic; add row virtualization.
- [ ] refactor(state): introduce React Query for remote data — manage async config fetching + sync polling.
- [ ] feat(parsing): offload inventory parsing to Web Worker — move parseInventoryFiles off main thread.
- [ ] refactor(data-flow): unify ingestion and IPC validation — central schema enforcement.

### 🔜 Phase 3 Backlog (Not Started)

- [ ] refactor(architecture): transition to feature-oriented directory structure — Move into `src/features/*` and `src/core/*`; update imports.
- [ ] refactor(domain): abstract inventory ingestion service — InventorySource interface + LocalFileSource + AzureBlobSource.
- [ ] feat(caching): persist devices in IndexedDB for cold starts — Cache normalized devices for faster cold starts.
- [ ] feat(observability): integrate structured error types — DomainError, SyncError, unified handling.
- [ ] feat(settings): introduce UI for configuration management — Manage externalized JSON mappings & rules with versioning.
- [ ] feat(ipc): move Azure sync logic to a background Node child process — True background sync for stability.
- [ ] feat(trends): implement device snapshot persistence and trend charts — Time-series metrics + reporting view.
- [ ] ci(release): implement automated signing and notarization pipeline — Add build signing + macOS notarization.
