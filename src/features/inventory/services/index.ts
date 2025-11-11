import { LocalFileSource } from './localFileSource';
import type { AnyInventorySource, InventorySource } from '@core/ingestion/inventorySource';

const sources: AnyInventorySource[] = [new LocalFileSource()];

export function resolveInventorySource(input: unknown): InventorySource | null {
  return sources.find((s) => s.canHandle(input)) || null;
}

export { parseInventoryFiles } from './localFileSource';
export { filterDevices } from './filterDevices';