# Error Handling Documentation

## 🛡️ Comprehensive Error Handling Strategy

### **File Upload Error Handling**

#### **FileUpload Component (`src/components/FileUpload.tsx`)**

- **File Type Validation**: Only accepts `.json` files
- **Empty File Handling**: Gracefully handles empty file selections
- **Drag & Drop Errors**: Prevents default browser behavior, handles invalid drops
- **File System Access**: Handles permission errors and network drives

#### **Device Parsing (`src/utils/deviceUtils.ts`)**

```typescript
// JSON Parsing Error Handling
try {
  const data = JSON.parse(content);
  // Process device data
} catch (error) {
  throw new Error(`Invalid JSON format in file: ${file.name}. Original error: ${error.message}`);
}
```

**Error Scenarios Handled:**

- Invalid JSON syntax
- Malformed device objects
- Missing required fields
- Unexpected data structures
- File encoding issues (UTF-16 support)

### **Data Processing Error Handling**

#### **Date Parsing (`DeviceTable.tsx:formatDate`)**

```typescript
const formatDate = (dateInput: string | DateObject) => {
  try {
    // Handle multiple date formats
    if (typeof dateInput === 'object' && dateInput?.DateTime) {
      return new Date(dateInput.DateTime).toLocaleDateString();
    }
    // Handle .NET date format: /Date(timestamp)/
    if (dateInput.includes('/Date(') && dateInput.includes(')/')) {
      const match = dateInput.match(/\/Date\((\d+)\)\//);
      if (match) {
        return new Date(parseInt(match[1])).toLocaleDateString();
      }
    }
    return new Date(dateInput).toLocaleDateString();
  } catch {
    return ''; // Graceful fallback for invalid dates
  }
};
```

#### **Location Detection (`deviceUtils.ts:determineLocation`)**

```typescript
const determineLocation = (deviceData: Device): string => {
  // Try multiple location sources
  if (deviceData.location) return deviceData.location;
  if (deviceData.Location) return deviceData.Location;
  if (deviceData.Site) return deviceData.Site;

  // IP-based location mapping with fallback
  const ip = deviceData.InternalIP || '';
  for (const location of locationMappings) {
    if (ip.startsWith(location.range)) {
      return location.name;
    }
  }

  return 'Unknown'; // Default fallback
};
```

### **UI Component Error Handling**

#### **FilterPanel Component**

- **Missing Device Data**: Handles empty device arrays gracefully
- **Undefined Properties**: Null-safe filtering and mapping
- **Invalid Filter States**: Validates filter combinations
- **Community Location Logic**: Handles partial selections and missing locations

#### **DeviceTable Component**

- **Missing Properties**: Default values for undefined device fields
- **Sorting Errors**: Handles mixed data types in sort operations
- **Rendering Issues**: Graceful handling of very long device names
- **Click Handlers**: Validates device objects before modal opening

#### **Export Functionality**

```typescript
export const exportToCSV = (data: unknown[], filename: string) => {
  if (data.length === 0) return; // Early exit for empty data

  try {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle special characters and null values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? ''; // Handle null/undefined
          })
          .join(',')
      ),
    ].join('\n');

    // Browser compatibility checks
    if (link.download !== undefined) {
      // Create and trigger download
    }
  } catch (error) {
    console.error('Export failed:', error);
    // Could integrate with toast notification system
  }
};
```

### **Test Environment Error Handling**

#### **Test Setup (`src/test/setup.ts`)**

- **Browser API Mocking**: Comprehensive mocking of unavailable APIs
- **DOM Compatibility**: JSDOM compatibility patches for modern React components
- **File API Simulation**: Mock implementations for testing file operations

```typescript
// Mock missing browser APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Fix JSDOM compatibility issues
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
}
```

### **Application-Level Error Boundaries**

#### **Toast Notification System**

- **User-Friendly Messages**: Converts technical errors to user-readable messages
- **Error Context**: Provides relevant information about what went wrong
- **Action Guidance**: Suggests next steps for error resolution

#### **State Management Error Handling**

- **Filter State Validation**: Ensures filter combinations are valid
- **Device State Consistency**: Maintains data integrity across operations
- **Memory Management**: Handles large device datasets efficiently

### **Network and Storage Error Handling**

#### **File System Interactions**

- **Permission Errors**: Handles read/write permission issues
- **Storage Limits**: Manages large file processing
- **Network Drives**: Handles files on network locations
- **Concurrent Access**: Manages multiple file operations

#### **Browser Compatibility**

- **API Availability**: Feature detection for modern browser APIs
- **Fallback Mechanisms**: Alternative implementations for older browsers
- **Progressive Enhancement**: Core functionality works without advanced features

### **Error Reporting and Debugging**

#### **Development Mode**

- **Detailed Error Messages**: Comprehensive error information in development
- **Stack Traces**: Full error context for debugging
- **Console Logging**: Strategic logging for troubleshooting

#### **Production Mode**

- **User-Friendly Errors**: Simplified error messages for end users
- **Error Boundaries**: Prevent application crashes
- **Graceful Degradation**: Maintain functionality when features fail

### **Error Recovery Strategies**

#### **Automatic Recovery**

- **Retry Mechanisms**: Automatic retry for transient failures
- **Default Values**: Sensible defaults when data is missing
- **State Reset**: Clean application state on critical errors

#### **User-Initiated Recovery**

- **Clear Data Button**: Reset application to initial state
- **Reload Functionality**: Re-upload files after errors
- **Filter Reset**: Return to default filter state

### **Testing Error Scenarios**

#### **Unit Test Error Coverage**

```typescript
// Example: Testing invalid JSON handling
it('should throw error for invalid JSON', async () => {
  const invalidJson = 'invalid json content';
  const file = new File([invalidJson], 'invalid.json');

  await expect(parseInventoryFiles([file])).rejects.toThrow('Invalid JSON format');
});
```

#### **Integration Test Error Coverage**

- **File Upload Failures**: Testing various file upload error scenarios
- **Data Processing Errors**: Malformed device data handling
- **UI Error States**: Component behavior during error conditions
- **Recovery Testing**: Ensuring error recovery mechanisms work

This comprehensive error handling strategy ensures the application remains stable and user-friendly even when encountering unexpected data or system conditions.
