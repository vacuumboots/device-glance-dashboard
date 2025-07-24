# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Development
- `npm run dev` - Start Vite development server for web app
- `npm run electron-dev` - Run Electron desktop app in development mode
- `npm run build` - Build web application for production
- `npm run build-electron` - Build Electron desktop application
- `npm run dist` - Create platform-specific executables

### Release & Distribution
- `npm version patch|minor|major` - Update version numbers automatically
- `git tag v1.x.x` - Create version tag for release
- `git push origin v1.x.x` - Trigger GitHub Actions installer build
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
- **Frontend**: React 18 + TypeScript (strict mode) + Vite
- **UI Framework**: shadcn-ui components with Tailwind CSS
- **Desktop**: Electron with Node.js backend services
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router with HashRouter (for Electron compatibility)
- **Testing**: Vitest + React Testing Library + JSDOM

### Core Application Structure

**Entry Point**: `src/App.tsx` sets up providers (Theme, Query, Tooltip, Router) and routing structure.

**Main Page**: `src/pages/Index.tsx` contains the primary dashboard with device management functionality.

**Key Components**:
- `DeviceTable.tsx` - Main data table with sorting and filtering
- `FilterPanel.tsx` - 8 different filter types for device analysis
- `SummaryCharts.tsx` - Visual analytics using Recharts
- `SyncPanel.tsx` - Azure blob storage integration for data sync
- `SettingsPanel.tsx` - Encrypted credential management

### Data Architecture

**Device Interface** (`src/types/device.ts`): Core data structure representing Windows devices with properties like:
- Hardware specs (RAM, storage, manufacturer, model)
- Security features (TPM, Secure Boot, Windows 11 readiness)
- Network info (IP, domain join type)
- Compliance tracking (hardware hash, collection date)

**Filter System**: 8 filter types including location-based filtering, security compliance, storage thresholds, and device categorization.

### Electron Integration

**Main Process**: `public/electron.js` handles desktop app lifecycle, IPC communication, and secure credential storage.

**PowerShell Integration**: `sync_inventory.ps1` script for Windows device inventory collection, packaged with the app.

**Secure Storage**: AES-256-GCM encryption for Azure credentials stored locally.

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
1. Update version in `package.json` (both main version and `build.extraMetadata.version`)
2. Commit version changes
3. Create git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. GitHub Actions automatically:
   - Builds Windows executable with electron-builder
   - Creates installer (.exe) and related files
   - Uploads to GitHub Releases page
   - Generates release notes from commits

**Build Artifacts:**
- `Device-Glance-Dashboard-Setup-*.exe` - Windows installer
- `*.blockmap` - Update verification files
- `*.yml` - Auto-updater configuration

**Monitoring:** Check the Actions tab for build progress. Complete build and release takes ~5-10 minutes.

### Manual Local Build

For local development and testing:
```bash
npm run build && npm run build:electron-services && npm run dist
```

This creates the installer in `dist-electron/` directory without uploading to GitHub.