import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock pointer capture methods for JSDOM compatibility
if (typeof HTMLElement !== 'undefined') {
  HTMLElement.prototype.hasPointerCapture = vi.fn();
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Mock File API with real content retention so utils can read buffers in tests
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  private _buffer: ArrayBuffer;

  constructor(bits: BlobPart[], filename: string, options?: FilePropertyBag) {
    this.name = filename;
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();

    // Concatenate bits into a single Uint8Array
    const chunks: Uint8Array[] = [];
    let total = 0;
    const encoder = new TextEncoder();
    for (const bit of bits) {
      if (typeof bit === 'string') {
        const enc = encoder.encode(bit);
        chunks.push(enc);
        total += enc.byteLength;
      } else if (bit instanceof ArrayBuffer) {
        const view = new Uint8Array(bit);
        chunks.push(view);
        total += view.byteLength;
      } else if (ArrayBuffer.isView(bit)) {
        const view = new Uint8Array(bit.buffer, bit.byteOffset, bit.byteLength);
        chunks.push(view);
        total += view.byteLength;
      } else if (typeof Blob !== 'undefined' && bit instanceof Blob) {
        // Synchronous Blob reading isn't available; best-effort empty chunk
        chunks.push(new Uint8Array());
      }
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    this.size = merged.byteLength;
    this._buffer = merged.buffer.slice(0);
  }

  arrayBuffer() {
    return Promise.resolve(this._buffer.slice(0));
  }

  // Optional convenience for environments that support File.text()
  text() {
    return Promise.resolve(new TextDecoder('utf-8').decode(this._buffer));
  }
} as unknown as typeof File;

global.FileList = class MockFileList extends Array<File> {
  item(index: number) {
    return this[index] || null;
  }
} as unknown as typeof FileList;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    }),
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});
