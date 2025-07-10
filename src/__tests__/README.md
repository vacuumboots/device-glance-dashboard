# Testing Documentation

This project includes comprehensive testing coverage using Vitest, React Testing Library, and JSDOM.

## Test Structure

### Unit Tests (`src/utils/__tests__/`)

- **`deviceUtils.test.ts`** - Tests for device parsing and filtering logic
- **`exportUtils.test.ts`** - Tests for CSV export functionality
- **`chartUtils.test.ts`** - Tests for chart data generation

### Component Tests (`src/components/__tests__/`)

- **`FilterPanel.test.tsx`** - Tests for the filter panel UI component
- **`DeviceTable.test.tsx`** - Tests for the device table component
- **`FileUpload.test.tsx`** - Tests for file upload functionality

### Integration Tests (`src/__tests__/integration/`)

- **`filtering.test.tsx`** - Tests for complete filtering workflows

### End-to-End Tests (`src/__tests__/e2e/`)

- **`user-workflows.test.tsx`** - Tests for complete user workflows and scenarios

## Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Test Coverage Areas

### ✅ **Unit Testing**

- Device data parsing and validation
- Filter logic for all filter types
- CSV export functionality
- Chart data generation
- Error handling and edge cases

### ✅ **Component Testing**

- Filter panel interactions
- Device table sorting and display
- File upload drag & drop
- Modal functionality
- UI state management

### ✅ **Integration Testing**

- Complete filtering workflows
- Data flow from upload to display
- Filter combinations and edge cases
- Summary chart updates

### ✅ **End-to-End Testing**

- IT audit workflows
- Security compliance checking
- Location-based analysis
- Device model analysis
- Device details viewing

## Key Test Features

1. **Mocked Dependencies**
   - DOM APIs (File, FileList, Blob, URL)
   - Browser APIs (ResizeObserver, IntersectionObserver)
   - Pointer capture methods for JSDOM compatibility

2. **Realistic Test Data**
   - Sample device inventories with real-world scenarios
   - Various device types (Desktop, Laptop, Workstation)
   - Different compliance states and configurations

3. **User Interaction Testing**
   - File upload via drag & drop and file picker
   - Filter selections and combinations
   - Table sorting and row clicking
   - Export functionality

4. **Error Scenarios**
   - Invalid JSON files
   - Missing device properties
   - Network-like failures
   - Edge cases and boundary conditions

## Test Configuration

The testing setup includes:

- **Vitest** as the test runner
- **React Testing Library** for component testing
- **JSDOM** for browser environment simulation
- **User Event** for realistic user interactions
- **Coverage reporting** with v8

## Running Specific Test Suites

```bash
# Run only unit tests
npm test -- src/utils/__tests__/

# Run only component tests
npm test -- src/components/__tests__/

# Run only integration tests
npm test -- src/__tests__/integration/

# Run only e2e tests
npm test -- src/__tests__/e2e/
```

## Test Patterns

### Component Testing Pattern

```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName {...props} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    const mockCallback = vi.fn();

    render(<ComponentName onAction={mockCallback} />);

    await user.click(screen.getByRole('button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### Integration Testing Pattern

```typescript
describe('Workflow Name', () => {
  it('should complete full user workflow', async () => {
    const user = userEvent.setup();

    render(<App />);

    // Upload file
    // Apply filters
    // Verify results
    // Export data
  });
});
```

This comprehensive test suite ensures the reliability and quality of the device inventory dashboard across all user scenarios and edge cases.
