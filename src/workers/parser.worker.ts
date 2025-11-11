import { decodeInventoryBuffer, parseContentsToDevices } from '@/utils/parserCore';
import type { LocationMapping } from '@/types/electron';
import type { Device } from '@/types/device';

// Message protocol types
// { type: 'parse', files: { name: string; buffer: ArrayBuffer }[], locationMapping?: LocationMapping | null }
// -> { type: 'parsed', devices: Device[] } | { type: 'error', error: string }

self.onmessage = (e: MessageEvent) => {
  const data = e.data as
    | { type: 'parse'; files: { name: string; buffer: ArrayBuffer }[]; locationMapping?: LocationMapping | null }
    | { type: string };

  if (!data || (data as any).type !== 'parse') return;

  try {
    const { files, locationMapping } = data as {
      files: { name: string; buffer: ArrayBuffer }[];
      locationMapping?: LocationMapping | null;
    };

    const contents: { name: string; content: string }[] = [];
    const total = files.length;
    for (let i = 0; i < files.length; i++) {
      const { name, buffer } = files[i];
      const content = decodeInventoryBuffer(buffer);
      contents.push({ name, content });
      (self as unknown as Worker).postMessage({ type: 'progress', current: i + 1, total, fileName: name });
    }

    const devices: Device[] = parseContentsToDevices(contents, locationMapping);

    (self as unknown as Worker).postMessage({ type: 'parsed', devices });
  } catch (err) {
    (self as unknown as Worker).postMessage({
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
