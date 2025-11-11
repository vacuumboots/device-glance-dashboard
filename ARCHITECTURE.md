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

- Validation and normalization: Integrated Zod `DeviceSchema` into the parsing path to coerce types, set defaults, and guard against malformed input.
- Parser resilience: Added BOM-/heuristic-based encoding detection with safe decoding for UTF-8/UTF-16LE/BE and robust .NET `/Date(…)/` parsing.
- Config externalization: Device model→category and generic IP range→location mappings moved to JSON and imported via `resolveJsonModule`.
- UI and a11y/test stability: Stable `data-testid`s and accessible labels; visible summary counts exposed for tests.
- Multi-OS distribution: Tag-driven CI releases with standardized artifact naming for macOS/Windows/Linux.
- Tests: Integration and E2E tests updated; full suite passes locally and in CI.

## Weaknesses / Technical Debt

1. Directory Structure: Mixed horizontal (components/, utils/, services/) rather than feature‑oriented; grows harder to navigate as features expand.
1. State Management: Heavy reliance on local `useState` and `useMemo`; React Query initialized but unused → missed caching/opportunistic refetch potential.
1. Performance: Full array filtering on every render without memoization; large file parsing done serially with full in-memory materialization (no streaming/Workers); table uses manual pagination/sort and lacks virtualization.
1. Coupling / IPC: Renderer constructs a synthetic `FileList` from synced files; should be abstracted behind a domain ingestion service.
1. Error Handling: Inconsistent try/catch; no unified error boundary or structured error types (e.g., `DomainError`, `SyncError`).
1. Validation / Data Integrity: Partially addressed via Zod; ensure all ingestion paths (including IPC sync) pass through schemas and unify defaults.
1. Testing Gaps: Limited unit tests for core domain functions; no tests for IPC flows/main-process services or upgrade recommendation logic.
1. Observability / Logging: Ad hoc `console.log`; no structured logger, log levels, or performance metrics.
1. Configuration: Partially addressed via JSON externalization; add a UI/editor and a versioning strategy for configs.
1. Accessibility (a11y): Table interactions and status badges need clearer semantics (roles, aria-*). Color-only indicators persist.
1. Security: No integrity check on downloaded blobs; risk if malicious JSON adds unexpected keys that surface in UI.
1. Release / CI: CI exists for tests/builds and release packaging; extend with signing/notarization and automated release notes.
1. Documentation: Architecture doc present; add contribution guide and ADRs.
1. Scalability: Single-thread parsing; no worker for CPU-intensive tasks (e.g., thousands of large inventory files).

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

## Immediate Actionable Improvements (Low Risk)

1. Memoize filtering via a stable hash of `filters` (e.g., `JSON.stringify(filters)` in `useMemo`).
1. Add an `ErrorBoundary` component wrapping `App`.
1. Implement a minimal logger utility (`core/logging/logger.ts`) with level enum & structured output.
1. Add unit tests for: `parseInventoryFiles`, `filterDevices`, `determineLocation`, `getUpgradeRecommendations`.
1. Enhance README with a contribution guide and link to decision records (ADRs).
1. Replace manual table pagination & sorting with TanStack Table + optional virtualization (`react-virtual` or `@tanstack/react-table` + `react-virtual`).
1. Improve a11y: add `role="row"`, `aria-sort`, and descriptive text for color badges (e.g., `aria-label`).

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

## Quick Wins Checklist

- [x] Add `ARCHITECTURE.md` (this file) to repo
- [x] Implement Zod schema & integrate into `parseInventoryFiles`
- [ ] Introduce logger
- [x] Add initial CI workflows (lint/test/build/release)
- [ ] Refactor table to TanStack + virtualization
- [x] Externalize mappings → `config/device-category.json`, `config/ip-range-generic.json`

## Closing Thoughts

The project is a solid MVP with clear utility. By introducing validation, performance safeguards, structured architecture, and contributor tooling, it can evolve into a reference-grade open source inventory analytics platform. The roadmap deliberately balances immediate hygiene tasks with aspirational extensions.

---
_Last updated: 2025-11-11_
GitHub Copilot: Created 6 todos

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/main.tsx)
Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/App.tsx)
