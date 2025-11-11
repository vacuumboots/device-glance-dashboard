# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - 2025-11-11

Phase 2: Hardening & Performance

### Added

- React Query integration for remote config fetching and Azure sync status polling.
- Web Worker-based parsing for inventory files with incremental progress events and cancel (AbortController).
- Controlled parsing UX unified across uploads and sync downloads (progress indicator + Cancel button).
- TanStack Table migration with optional virtualization for large datasets.
- Shared parsing core (`parserCore`) with Zod validation used by both main thread and Worker.

### Improved

- Memoized device filtering via stable dependency hash to avoid unnecessary recomputation.
- Unified ingestion and validation path for both upload and sync ingestion.
- Documentation updates: architecture reflects Phase 2 completion and new data flow.

### Fixed

- Test harness stability issues: ensured React Query provider is present where required; stabilized SyncPanel tests for web and desktop contexts.

### Internal

- Refactors to simplify data flow and reduce UI thread work during heavy ingestion.

## [1.4.x] - 2025-07

- Phase 1: Foundation & Stability and subsequent UX improvements.
