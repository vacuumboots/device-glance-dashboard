import type { Device } from '@features/inventory/model/device';
import type { InventorySource, InventorySourceContext, InventorySourceResult } from '@core/ingestion/inventorySource';
import { decodeInventoryBuffer, parseContentsToDevices } from '@/utils/parserCore';
import type { LocationMapping } from '@/types/electron';

export type ParseProgress = { current: number; total: number; fileName?: string };

export async function parseInventoryFiles(
  files: FileList | File[],
  locationMapping?: LocationMapping | null,
  opts?: { signal?: AbortSignal; onProgress?: (p: ParseProgress) => void }
): Promise<Device[]> {
  const fileArray: File[] = Array.from(files as any);
  const buffers = await Promise.all(
    fileArray.map(async (file) => ({ name: file.name, buffer: await (file as any).arrayBuffer() }))
  );
  const totalBytes = buffers.reduce((sum, f) => sum + (f.buffer?.byteLength || 0), 0);
  const canUseWorker = typeof Worker !== 'undefined' && typeof window !== 'undefined';
  const shouldUseWorker = canUseWorker && (totalBytes > 1_000_000 || fileArray.length > 3);
  if (shouldUseWorker) {
    const worker = new Worker(new URL('../../../workers/parser.worker.ts', import.meta.url), { type: 'module' });
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
      const transfers = buffers.map((f) => f.buffer);
      worker.postMessage(
        { type: 'parse', files: buffers, locationMapping: locationMapping || null },
        transfers as unknown as Transferable[]
      );
    });
    return result;
  }
  const total = buffers.length;
  const contents: { name: string; content: string }[] = [];
  for (let i = 0; i < buffers.length; i++) {
    if (opts?.signal?.aborted) throw new Error('Parsing cancelled');
    const { name, buffer } = buffers[i];
    const content = decodeInventoryBuffer(buffer);
    contents.push({ name, content });
    opts?.onProgress?.({ current: i + 1, total, fileName: name });
  }
  return parseContentsToDevices(contents, locationMapping);
}

export class LocalFileSource implements InventorySource {
  readonly id = 'local-files';
  canHandle(input: unknown): boolean {
    return typeof FileList !== 'undefined' && (input instanceof FileList || Array.isArray(input));
  }
  async load(input: unknown, ctx?: InventorySourceContext): Promise<InventorySourceResult> {
    if (!this.canHandle(input)) throw new Error('Unsupported input for LocalFileSource');
    const files = Array.isArray(input) ? (input as File[]) : (input as FileList);
    const devices = await parseInventoryFiles(files, undefined, {
      signal: ctx?.abortSignal,
      onProgress: (p) => ctx?.progress?.({ processed: p.current, total: p.total, phase: 'parsing', fileName: p.fileName }),
    });
    return { devices, metadata: { source: this.id, retrievedAt: new Date(), rawCount: devices.length } };
  }
}