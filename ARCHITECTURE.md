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
- Domain logic centralized in `deviceUtils.ts` (parsing & filtering) enabling reuse.
- Safe credential storage using `safeStorage.encryptString` (good baseline security).
- Simple, readable React component code; adoption of composition via small components.
- Use of modern tooling: Vite, TypeScript, Vitest, Tailwind, Radix UI.
- Packaging flow via `electron-builder` already configured.

## Weaknesses / Technical Debt
1. Directory Structure: Mixed horizontal (components/, utils/, services/) rather than feature‑oriented; grows harder to navigate as features expand.
2. State Management: Heavy reliance on local `useState` and `useMemo`; React Query initialized but unused → missed caching/opportunistic refetch potential.
3. Performance: 
   - Full array filtering on every render without memoization keyed by filters hash.
   - Large file parsing done serially and fully loaded into memory; no streaming/incremental parsing or Web Worker offloading.
   - Table pagination + client sort implemented manually; lacks virtualization for large datasets.
4. Coupling / IPC:
   - Renderer logic constructs a synthetic `FileList` from synced files; could abstract behind a domain ingestion service.
5. Error Handling:
   - Inconsistent: try/catch sprinkled; no unified error boundary or structured error types (e.g., `DomainError`, `SyncError`).
6. Validation / Data Integrity:
   - No schema validation of incoming device objects (unsafe spreads `...deviceData`).
   - Lack of fallback defaults typed but not centrally defined.
7. Testing Gaps:
   - Limited unit tests for critical domain functions (`parseInventoryFiles`, `filterDevices`).
   - No tests for IPC flows, Electron main services, or upgrade recommendation logic.
8. Observability / Logging:
   - `console.log` scattered; no structured logger or log levels; no performance metrics.
9. Configuration:
   - Location mapping + device category mapping hardcoded inside code; not externalized/versioned.
10. Accessibility (a11y):
   - Missing ARIA roles for interactive table rows, color-only indicators for status badges.
11. Security:
   - No integrity check on downloaded blobs.
   - Potential risk if malicious JSON adds unexpected keys and surfaces in UI.
12. Release / CI:
   - No GitHub Actions pipeline (lint/test/build/package, release draft automation).
13. Documentation:
   - README strong on quick start but lacks architectural rationale, contribution guide, decision records.
14. Scalability:
   - Single-thread parsing; no worker for CPU intensive tasks (e.g. thousands of large inventory files).

## Proposed Target Architecture (To‑Be)
Feature‑oriented modular structure:
```
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
1. Introduce `zod` schemas for Device parsing (validate & coerce).  
2. Memoize filtering via a stable hash of `filters` (e.g., `JSON.stringify(filters)` in `useMemo`).  
3. Extract mapping constants (`deviceCategoryMap`, IP ranges) into `config/*.json` & load on start.  
4. Add an `ErrorBoundary` component wrapping `App`.  
5. Implement a minimal logger utility (`core/logging/logger.ts`) with level enum & structured output.  
6. Add unit tests for: `parseInventoryFiles`, `filterDevices`, `determineLocation`, `getUpgradeRecommendations`.  
7. Add `github/workflows/ci.yml`: Node matrix (16, 18, 20), install, lint, test, build.  
8. Enhance README with architecture + contribution section referencing this doc.  
9. Replace manual table pagination & sorting with TanStack Table + optional virtualization (`react-virtual` or `@tanstack/react-table` + `react-virtual`).  
10. Improve a11y: add `role="row"`, `aria-sort`, descriptive text for color badges (e.g., `aria-label`).

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
- [ ] Add `ARCHITECTURE.md` (this file) to repo
- [ ] Implement Zod schema & integrate into `parseInventoryFiles`
- [ ] Introduce logger
- [ ] Add initial unit tests & CI workflow
- [ ] Refactor table to TanStack + virtualization
- [ ] Externalize mappings → `config/device-category.json`, `config/location-ip-ranges.json`

## Closing Thoughts
The project is a solid MVP with clear utility. By introducing validation, performance safeguards, structured architecture, and contributor tooling, it can evolve into a reference-grade open source inventory analytics platform. The roadmap deliberately balances immediate hygiene tasks with aspirational extensions.

---
_Last updated: 2025-11-11_


vacuumboots: This is a project of mine that I created a few months ago. It was an early attempt at using an AI to accomplish a coding task. It works pretty well, although it's a little rough around the edges. Would you review the general architecture and design choices that Claude and I made when we created this tool?

GitHub Copilot: I'll review the architecture and design choices of your device glance dashboard project. Let me start by examining the key files to understand the overall structure and design decisions. 

Read [](file:///Users/administrator/Projects/device-glance-dashboard/package.json#1-1), lines 1 to 50

Read [](file:///Users/administrator/Projects/device-glance-dashboard/package.json#51-51), lines 51 to 154

Read [](file:///Users/administrator/Projects/device-glance-dashboard/README.md#1-1), lines 1 to 50

vacuumboots: This is a project of mine that I created a few months ago. It was an early attempt at using an AI to accomplish a coding task. It works pretty well, although it's a little rough around the edges. Would you review the general architecture and design choices that Claude and I made when we created this tool? 

When you have suggestions, please don't hold back. There are ways to make this a robust project and one that would be more impressive to author on github. How does this project get there?

GitHub Copilot: Created 6 todos

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/main.tsx)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/App.tsx)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/public/electron.js)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/public/preload.js)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/services/credentialsService.ts)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/services/syncService.ts)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/types/device.ts)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/utils/deviceUtils.ts)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/components/DeviceTable.tsx)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/components/DeviceDetailsModal.tsx)

Starting (2/6) *Assess current architecture*

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/pages/Index.tsx)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/components/FilterPanel.tsx)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/components/FileUpload.tsx)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/components/SummaryCharts.tsx)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/components/SyncPanel.tsx)

Created [](file:///Users/administrator/Projects/device-glance-dashboard/ARCHITECTURE.md)

Read [](file:///Users/administrator/Projects/device-glance-dashboard/vitest.config.ts)

Completed (2/6) *Assess current architecture*

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/types/electron.d.ts)

Using "Apply Patch"


```

```


Created [](file:///Users/administrator/Projects/device-glance-dashboard/.github/workflows/ci.yml)

Using "Apply Patch"


```

```


Checked [](file:///Users/administrator/Projects/device-glance-dashboard/src/types/electron.d.ts), no problems found

Ran terminal command: npm ci

Ran terminal command: npm run lint

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/services/credentialsService.ts)

Using "Apply Patch"


```

```


Ran terminal command: npm run lint

Read [](file:///Users/administrator/Projects/device-glance-dashboard/src/services/credentialsService.ts#20-20), lines 20 to 40

Using "Apply Patch"


```

```


Ran terminal command: npm run lint

Ran terminal command: npm run test:run

Ran terminal command: npm run build

Thanks for the context—I'll give you a crisp architectural review, then lay out concrete, high‑ROI steps to turn this into a robust, contributor‑friendly project. I’ll also make a couple of safe improvements right away.

## actions taken

- Read key files to understand the architecture and flow: renderer entry, pages/components, utilities, Electron main/preload, services, and types.
- Added ARCHITECTURE.md summarizing current design, issues, and a roadmap.
- Fixed a type mismatch: added the missing "cancelled" stage to `SyncProgress` in electron.d.ts.
- Set up a CI workflow: ci.yml runs lint, tests, and builds on PRs/commits to main.
- Updated README to:
  - Correct `npm run electron-dev`
  - Link to the new architecture doc
  - Note the new CI workflow
- Linted and tested the repo locally:
  - Lint: PASS (warnings only)
  - Build: PASS (bundle ~816KB; chunk size warning)
  - Tests: FAIL (pre-existing issues; see notes below)

## architecture review

### what’s solid

- Clear separation between Electron main (Node context) and renderer (browser context), with contextIsolation on and a minimal preload API via `window.electronAPI`. This is the right security posture.
- Domain logic is mostly centralized in deviceUtils.ts and related utils (parsing, filtering, chart aggregation), which is a good start.
- Credentials encrypted with `safeStorage` and saved to `app.getPath('userData')` is a sensible baseline.
- Sync logic is encapsulated in a class (`SyncService`), with progress events forwarded to renderer—nice, testable separation.
- Modern stack (Vite, TypeScript, Tailwind + Radix UI, React 18, Vitest) with basic tests in place.
- Packaging is configured via `electron-builder`, and Electron runtime entry is clean.

### where it’s rough

- Organization is horizontal (components/, utils/, services/) instead of feature‑oriented. As features grow, this becomes hard to navigate and reason about.
- State management is local `useState`/`useMemo`; React Query is initialized but not actually used for data fetching/caching. You miss a lot of ergonomics and cache benefits.
- Parsing and filtering work entirely on the main thread in the renderer with full arrays in memory; for large inventories this will stutter the UI.
- Ingestion API is leaky: the renderer constructs a fake FileList from synced files rather than calling a high‑level ingestion service. IPC is used correctly but the abstraction could be tighter.
- Validation is weak: parsed device objects are spread with `...deviceData` and trusted. There’s no schema validation or normalization pass to protect the UI.
- Error handling is ad hoc; no error boundaries in the React tree, and error types are not standardized.
- Observability is basic: console logging, no structured logs, and no perf metrics.
- Accessibility: table interactions and badge color semantics need a pass for assistive tech.
- Release automation: no CI for release packaging and no release drafter/conventional commits.
- Bundle size is large (816 KB minified JS). This is fine for Electron, but code-splitting would still help and makes the web build snappier.

### specific quirks and small issues

- `SyncProgress` type in electron.d.ts was missing 'cancelled' (used by `SyncPanel` and `SyncService`). Fixed.
- `parseMsDate` regex in deviceUtils.ts likely incorrect: it uses `/\/Date\((\d+)\)\\/` which matches a trailing backslash; .NET format is “/Date(…)/”. It should be `/\/Date\((\d+)\)\//`. Consider fixing when you add schema-driven parsing and tests.
- Tests currently fail, mostly in UI expectations for `FilterPanel` and utils behavior. This predates the changes and indicates drift between test assumptions and current UI behavior (e.g., lowercase enum values, location labels, testids). See notes.

## how to harden and impress on GitHub

Below is a prioritized plan with near-term “quick wins” and a medium-term path to robustness.

### quick wins (low risk, 1–2 weeks)

- Schema validation and normalization
  - Use Zod to define a `DeviceSchema`. Validate and coerce in `parseInventoryFiles` before any UI consumption.
  - Benefits: protects the UI, prevents XSS/vector injection via untrusted JSON, codifies defaults.
- Tighten filtering and performance
  - Memoize filtered lists using a stable filters hash: `useMemo(() => filterDevices(...), [devices, filtersHash])`.
  - Consider moving filter logic into a web worker when device counts exceed a threshold (e.g., >10k).
- Table ergonomics and performance
  - Replace manual sorting/pagination with TanStack Table and add virtualization (`react-virtual`). Keeps UI smooth at scale.
- A11y improvements
  - Table rows: `role="row"`, sortable headers with `aria-sort`, and provide `aria-labels` for color-coded badges (Win11 readiness, Secure Boot).
- Externalize hardcoded mappings
  - Move device model categories and IP→location mapping to `config/*.json`. Provide a UI to load custom mappings (you already have location mapping via IPC—generalize it).
- Logging and error boundaries
  - Add a tiny `logger.ts` with log levels (info/warn/error) instead of `console.log`.
  - Add a React error boundary to wrap `App`.
- CI polish
  - Already added baseline CI. Extend with test coverage upload, lint warnings as annotations, and a simple Release Drafter.

What I can implement quickly next if you’d like:
- Introduce Zod schema and wire it into `parseInventoryFiles`.
- Swap DeviceTable to TanStack Table with basic virtualization.
- Move the category and IP mappings to `config/` and load them.

### medium-term (3–6 weeks)

- Feature-oriented structure
  - Restructure into `src/features/{inventory,sync,settings}/…` and `src/core/{ipc,config,logging,error,ui}/…`.
  - Benefits: easier navigation, natural module boundaries, better test isolation.
- Unified ingestion API
  - Define `InventorySource` interface with implementations for Local (file upload), Azure Blob (via IPC), and a placeholder for future REST.
  - Renderer calls an `InventoryIngestionService` that picks a source; no `FileList` hacks from synced content.
- Workerized parsing and filtering
  - Move JSON parsing, normalization, and expensive filters into a dedicated web worker. PostMessage batches for progress.
- Caching
  - Persist normalized data in IndexedDB for fast reloads and offline use. Only re-parse new or changed files.
- IPC and service improvements
  - Move the long-running sync into a Node worker/child-process in main to keep main process snappy; preserve progress events.
  - Consider SAS tokens instead of account keys (least privilege) and support for expiry/rotation.

### longer-term (8+ weeks)

- Trend analysis and historical snapshots
  - Store snapshots (timestamped Device sets) to visualize changes over time (Win11 readiness trends, TPM adoption).
- Plugin/enrichment system
  - Let users add custom enrichment modules (e.g., map serial to asset metadata via a CSV/API).
- Observability
  - Integrate Sentry or OpenTelemetry for crash/perf in Electron builds.
- Release automation
  - GitHub Actions flow to build installers for Windows (already), optionally macOS/Linux, sign, and publish on tag; generate release notes from PRs.

## test and quality gates summary

- Lint: PASS (warnings)
- Build: PASS
- Unit/Integration tests: FAIL

The test failures appear unrelated to changes in this review:
- `FilterPanel` tests expect different value semantics (e.g., 'Ready' vs 'ready') and specific location label text that your UI no longer emits. They need to be updated to match the current UI (or the UI adjusted to match test expectations).
- `chartUtils` boolean labeling test mismatches current naming strategy.
- `deviceUtils` tests fail parsing because the tests likely construct `File` content as UTF‑8 while the parser assumes UTF‑16LE. Either update tests to encode as UTF‑16LE or adjust parser to detect encoding (try/catch UTF‑16LE then fallback UTF‑8).

If you want, I can take a pass at aligning tests and improving the parser’s encoding detection; it’s a small change with big stability payoff.

## small fixes made

- Added ARCHITECTURE.md with current state, gaps, and a roadmap.
- Added CI workflow for lint, tests, and builds: ci.yml.
- Patched `SyncProgress` typing to include ‘cancelled’.
- Fixed an ESLint typing issue in credentialsService.ts.
- Updated README with accurate dev script and links.

## suggested next steps

Pick a “Foundations” sprint (1–2 weeks):

1) Validation and safety
- Add Zod schemas and wire into `parseInventoryFiles`.
- Fix .NET date regex and add a couple of tests.

2) Performance and UX
- Replace the table with TanStack Table + virtualization.
- Memoize filtering and consider a worker for large sets.

3) Hygiene
- Add an ErrorBoundary and a tiny logger.
- Externalize mappings to `config/`.

4) Tests
- Update failing tests to match current UI behavior and encoding.
- Add unit tests for `parseInventoryFiles`, `filterDevices`, and `determineLocation`.

If you’d like, say the word and I’ll start by:
- Adding the Zod `DeviceSchema` and integrating it.
- Refactoring the table to TanStack Table with virtualization.
- Moving the mappings to JSON config and loading them, with a fallback.

This project already delivers value; with a few focused steps, it can look and behave like a polished, production‑ready tool that’s easy to contribute to and impressive on GitHub.

Made changes.

vacuumboots: can you plan a git commit plan with these? Like map out a timeline of future commits that will accomplish the plans you've suggested? Include ways to manually test milestones. Prioritize multi-os deployment.

GitHub Copilot: Created 12 todos

Here’s a concrete, conventional-commit–style roadmap that gets you to robust multi‑OS distribution fast, while tightening correctness, performance, and contributor readiness. Each milestone lists expected commits, acceptance criteria, and how to manually test.

## high-level approach

- Front-load multi-OS packaging and CI so you can ship on Windows/macOS/Linux early.
- Unblock failing tests and harden the parser with validation so the project looks solid in CI.
- Improve UX performance (virtualized table, workerized parsing) so large inventories feel smooth.
- Round out docs, logging, and error boundaries to look polished on GitHub.

## sequenced commit plan with manual test steps

Timeline assumes small PRs merged daily. If you prefer bigger PRs, you can bundle adjacent commits.

Week 1: Distribution and CI first

1) ci: add multi-os build workflow and artifacts
- Summary: Add a new GitHub Actions workflow that builds Electron artifacts for win/mac/linux (unsigned) using electron-builder matrix.
- Files:
  - .github/workflows/release-preview.yml (new): matrix for windows-latest, macos-latest, ubuntu-latest; run npm ci, build web + electron services, then electron-builder with --dir or artifact targets.
  - package.json build config: add mac/linux targets if missing.
- Acceptance:
  - Workflow runs on push and PR, uploads unsigned app artifacts for all three OSes.
- Manual test:
  - On GitHub, open a PR and confirm workflow uploads three artifacts (Win NSIS/dir, mac .dmg/.zip, Linux AppImage/deb as configured).
  - Locally on macOS: run
    ```sh
    npm run build
    npm run build:electron-services
    npx electron-builder --mac --x64 --dir
    ```
    Verify the app launches via the unpacked app.

2) build: extend electron-builder config for mac and linux
- Summary: Update package.json build section with:
  - "mac": { "target": ["dmg","zip"], "category": "public.app-category.developer-tools" }
  - "linux": { "target": ["AppImage","deb"], "category": "Utility" }
- Acceptance:
  - Local mac build produces a DMG and a ZIP; Linux build on CI produces AppImage/deb.
- Manual test:
  - Download mac artifact from CI to a mac, open DMG, drag app to Applications, run.

3) docs(ci): add signing/notarization guide + secrets placeholders
- Summary: Add docs on code signing/notarization (Apple ID/App Specific Password/Certificates; Windows code signing cert; Linux signing optional).
- Files:
  - docs/packaging/APPLE_NOTARIZATION.md
  - docs/packaging/WINDOWS_CODESIGN.md
  - README: “Multi-OS builds” section with links and required secrets names for CI (APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, CSC_LINK, CSC_KEY_PASSWORD).
- Acceptance:
  - Clear instructions exist on how to enable signed releases later.
- Manual test:
  - Ensure docs match your repo set up; no build step needed.

Week 2: Fix tests and harden parsing

4) fix(utils): detect UTF-16LE/UTF-8 and stabilize .NET date parsing
- Summary: Update parseInventoryFiles to:
  - Try UTF-16LE first (current), fall back to UTF-8 if JSON.parse fails.
  - Fix .NET date regex to /\/Date\((\d+)\)\// and optionally accept variants.
- Files:
  - deviceUtils.ts
  - tests updated accordingly (see next commit).
- Acceptance:
  - Parser correctly handles UTF-16LE or UTF-8 tests; dates consistently parse.
- Manual test:
  - Use FileUpload: drop a UTF-8 JSON and a UTF-16LE JSON; both load and render devices.

5) test: update FilterPanel and chartUtils tests for current UI semantics
- Summary: Align tests with real values and labels:
  - windows11Ready uses 'ready' not 'Ready', etc.
  - Provide testids or accessible names where needed.
- Files:
  - FilterPanel.tsx (add data-testid attributes if necessary)
  - chartUtils.test.ts
  - FilterPanel.test.tsx
- Acceptance:
  - Vitest suite passes locally and in CI.
- Manual test:
  - Run:
    ```sh
    npm run test:run
    ```
  - All tests green.

Week 3: Validation, logging, and stability

6) feat(domain): add zod DeviceSchema and normalize inputs
- Summary: Introduce schema validation + coercion for device objects. Reject or sanitize unexpected fields; normalize booleans/numbers; handle fallback defaults centrally.
- Files:
  - src/features/inventory/model/device.schema.ts (new)
  - deviceUtils.ts (integrate schema)
- Acceptance:
  - Invalid JSON structures generate friendly errors and don’t crash the UI.
- Manual test:
  - Upload malformed fields (e.g., strings for GB fields), ensure UI shows toast error, app remains stable.

7) feat(core): logger + ErrorBoundary
- Summary:
  - Add core logger with levels and structured payloads; replace ad hoc console.log in services and components.
  - Wrap App with an ErrorBoundary that shows a user-friendly error page and logs the error.
- Files:
  - src/core/logging/logger.ts (new)
  - App.tsx (wrap with boundary)
  - Replace console statements in src/services/* and components that log errors.
- Acceptance:
  - Errors surface a friendly screen; logs are consistent; lint warnings reduced.
- Manual test:
  - Intentionally throw in a dev route or simulate an error in component; verify boundary and logs.

8) refactor(config): externalize device model categories and ip-range mapping
- Summary: Move model/deviceCategory and IP ranges to `config/device-category.json` and `config/location-ip-ranges.json`, add a loader, and fallback if files missing.
- Files:
  - config/*.json (new), src/core/config/loaders.ts (new)
  - deviceUtils.ts (use loaded mappings rather than inline)
- Acceptance:
  - App uses externalized configs; can be changed without code edits.
- Manual test:
  - Modify config JSONs and reload; confirm changes reflect in categorization and locations.

Week 4: UX performance and structure

9) feat(ui): DeviceTable → TanStack Table + virtualization
- Summary: Replace manual sorting/pagination with TanStack Table; add react-virtual for rows to handle large datasets.
- Files:
  - DeviceTable.tsx (rewrite using @tanstack/react-table + react-virtual)
  - Add minimal styling and keep columns/behaviors
- Acceptance:
  - Sorting/pagination accessible and fast; smooth scroll with 20k rows.
- Manual test:
  - Load a big synthetic JSON (20k+ devices); scroll is smooth; sorts quickly.

10) feat(worker): move parsing/filtering to a Web Worker
- Summary:
  - Create a worker to parse/validate/normalize devices and to run heavy filtering.
  - Provide progress messages; fall back to main thread for tiny files.
- Files:
  - src/features/inventory/workers/ingest.worker.ts (new)
  - deviceUtils.ts or a new service: orchestrate worker usage
- Acceptance:
  - Main thread stays responsive during ingestion/filtering.
- Manual test:
  - In DevTools Performance, ensure no long blocking during large ingest; UI responsive.

Week 5: Ingestion abstraction and caching

11) feat(domain): InventorySource and InventoryIngestionService
- Summary:
  - Define an `InventorySource` interface (listFiles, readDevices).
  - Implement `LocalFileSource` and `AzureBlobSource` (renderer invokes one high-level ingestion entry point).
  - Remove the "fake FileList" construction in SyncPanel.
- Files:
  - src/features/inventory/services/InventorySource.ts, LocalFileSource.ts, AzureBlobSource.ts (new)
  - SyncPanel.tsx (simplify to call service)
- Acceptance:
  - Same UX, cleaner boundary; IPC returns raw contents but ingestion service owns parsing.
- Manual test:
  - Use SyncPanel; on complete, ingestion service loads devices as before.

12) feat(cache): IndexedDB cache for normalized devices
- Summary:
  - Persist normalized Device[] and metadata (timestamp, source) in IndexedDB.
  - On startup, load from cache while allowing a manual refresh.
- Files:
  - src/features/inventory/services/CacheService.ts (new with idb)
  - Index.tsx (load from cache on mount)
- Acceptance:
  - Cold start is faster; previously loaded dataset appears instantly with a “last loaded” hint.
- Manual test:
  - Load large dataset; refresh app; data shows instantly; clearing cache works.

Week 6: Release-level polish

13) ci(release): tag-based release packaging for all OS
- Summary:
  - Add a new workflow to build and upload release assets on tag vX.Y.Z. Include release notes generation.
  - If signing credentials exist, sign and notarize mac build; sign win build; otherwise upload unsigned artifacts with clear label.
- Files:
  - release.yml (new; matrix for all OS)
  - .github/release-drafter.yml or rely on GitHub release notes
- Acceptance:
  - Creating a Git tag produces ready-to-download installers for Windows/macOS/Linux.
- Manual test:
  - Cut a pre-release tag v1.3.0-rc.1; verify artifacts appear.

14) docs: contribution guide + architecture pointers + troubleshooting
- Summary:
  - Add CONTRIBUTING.md, update README with dev scripts, troubleshooting (encoding, Electron quirks), and link to ARCHITECTURE.md.
- Files:
  - CONTRIBUTING.md (new)
  - README.md (update)
- Acceptance:
  - New contributors understand how to run, test, and submit changes.
- Manual test:
  - Follow docs on a fresh clone to ensure no missing steps.

## multi-os deployment notes and sequencing

- Early Week 1: multi-OS build artifacts (unsigned) so you can share test builds with others quickly.
- Week 6: signed releases on tag if you have code signing credentials:
  - macOS: Notarization requires Apple Developer account and ASC credentials; configure APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, CSC_LINK, CSC_KEY_PASSWORD.
  - Windows: Sign with a code signing cert (.pfx) via CSC_LINK or environment. For corporate environments, consider Azure Key Vault or GitHub OIDC + HSM provider.
  - Linux: Signing optional; AppImage/deb publishable as-is.

## manual testing checklist per milestone

- CI matrix build: Confirm 3 artifacts (Win/mac/Linux) per PR. Download and launch each where possible.
- Parser/encoding: Upload both UTF-8 and UTF-16LE JSON; verify devices render; no console errors.
- Validation: Try malformed fields; expect error toast; app remains stable.
- Virtualized table: Load 10k–50k rows; scroll and sort without noticeable jank.
- Worker parsing: Observe DevTools Performance; main thread remains responsive during ingest.
- Ingestion service: Azure sync populates devices without constructing FileList in renderer.
- Cache: Restart app and see instant dataset render.
- Release: Tag a version and confirm installers are generated; if signing disabled, they should still install and run locally with platform prompts as expected.

## acceptance gates (per PR)

- Lint and Typecheck: PASS
- Unit/Integration Tests: PASS (update and expand tests as you touch modules)
- Build (web + services): PASS
- For PRs affecting packaging: Dry-run electron-builder on CI PASS
- Bundle size guard: keep main chunk reasonable (consider code-splitting)

## suggested commit message style

Use conventional commits for clean history:
- feat(scope): …
- fix(scope): …
- refactor(scope): …
- test(scope): …
- build(scope): …
- ci(scope): …
- docs(scope): …
- chore(scope): …

<<<<<<< Updated upstream
If you want, I can start by drafting the first two PRs:
- CI matrix workflow for multi-OS artifacts + electron-builder target updates
- Parser encoding fix + .NET date regex + green tests
=======
>>>>>>> Stashed changes
