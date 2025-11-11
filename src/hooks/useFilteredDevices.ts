import { useMemo } from 'react';
import type { Device, FilterState } from '@features/inventory/model/device';
import { filterDevices } from '@features/inventory/services/filterDevices';

// Stable stringify to avoid recomputation when filter object identity changes
// but the semantic contents are identical (key order agnostic).
function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const stringify = (val: any): any => {
    if (val === null || typeof val !== 'object') return val;
    if (seen.has(val)) return undefined; // avoid cycles (not expected here)
    seen.add(val);
    if (Array.isArray(val)) return val.map((v) => stringify(v));
    const keys = Object.keys(val).sort();
    const out: Record<string, any> = {};
    for (const k of keys) out[k] = stringify(val[k]);
    return out;
  };
  return JSON.stringify(stringify(value));
}

export function useFilteredDevices(devices: Device[], filters: FilterState): Device[] {
  const filtersKey = useMemo(() => stableStringify(filters), [filters]);

  return useMemo(() => {
    return filterDevices(devices, filters);
  }, [devices, filtersKey]);
}
