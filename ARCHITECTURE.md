# Device Glance Dashboard Architecture

## Overview
Device Glance Dashboard is a hybrid Electron + React + TypeScript application for ingesting, normalizing, analyzing, and visualizing Windows device inventory data. Current design emerged organically and successfully delivers core value (local file ingestion, Azure Storage sync, filtering, charting, export, per‑device detail). This document describes the existing architecture, identifies gaps, and proposes a roadmap to evolve the project into a more robust, scalable, and contributor‑friendly platform.

## Current Layering (As‑Is)
| Layer | Responsibilities | Representative Modules |
|-------|------------------|------------------------|
| UI / Presentation | React components, Radix UI primitives, Tailwind styling, charts | `src/components/*`, `src/pages/Index.tsx`, `SummaryCharts.tsx`, `DeviceTable.tsx` |
| State / View Composition | Local `useState` / `useMemo` hooks, light usage of React Query (mostly unused currently for remote data) | `App.tsx`, `Index.tsx` |
| Domain / Business Logic | Device parsing, filtering, categorization, mapping, upgrade recommendations | `utils/deviceUtils.ts`, `utils/upgradeUtils.ts`, `chartUtils.ts` |
| Services / Infrastructure | Azure Blob sync, credential encryption/storage (Electron main process) | `public/electron.js`, `dist/electron-services/services/*` (built from `src/services/*`) |
| Cross‑Cutting | Types, utilities, toast system, theming, configuration stubs | `types/*`, `hooks/use-toast.ts`, `ThemeToggle.tsx` |

## Data Flow (Simplified)
1. User uploads JSON files or triggers Azure sync.
2. Files converted to `FileList` (or read from disk via IPC) and passed to `parseInventoryFiles`.
3. Parsing/normalization returns `Device[]` stored in component state.
4. Filters (also in local state) are applied via `filterDevices(devices, filters)` → derived array.
5. Derived array drives charts (`generateChartData`), table, export, and details modal.
6. Azure sync progress events push renderer updates via IPC.

 
## Strengths (Updated After Phase 2 Completion)

- Clear separation between Electron main process and renderer (context isolation enabled; preload exposes curated API).
- Domain logic centralized and now shared between main thread & Web Worker via parser core utilities and Zod validation.
- Safe credential storage using `safeStorage.encryptString` (baseline security retained).
- Simple, readable React component code; composition + controlled parsing UX (unified progress/cancel for upload & sync).
- Modern tooling: Vite, TypeScript, Vitest, Tailwind, Radix UI, TanStack Table, React Query.
- Performance improvements: memoized filtering, virtualized table rendering, worker-based large file parsing with incremental progress events.
- Unified ingestion & validation path (worker + sync downloads both pass through shared parsing + Zod schemas).
- Packaging flow via `electron-builder` already configured.
- Test suite expanded & stable (94 tests: unit, component, integration, E2E).

## Recent Hardening & Performance (Phase 2 Summary — 2025-11)

Foundational stability (Phase 1) plus Phase 2 performance & data-flow improvements:

1. Validation & normalization: Zod `DeviceSchema` integrated across all ingestion paths (upload & sync).
2. Parser resilience: BOM/heuristic encoding detection (UTF-8/UTF-16LE/BE) + robust .NET `/Date(…)/` parsing.
3. Config externalization: Category + generic IP range/location mappings moved to JSON (imported via `resolveJsonModule`).
4. Filtering performance: Memoized filtering logic with stable dependency hash; avoids redundant recomputation.
5. Table performance: Migrated to TanStack Table + virtualization (react-virtual) for scalable rendering when row count is large.
6. Async/state management: React Query introduced for external config fetch & sync status polling (replaces ad-hoc polling/state).
7. Parsing performance: Web Worker offloads large JSON decoding & validation; incremental progress + cancel via AbortController.
8. Unified data-flow: Worker parsing & sync file ingestion share a central parsing/validation core.
9. Controlled UX: Consistent progress & cancel affordances for both manual uploads and sync downloads.
10. Logging & Error handling: Structured renderer logger; main-process rotating file logger; global ErrorBoundary.
11. Test coverage: Expanded to 94 tests validating new worker & React Query behaviors.
12. CI pipeline: Continues to run lint + tests + build; ready for Phase 2 merge.

## Remaining Weaknesses / Technical Debt (Post Phase 2)

1. Directory Structure: Still horizontal; feature-oriented refactor (Phase 3) pending.
2. Ingestion Abstraction: Need `InventorySource` interface (Local/Azure implementations) to decouple IPC & parsing.
3. Error Taxonomy: No structured domain error classes (`DomainError`, `SyncError`).
4. Advanced Observability: No metrics/tracing (parse duration, filter latency) instrumentation yet.
5. Configuration Management: External JSON lacks versioned UI editor & runtime validation lifecycle.
6. Accessibility: Additional keyboard navigation & non-color indicators needed for full WCAG compliance.
7. Security Hardening: No integrity/signature verification of remote blobs.
8. Release Automation: Code signing, notarization, and automated release notes still outstanding.
9. Documentation Depth: Contribution guide & ADR process incomplete.
10. Caching & Cold Start: Devices not persisted (IndexedDB caching not implemented yet).
11. Trend Analytics: Snapshot persistence & historical charts not yet available.
12. Structured Performance Metrics: No baseline stored for bundle size, memory footprint, or throughput.

## Proposed Target Architecture (To‑Be)

Feature‑oriented modular structure:

```text
src/
  features/
    inventory/
      components/
      services/
      hooks/
      model/ (zod schemas, types)
      utils/
    sync/
      ...
    settings/
    reporting/
  core/
    ipc/
    config/
    logging/
    error/
    ui/ (design system wrappers)
```

Key principles:

- Schema-driven domain (Zod) for validation + normalization.
- Explicit domain services (`InventoryIngestionService`, `DeviceFilterService`).
- React Query for async operations (sync status polling, mapping fetch).
- Web Worker(s) for parsing + filtering heavy arrays.
- Unified Error & Logging abstractions.
- Pluggable data sources (Azure, Local, REST, Future connectors).

## Phase 2 Completed Items (Performance Hardening)

1. Memoized filtering (stable dependency hash avoids redundant work).
2. TanStack Table migration + virtualization for large datasets.
3. React Query integration for remote config + sync status polling.
4. Web Worker parsing with progress & cancellation (AbortController).
5. Centralized ingestion validation (shared parser core & Zod schemas).
6. Unified controlled parsing UX (upload & sync flows share progress/cancel UI).
7. Expanded test suite validating new behaviors.

Phase 2 is now considered COMPLETE and ready for merge.

## Medium-Term Enhancements

- Abstract ingestion behind an interface: `InventorySource` (methods: `listFiles()`, `readDevices()`). Implement `LocalFileSource`, `AzureBlobSource`.
- Move sync logic off main thread (background worker process or node child process) with progress events.
- Add time-series trend analysis (persist snapshots with timestamp → charts over time).
- Implement caching layer (persist normalized devices in IndexedDB for faster cold starts).
- Add Settings for parsing options (e.g., date format, storage threshold, Win11 readiness rules).
- Introduce Domain Events (e.g., `DevicesLoaded`, `SyncCompleted`) to decouple UI from services.
- Add Storybook for UI components and visual regression testing.

## Longer-Term / Advanced

- Plugin system for custom device enrichment (scripts that add derived fields).  
- Multi-tenant / profile support (named workspaces with isolated data sets).  
- Export to standardized formats (CSV, Parquet, signed JSON).  
- Remote API mode (headless ingestion server).  
- Sentry/OpenTelemetry integration for crash + performance telemetry.  
- Automated release pipeline (tag → build → notarize/sign → publish).  
- Hardware hash protection / redaction pipeline (security compliance).  

## Suggested Zod Schema (Example Sketch)

```ts
import { z } from 'zod';
export const DeviceSchema = z.object({
  ComputerName: z.string().min(1),
  Manufacturer: z.string().default(''),
  Model: z.string().default(''),
  OSName: z.string().default(''),
  WindowsVersion: z.string().default(''),
  WindowsEdition: z.string().default(''),
  TotalRAMGB: z.coerce.number().nonnegative().default(0),
  TotalStorageGB: z.coerce.number().nonnegative().default(0),
  FreeStorageGB: z.coerce.number().nonnegative().default(0),
  HardDriveType: z.string().default(''),
  TPMVersion: z.string().default(''),
  SecureBootEnabled: z.boolean().default(false),
  JoinType: z.string().default('None'),
  InternalIP: z.string().default(''),
  LastBootUpTime: z.string().default(''),
  HardwareHash: z.string().default(''),
  SerialNumber: z.string().optional(),
  canUpgradeToWin11: z.boolean().default(false),
  issues: z.array(z.string()).default([]),
  location: z.string().optional(),
  CollectionDate: z.string().optional(),
  category: z.string().optional(),
}).passthrough();
```

## Roadmap Phases

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| Foundation (Weeks 1-2) | Quality & Validation | Zod schemas, unit tests, logger, CI pipeline, a11y pass |
| Hardening (Weeks 3-5) | Performance & Structure | Feature directory refactor, TanStack Table + virtualization, worker-based parsing, config externalization |
| Insight (Weeks 6-8) | Advanced Analytics | Snapshot persistence, trend charts, enrichers, domain events |
| Distribution (Weeks 9-10) | Release & Observability | GitHub Actions releases, crash/perf telemetry, contribution guide |
| Extensibility (Future) | Plugins & Integrations | Plugin API, remote sources, enrichment marketplace |

## Metrics to Track

- Parsing time (ms) per 1k devices.
- Memory footprint after ingestion.
- Filter latency (ms) with 50k devices.
- Sync throughput (files/sec) & error rate.
- Test coverage (% lines / branches) target ≥ 80% domain layer.
- Bundle size (renderer) target < 400KB initial JS.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large JSON causes UI freeze | Offload parsing to Web Worker + streaming / incremental yield |
| Unvalidated data introduces XSS or UI breakage | Zod validation + sanitize display (never raw HTML) |
| Electron credential storage fails on some platforms | Fallback to OS keychain (Keychain/Win Credential Vault) abstraction |
| Increasing complexity in sync process | Isolate into service class with lifecycle + abort semantics (already partially present) |
| Feature refactor breaks imports | Perform staged refactor with codemods & export compatibility layer |

## Contribution Guidelines (Draft Points)

- All new domain logic requires schema validation & unit tests.
- Prefer feature folders; avoid adding new flat root directories.
- Use structured logging (`logger.info({...})`) instead of `console.log`.
- Every UI component needs basic a11y checks (focus, ARIA roles, color contrast).
- Open a `docs/decisions/ADR-XXXX.md` for material architectural choices.

## Quick Wins Checklist (Updated)

- [x] Add `ARCHITECTURE.md` (this file) to repo
- [x] Implement Zod schema & integrate into `parseInventoryFiles`
- [x] Introduce renderer + main-process loggers (structured, rotating)
- [x] Add initial CI workflows (lint/test/build/release)
- [x] Refactor table to TanStack + virtualization
- [x] Externalize mappings → `config/device-category.json`, `config/ip-range-generic.json`
- [x] Global `ErrorBoundary`
- [ ] Contribution guide + ADR starter

## Closing Thoughts

The project is a solid MVP with clear utility. By introducing validation, performance safeguards, structured architecture, and contributor tooling, it can evolve into a reference-grade open source inventory analytics platform. The roadmap deliberately balances immediate hygiene tasks with aspirational extensions.

---
Last updated: 2025-11-11 (Phase 2 complete)
<!-- Removed transient tooling artifact lines -->
