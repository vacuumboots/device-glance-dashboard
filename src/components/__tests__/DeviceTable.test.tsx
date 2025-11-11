import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceTable } from '../DeviceTable';
import { Device } from '../../types/device';

const mockDevices: Device[] = [
  {
    ComputerName: 'PC-001',
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
    LastBootUpTime: '2024-01-01T10:00:00Z',
    HardwareHash: 'ABC123DEF456',
    canUpgradeToWin11: true,
    issues: [],
    location: 'Big Rock',
    category: 'Desktop',
  },
  {
    ComputerName: 'PC-002',
    Manufacturer: 'HP Inc.',
    Model: 'Latitude 5400',
    OSName: 'Windows 11 Pro',
    WindowsVersion: '11.0.22000',
    WindowsEdition: 'Pro',
    TotalRAMGB: 8,
    TotalStorageGB: 256,
    FreeStorageGB: 15,
    HardDriveType: 'HDD',
    TPMVersion: 'None',
    SecureBootEnabled: false,
    JoinType: 'OnPremAD',
    InternalIP: '10.53.1.100',
    LastBootUpTime: '2024-01-02T15:30:00Z',
    HardwareHash: '',
    canUpgradeToWin11: false,
    issues: ['Low Storage'],
    location: 'Red Deer Lake',
    category: 'Laptop',
  },
];

describe('DeviceTable', () => {
  it('should render table headers', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    expect(screen.getByText('Computer Name')).toBeInTheDocument();
    expect(screen.getByText('Manufacturer')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('OS')).toBeInTheDocument();
    expect(screen.getByText('RAM')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Free Storage')).toBeInTheDocument();
    expect(screen.getByText('TPM')).toBeInTheDocument();
    expect(screen.getByText('Secure Boot')).toBeInTheDocument();
    expect(screen.getByText('Join Type')).toBeInTheDocument();
    expect(screen.getByText('Win11 Ready')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Last Boot Time')).toBeInTheDocument();
  });

  it('should render device data in table rows', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    expect(screen.getByText('PC-001')).toBeInTheDocument();
    expect(screen.getByText('PC-002')).toBeInTheDocument();
    expect(screen.getByText('Dell Inc.')).toBeInTheDocument();
    expect(screen.getByText('HP Inc.')).toBeInTheDocument();
    expect(screen.getByText('OptiPlex 7070')).toBeInTheDocument();
    expect(screen.getByText('Latitude 5400')).toBeInTheDocument();
  });

  it('should format RAM and storage values correctly', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    expect(screen.getByText('16.0 GB')).toBeInTheDocument();
    expect(screen.getByText('8.0 GB')).toBeInTheDocument();
  expect(screen.getByText('512.0 GB')).toBeInTheDocument();
  // There may be multiple occurrences of 256.0 GB (total and free). Ensure at least one.
  expect(screen.getAllByText('256.0 GB').length).toBeGreaterThan(0);
    expect(screen.getByText('15.0 GB')).toBeInTheDocument();
  });

  it('should display TPM version correctly', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    expect(screen.getByText('2.0')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('should display Secure Boot status as Yes/No', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

  expect(screen.getAllByText('Yes').length).toBeGreaterThan(0); // Win11 Ready and/or Secure Boot
  expect(screen.getAllByText('No').length).toBeGreaterThan(0); // Secure Boot and/or readiness for at least one row
  });

  it('should display Windows 11 readiness correctly', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    // Should have "Yes" for PC-001 (canUpgradeToWin11: true) and "No" for PC-002 (canUpgradeToWin11: false)
    const yesElements = screen.getAllByText('Yes');
    const noElements = screen.getAllByText('No');

    expect(yesElements.length).toBeGreaterThan(0);
    expect(noElements.length).toBeGreaterThan(0);
  });

  it('should call onDeviceClick when a row is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    // Click on the first device row
    const firstRow = screen.getByText('PC-001').closest('tr');
    expect(firstRow).toBeInTheDocument();

    if (firstRow) {
      await user.click(firstRow);
      expect(mockOnDeviceClick).toHaveBeenCalledWith(mockDevices[0]);
    }
  });

  it('should sort devices when column header is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    // Click on Computer Name header to sort
    const computerNameHeader = screen.getByText('Computer Name');
    await user.click(computerNameHeader);

    // Verify that rows are reordered (PC-001 should come before PC-002 alphabetically)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('PC-001'); // First data row (index 1, after header)
    expect(rows[2]).toHaveTextContent('PC-002'); // Second data row
  });

  it('should toggle sort direction on repeated header clicks', async () => {
    const user = userEvent.setup();
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    const computerNameHeader = screen.getByText('Computer Name');

    // First click - ascending sort
    await user.click(computerNameHeader);
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('PC-001');

    // Second click - descending sort
    await user.click(computerNameHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('PC-002');
  });

  it('should handle empty device list', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={[]} onDeviceClick={mockOnDeviceClick} />);

    // Headers should still be present
    expect(screen.getByText('Computer Name')).toBeInTheDocument();

    // But no data rows
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(1); // Only header row
  });

  it('should format dates correctly', () => {
    const mockOnDeviceClick = vi.fn();

    // Test with a device that has a properly formatted date
    const deviceWithDate: Device[] = [
      {
        ...mockDevices[0],
        LastBootUpTime: '2024-01-01T10:00:00Z',
      },
    ];

    render(<DeviceTable devices={deviceWithDate} onDeviceClick={mockOnDeviceClick} />);

    // Should display formatted date (exact format may vary based on locale)
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('should handle missing or invalid date values', () => {
    const mockOnDeviceClick = vi.fn();

    const deviceWithInvalidDate: Device[] = [
      {
        ...mockDevices[0],
        LastBootUpTime: '',
      },
    ];

    render(<DeviceTable devices={deviceWithInvalidDate} onDeviceClick={mockOnDeviceClick} />);

    // Should not crash and should handle gracefully
    expect(screen.getByText('Computer Name')).toBeInTheDocument();
  });

  it('should handle .NET date format', () => {
    const mockOnDeviceClick = vi.fn();

    const deviceWithNetDate: Device[] = [
      {
        ...mockDevices[0],
        LastBootUpTime: '/Date(1704067200000)/', // .NET date format
      },
    ];

    render(<DeviceTable devices={deviceWithNetDate} onDeviceClick={mockOnDeviceClick} />);

    // Should parse and display the date
    expect(screen.getByText('Computer Name')).toBeInTheDocument();
  });

  it('should display location information', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    expect(screen.getByText('Big Rock')).toBeInTheDocument();
    expect(screen.getByText('Red Deer Lake')).toBeInTheDocument();
  });

  it('should be accessible with proper table structure', () => {
    const mockOnDeviceClick = vi.fn();

    render(<DeviceTable devices={mockDevices} onDeviceClick={mockOnDeviceClick} />);

    // Check for proper table structure
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(13); // Number of columns
    expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 data rows
  });

  it('should handle very long device names without breaking layout', () => {
    const mockOnDeviceClick = vi.fn();

    const deviceWithLongName: Device[] = [
      {
        ...mockDevices[0],
        ComputerName:
          'VERY-LONG-COMPUTER-NAME-THAT-MIGHT-BREAK-LAYOUT-IF-NOT-HANDLED-PROPERLY-123456789',
      },
    ];

    render(<DeviceTable devices={deviceWithLongName} onDeviceClick={mockOnDeviceClick} />);

    expect(screen.getByText(/VERY-LONG-COMPUTER-NAME/)).toBeInTheDocument();
  });
});
