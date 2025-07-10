import { describe, it, expect } from 'vitest';
import { generateChartData } from '../chartUtils';
import { Device } from '../../types/device';

describe('chartUtils', () => {
  describe('generateChartData', () => {
    const mockDevices: Device[] = [
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
        location: 'Big Rock',
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
      {
        ComputerName: 'PC-003',
        Manufacturer: 'HP Inc.',
        Model: 'EliteBook 840',
        OSName: 'Windows 11',
        WindowsVersion: '11.0.22000',
        WindowsEdition: 'Pro',
        TotalRAMGB: 16,
        TotalStorageGB: 512,
        FreeStorageGB: 100,
        HardDriveType: 'SSD',
        TPMVersion: '2.0',
        SecureBootEnabled: true,
        JoinType: 'AzureAD',
        InternalIP: '10.52.1.101',
        LastBootUpTime: '2024-01-01',
        HardwareHash: 'DEF456',
        canUpgradeToWin11: true,
        issues: [],
        location: 'Big Rock',
        category: 'Laptop',
      },
    ];

    it('should generate chart data for device categories', () => {
      const mapping = {
        Desktop: { name: 'Desktop Computers', color: '#3b82f6' },
        Laptop: { name: 'Laptop Computers', color: '#10b981' },
        Other: { name: 'Other Devices', color: '#f59e0b' },
      };

      const result = generateChartData(mockDevices, 'category', mapping);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        {
          name: 'Desktop Computers',
          value: 1,
          percentage: 33,
          color: '#3b82f6',
        },
        {
          name: 'Laptop Computers',
          value: 2,
          percentage: 67,
          color: '#10b981',
        },
      ]);
    });

    it('should generate chart data for join types', () => {
      const mapping = {
        AzureAD: { name: 'Azure AD', color: '#0ea5e9' },
        OnPremAD: { name: 'On-Premises AD', color: '#8b5cf6' },
        Hybrid: { name: 'Hybrid Join', color: '#06b6d4' },
        None: { name: 'Workgroup', color: '#6b7280' },
      };

      const result = generateChartData(mockDevices, 'JoinType', mapping);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        {
          name: 'Azure AD',
          value: 2,
          percentage: 67,
          color: '#0ea5e9',
        },
        {
          name: 'On-Premises AD',
          value: 1,
          percentage: 33,
          color: '#8b5cf6',
        },
      ]);
    });

    it('should handle unmapped values with default color', () => {
      const mapping = {
        Desktop: { name: 'Desktop Computers', color: '#3b82f6' },
        // Laptop not mapped
      };

      const result = generateChartData(mockDevices, 'category', mapping);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Desktop Computers',
        value: 1,
        percentage: 33,
        color: '#3b82f6',
      });
      expect(result[1]).toEqual({
        name: 'Laptop', // Uses original key as name
        value: 2,
        percentage: 67,
        color: '#6b7280', // Default color
      });
    });

    it('should handle boolean fields', () => {
      const mapping = {
        true: { name: 'Enabled', color: '#10b981' },
        false: { name: 'Disabled', color: '#ef4444' },
      };

      const result = generateChartData(mockDevices, 'SecureBootEnabled', mapping);

      expect(result).toHaveLength(2);
      // Sort results by name for consistent testing
      const sortedResult = result.sort((a, b) => a.name.localeCompare(b.name));
      expect(sortedResult).toEqual([
        {
          name: 'Disabled',
          value: 1,
          percentage: 33,
          color: '#ef4444',
        },
        {
          name: 'Enabled',
          value: 2,
          percentage: 67,
          color: '#10b981',
        },
      ]);
    });

    it('should handle empty device array', () => {
      const mapping = {
        Desktop: { name: 'Desktop Computers', color: '#3b82f6' },
      };

      const result = generateChartData([], 'category', mapping);

      expect(result).toEqual([]);
    });

    it('should handle null/undefined field values', () => {
      const devicesWithNulls: Device[] = [
        {
          ...mockDevices[0],
          category: undefined,
        },
        {
          ...mockDevices[1],
          category: undefined,
        },
      ];

      const mapping = {
        Desktop: { name: 'Desktop Computers', color: '#3b82f6' },
        '': { name: 'Unknown', color: '#6b7280' },
      };

      const result = generateChartData(devicesWithNulls, 'category', mapping);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Unknown',
        value: 2,
        percentage: 100,
        color: '#6b7280',
      });
    });

    it('should calculate correct percentages with rounding', () => {
      // Create data that would result in 33.33% percentages
      const threeDevices = mockDevices;
      const mapping = {
        Desktop: { name: 'Desktop', color: '#3b82f6' },
        Laptop: { name: 'Laptop', color: '#10b981' },
      };

      const result = generateChartData(threeDevices, 'category', mapping);

      // Should round 33.33% to 33% and 66.67% to 67%
      const percentages = result.map((item) => item.percentage);
      expect(percentages).toEqual([33, 67]);

      // Verify the total doesn't exceed 100% significantly
      const total = percentages.reduce((sum, pct) => sum + pct, 0);
      expect(total).toBe(100);
    });

    it('should handle numeric fields', () => {
      const mapping = {
        '8': { name: '8 GB', color: '#ef4444' },
        '16': { name: '16 GB', color: '#10b981' },
      };

      const result = generateChartData(mockDevices, 'TotalRAMGB', mapping);

      expect(result).toHaveLength(2);
      // Sort results by value for consistent testing
      const sortedResult = result.sort((a, b) => a.value - b.value);
      expect(sortedResult).toEqual([
        {
          name: '8 GB',
          value: 1,
          percentage: 33,
          color: '#ef4444',
        },
        {
          name: '16 GB',
          value: 2,
          percentage: 67,
          color: '#10b981',
        },
      ]);
    });
  });
});
