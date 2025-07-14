# Device Glance Dashboard

A comprehensive Windows device inventory management system built with React, TypeScript, and Electron.

## How to Run This Project

This project requires Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Development Setup

```sh
# Step 1: Clone the repository
git clone https://github.com/vacuumboots/device-glance-dashboard.git

# Step 2: Navigate to the project directory
cd device-glance-dashboard

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

### Desktop Application

Run the Electron desktop app:

```sh
npm run electron:dev
```

### Development Options

**Local Development**
- Use your preferred IDE to edit files locally
- Run `npm run dev` for web development
- Run `npm run electron:dev` for desktop development

**GitHub Codespaces**
- Click the "Code" button on the repository page
- Select "Codespaces" and create a new codespace
- Edit files directly in the browser-based VS Code environment

## What technologies are used for this project?

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript with strict mode
- **React 18** - Modern React with hooks and concurrent features
- **shadcn-ui** - High-quality, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Electron** - Desktop application framework
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities

## Features

- 📊 **Device Inventory Management** - Upload and analyze Windows device data
- 🔍 **Advanced Filtering** - 8 different filter types including device model, location, compliance status
- 📈 **Summary Charts** - Visual analytics for device fleet composition
- 📤 **Data Export** - CSV export functionality for filtered datasets
- 🏢 **Location-Based Analysis** - Community grouping and IP-based location detection
- 🔒 **Security Compliance** - TPM, Secure Boot, and Windows 11 readiness tracking
- 🖥️ **Desktop Application** - Cross-platform Electron app

## Testing

Comprehensive testing framework with 81 tests covering:

```bash
npm test              # Watch mode development
npm run test:run      # Single run for CI/CD
npm run test:ui       # Visual test interface
npm run test:coverage # Coverage reporting
```

- **Unit Tests** (29) - Utility functions and business logic
- **Component Tests** (38) - UI components and interactions
- **Integration Tests** (8) - Data flow and filtering workflows
- **End-to-End Tests** (5) - Complete user scenarios

## Deployment

### Web Application
Build the web version for deployment:

```sh
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

### Desktop Application
Build the desktop application:

```sh
npm run electron:build
```

This will create platform-specific executables in the `dist` directory.

## Recent Changes

### July 14, 2025 - System Verification & Environment Setup

- **✅ Comprehensive System Verification** - Verified all project components work correctly
  - Fixed React Router test context issues for proper test execution
  - Confirmed Electron production build loads UI correctly
  - Verified Electron development environment loads properly
  - Confirmed web preview serves the application correctly
  - Added dotenv support for environment variable loading
- **🔧 Environment Configuration** - Enhanced environment variable handling
  - Added dotenv dependency and configuration to Electron main process
  - Created .env file support for Azure Storage configuration
  - Verified sync script can access environment variables properly
  - Ensured PowerShell sync script integration works correctly
- **🧪 Test Framework Improvements** - Enhanced test reliability and coverage
  - Fixed router context mocking in test setup
  - Updated test utilities to handle React Router properly
  - Verified test suite passes with improved stability
- **📦 Version Update** - Updated to version 1.1.1 for deployment testing

### July 10, 2025 - Major Testing & Quality Implementation

- **🧪 Comprehensive Testing Framework** - Implemented complete testing suite with 81 tests
  - Unit tests for all utility functions (device parsing, filtering, export, charts)
  - Component tests for UI interactions and accessibility
  - Integration tests for filtering workflows and data flow
  - End-to-end tests for complete user scenarios (IT audits, security compliance)
- **⚙️ Test Configuration** - Added Vitest + React Testing Library + JSDOM setup
- **🛡️ Enhanced Error Handling** - Comprehensive error handling for file uploads, data parsing, and UI interactions
- **📋 Device Model Filter** - Added dynamic device model filtering with alphabetical sorting
- **🔧 Code Quality** - ESLint compliance, Prettier formatting, TypeScript strict mode
- **📚 Documentation** - Added comprehensive testing documentation and configuration summaries
- **🚀 CI/CD Ready** - Test scripts and coverage reporting for automated workflows

### July 9, 2025

- **Added Last Boot Time column** to the device inventory table with proper .NET Date format parsing
- **Fixed Collection Date parsing** to handle complex object structure with nested date properties
- **Added Hash Present filter** to filter devices based on whether they have a hardware hash in their records
- Improved date formatting functions to handle various date formats from device exports

## Documentation

- 📋 **[Configuration Summary](./CONFIGURATION_SUMMARY.md)** - Detailed overview of all configuration files and testing setup
- 🛡️ **[Error Handling Guide](./ERROR_HANDLING.md)** - Comprehensive error handling documentation
- 🧪 **[Testing Guide](./src/__tests__/README.md)** - Complete testing framework documentation
