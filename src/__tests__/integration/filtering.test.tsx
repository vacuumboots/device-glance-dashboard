import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Index from '../../pages/Index';
import { Device } from '../../types/device';

// Mock the toast hook
vi.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Filtering Integration Tests', () => {
  const createMockFile = (devices: Device[]) => {
    const jsonContent = JSON.stringify(devices);
    const buffer = new TextEncoder().encode(jsonContent);
    return new File([buffer], 'test-devices.json', { type: 'application/json' });
  };

  const mockDevices: Device[] = [
    {
      ComputerName: 'DESKTOP-001',
      Manufacturer: 'Dell Inc.',
      Model: 'OptiPlex 7070',
      OSName: 'Windows 10 Pro',
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
      canUpgradeToWin11: true,
      issues: [],
      location: 'Big Rock',
      category: 'Desktop',
    },
    {
      ComputerName: 'LAPTOP-001',
      Manufacturer: 'HP Inc.',
      Model: 'Latitude 5400',
      OSName: 'Windows 10 Pro',
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
      LastBootUpTime: '/Date(1704153600000)/',
      HardwareHash: '',
      canUpgradeToWin11: false,
      issues: ['Low Storage'],
      location: 'Red Deer Lake',
      category: 'Laptop',
    },
    {
      ComputerName: 'WORKSTATION-001',
      Manufacturer: 'Dell Inc.',
      Model: 'Precision 3660',
      OSName: 'Windows 11 Pro',
      WindowsVersion: '11.0.22000',
      WindowsEdition: 'Pro',
      TotalRAMGB: 32,
      TotalStorageGB: 1024,
      FreeStorageGB: 500,
      HardDriveType: 'SSD',
      TPMVersion: '2.0',
      SecureBootEnabled: true,
      JoinType: 'Hybrid',
      InternalIP: '10.52.1.200',
      LastBootUpTime: '/Date(1704240000000)/',
      HardwareHash: 'XYZ789ABC123',
      canUpgradeToWin11: true,
      issues: [],
      location: 'Big Rock',
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
  });

  it('should filter devices by Windows 11 readiness', async () => {
    const user = userEvent.setup();

    render(<Index />);

    // Upload test file
    const fileInput = screen.getByRole('button', { name: /browse files/i })
      .previousElementSibling as HTMLInputElement;

    const file = createMockFile(mockDevices);
    Object.defineProperty(fileInput, 'files', {
      value: [file] as unknown as FileList,
    });
    fireEvent.change(fileInput);

    // Wait for devices to load
    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 3 shown')).toBeInTheDocument();
    });

    // Apply Windows 11 Ready filter
    const windows11Select = screen.getAllByRole('combobox')[0];
    await user.click(windows11Select);

    const readyOption = screen.getByText('Ready');
    await user.click(readyOption);

    // Should show only 2 devices (DESKTOP-001 and WORKSTATION-001)
    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 2 shown')).toBeInTheDocument();
    });

    // Verify correct devices are shown
    expect(screen.getByText('DESKTOP-001')).toBeInTheDocument();
    expect(screen.getByText('WORKSTATION-001')).toBeInTheDocument();
    expect(screen.queryByText('LAPTOP-001')).not.toBeInTheDocument();
  });

  it('should filter devices by device category', async () => {
    const user = userEvent.setup();

    render(<Index />);

    // Upload test file
    const fileInput = screen.getByRole('button', { name: /browse files/i })
      .previousElementSibling as HTMLInputElement;

    const file = createMockFile(mockDevices);
    Object.defineProperty(fileInput, 'files', {
      value: [file] as unknown as FileList,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 3 shown')).toBeInTheDocument();
    });

    // Apply Device Category filter to show only Laptops
    const categorySelect = screen.getAllByRole('combobox')[5]; // Device Category is 6th select
    await user.click(categorySelect);

    const laptopOption = screen.getByText('Laptop');
    await user.click(laptopOption);

    // Should show only 1 device (LAPTOP-001)
    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 1 shown')).toBeInTheDocument();
    });

    expect(screen.getByText('LAPTOP-001')).toBeInTheDocument();
    expect(screen.queryByText('DESKTOP-001')).not.toBeInTheDocument();
    expect(screen.queryByText('WORKSTATION-001')).not.toBeInTheDocument();
  });

  it('should filter devices by device model', async () => {
    const user = userEvent.setup();

    render(<Index />);

    // Upload test file
    const fileInput = screen.getByRole('button', { name: /browse files/i })
      .previousElementSibling as HTMLInputElement;

    const file = createMockFile(mockDevices);
    Object.defineProperty(fileInput, 'files', {
      value: [file] as unknown as FileList,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 3 shown')).toBeInTheDocument();
    });

    // Apply Device Model filter
  const modelSelect = screen.getAllByRole('combobox')[7]; // Device Model is 8th select
    await user.click(modelSelect);

  // Disambiguate option from table cell by targeting role=option
  const optiplexOption = await screen.findByRole('option', { name: 'OptiPlex 7070' });
  await user.click(optiplexOption);

    // Should show only 1 device (DESKTOP-001)
    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 1 shown')).toBeInTheDocument();
    });

    expect(screen.getByText('DESKTOP-001')).toBeInTheDocument();
    expect(screen.queryByText('LAPTOP-001')).not.toBeInTheDocument();
    expect(screen.queryByText('WORKSTATION-001')).not.toBeInTheDocument();
  });

  it('should combine multiple filters correctly', async () => {
    const user = userEvent.setup();

    render(<Index />);

    // Upload test file
    const fileInput = screen.getByRole('button', { name: /browse files/i })
      .previousElementSibling as HTMLInputElement;

    const file = createMockFile(mockDevices);
    Object.defineProperty(fileInput, 'files', {
      value: [file] as unknown as FileList,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 3 shown')).toBeInTheDocument();
    });

    // Apply TPM Present filter
    const tpmSelect = screen.getAllByRole('combobox')[1];
    await user.click(tpmSelect);
    const tpmPresentOption = screen.getByText('Present');
    await user.click(tpmPresentOption);

    // Apply Secure Boot Enabled filter
    const secureBootSelect = screen.getAllByRole('combobox')[2];
    await user.click(secureBootSelect);
    const secureBootEnabledOption = screen.getByText('Enabled');
    await user.click(secureBootEnabledOption);

    // Should show only 2 devices (DESKTOP-001 and WORKSTATION-001)
    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 2 shown')).toBeInTheDocument();
    });

    expect(screen.getByText('DESKTOP-001')).toBeInTheDocument();
    expect(screen.getByText('WORKSTATION-001')).toBeInTheDocument();
    expect(screen.queryByText('LAPTOP-001')).not.toBeInTheDocument();
  });

  it('should filter by location using checkboxes', async () => {
    const user = userEvent.setup();

    render(<Index />);

    // Upload test file
    const fileInput = screen.getByRole('button', { name: /browse files/i })
      .previousElementSibling as HTMLInputElement;

    const file = createMockFile(mockDevices);
    Object.defineProperty(fileInput, 'files', {
      value: [file] as unknown as FileList,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 3 shown')).toBeInTheDocument();
    });

    // Click on Big Rock location checkbox
    const bigRockCheckbox = screen.getByLabelText('Big Rock');
    await user.click(bigRockCheckbox);

    // Should show only 2 devices (DESKTOP-001 and WORKSTATION-001 at Big Rock)
    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 2 shown')).toBeInTheDocument();
    });

    expect(screen.getByText('DESKTOP-001')).toBeInTheDocument();
    expect(screen.getByText('WORKSTATION-001')).toBeInTheDocument();
    expect(screen.queryByText('LAPTOP-001')).not.toBeInTheDocument();
  });

  it('should clear filters when Clear Data button is clicked', async () => {
    const user = userEvent.setup();

    render(<Index />);

    // Upload test file
    const fileInput = screen.getByRole('button', { name: /browse files/i })
      .previousElementSibling as HTMLInputElement;

    const file = createMockFile(mockDevices);
    Object.defineProperty(fileInput, 'files', {
      value: [file] as unknown as FileList,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 3 shown')).toBeInTheDocument();
    });

    // Apply a filter
    const categorySelect = screen.getAllByRole('combobox')[5];
    await user.click(categorySelect);
    const laptopOption = screen.getByText('Laptop');
    await user.click(laptopOption);

    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 1 shown')).toBeInTheDocument();
    });

    // Clear data
    const clearButton = screen.getByRole('button', { name: /clear data/i });
    await user.click(clearButton);

    // Should return to initial state
    expect(screen.queryByText('devices loaded')).not.toBeInTheDocument();
    expect(screen.getByText('Upload Device Inventory Files')).toBeInTheDocument();
  });

  it('should update summary charts when filters are applied', async () => {
    const user = userEvent.setup();

    render(<Index />);

    // Upload test file
    const fileInput = screen.getByRole('button', { name: /browse files/i })
      .previousElementSibling as HTMLInputElement;

    const file = createMockFile(mockDevices);
    Object.defineProperty(fileInput, 'files', {
      value: [file] as unknown as FileList,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 3 shown')).toBeInTheDocument();
    });

    // Verify summary section is present
    expect(screen.getByText('Summary (3 devices loaded, 3 shown)')).toBeInTheDocument();

    // Apply a filter
    const categorySelect = screen.getAllByRole('combobox')[5];
    await user.click(categorySelect);
    const desktopOption = screen.getByText('Desktop');
    await user.click(desktopOption);

    // Summary should update to reflect filtered devices
    await waitFor(() => {
      expect(screen.getByText('Summary (3 devices loaded, 2 shown)')).toBeInTheDocument();
    });
  });

  it('should show no devices when conflicting filters are applied', async () => {
    const user = userEvent.setup();

    render(<Index />);

    // Upload test file
    const fileInput = screen.getByRole('button', { name: /browse files/i })
      .previousElementSibling as HTMLInputElement;

    const file = createMockFile(mockDevices);
    Object.defineProperty(fileInput, 'files', {
      value: [file] as unknown as FileList,
    });
    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 3 shown')).toBeInTheDocument();
    });

    // Apply conflicting filters: Windows 11 Ready = Yes AND TPM = Missing
    const windows11Select = screen.getAllByRole('combobox')[0];
    await user.click(windows11Select);
    const readyOption = screen.getByText('Ready');
    await user.click(readyOption);

    const tpmSelect = screen.getAllByRole('combobox')[1];
    await user.click(tpmSelect);
    const tpmMissingOption = screen.getByText('Missing');
    await user.click(tpmMissingOption);

    // Should show 0 devices
    await waitFor(() => {
      expect(screen.getByText('3 devices loaded, 0 shown')).toBeInTheDocument();
    });

    // No device rows should be visible in table
    expect(screen.queryByText('DESKTOP-001')).not.toBeInTheDocument();
    expect(screen.queryByText('LAPTOP-001')).not.toBeInTheDocument();
    expect(screen.queryByText('WORKSTATION-001')).not.toBeInTheDocument();
  });
});
