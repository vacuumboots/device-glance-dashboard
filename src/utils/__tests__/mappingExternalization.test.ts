import { describe, it, expect } from 'vitest';
import { parseInventoryFiles } from '@features/inventory/services/localFileSource';

// Helper to create a FileList-like object for tests (the test setup provides a simple Array-based mock)
const toFileList = (files: File[]): FileList => files as unknown as FileList;

describe('mappingExternalization', () => {
  it('derives category from externalized device-category.json mapping', async () => {
    const sample = [
      {
        ComputerName: 'PC-01',
        Manufacturer: 'Dell',
        Model: 'Latitude 5400',
        OSName: 'Windows 10 Pro',
        WindowsVersion: 'Windows 10',
      },
    ];
    const file = new File([JSON.stringify(sample)], 'devices.json', { type: 'application/json' });
    const devices = await parseInventoryFiles(toFileList([file]), null);
    expect(devices[0].category).toBe('Laptop');
  });

  it('derives location from externalized ip-range mapping when no explicit location & no external mapping overrides', async () => {
    const sample = [
      {
        ComputerName: 'PC-02',
        Manufacturer: 'Dell',
        Model: 'OptiPlex 7070',
        InternalIP: '10.53.12.34',
        OSName: 'Windows 10 Pro',
        WindowsVersion: 'Windows 10',
      },
    ];
    const file = new File([JSON.stringify(sample)], 'devices2.json', { type: 'application/json' });
    const devices = await parseInventoryFiles(toFileList([file]), null);
    expect(devices[0].location).toBe('Site 2B');
  });
});
