import { Device, ChartData } from '@/types/device';

export const generateChartData = (
  devices: Device[],
  field: keyof Device,
  mapping: Record<string, { name: string; color: string }>
): ChartData[] => {
  const counts: Record<string, number> = {};

  devices.forEach((device) => {
    const raw = device[field] as unknown;
    const value = raw === null || raw === undefined ? '' : String(raw);
    counts[value] = (counts[value] || 0) + 1;
  });

  const total = devices.length;

  return Object.entries(counts).map(([key, count]) => ({
    name: mapping[key]?.name || key,
    value: count,
    percentage: Math.round((count / total) * 100),
    color: mapping[key]?.color || '#6b7280',
  }));
};
