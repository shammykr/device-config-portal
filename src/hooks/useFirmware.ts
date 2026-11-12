import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../api/client';
import {
  DELETE_POLICY,
  LOCATIONS_QUERY,
  POLICIES_QUERY,
  RELEASES_QUERY,
  SAVE_POLICY,
} from '../api/documents';
import { queryKeys } from '../api/queryKeys';
import type { FirmwarePolicy, FirmwarePolicyInput, FirmwareRelease, Location } from '../api/types';
import { useOptimisticListMutation } from './useOptimisticListMutation';

export function useLocations() {
  return useQuery({
    queryKey: queryKeys.locations,
    queryFn: () => gqlRequest<{ locations: Location[] }>(LOCATIONS_QUERY).then((d) => d.locations),
    staleTime: Infinity,
  });
}

export function useFirmwareReleases() {
  return useQuery({
    queryKey: queryKeys.releases,
    queryFn: () =>
      gqlRequest<{ firmwareReleases: FirmwareRelease[] }>(RELEASES_QUERY).then((d) => d.firmwareReleases),
    staleTime: 5 * 60_000,
  });
}

export function useFirmwarePolicies() {
  return useQuery({
    queryKey: queryKeys.policies,
    queryFn: () =>
      gqlRequest<{ firmwarePolicies: FirmwarePolicy[] }>(POLICIES_QUERY).then((d) => d.firmwarePolicies),
  });
}

export function useSaveFirmwarePolicy() {
  const qc = useQueryClient();
  return useOptimisticListMutation({
    queryKey: queryKeys.policies,
    mutationFn: (input: FirmwarePolicyInput) =>
      gqlRequest<{ saveFirmwarePolicy: FirmwarePolicy }>(SAVE_POLICY, { input }).then((r) => r.saveFirmwarePolicy),
    optimistic: (list: FirmwarePolicy[], { locationIds, ...input }) => {
      const locations = (qc.getQueryData<Location[]>(queryKeys.locations) ?? []).filter((l) =>
        locationIds.includes(l.id),
      );
      const draft: FirmwarePolicy = {
        ...input,
        id: input.id ?? `temp-${Date.now()}`,
        locations,
        updatedAt: new Date().toISOString(),
      };
      return input.id ? list.map((p) => (p.id === input.id ? draft : p)) : [...list, draft];
    },
  });
}

export function useDeleteFirmwarePolicy() {
  return useOptimisticListMutation({
    queryKey: queryKeys.policies,
    mutationFn: (id: string) => gqlRequest(DELETE_POLICY, { id }),
    optimistic: (list: FirmwarePolicy[], id) => list.filter((p) => p.id !== id),
  });
}
