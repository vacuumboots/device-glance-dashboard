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

## Strengths
- Clear separation between Electron main process and renderer (context isolation enabled; preload exposes curated API).
- Domain logic centralized in `deviceUtils.ts` (parsing & filtering) enabling reuse; validated via Zod schemas.
- Safe credential storage using `safeStorage.encryptString` (good baseline security).
- Simple, readable React component code; adoption of composition via small components.
- Use of modern tooling: Vite, TypeScript, Vitest, Tailwind, Radix UI.
- Packaging flow via `electron-builder` already configured.

## Recent hardening (2025-11)

Implemented foundational stability & observability:

1. Validation & normalization: Zod `DeviceSchema` integrated in parsing path (type coercion, defaults, malformed guard).
2. Parser resilience: BOM/heuristic encoding detection (UTF-8/UTF-16LE/BE) + robust .NET `/Date(…)/` parsing.
3. Config externalization: Category + generic IP range/location mappings moved to JSON (imported via `resolveJsonModule`).
4. UI & test stability: Stable `data-testid`s, accessible labels, visible summary counts for deterministic assertions.
5. Logging (renderer): Structured logger (`src/core/logging/logger.ts`) with level filtering.
6. Error handling: Global `ErrorBoundary` wrapping `App` for graceful renderer failures.
7. Logging (main process): File-based daily logs with 5MB rotation + IPC `openLogsFolder` + Settings panel button.
8. Multi-OS distribution: Tag-driven CI release pipeline concept defined (macOS/Windows/Linux artifacts).
9. Tests: Unit + integration + E2E suites passing (92 tests) — baseline coverage for parsing & filtering.

## Weaknesses / Technical Debt (Updated)

1. Directory Structure: Still horizontal (components/, utils/, services/); feature-oriented refactor pending (Phase 3).
2. State Management: Reliance on local state; React Query unused → missed caching & refetch semantics.
3. Performance: Filtering not memoized; parsing synchronous on UI thread; table lacks virtualization.
4. Coupling / IPC: Synthetic `FileList` construction for synced files — needs ingestion abstraction service.
5. Error Handling: Global boundary added, but no structured error taxonomy (`DomainError`, `SyncError`) yet.
6. Validation Coverage: IPC sync path not yet unified through schema validation service.
7. Testing Gaps: Limited IPC/main-process logger & sync service tests; upgrade recommendation logic lightly covered.
8. Observability Metrics: Structured logging in place, but no performance metric collection or tracing.
9. Configuration Management: External JSON present — lacks UI editor, versioning, validation lifecycle.
10. Accessibility: Color indicators still rely on visual cues; further ARIA improvements & keyboard workflows needed.
11. Security: No integrity/signature verification of remote blobs; potential injection of unexpected fields.
12. Release / CI: Signing/notarization & automated release notes not implemented.
13. Documentation Depth: Missing contribution guide & ADR process formalization.
14. Scalability: No Web Worker / streaming parsing for very large datasets.

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

## Immediate Actionable Improvements (Phase 2 Kickoff)

Remaining low-risk tasks to start Phase 2 (performance hardening):

1. Memoize filtering via `useMemo` + stable dependency hash of filters.
2. Introduce TanStack Table + virtualization (`react-virtual`) for large dataset rendering.
3. Add React Query for remote config fetch + sync status polling.
4. Offload parsing to a Web Worker (structured message protocol + incremental progress events).
5. Centralize ingestion validation (all IPC & worker outputs pass through schema service).
6. Begin collecting performance metrics (filter latency, parse time) via lightweight timing wrapper.
7. Start contribution guide & ADR template (`docs/adr/ADR-0001.md`).
8. Enhance remaining a11y (non-color indicators, keyboard navigation for table & filters).

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
- [ ] Refactor table to TanStack + virtualization
- [x] Externalize mappings → `config/device-category.json`, `config/ip-range-generic.json`
- [x] Global `ErrorBoundary`
- [ ] Contribution guide + ADR starter

## Closing Thoughts

The project is a solid MVP with clear utility. By introducing validation, performance safeguards, structured architecture, and contributor tooling, it can evolve into a reference-grade open source inventory analytics platform. The roadmap deliberately balances immediate hygiene tasks with aspirational extensions.

---
Last updated: 2025-11-11 (Phase 2 kickoff)
<!-- Removed transient tooling artifact lines -->
