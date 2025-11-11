# Phase 3: Structure & Extensibility

> Branch: `feature/modular-structure`
> Goal: Refactor into a feature-oriented architecture, abstract data ingestion, introduce persistence & observability primitives, and prepare for advanced functionality.

---

## Guiding Principles

- **Isolation:** Features own UI + domain logic; shared cross-cutting concerns move to `src/core`.
- **Explicit Interfaces:** Inventory ingestion, persistence, and sync defined via TypeScript contracts.
- **Progressive Enhancement:** Ship refactor in incremental slices guarded by compatibility shims.
- **Resilience & Observability:** Strong error taxonomy + structured logging surfaces failure modes early.
- **Performance Conscious:** Persistence & refactor must not regress current load, parse, or filter speeds.

---

## High-Level Milestones

1. Architectural Skeleton & Migration Strategy.
2. Inventory Ingestion Abstraction (Local + Azure Blob) with validation.
3. Device Persistence (IndexedDB) & Boot Hydration.
4. Structured Error Types & Integration with ErrorBoundary + Logging.
5. Stabilization & Verification (benchmarks, tests, documentation).

---

## Directory Layout (Target)

```text
src/
  core/
    logging/
      logger.ts
    errors/
      DomainError.ts
      SyncError.ts
      index.ts
    persistence/
      indexedDbClient.ts
      cacheContracts.ts
    ingestion/
      inventorySource.ts    (interfaces)
    config/
      constants.ts
      zodSchemas.ts
  features/
    inventory/
      components/
      hooks/
      services/
        localFileSource.ts
        azureBlobSource.ts
        index.ts
      model/
        device.ts
        normalization.ts
    sync/
      services/
        syncService.ts
        syncStatusPoller.ts
    settings/
      components/
      services/
    reporting/
      services/
      components/
  workers/
    parser.worker.ts
  app/
    App.tsx
    routes.tsx
```

Compatibility shims: Temporary `src/legacy/*` or re-export modules to avoid breaking imports during phased migration.

---

## Detailed Work Breakdown

### 11. refactor(architecture) – Feature-Oriented Transition

**Objectives:**

- Establish `src/core` (errors, logging, ingestion interfaces, persistence).
- Create `src/features/inventory` and migrate `deviceUtils`, parsing logic, and validation.
- Migrate sync logic into `src/features/sync`.
- Introduce normalized import paths (`@core/*`, `@features/*`) via `tsconfig.paths` update.
- Preserve public API surface for existing components until migration completes.

**Tasks:**

1. Add path aliases and update `tsconfig.json`.
2. Create `core` scaffolding (logger relocation, errors placeholder, ingestion contracts file, persistence placeholder).
3. Move inventory domain pieces: `types/device.ts`, normalization utilities.
4. Relocate worker code into `workers/` and adjust build references.
5. Update imports in `App.tsx`, `DeviceTable.tsx`, `FileUpload.tsx`, `SyncPanel.tsx`, `SummaryCharts.tsx`.
6. Add temporary re-exports (e.g., `src/utils/deviceUtils.ts` -> forward to new location) to avoid breaking tests in incremental commits.
7. Run full test suite; ensure green after each major migration slice.
8. Remove shims after final import updates.

**Acceptance Criteria:**

- All tests pass (unit/integration/e2e).
- No circular dependencies introduced.
- Build completes without path resolution errors.
- Lint passes with updated structure.

### 12. refactor(domain) – Inventory Ingestion Abstraction

**Objectives:**

- Replace ad-hoc ingestion with interface-based sources.
- Ensure both local file upload and Azure Blob share normalization + validation pipeline.

**Contracts:**

```ts
export interface InventorySourceContext {
  abortSignal?: AbortSignal;
  progress?: (p: { processed: number; total?: number; phase: string }) => void;
}
export interface InventorySourceResult {
  devices: NormalizedDevice[];
  metadata: { source: string; retrievedAt: Date; rawCount: number };
}
export interface InventorySource {
  readonly id: string;
  canHandle(input: unknown): boolean;
  load(input: unknown, ctx?: InventorySourceContext): Promise<InventorySourceResult>;
}
```

**Tasks:**

1. Define interfaces in `core/ingestion/inventorySource.ts`.
2. Extract current local parsing flow into `LocalFileSource` (wrap worker parsing & validation).
3. Abstract Azure sync retrieval into `AzureBlobSource` (leveraging existing `syncService`).
4. Create a source resolver `resolveInventorySource(input)`.
5. Refactor UI ingestion points (`FileUpload`, `SyncPanel`) to use resolver + unified pipeline.
6. Add tests for: resolver selection, worker parse integration, Azure blob fallback, abort behavior.

**Acceptance Criteria:**

- Upload & Azure sync produce identical normalized device arrays for same data sets.
- Progress & cancel remain functional.
- Schema validation errors surfaced as `DomainError` (post ErrorTypes implementation) or standard error message initially.

### 13. feat(caching) – IndexedDB Device Persistence

**Objectives:**

- Persist normalized devices to reduce cold-start latency after initial ingestion.
- Provide versioned cache entries keyed by schema + app version.

**Tasks:**

1. Implement minimal IndexedDB client (`core/persistence/indexedDbClient.ts`).
2. Define cache contract `DeviceCacheRecord` with version, timestamp, device count.
3. Add persistence hook/service: `saveDevices(devices)` and `loadDevices()` with staleness threshold.
4. Integrate load-on-start in `App.tsx` (rehydrate React Query state or local store).
5. Add user setting (Phase 3 later item) toggle placeholder for cache enable/disable.
6. Introduce migration strategy when schema/version mismatch (drop + rebuild).
7. Write tests (can use fake IndexedDB or simple in-memory adapter in test env).
8. Benchmark load time with and without cache (document results in Phase3.md appendix).

**Acceptance Criteria:**

- Successful cold start with cached devices if present (no ingestion blocking UI).
- Cache invalidated when app version or schema changes.
- No blocking of main thread > acceptable threshold (~100ms) during load.

### 14. feat(observability) – Structured Error Types

**Objectives:**

- Provide domain-specific error classes to differentiate operational vs. domain validation vs. sync transport failures.

**Classes:**

```ts
class DomainError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: unknown) { super(message); }
}
class SyncError extends Error {
  constructor(message: string, public readonly stage: string, public readonly retryable: boolean, public readonly details?: unknown) { super(message); }
}
```

**Tasks:**

1. Implement `DomainError`, `SyncError` and index export.
2. Update ingestion pipeline to wrap validation failures in `DomainError(code='VALIDATION_FAILED')`.
3. Wrap Azure sync failures with `SyncError(stage='download' | 'list' | 'auth', retryable)`.
4. Update `ErrorBoundary` to branch logic based on instance type.
5. Emit structured logs (augment existing logger) including `code`, `stage`, `retryable`.
6. Add tests for error wrapping & propagation.
7. Update documentation section in `Phase3.md` with taxonomy & usage examples.

**Acceptance Criteria:**

- Errors thrown from ingestion & sync are typed.
- ErrorBoundary surfaces user-friendly messaging while logging structured detail.
- Tests assert instance checks and metadata presence.

---

## Incremental Commit Strategy

- Each major subsection (11, 12, 13, 14) lands as a series of small commits (<300 LOC changed) to ease code review.
- Keep shims until architectural refactor stable; remove them in a final cleanup commit.
- Tag pre-release (`1.6.0-alpha.N`) after each milestone to aid QA.

---

## Risk Mitigation

- Maintain green tests after every migration slice.
- Abort signals enforced in ingestion preventing orphaned workers.
- IndexedDB operations wrapped with timeouts & fallbacks to in-memory store.
- Feature flags (env or config) can disable persistence & new ingestion pipeline if needed.

---

## Verification & Benchmarks (to fill during implementation)

| Scenario | Pre-Phase3 Baseline | Post-Implementation | Delta |
|----------|---------------------|---------------------|-------|
| Cold start (no cache) | TBD ms | TBD ms | TBD |
| Cold start (with cache) | N/A | TBD ms | TBD |
| Large file parse (50k rows) | TBD ms | TBD ms | TBD |

---

## Follow-Up / Out of Scope (Future Phase 3 Items)

- Child process sync (later milestone 16 in roadmap).
- Settings UI integration (later milestone 15).
- Trend snapshots & reporting (milestone 17).
- Release signing & notarization (milestone 18).

---

## Acceptance Gate for Phase 3 Completion

- All four milestone feature sets (11–14) merged.
- Tests ≥ prior count; new coverage for ingestion, persistence, errors.
- No performance regressions; documented benchmark table filled.
- Pre-release tags validated (alpha/beta) before final 1.6.0.

---

## Appendix: Open Questions

- Should persistence leverage React Query cache hydration instead of manual store? (Evaluate complexity vs. ROI.)
- Need encryption for cached device data? (Depends on sensitivity of fields.)
- Graceful downgrade path if IndexedDB quota exceeded?
- Standardized retry/backoff for Azure sync failures (exponential vs. fixed). Will integrate with `SyncError.retryable`.

