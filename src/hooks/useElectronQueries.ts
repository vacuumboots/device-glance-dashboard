import { useQuery } from '@tanstack/react-query';
import type { LocationMapping } from '@/types/electron';

function hasElectron() {
  return typeof window !== 'undefined' && Boolean((window as Window & { electronAPI?: unknown }).electronAPI);
}

export function useLocationMapping() {
  return useQuery<
    { success: boolean; mapping?: LocationMapping | null },
    Error,
    LocationMapping | null
  >({
    queryKey: ['locationMapping'],
    enabled: hasElectron() && !!window.electronAPI.loadLocationMapping,
    queryFn: async () => {
      const res = await window.electronAPI.loadLocationMapping();
      return res;
    },
    select: (res) => (res.success && res.mapping ? res.mapping : null),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30,
  });
}

type SyncStatus = { isRunning: boolean };

export function useSyncStatus(pollMs = 2000) {
  return useQuery<SyncStatus>({
    queryKey: ['syncStatus'],
    enabled: hasElectron() && !!window.electronAPI.getSyncStatus,
    queryFn: () => window.electronAPI.getSyncStatus(),
    refetchInterval: pollMs,
  });
}
