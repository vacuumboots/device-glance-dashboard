import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Index from '../../pages/Index';
import { Device } from '../../types/device';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the toast hook
vi.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('End-to-End User Workflows', () => {
  const renderWithProvider = (ui: React.ReactNode) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  };
  const createMockInventoryFile = (devices: Device[]) => {
    const jsonContent = JSON.stringify(devices);
    const buffer = new TextEncoder().encode(jsonContent);
    return new File([buffer], 'company-inventory.json', { type: 'application/json' });
  };

  const sampleDevices: Device[] = [
    {
      ComputerName: 'FINANCE-PC-001',
      Manufacturer: 'Dell Inc.',
      Model: 'OptiPlex 7070',
      OSName: 'Windows 10 Pro',
      WindowsVersion: '10.0.19044',
      WindowsEdition: 'Pro',
      TotalRAMGB: 16,
      TotalStorageGB: 512,
      FreeStorageGB: 300,
      HardDriveType: 'SSD',
      TPMVersion: '2.0',
      SecureBootEnabled: true,
      JoinType: 'AzureAD',
      InternalIP: '10.52.1.100',
      LastBootUpTime: '/Date(1704067200000)/',
      HardwareHash: 'HASH001',
      SerialNumber: 'SN001',
      canUpgradeToWin11: true,
      issues: [],
      location: 'Big Rock',
      category: 'Desktop',
    },
    {
      ComputerName: 'HR-LAPTOP-001',
      Manufacturer: 'HP Inc.',
      Model: 'EliteBook 840',
      OSName: 'Windows 10 Pro',
      WindowsVersion: '10.0.19044',
      WindowsEdition: 'Pro',
      TotalRAMGB: 8,
      TotalStorageGB: 256,
      FreeStorageGB: 25,
      HardDriveType: 'SSD',
      TPMVersion: 'None',
      SecureBootEnabled: false,
      JoinType: 'OnPremAD',
      InternalIP: '10.53.1.100',
      LastBootUpTime: '/Date(1704153600000)/',
      HardwareHash: '',
      SerialNumber: 'SN002',
      canUpgradeToWin11: false,
      issues: ['TPM Missing', 'Secure Boot Disabled'],
      location: 'Red Deer Lake',
      category: 'Laptop',
    },
    {
      ComputerName: 'DEV-WORKSTATION-001',
      Manufacturer: 'Dell Inc.',
      Model: 'Precision 3660',
      OSName: 'Windows 11 Pro',
      WindowsVersion: '11.0.22000',
      WindowsEdition: 'Pro',
      TotalRAMGB: 32,
      TotalStorageGB: 1024,
      FreeStorageGB: 15,
      HardDriveType: 'SSD',
      TPMVersion: '2.0',
      SecureBootEnabled: true,
      JoinType: 'Hybrid',
      InternalIP: '10.52.1.200',
      LastBootUpTime: '/Date(1704240000000)/',
      HardwareHash: 'HASH002',
      SerialNumber: 'SN003',
      canUpgradeToWin11: true,
      issues: ['Low Storage'],
      location: 'Big Rock',
      category: 'Desktop',
    },
    {
      ComputerName: 'LEGACY-PC-001',
      Manufacturer: 'HP Inc.',
      Model: 'EliteDesk 800',
      OSName: 'Windows 7 Pro',
      WindowsVersion: '6.1.7601',
      WindowsEdition: 'Pro',
      TotalRAMGB: 4,
      TotalStorageGB: 120,
      FreeStorageGB: 10,
      HardDriveType: 'HDD',
      TPMVersion: 'None',
      SecureBootEnabled: false,
      JoinType: 'OnPremAD',
      InternalIP: '10.54.1.100',
      LastBootUpTime: '/Date(1703980800000)/',
      HardwareHash: '',
      SerialNumber: 'SN004',
      canUpgradeToWin11: false,
      issues: ['Unsupported OS', 'TPM Missing', 'Low RAM', 'Low Storage'],
      location: 'Westmount',
      category: 'Desktop',
    },
  ];

  beforeEach(() => {
    // Mock TextDecoder for file parsing
    global.TextDecoder = class MockTextDecoder {
      decode(buffer: ArrayBuffer) {
        return new TextDecoder('utf-8').decode(buffer);
      }
    } as unknown as typeof TextDecoder;

    // Mock CSV export functionality
    global.Blob = vi.fn().mockImplementation((content, options) => ({
      content,
      options,
    })) as unknown as typeof Blob;

    // Stub URL object URL creation (avoid real blob URLs in tests)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis.URL as any) = {
      createObjectURL: vi.fn(() => 'mock-url'),
      revokeObjectURL: vi.fn(),
    };
  });

  describe('Complete IT Audit Workflow', () => {
    it('should complete a full IT audit: upload, analyze, filter, and export', async () => {
      const user = userEvent.setup();

  renderWithProvider(<Index />);

      // Step 1: Upload inventory file
      const fileInput = screen.getByRole('button', { name: /browse files/i })
        .previousElementSibling as HTMLInputElement;

      const inventoryFile = createMockInventoryFile(sampleDevices);
      Object.defineProperty(fileInput, 'files', {
        value: [inventoryFile] as unknown as FileList,
      });
      fireEvent.change(fileInput);

      // Wait for file to load and verify device count
      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 4 shown')).toBeInTheDocument();
      });

      // Step 2: Analyze summary data
      expect(screen.getByText('Summary (4 devices loaded, 4 shown)')).toBeInTheDocument();

      // Verify all device names are visible in table
      expect(screen.getByText('FINANCE-PC-001')).toBeInTheDocument();
      expect(screen.getByText('HR-LAPTOP-001')).toBeInTheDocument();
      expect(screen.getByText('DEV-WORKSTATION-001')).toBeInTheDocument();
      expect(screen.getByText('LEGACY-PC-001')).toBeInTheDocument();

      // Step 3: Filter for Windows 11 upgrade planning
      const windows11Select = screen.getAllByRole('combobox')[0];
      await user.click(windows11Select);
      const notReadyOption = screen.getByText('Not Ready');
      await user.click(notReadyOption);

      // Should show 2 devices that can't upgrade
      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 2 shown')).toBeInTheDocument();
      });

      expect(screen.getByText('HR-LAPTOP-001')).toBeInTheDocument();
      expect(screen.getByText('LEGACY-PC-001')).toBeInTheDocument();
      expect(screen.queryByText('FINANCE-PC-001')).not.toBeInTheDocument();
      expect(screen.queryByText('DEV-WORKSTATION-001')).not.toBeInTheDocument();

      // Step 4: Further filter by storage issues
      const storageSelect = screen.getAllByRole('combobox')[3];
      await user.click(storageSelect);
      const lowStorageOption = screen.getByText('Less than 30 GB');
      await user.click(lowStorageOption);

      // Should show only devices with both issues
      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 2 shown')).toBeInTheDocument();
      });

      // Step 5: Export filtered results
  const exportButton = screen.getByRole('button', { name: /export full dataset/i });
      await user.click(exportButton);

      // Verify CSV export was triggered
      expect(global.Blob).toHaveBeenCalled();

      // Step 6: Reset filters to see all devices again
      const clearButton = screen.getByRole('button', { name: /clear data/i });
      await user.click(clearButton);

      expect(screen.getByText('Upload Device Inventory Files')).toBeInTheDocument();
      expect(screen.queryByText('devices loaded')).not.toBeInTheDocument();
    });
  });

  describe('Security Compliance Check Workflow', () => {
    it('should identify security compliance issues across the fleet', async () => {
      const user = userEvent.setup();

  renderWithProvider(<Index />);

      // Upload inventory
      const fileInput = screen.getByRole('button', { name: /browse files/i })
        .previousElementSibling as HTMLInputElement;

      const inventoryFile = createMockInventoryFile(sampleDevices);
      Object.defineProperty(fileInput, 'files', {
        value: [inventoryFile] as unknown as FileList,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 4 shown')).toBeInTheDocument();
      });

      // Check for TPM compliance
      const tpmSelect = screen.getAllByRole('combobox')[1];
      await user.click(tpmSelect);
      const tpmMissingOption = screen.getByText('Missing');
      await user.click(tpmMissingOption);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 2 shown')).toBeInTheDocument();
      });

      // Should show non-compliant devices
      expect(screen.getByText('HR-LAPTOP-001')).toBeInTheDocument();
      expect(screen.getByText('LEGACY-PC-001')).toBeInTheDocument();

  // Reset and check Secure Boot compliance - reopen TPM select then choose All
  const tpmSelectAgain = screen.getAllByRole('combobox')[1];
  await user.click(tpmSelectAgain);
  const allTpmOption = await screen.findByRole('option', { name: 'All' });
  await user.click(allTpmOption);

      const secureBootSelect = screen.getAllByRole('combobox')[2];
      await user.click(secureBootSelect);
      const secureBootDisabledOption = screen.getByText('Disabled');
      await user.click(secureBootDisabledOption);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 2 shown')).toBeInTheDocument();
      });

      // Same devices should be non-compliant
      expect(screen.getByText('HR-LAPTOP-001')).toBeInTheDocument();
      expect(screen.getByText('LEGACY-PC-001')).toBeInTheDocument();
    });
  });

  describe('Device Inventory by Location Workflow', () => {
    it('should filter and analyze devices by location', async () => {
      const user = userEvent.setup();

  renderWithProvider(<Index />);

      // Upload inventory
      const fileInput = screen.getByRole('button', { name: /browse files/i })
        .previousElementSibling as HTMLInputElement;

      const inventoryFile = createMockInventoryFile(sampleDevices);
      Object.defineProperty(fileInput, 'files', {
        value: [inventoryFile] as unknown as FileList,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 4 shown')).toBeInTheDocument();
      });

      // Filter by Big Rock location
      const bigRockCheckbox = screen.getByLabelText('Big Rock');
      await user.click(bigRockCheckbox);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 2 shown')).toBeInTheDocument();
      });

      expect(screen.getByText('FINANCE-PC-001')).toBeInTheDocument();
      expect(screen.getByText('DEV-WORKSTATION-001')).toBeInTheDocument();
      expect(screen.queryByText('HR-LAPTOP-001')).not.toBeInTheDocument();
      expect(screen.queryByText('LEGACY-PC-001')).not.toBeInTheDocument();

      // Check if one has storage issues
      const storageSelect = screen.getAllByRole('combobox')[3];
      await user.click(storageSelect);
      const lowStorageOption = screen.getByText('Less than 30 GB');
      await user.click(lowStorageOption);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 1 shown')).toBeInTheDocument();
      });

      expect(screen.getByText('DEV-WORKSTATION-001')).toBeInTheDocument();
      expect(screen.queryByText('FINANCE-PC-001')).not.toBeInTheDocument();
    });
  });

  describe('Device Model Analysis Workflow', () => {
    it('should analyze fleet composition by device model', async () => {
      const user = userEvent.setup();

  renderWithProvider(<Index />);

      // Upload inventory
      const fileInput = screen.getByRole('button', { name: /browse files/i })
        .previousElementSibling as HTMLInputElement;

      const inventoryFile = createMockInventoryFile(sampleDevices);
      Object.defineProperty(fileInput, 'files', {
        value: [inventoryFile] as unknown as FileList,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 4 shown')).toBeInTheDocument();
      });

      // Filter by specific device model
      const modelSelect = screen.getAllByRole('combobox')[7];
      await user.click(modelSelect);

  // Should see all available models (target options specifically to avoid table cell duplicates)
  expect(await screen.findByRole('option', { name: 'OptiPlex 7070' })).toBeInTheDocument();
  expect(await screen.findByRole('option', { name: 'EliteBook 840' })).toBeInTheDocument();
  expect(await screen.findByRole('option', { name: 'Precision 3660' })).toBeInTheDocument();
  expect(await screen.findByRole('option', { name: 'EliteDesk 800' })).toBeInTheDocument();

      // Select OptiPlex model
  const optiplexOption = await screen.findByRole('option', { name: 'OptiPlex 7070' });
      await user.click(optiplexOption);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 1 shown')).toBeInTheDocument();
      });

      expect(screen.getByText('FINANCE-PC-001')).toBeInTheDocument();
      expect(screen.queryByText('HR-LAPTOP-001')).not.toBeInTheDocument();
      expect(screen.queryByText('DEV-WORKSTATION-001')).not.toBeInTheDocument();
      expect(screen.queryByText('LEGACY-PC-001')).not.toBeInTheDocument();
    });
  });

  describe('Device Details Workflow', () => {
    it('should view detailed device information', async () => {
      const user = userEvent.setup();

  renderWithProvider(<Index />);

      // Upload inventory
      const fileInput = screen.getByRole('button', { name: /browse files/i })
        .previousElementSibling as HTMLInputElement;

      const inventoryFile = createMockInventoryFile(sampleDevices);
      Object.defineProperty(fileInput, 'files', {
        value: [inventoryFile] as unknown as FileList,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('4 devices loaded, 4 shown')).toBeInTheDocument();
      });

      // Click on a device row to view details
      const deviceRow = screen.getByText('FINANCE-PC-001').closest('tr');
      expect(deviceRow).toBeInTheDocument();

      if (deviceRow) {
        await user.click(deviceRow);

        // Device details modal should open
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

  // Should show device details within the modal dialog
  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getByText('FINANCE-PC-001')).toBeInTheDocument();
  expect(within(dialog).getByText('Dell Inc.')).toBeInTheDocument();
  expect(within(dialog).getByText('OptiPlex 7070')).toBeInTheDocument();

        // Close modal
        const closeButton = screen.getByRole('button', { name: /close/i });
        await user.click(closeButton);

        // Modal should close
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      }
    });
  });
});
