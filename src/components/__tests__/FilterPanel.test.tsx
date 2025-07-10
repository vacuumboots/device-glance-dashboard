import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from '../FilterPanel';
import { Device, FilterState } from '../../types/device';

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
];

const defaultFilters: FilterState = {
  windows11Ready: 'all',
  tpmPresent: 'all',
  secureBootEnabled: 'all',
  lowStorage: 'all',
  joinType: 'all',
  deviceCategory: 'all',
  hashPresent: 'all',
  deviceModel: 'all',
  location: [],
};

describe('FilterPanel', () => {
  it('should render all filter labels', () => {
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={mockDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Windows 11 Ready')).toBeInTheDocument();
    expect(screen.getByText('TPM')).toBeInTheDocument();
    expect(screen.getByText('Secure Boot')).toBeInTheDocument();
    expect(screen.getByText('Free Storage')).toBeInTheDocument();
    expect(screen.getByText('Join Type')).toBeInTheDocument();
    expect(screen.getByText('Device Category')).toBeInTheDocument();
    expect(screen.getByText('Hash Present')).toBeInTheDocument();
    expect(screen.getByText('Device Model')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
  });

  it('should populate device model options from provided devices', () => {
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={mockDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Find and click the device model select to open it
    const deviceModelSelect = screen.getByRole('combobox', { name: '' });
    fireEvent.click(deviceModelSelect);

    // Check that device model options are present
    expect(screen.getByText('OptiPlex 7070')).toBeInTheDocument();
    expect(screen.getByText('Latitude 5400')).toBeInTheDocument();
  });

  it('should call onFiltersChange when Windows 11 Ready filter changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={mockDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Find Windows 11 Ready select trigger and click it
    const windows11Select = screen.getAllByRole('combobox')[0];
    await user.click(windows11Select);

    // Click on "Ready" option
    const readyOption = screen.getByText('Ready');
    await user.click(readyOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      windows11Ready: 'Ready',
    });
  });

  it('should call onFiltersChange when TPM filter changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={mockDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Find TPM select trigger and click it
    const tpmSelect = screen.getAllByRole('combobox')[1];
    await user.click(tpmSelect);

    // Click on "Present" option
    const presentOption = screen.getByText('Present');
    await user.click(presentOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      tpmPresent: 'Present',
    });
  });

  it('should display location checkboxes for community groups', () => {
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={mockDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Check that community groups are displayed
    expect(screen.getByText('Okotoks')).toBeInTheDocument();
    expect(screen.getByText('Okotoks Area')).toBeInTheDocument();

    // Check that individual location checkboxes are displayed
    expect(screen.getByText('Big Rock')).toBeInTheDocument();
    expect(screen.getByText('Red Deer Lake')).toBeInTheDocument();
  });

  it('should handle location checkbox changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={mockDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Find and click the "Big Rock" checkbox
    const bigRockCheckbox = screen.getByLabelText('Big Rock');
    await user.click(bigRockCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      location: ['Big Rock'],
    });
  });

  it('should handle community group checkbox changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={mockDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Find and click the "Okotoks" community checkbox
    const okotoksCheckbox = screen.getByLabelText('Okotoks');
    await user.click(okotoksCheckbox);

    // Should select all Okotoks locations that exist in the device data
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      location: ['Big Rock'], // Only Big Rock exists in mock data under Okotoks
    });
  });

  it('should reflect current filter values in UI', () => {
    const mockOnFiltersChange = vi.fn();
    const activeFilters: FilterState = {
      ...defaultFilters,
      windows11Ready: 'ready',
      tpmPresent: 'present',
      location: ['Big Rock'],
    };

    render(
      <FilterPanel
        devices={mockDevices}
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Check that Big Rock checkbox is checked
    const bigRockCheckbox = screen.getByLabelText('Big Rock') as HTMLInputElement;
    expect(bigRockCheckbox.checked).toBe(true);
  });

  it('should show community checkbox as indeterminate when partially selected', () => {
    const mockOnFiltersChange = vi.fn();

    // Create devices that include multiple Okotoks locations
    const extendedDevices: Device[] = [
      ...mockDevices,
      {
        ...mockDevices[0],
        ComputerName: 'PC-003',
        location: 'Dr. Morris Gibson',
      },
    ];

    const partialFilters: FilterState = {
      ...defaultFilters,
      location: ['Big Rock'], // Only one of the Okotoks locations
    };

    render(
      <FilterPanel
        devices={extendedDevices}
        filters={partialFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // The Okotoks community checkbox should show as indeterminate
    const okotoksCheckbox = screen.getByLabelText('Okotoks') as HTMLInputElement;
    expect(okotoksCheckbox.indeterminate).toBe(true);
  });

  it('should handle device model filter changes', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={mockDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Find device model select - it should be the last combobox
    const deviceModelSelect = screen.getAllByRole('combobox')[7]; // 8th select (0-indexed)
    await user.click(deviceModelSelect);

    // Click on a specific model
    const optiplexOption = screen.getByText('OptiPlex 7070');
    await user.click(optiplexOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      deviceModel: 'OptiPlex 7070',
    });
  });

  it('should sort device models alphabetically', () => {
    const unsortedDevices: Device[] = [
      { ...mockDevices[0], Model: 'ZZZ Model' },
      { ...mockDevices[1], Model: 'AAA Model' },
      { ...mockDevices[0], Model: 'MMM Model' },
    ];

    const mockOnFiltersChange = vi.fn();

    render(
      <FilterPanel
        devices={unsortedDevices}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Open device model select
    const deviceModelSelect = screen.getAllByRole('combobox')[7];
    fireEvent.click(deviceModelSelect);

    // Get all model options (excluding "All")
    const modelOptions = screen.getAllByRole('option').slice(1);
    const modelTexts = modelOptions.map((option) => option.textContent);

    expect(modelTexts).toEqual(['AAA Model', 'MMM Model', 'ZZZ Model']);
  });
});
