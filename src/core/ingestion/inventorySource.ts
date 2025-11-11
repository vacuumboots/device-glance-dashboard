import type { Device } from '@features/inventory/model/device';

export interface InventorySourceContext {
  abortSignal?: AbortSignal;
  progress?: (p: { processed: number; total?: number; phase: string; fileName?: string }) => void;
}

export interface InventorySourceResult {
  devices: Device[];
  metadata: { source: string; retrievedAt: Date; rawCount: number };
}

export interface InventorySource {
  readonly id: string;
  canHandle(input: unknown): boolean;
  load(input: unknown, ctx?: InventorySourceContext): Promise<InventorySourceResult>;
}

export type AnyInventorySource = InventorySource;