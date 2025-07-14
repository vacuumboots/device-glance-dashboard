import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncPanel } from '../SyncPanel';

// Mock the window.electronAPI
const mockElectronAPI = {
  startSync: vi.fn(),
  stopSync: vi.fn(),
  getSyncStatus: vi.fn().mockResolvedValue({ isRunning: false }),
  onSyncProgress: vi.fn(),
  removeAllListeners: vi.fn(),
};

describe('SyncPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders web message when electronAPI is not available', () => {
    // Mock window.electronAPI as undefined
    Object.defineProperty(window, 'electronAPI', {
      value: undefined,
      writable: true,
    });

    render(<SyncPanel />);
    
    expect(screen.getByText('Azure Sync')).toBeInTheDocument();
    expect(screen.getByText(/Azure Sync is only available in the desktop app/)).toBeInTheDocument();
  });

  it('renders sync controls when electronAPI is available', async () => {
    // Mock window.electronAPI as available
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
    });

    render(<SyncPanel />);
    
    expect(screen.getByText('Azure Sync')).toBeInTheDocument();
    expect(screen.getByText('Start Sync')).toBeInTheDocument();
    expect(screen.getByText(/This will download the latest device inventory/)).toBeInTheDocument();
  });

  it('calls getSyncStatus on mount when electronAPI is available', async () => {
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
    });

    render(<SyncPanel />);
    
    expect(mockElectronAPI.getSyncStatus).toHaveBeenCalled();
  });
});