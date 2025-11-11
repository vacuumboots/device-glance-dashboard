import { describe, it, expect } from 'vitest';
import { filterDevices } from '../deviceUtils';
import type { Device, FilterState } from '@/types/device';
import { useFilteredDevices } from '@/hooks/useFilteredDevices';
import { renderHook, act } from '@testing-library/react';

// Minimal mock devices
const devices: Device[] = [
  {
    ComputerName: 'PC-1',
    Manufacturer: 'Dell',
    Model: 'XPS',
    OSName: 'Windows 11',
    WindowsVersion: '23H2',
    WindowsEdition: 'Pro',
    TotalRAMGB: 16,
    TotalStorageGB: 512,
    FreeStorageGB: 200,
    HardDriveType: 'SSD',
    TPMVersion: '2.0',
    SecureBootEnabled: true,
    JoinType: 'AAD',
    InternalIP: '10.0.0.1',
    LastBootUpTime: new Date().toISOString(),
    HardwareHash: 'hash1',
    canUpgradeToWin11: true,
    issues: [],
    location: 'HQ',
    CollectionDate: new Date().toISOString(),
    category: 'Laptop'
  },
  {
    ComputerName: 'PC-2',
    Manufacturer: 'HP',
    Model: 'Elite',
    OSName: 'Windows 10',
    WindowsVersion: '22H2',
    WindowsEdition: 'Enterprise',
    TotalRAMGB: 8,
    TotalStorageGB: 256,
    FreeStorageGB: 50,
    HardDriveType: 'SSD',
    TPMVersion: '2.0',
    SecureBootEnabled: true,
    JoinType: 'AAD',
    InternalIP: '10.0.0.2',
    LastBootUpTime: new Date().toISOString(),
    HardwareHash: 'hash2',
    canUpgradeToWin11: false,
    issues: [],
    location: 'Remote',
    CollectionDate: new Date().toISOString(),
    category: 'Desktop'
  }
];

const baseFilters: FilterState = {
  windows11Ready: 'all',
  tpmPresent: 'all',
  secureBootEnabled: 'all',
  lowStorage: 'all',
  joinType: 'all',
  deviceCategory: 'all',
  hashPresent: 'all',
  deviceModel: 'all',
  location: [],
  searchTerm: ''
};

describe('filterDevices memoization strategy', () => {
  it('returns same array reference when inputs unchanged via hook', () => {
    const { result, rerender } = renderHook(({ list, filters }) => useFilteredDevices(list, filters), {
      initialProps: { list: devices, filters: baseFilters }
    });
    const first = result.current;
    rerender({ list: devices, filters: { ...baseFilters } }); // shallow clone identical semantic content
    const second = result.current;
    expect(second).toBe(first); // memoized by stable hash
  });

  it('produces a new array when filters change semantically', () => {
    const { result, rerender } = renderHook(({ list, filters }) => useFilteredDevices(list, filters), {
      initialProps: { list: devices, filters: baseFilters }
    });
    const first = result.current;
    rerender({ list: devices, filters: { ...baseFilters, windows11Ready: 'ready' } });
    const second = result.current;
    expect(second).not.toBe(first);
  });
});
