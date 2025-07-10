# Device Glance Dashboard

A comprehensive Windows device inventory management system built with React, TypeScript, and Electron.

## Project info

**URL**: https://lovable.dev/projects/89f46fc0-403a-4da7-8bef-e365b7c98375

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/89f46fc0-403a-4da7-8bef-e365b7c98375) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

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

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/89f46fc0-403a-4da7-8bef-e365b7c98375) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Recent Changes

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
