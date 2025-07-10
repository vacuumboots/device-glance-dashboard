import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV } from '../exportUtils';

// Mock DOM APIs
const mockCreateElement = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();

describe('exportUtils', () => {
  beforeEach(() => {
    // Setup DOM mocks
    global.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as unknown as Document;

    global.URL = {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    } as unknown as Document;

    global.Blob = vi.fn().mockImplementation((content, options) => ({
      content,
      options,
    })) as unknown as typeof Blob;

    // Setup mock element
    const mockElement = {
      download: true,
      setAttribute: vi.fn(),
      style: {},
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockElement);
    mockCreateObjectURL.mockReturnValue('mock-url');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToCSV', () => {
    it('should export simple data to CSV', () => {
      const testData = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Los Angeles' },
      ];

      exportToCSV(testData, 'test.csv');

      // Verify Blob creation
      expect(global.Blob).toHaveBeenCalledWith(
        ['name,age,city\nJohn,30,New York\nJane,25,Los Angeles'],
        { type: 'text/csv;charset=utf-8;' }
      );

      // Verify element creation and setup
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should handle data with commas and quotes', () => {
      const testData = [
        { name: 'John, Jr.', description: 'A "smart" person' },
        { name: 'Jane', description: 'Regular person' },
      ];

      exportToCSV(testData, 'test.csv');

      expect(global.Blob).toHaveBeenCalledWith(
        ['name,description\n"John, Jr.","A ""smart"" person"\nJane,Regular person'],
        { type: 'text/csv;charset=utf-8;' }
      );
    });

    it('should handle empty data array', () => {
      exportToCSV([], 'test.csv');

      // Should not create any elements or blobs
      expect(global.Blob).not.toHaveBeenCalled();
      expect(mockCreateElement).not.toHaveBeenCalled();
    });

    it('should handle different data types', () => {
      const testData = [{ name: 'Test', count: 42, active: true, value: null, date: undefined }];

      exportToCSV(testData, 'test.csv');

      expect(global.Blob).toHaveBeenCalledWith(['name,count,active,value,date\nTest,42,true,,'], {
        type: 'text/csv;charset=utf-8;',
      });
    });

    it('should not download if download attribute is not supported', () => {
      const mockElement = {
        download: undefined,
        setAttribute: vi.fn(),
        style: {},
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockElement);

      const testData = [{ name: 'Test' }];
      exportToCSV(testData, 'test.csv');

      expect(mockClick).not.toHaveBeenCalled();
      expect(mockAppendChild).not.toHaveBeenCalled();
    });

    it('should set correct filename and attributes', () => {
      const testData = [{ name: 'Test' }];
      const filename = 'my-export.csv';

      const mockElement = {
        download: true,
        setAttribute: vi.fn(),
        style: {},
        click: mockClick,
      };
      mockCreateElement.mockReturnValue(mockElement);

      exportToCSV(testData, filename);

      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', filename);
      expect(mockElement.style.visibility).toBe('hidden');
    });
  });
});
