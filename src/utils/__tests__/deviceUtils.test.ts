import { describe, it, expect, beforeEach } from 'vitest';
import { parseInventoryFiles } from '@features/inventory/services/localFileSource';
import { filterDevices } from '@features/inventory/services/filterDevices';
import { DeviceSchema } from '@features/inventory/model/device.schema';
import { Device, FilterState } from '@features/inventory/model/device';

describe('deviceUtils', () => {
  describe('parseInventoryFiles', () => {
    it('should parse valid JSON inventory file', async () => {
      const mockData = {
        ComputerName: 'TEST-PC-001',
        Manufacturer: 'Dell Inc.',
        Model: 'OptiPlex 7070',
        OSName: 'Microsoft Windows 10 Pro',
        WindowsVersion: '10.0.19044',
        WindowsEdition: 'Pro',
        TotalRAMGB: 16,
        TotalStorageGB: 512,
        FreeStorageGB: 256,
        HardDriveType: 'SSD',
        TPMVersion: '2.0',
        SecureBootEnabled: true,
        JoinType: 'AzureAD',
        InternalIP: '10.52.1.100',
        LastBootUpTime: '/Date(1704067200000)/',
        HardwareHash: 'ABC123DEF456',
        SerialNumber: 'SN123456789',
      };

      const jsonContent = JSON.stringify(mockData);
      const buffer = new TextEncoder().encode(jsonContent);
      const file = new File([buffer], 'inventory.json', { type: 'application/json' });
      const fileList = [file] as unknown as FileList;

      // Mock TextDecoder
      const originalTextDecoder = global.TextDecoder;
      global.TextDecoder = class MockTextDecoder {
        decode(buffer: ArrayBuffer) {
          return new originalTextDecoder('utf-8').decode(buffer);
        }
      } as unknown as typeof TextDecoder;

      const devices = await parseInventoryFiles(fileList);

      expect(devices).toHaveLength(1);
      // Validate Zod schema acceptance
      expect(() => DeviceSchema.parse(devices[0])).not.toThrow();
      expect(devices[0]).toMatchObject({
        ComputerName: 'TEST-PC-001',
        Manufacturer: 'Dell Inc.',
        Model: 'OptiPlex 7070',
        category: 'Desktop',
        location: 'Site 1A', // Should be determined from IP 10.52.x.x (generic name without mapping)
      });
    });

    it('should handle array of devices in JSON file', async () => {
      const mockData = [
        {
          ComputerName: 'TEST-PC-001',
          Model: 'OptiPlex 7070',
          InternalIP: '10.52.1.100',
        },
        {
          ComputerName: 'TEST-PC-002',
          Model: 'Latitude 5400',
          InternalIP: '10.53.1.100',
        },
      ];

      const jsonContent = JSON.stringify(mockData);
      const buffer = new TextEncoder().encode(jsonContent);
      const file = new File([buffer], 'inventory.json', { type: 'application/json' });
      const fileList = [file] as unknown as FileList;

      const originalTextDecoder = global.TextDecoder;
      global.TextDecoder = class MockTextDecoder {
        decode(buffer: ArrayBuffer) {
          return new originalTextDecoder('utf-8').decode(buffer);
        }
      } as unknown as typeof TextDecoder;

      const devices = await parseInventoryFiles(fileList);

      expect(devices).toHaveLength(2);
      expect(devices[0].ComputerName).toBe('TEST-PC-001');
      expect(devices[0].category).toBe('Desktop');
      expect(devices[1].ComputerName).toBe('TEST-PC-002');
      expect(devices[1].category).toBe('Laptop');
    });

    it('coerces numeric and boolean-like fields via Zod schema', async () => {
      const mockData = {
        ComputerName: 'COERCE-PC',
        Manufacturer: 'Dell',
        Model: 'OptiPlex 7070',
        OSName: 'Windows 10',
        WindowsVersion: '10.0.19044',
        WindowsEdition: 'Pro',
        TotalRAMGB: '32',
        TotalStorageGB: '1024',
        FreeStorageGB: '512',
        HardDriveType: 'SSD',
        TPMVersion: '2.0',
        SecureBootEnabled: 'true',
        JoinType: 'AzureAD',
        InternalIP: '10.52.9.9',
        LastBootUpTime: '/Date(1704067200000)/',
        HardwareHash: 'HASH',
        SerialNumber: 'SN-1',
        canUpgradeToWin11: 'false',
        issues: ['x'],
      } as unknown as Device;

      const jsonContent = JSON.stringify(mockData);
      const buffer = new TextEncoder().encode(jsonContent);
      const file = new File([buffer], 'inventory.json', { type: 'application/json' });
      const fileList = [file] as unknown as FileList;

      const originalTextDecoder = global.TextDecoder;
      global.TextDecoder = class MockTextDecoder {
        decode(buffer: ArrayBuffer) {
          return new originalTextDecoder('utf-8').decode(buffer);
        }
      } as unknown as typeof TextDecoder;

      const devices = await parseInventoryFiles(fileList);

      expect(devices).toHaveLength(1);
      const d = devices[0] as any;
      expect(typeof d.TotalRAMGB).toBe('number');
      expect(typeof d.TotalStorageGB).toBe('number');
      expect(typeof d.FreeStorageGB).toBe('number');
      expect(typeof d.SecureBootEnabled).toBe('boolean');
      expect(typeof d.canUpgradeToWin11).toBe('boolean');

      // restore
      global.TextDecoder = originalTextDecoder as typeof TextDecoder;
    });

    it('should throw error for invalid JSON', async () => {
      const invalidJson = 'invalid json content';
      const buffer = new TextEncoder().encode(invalidJson);
      const file = new File([buffer], 'invalid.json', { type: 'application/json' });
      const fileList = [file] as unknown as FileList;

      const originalTextDecoder = global.TextDecoder;
      global.TextDecoder = class MockTextDecoder {
        decode(buffer: ArrayBuffer) {
          return new originalTextDecoder('utf-8').decode(buffer);
        }
      } as unknown as typeof TextDecoder;

      await expect(parseInventoryFiles(fileList)).rejects.toThrow('Invalid JSON format');
    });

    it('should handle nested TPM and SecureBoot info', async () => {
      const mockData = {
        ComputerName: 'TEST-PC-001',
        TPMInfo: {
          TPMVersion: '2.0',
        },
        SecureBootStatus: {
          SecureBootEnabled: true,
        },
      };

      const jsonContent = JSON.stringify(mockData);
      const buffer = new TextEncoder().encode(jsonContent);
      const file = new File([buffer], 'inventory.json', { type: 'application/json' });
      const fileList = [file] as unknown as FileList;

      const originalTextDecoder = global.TextDecoder;
      global.TextDecoder = class MockTextDecoder {
        decode(buffer: ArrayBuffer) {
          return new originalTextDecoder('utf-8').decode(buffer);
        }
      } as unknown as typeof TextDecoder;

      const devices = await parseInventoryFiles(fileList);

      expect(devices[0].TPMVersion).toBe('2.0');
      expect(devices[0].SecureBootEnabled).toBe(true);
    });

  it('detects and decodes UTF-16LE encoded inventory file', async () => {
      const mockData = {
        ComputerName: 'UTF16-PC',
        Model: 'Latitude 5400',
        InternalIP: '10.53.1.101',
        LastBootUpTime: '/Date(1704067200000)/',
      };
      const jsonContent = JSON.stringify(mockData);
      // Encode as UTF-16LE manually
      const utf16Buffer = new ArrayBuffer(jsonContent.length * 2);
      const view = new DataView(utf16Buffer);
      for (let i = 0; i < jsonContent.length; i++) {
        view.setUint16(i * 2, jsonContent.charCodeAt(i), true);
      }
      const file = new File([new Uint8Array(utf16Buffer)], 'utf16-inventory.json', {
        type: 'application/json',
      });
      const fileList = [file] as unknown as FileList;

  // Ensure TextDecoder honors encoding labels for this test
  const originalTD = global.TextDecoder;
  const { TextDecoder: NodeTextDecoder } = await import('node:util');
  (global as any).TextDecoder = NodeTextDecoder as unknown as typeof TextDecoder;

  const devices = await parseInventoryFiles(fileList);

  // restore
  (global as any).TextDecoder = originalTD as typeof TextDecoder;
  expect(devices).toHaveLength(1);
  expect(devices[0].ComputerName).toBe('UTF16-PC');
  expect(devices[0].Model).toBe('Latitude 5400');
    });
  });

  describe('filterDevices', () => {
    let mockDevices: Device[];
    let baseFilters: FilterState;

    beforeEach(() => {
      mockDevices = [
        {
          ComputerName: 'PC-001',
          Manufacturer: 'Dell Inc.',
          Model: 'OptiPlex 7070',
          OSName: 'Windows 10',
          WindowsVersion: '10.0.19044',
          WindowsEdition: 'Pro',
          TotalRAMGB: 16,
          TotalStorageGB: 512,
          FreeStorageGB: 256,
          HardDriveType: 'SSD',
          TPMVersion: '2.0',
          SecureBootEnabled: true,
          JoinType: 'AzureAD',
          InternalIP: '10.52.1.100',
          LastBootUpTime: '2024-01-01',
          HardwareHash: 'ABC123',
          canUpgradeToWin11: true,
          issues: [],
          location: 'Site 1A',
          category: 'Desktop',
        },
        {
          ComputerName: 'PC-002',
          Manufacturer: 'Dell Inc.',
          Model: 'Latitude 5400',
          OSName: 'Windows 10',
          WindowsVersion: '10.0.19044',
          WindowsEdition: 'Pro',
          TotalRAMGB: 8,
          TotalStorageGB: 256,
          FreeStorageGB: 15,
          HardDriveType: 'HDD',
          TPMVersion: 'None',
          SecureBootEnabled: false,
          JoinType: 'OnPremAD',
          InternalIP: '10.53.1.100',
          LastBootUpTime: '2024-01-01',
          HardwareHash: '',
          canUpgradeToWin11: false,
          issues: [],
          location: 'Red Deer Lake',
          category: 'Laptop',
        },
      ];

      baseFilters = {
        windows11Ready: 'all',
        tpmPresent: 'all',
        secureBootEnabled: 'all',
        lowStorage: 'all',
        joinType: 'all',
        deviceCategory: 'all',
        hashPresent: 'all',
        deviceModel: 'all',
        location: [],
        searchTerm: '',
      };
    });

    it('should return all devices when no filters are applied', () => {
      const result = filterDevices(mockDevices, baseFilters);
      expect(result).toHaveLength(2);
    });

    it('should filter by Windows 11 readiness', () => {
      const filters = { ...baseFilters, windows11Ready: 'ready' as const };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');

      const notReadyFilters = { ...baseFilters, windows11Ready: 'not-ready' as const };
      const notReadyResult = filterDevices(mockDevices, notReadyFilters);
      expect(notReadyResult).toHaveLength(1);
      expect(notReadyResult[0].ComputerName).toBe('PC-002');
    });

    it('should filter by TPM presence', () => {
      const filters = { ...baseFilters, tpmPresent: 'present' as const };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');

      const missingFilters = { ...baseFilters, tpmPresent: 'missing' as const };
      const missingResult = filterDevices(mockDevices, missingFilters);
      expect(missingResult).toHaveLength(1);
      expect(missingResult[0].ComputerName).toBe('PC-002');
    });

    it('should filter by Secure Boot status', () => {
      const filters = { ...baseFilters, secureBootEnabled: 'enabled' as const };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');

      const disabledFilters = { ...baseFilters, secureBootEnabled: 'disabled' as const };
      const disabledResult = filterDevices(mockDevices, disabledFilters);
      expect(disabledResult).toHaveLength(1);
      expect(disabledResult[0].ComputerName).toBe('PC-002');
    });

    it('should filter by storage availability', () => {
      const filters = { ...baseFilters, lowStorage: 'low' as const };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-002');

      const sufficientFilters = { ...baseFilters, lowStorage: 'sufficient' as const };
      const sufficientResult = filterDevices(mockDevices, sufficientFilters);
      expect(sufficientResult).toHaveLength(1);
      expect(sufficientResult[0].ComputerName).toBe('PC-001');
    });

    it('should filter by join type', () => {
      const filters = { ...baseFilters, joinType: 'AzureAD' as const };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');
    });

    it('should filter by device category', () => {
      const filters = { ...baseFilters, deviceCategory: 'Desktop' as const };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');

      const laptopFilters = { ...baseFilters, deviceCategory: 'Laptop' as const };
      const laptopResult = filterDevices(mockDevices, laptopFilters);
      expect(laptopResult).toHaveLength(1);
      expect(laptopResult[0].ComputerName).toBe('PC-002');
    });

    it('should filter by hash presence', () => {
      const filters = { ...baseFilters, hashPresent: 'present' as const };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');

      const missingFilters = { ...baseFilters, hashPresent: 'missing' as const };
      const missingResult = filterDevices(mockDevices, missingFilters);
      expect(missingResult).toHaveLength(1);
      expect(missingResult[0].ComputerName).toBe('PC-002');
    });

    it('should filter by device model', () => {
      const filters = { ...baseFilters, deviceModel: 'OptiPlex 7070' };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');

      const laptopFilters = { ...baseFilters, deviceModel: 'Latitude 5400' };
      const laptopResult = filterDevices(mockDevices, laptopFilters);
      expect(laptopResult).toHaveLength(1);
      expect(laptopResult[0].ComputerName).toBe('PC-002');
    });

    it('should filter by location', () => {
      const filters = { ...baseFilters, location: ['Site 1A'] };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');
    });

    it('should combine multiple filters', () => {
      const filters = {
        ...baseFilters,
        deviceCategory: 'Desktop' as const,
        tpmPresent: 'present' as const,
        secureBootEnabled: 'enabled' as const,
      };
      const result = filterDevices(mockDevices, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ComputerName).toBe('PC-001');

      // Conflicting filters should return no results
      const conflictingFilters = {
        ...baseFilters,
        deviceCategory: 'Desktop' as const,
        tpmPresent: 'missing' as const,
      };
      const conflictingResult = filterDevices(mockDevices, conflictingFilters);
      expect(conflictingResult).toHaveLength(0);
    });
  });
});
