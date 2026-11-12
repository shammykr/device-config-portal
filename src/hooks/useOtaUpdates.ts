import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../api/client';
import { CREATE_OTA_UPDATE, OTA_UPDATES_QUERY, SET_OTA_STATUS } from '../api/documents';
import { queryKeys } from '../api/queryKeys';
import type { Location, OtaStatus, OtaUpdate, OtaUpdateInput } from '../api/types';
import { useOptimisticListMutation } from './useOptimisticListMutation';

const ACTIVE: OtaStatus[] = ['SCHEDULED', 'IN_PROGRESS'];

export function useOtaUpdates() {
  return useQuery({
    queryKey: queryKeys.otaUpdates,
    queryFn: () => gqlRequest<{ otaUpdates: OtaUpdate[] }>(OTA_UPDATES_QUERY).then((d) => d.otaUpdates),
    // Poll while a rollout is running so progress bars stay live.
    refetchInterval: (query) =>
      query.state.data?.some((u) => ACTIVE.includes(u.status)) ? 2000 : false,
  });
}

export function useCreateOtaUpdate() {
  const qc = useQueryClient();
  return useOptimisticListMutation({
    queryKey: queryKeys.otaUpdates,
    mutationFn: (input: OtaUpdateInput) =>
      gqlRequest<{ createOtaUpdate: OtaUpdate }>(CREATE_OTA_UPDATE, { input }).then((r) => r.createOtaUpdate),
    optimistic: (list: OtaUpdate[], { locationIds, ...input }) => {
      const locations = (qc.getQueryData<Location[]>(queryKeys.locations) ?? []).filter((l) =>
        locationIds.includes(l.id),
      );
      const draft: OtaUpdate = {
        ...input,
        id: `temp-${Date.now()}`,
        locations,
        status: 'SCHEDULED',
        targetCount: 0,
        completedCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString(),
      };
      return [draft, ...list];
    },
  });
}

export function useSetOtaStatus() {
  return useOptimisticListMutation({
    queryKey: queryKeys.otaUpdates,
    mutationFn: (vars: { id: string; status: OtaStatus }) =>
      gqlRequest<{ setOtaUpdateStatus: OtaUpdate }>(SET_OTA_STATUS, vars).then((r) => r.setOtaUpdateStatus),
    optimistic: (list: OtaUpdate[], { id, status }) => list.map((u) => (u.id === id ? { ...u, status } : u)),
    reconcile: (list, result) => list.map((u) => (u.id === result.id ? result : u)),
  });
}
