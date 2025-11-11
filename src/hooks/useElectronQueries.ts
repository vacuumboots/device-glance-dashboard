import { useQuery } from '@tanstack/react-query';
import type { LocationMapping } from '@/types/electron';

function hasElectron() {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}

export function useLocationMapping() {
  const enabled = hasElectron() && !!window.electronAPI.loadLocationMapping;
  if (!enabled) {
    return { data: null, isLoading: false, isError: false } as const;
  }
  return useQuery<{ success: boolean; mapping?: LocationMapping | null }, Error, LocationMapping | null>({
    queryKey: ['locationMapping'],
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
  const enabled = hasElectron() && !!window.electronAPI.getSyncStatus;
  if (!enabled) {
    return { data: undefined, isLoading: false, isError: false } as const;
  }
  return useQuery<SyncStatus>({
    queryKey: ['syncStatus'],
    queryFn: () => window.electronAPI.getSyncStatus(),
    refetchInterval: pollMs,
  });
}
