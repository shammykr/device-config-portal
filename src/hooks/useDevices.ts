import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest, gqlSubscribe } from '../api/client';
import {
  DEVICE_STATUS_SUBSCRIPTION,
  DEVICES_QUERY,
  REBOOT_DEVICES,
  UPDATE_DEVICE_SETTINGS,
} from '../api/documents';
import { queryKeys } from '../api/queryKeys';
import type { Device, DeviceSettings, DeviceStatusEvent } from '../api/types';
import { useOptimisticListMutation } from './useOptimisticListMutation';

export function useDevices() {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: () => gqlRequest<{ devices: Device[] }>(DEVICES_QUERY).then((d) => d.devices),
    staleTime: Infinity, // kept fresh by the status subscription
  });
}

/** Streams device status changes from the GraphQL subscription into the devices cache. */
export function useDeviceStatusSubscription() {
  const qc = useQueryClient();
  useEffect(
    () =>
      gqlSubscribe<{ deviceStatusChanged: DeviceStatusEvent[] }>(DEVICE_STATUS_SUBSCRIPTION, (data) => {
        const updates = new Map(data.deviceStatusChanged.map((e) => [e.id, e]));
        qc.setQueryData<Device[]>(queryKeys.devices, (list) =>
          list?.map((d) => {
            const e = updates.get(d.id);
            return e ? { ...d, ...e } : d;
          }),
        );
      }),
    [qc],
  );
}

const patchById = (list: Device[], ids: string[], patch: (d: Device) => Device) => {
  const set = new Set(ids);
  return list.map((d) => (set.has(d.id) ? patch(d) : d));
};

const mergeResult = <T extends { id: string }>(list: Device[], result: T[]) => {
  const byId = new Map(result.map((r) => [r.id, r]));
  return list.map((d) => (byId.has(d.id) ? { ...d, ...byId.get(d.id) } : d));
};

export function useUpdateDeviceSettings() {
  return useOptimisticListMutation({
    queryKey: queryKeys.devices,
    mutationFn: (vars: { ids: string[]; input: Partial<DeviceSettings> }) =>
      gqlRequest<{ updateDeviceSettings: Device[] }>(UPDATE_DEVICE_SETTINGS, vars).then(
        (r) => r.updateDeviceSettings,
      ),
    optimistic: (list: Device[], { ids, input }) =>
      patchById(list, ids, (d) => ({ ...d, settings: { ...d.settings, ...input } })),
    reconcile: (list, result) => mergeResult(list, result),
  });
}

export function useRebootDevices() {
  return useOptimisticListMutation({
    queryKey: queryKeys.devices,
    mutationFn: (ids: string[]) =>
      gqlRequest<{ rebootDevices: Pick<Device, 'id' | 'status' | 'lastSeen'>[] }>(REBOOT_DEVICES, { ids }).then(
        (r) => r.rebootDevices,
      ),
    optimistic: (list: Device[], ids) =>
      patchById(list, ids, (d) => (d.status === 'UPDATING' ? d : { ...d, status: 'OFFLINE' })),
    reconcile: (list, result) => mergeResult(list, result),
  });
}
