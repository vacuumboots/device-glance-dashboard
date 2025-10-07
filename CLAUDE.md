# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Development
- `npm run dev` - Start Vite development server for web app (port 5173)
- `npm run electron-dev` - Run Electron desktop app in development mode (starts dev server + Electron)
- `npm run build` - Build web application for production
- `npm run build:dev` - Build web application in development mode
- `npm run build:electron-services` - Compile TypeScript for Electron main process (outputs to dist/electron-services)
- `npm run build-electron` - Build complete Electron application (runs build + build:electron-services + electron-builder)
- `npm run dist` - Create Windows x64 installer without publishing
- `npm run electron` - Build services and run Electron in production mode (for testing built app locally)

### Release & Distribution
- `npm version patch|minor|major` - Update version numbers automatically (updates package.json only)
- **IMPORTANT**: After `npm version`, manually update `build.extraMetadata.version` in package.json to match
- `git tag v1.x.x` - Create version tag for release
- `git push origin main` - Push commits to main branch
- `git push origin v1.x.x` - Trigger GitHub Actions installer build and release upload
- GitHub Actions automatically creates Windows installer and uploads to Releases

### Code Quality
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run tests in watch mode for development
- `npm run test:run` - Run all tests once (for CI/CD)
- `npm run test:ui` - Open Vitest UI for visual test management
- `npm run test:coverage` - Generate test coverage reports

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript (strict mode) + Vite 5 + SWC
- **UI Framework**: shadcn-ui components (Radix UI primitives) + Tailwind CSS
- **Desktop**: Electron 37 with Node.js backend services
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router 6 with HashRouter (for Electron compatibility with relative paths)
- **Testing**: Vitest + React Testing Library + JSDOM
- **Charts**: Recharts for data visualization
- **Azure Integration**: @azure/storage-blob SDK for inventory sync

### Core Application Structure

**Entry Point**: `src/App.tsx` sets up providers in this order:
1. ThemeProvider (next-themes) - Light/dark mode support
2. QueryClientProvider - React Query for data fetching
3. TooltipProvider - shadcn-ui tooltip context
4. HashRouter - React Router with hash routing for Electron
5. Routes with catch-all NotFound page

**Main Page**: `src/pages/Index.tsx` contains the primary dashboard with device management functionality.

**Key Components** (all in `src/components/`):
- `DeviceTable.tsx` - Main data table with sorting, filtering, and device search
- `FilterPanel.tsx` - 8 different filter types for device analysis
- `SummaryCharts.tsx` - Visual analytics using Recharts
- `SyncPanel.tsx` - Azure blob storage integration for data sync with progress tracking
- `SettingsPanel.tsx` - Encrypted credential management
- `DeviceDetailsModal.tsx` - Detailed device information display with Windows 11 readiness assessment

### Data Architecture

**Device Interface** (`src/types/device.ts`): Core data structure representing Windows devices with properties like:
- Hardware specs (RAM, storage, manufacturer, model)
- Security features (TPM, Secure Boot, Windows 11 readiness)
- Network info (IP, domain join type)
- Compliance tracking (hardware hash, collection date)

**Filter System**: 8 filter types including:
- Windows 11 readiness status
- TPM presence and version
- Secure Boot status
- Storage thresholds (low storage warnings)
- Domain join types (Azure AD, On-Prem AD, Hybrid, Workgroup)
- Device categories (Desktop, Laptop, Other)
- Hardware hash presence
- Device model filtering with alphabetical sorting
- Location-based filtering with community grouping

### Electron Integration

**Main Process**: `public/electron.js` handles desktop app lifecycle, IPC communication, and secure credential storage.

**TypeScript Services**: `src/services/` contains Electron main process services compiled separately:
- `azureSyncService.ts` - Azure Blob Storage sync implementation using @azure/storage-blob SDK
- Compiled to `dist/electron-services/` via `tsconfig.electron.json` configuration
- Imported by main process after compilation

**PowerShell Script**: `sync_inventory.ps1` packaged as extraResource for Windows device inventory collection.

**Secure Storage**: Electron's `safeStorage` API for OS-native credential encryption (Windows Credential Manager, macOS Keychain, Linux Secret Service).

### Testing Strategy

The project has comprehensive test coverage (81 tests) across:
- **Unit Tests** (29): Utility functions in `src/utils/`
- **Component Tests** (38): UI components with user interaction testing
- **Integration Tests** (8): Data flow and filtering workflows
- **E2E Tests** (5): Complete user scenarios

Test files are co-located with source files in `__tests__` directories.

## Key Development Patterns

### Component Structure
- Use shadcn-ui components as base building blocks
- Follow existing patterns in `src/components/` for consistency
- Implement proper TypeScript interfaces for all props

### Data Handling
- Device data parsing utilities in `src/utils/deviceUtils.ts`
- Export functionality in `src/utils/exportUtils.ts`
- Chart data transformation in `src/utils/chartUtils.ts`

### State Management
- Use React Query for async data fetching and caching
- Local state with React hooks for UI interactions
- Electron IPC for desktop-specific functionality

### Error Handling
- Comprehensive error boundaries and user feedback
- Graceful fallbacks for missing data or failed operations
- Clear user messaging through toast notifications

## File Upload & Data Processing

The application processes Windows device inventory JSON files. Device data includes complex nested objects for dates and various hardware/software properties. Key processing functions are in `src/utils/deviceUtils.ts` for parsing and normalizing device data.

## Release Process & GitHub Actions

### Automated Installer Creation

The project uses GitHub Actions (`.github/workflows/release.yml`) for automated Windows installer builds:

**Workflow Triggers:**
- Push to main branch (builds only)
- Push to version tags (`v*`) - builds and uploads installer
- Manual workflow dispatch
- Published GitHub releases

**Release Steps:**
1. Update version: `npm version patch|minor|major`
2. Manually update `build.extraMetadata.version` in package.json to match the new version
3. Commit version changes
4. Create git tag: `git tag v1.x.x`
5. Push: `git push origin main && git push origin v1.x.x`
6. GitHub Actions automatically:
   - Runs on Windows runner with Node.js 20
   - Builds web app with Vite
   - Compiles Electron services with TypeScript
   - Creates Windows x64 installer with electron-builder
   - Uploads installer (.exe), blockmap files, and yml config to GitHub Releases
   - Generates release notes from commits

**Build Artifacts:**
- `Device-Glance-Dashboard-Setup-*.exe` - Windows installer
- `*.blockmap` - Update verification files
- `*.yml` - Auto-updater configuration

**Monitoring:** Check the Actions tab for build progress. Complete build and release takes ~5-10 minutes. Workflow has 30-minute timeout.

### Manual Local Build

For local development and testing:
```bash
npm run dist
```

This runs the full build pipeline (build + build:electron-services + electron-builder) and creates the installer in `dist-electron/` directory without uploading to GitHub.

## Test Configuration

Tests are configured with Vitest and JSDOM environment:
- **Setup File**: `src/test/setup.ts` - Global test configuration
- **Globals**: Test globals enabled (describe, it, expect available without imports)
- **Environment**: JSDOM for DOM testing
- **Coverage**: HTML, text, and JSON reporters with comprehensive exclusions
- **Path Aliases**: `@/` alias for `src/` directory supported in tests
- **Test Location**: Tests are co-located in `__tests__` directories next to source files

## Important Build Details

### Dual Build System
The project requires two separate TypeScript compilations:
1. **Vite Build** (`npm run build`) - Compiles React frontend with Vite + SWC
2. **Electron Services** (`npm run build:electron-services`) - Compiles backend services with `tsc` using `tsconfig.electron.json`

The Electron services use a separate tsconfig that:
- Only includes `src/services/**/*` and electron type definitions
- Explicitly excludes React components, pages, and utils
- Outputs to `dist/electron-services/`
- This separation is necessary because Electron main process doesn't use Vite

### Path Configuration
- **Development**: Vite serves on `http://localhost:5173`
- **Production**: Uses relative paths (`base: './'` in vite.config.ts) for Electron compatibility
- **Module Aliases**: `@/` maps to `src/` directory in both Vite and Vitest configs