import { Device, FilterState } from '@/types/device';
import { LocationMapping } from '@/types/electron';
import {
  decodeInventoryBuffer,
  parseContentsToDevices,
} from '@/utils/parserCore';

/**
 * Parse classic .NET serialized date strings of the form /Date(1712345678900)/.
 * Falls back to the original input if the pattern does not match.
 */
// moved to parserCore

/**
 * Attempt to decode an inventory file buffer by detecting common encodings.
 * Priority:
 *  1. BOM detection (UTF-8, UTF-16 LE/BE)
 *  2. Heuristic for UTF-16 LE (many zero high bytes)
 *  3. Fallback to UTF-8
 */
// Safe decoders that avoid relying solely on global TextDecoder (which tests may mock)
// moved to parserCore

// moved to parserCore

// deviceCategoryMap now externalized to JSON (Record<string,string>)

// moved to parserCore

export type ParseProgress = { current: number; total: number; fileName?: string };

export const parseInventoryFiles = async (
  files: FileList | File[],
  locationMapping?: LocationMapping | null,
  opts?: { signal?: AbortSignal; onProgress?: (p: ParseProgress) => void }
): Promise<Device[]> => {
  const fileArray: File[] = Array.from(files as any);
  const buffers = await Promise.all(
    fileArray.map(async (file) => ({ name: file.name, buffer: await (file as any).arrayBuffer() }))
  );

  // Decide whether to use a Web Worker based on total size and environment support
  const totalBytes = buffers.reduce((sum, f) => sum + (f.buffer?.byteLength || 0), 0);
  const canUseWorker = typeof Worker !== 'undefined' && typeof window !== 'undefined';
  const shouldUseWorker = canUseWorker && (totalBytes > 1_000_000 || fileArray.length > 3);

  if (shouldUseWorker) {
    const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), {
      type: 'module',
    });

    const result: Device[] = await new Promise((resolve, reject) => {
      const handleMessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg?.type === 'progress') {
          opts?.onProgress?.({ current: msg.current, total: msg.total, fileName: msg.fileName });
        } else if (msg?.type === 'parsed') {
          worker.removeEventListener('message', handleMessage);
          worker.terminate();
          resolve(msg.devices as Device[]);
        } else if (msg?.type === 'error') {
          worker.removeEventListener('message', handleMessage);
          worker.terminate();
          reject(new Error(msg.error || 'Worker parsing failed'));
        }
      };
      worker.addEventListener('message', handleMessage);

      if (opts?.signal) {
        const onAbort = () => {
          worker.removeEventListener('message', handleMessage);
          worker.terminate();
          reject(new Error('Parsing cancelled'));
        };
        if (opts.signal.aborted) onAbort();
        opts.signal.addEventListener('abort', onAbort, { once: true });
      }
      // Transfer ArrayBuffers for zero-copy
      const transfers = buffers.map((f) => f.buffer);
      worker.postMessage(
        {
          type: 'parse',
          files: buffers,
          locationMapping: locationMapping || null,
        },
        transfers as unknown as Transferable[]
      );
    });
    return result;
  }

  // Fallback: decode and parse on main thread
  const total = buffers.length;
  const contents: { name: string; content: string }[] = [];
  for (let i = 0; i < buffers.length; i++) {
    if (opts?.signal?.aborted) {
      throw new Error('Parsing cancelled');
    }
    const { name, buffer } = buffers[i];
    const content = decodeInventoryBuffer(buffer);
    contents.push({ name, content });
    opts?.onProgress?.({ current: i + 1, total, fileName: name });
  }
  return parseContentsToDevices(contents, locationMapping);
};

export const filterDevices = (devices: Device[], filters: FilterState): Device[] => {
  return devices.filter((device) => {
    // Windows 11 Ready filter
    if (filters.windows11Ready !== 'all') {
      const isReady = device.canUpgradeToWin11;
      if (filters.windows11Ready === 'ready' && !isReady) return false;
      if (filters.windows11Ready === 'not-ready' && isReady) return false;
    }

    // TPM filter
    if (filters.tpmPresent !== 'all') {
      const hasTPM = device.TPMVersion && device.TPMVersion !== 'None';
      if (filters.tpmPresent === 'present' && !hasTPM) return false;
      if (filters.tpmPresent === 'missing' && hasTPM) return false;
    }

    // Secure Boot filter
    if (filters.secureBootEnabled !== 'all') {
      if (filters.secureBootEnabled === 'enabled' && !device.SecureBootEnabled) return false;
      if (filters.secureBootEnabled === 'disabled' && device.SecureBootEnabled) return false;
    }

    // Storage filter
    if (filters.lowStorage !== 'all') {
      const hasLowStorage = device.FreeStorageGB < 30;
      if (filters.lowStorage === 'low' && !hasLowStorage) return false;
      if (filters.lowStorage === 'sufficient' && hasLowStorage) return false;
    }

    // Join Type filter
    if (filters.joinType !== 'all' && device.JoinType !== filters.joinType) {
      return false;
    }

    // Device Category filter
    if (filters.deviceCategory !== 'all' && device.category !== filters.deviceCategory) {
      return false;
    }

    // Hash Present filter
    if (filters.hashPresent !== 'all') {
      const hasHash = device.HardwareHash && device.HardwareHash.trim() !== '';
      if (filters.hashPresent === 'present' && !hasHash) return false;
      if (filters.hashPresent === 'missing' && hasHash) return false;
    }

    // Device Model filter
    if (filters.deviceModel !== 'all' && device.Model !== filters.deviceModel) {
      return false;
    }

    // Location filter
    if (filters.location.length > 0 && !filters.location.includes(device.location || '')) {
      return false;
    }

    // Search term filter (searches ComputerName and SerialNumber)
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = filters.searchTerm.toLowerCase().trim();
      const computerName = (device.ComputerName || '').toLowerCase();
      const serialNumber = (device.SerialNumber || '').toLowerCase();

      if (!computerName.includes(searchTerm) && !serialNumber.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });
};

// moved to parserCore
