import { GraphQLError } from 'graphql';
import type { PubSub } from 'graphql-yoga';
import {
  devices,
  firmwarePolicies,
  firmwareReleases,
  locations,
  nextId,
  otaUpdates,
  type Device,
  type DeviceSettings,
  type FirmwarePolicy,
  type OtaStatus,
  type OtaUpdate,
} from './data.js';
import { eligibleDevices, scheduleReboot, toStatusEvent, type StatusEvent } from './simulator.js';

export type Channels = { 'device:status': [StatusEvent[]] };

const locationById = (id: string) => {
  const loc = locations.find((l) => l.id === id);
  if (!loc) throw new GraphQLError(`Unknown location ${id}`);
  return loc;
};

const findDevices = (ids: string[]) => {
  const set = new Set(ids);
  return devices.filter((d) => set.has(d.id));
};

const OTA_TRANSITIONS: Record<OtaStatus, OtaStatus[]> = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PAUSED', 'CANCELLED'],
  PAUSED: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const createResolvers = (pubsub: PubSub<Channels>) => ({
  Query: {
    devices: () => devices,
    locations: () => locations,
    firmwareReleases: (_: unknown, { model }: { model?: string }) =>
      model ? firmwareReleases.filter((r) => r.model === model) : firmwareReleases,
    firmwarePolicies: () => firmwarePolicies,
    otaUpdates: () => [...otaUpdates].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  },

  Mutation: {
    updateDeviceSettings: (
      _: unknown,
      { ids, input }: { ids: string[]; input: Partial<DeviceSettings> },
    ) => {
      if (input.telemetryIntervalSec != null && input.telemetryIntervalSec < 5) {
        throw new GraphQLError('Telemetry interval must be at least 5 seconds');
      }
      const patch = Object.fromEntries(Object.entries(input).filter(([, v]) => v != null));
      const updated = findDevices(ids);
      for (const d of updated) d.settings = { ...d.settings, ...patch };
      return updated;
    },

    rebootDevices: (_: unknown, { ids }: { ids: string[] }) => {
      const targets = findDevices(ids).filter((d) => d.status !== 'UPDATING');
      const now = new Date().toISOString();
      for (const d of targets) {
        d.status = 'OFFLINE';
        d.lastSeen = now;
        scheduleReboot(d.id);
      }
      pubsub.publish('device:status', targets.map(toStatusEvent));
      return targets;
    },

    saveFirmwarePolicy: (_: unknown, { input }: { input: Omit<FirmwarePolicy, 'updatedAt'> & { id?: string } }) => {
      if (!input.name.trim()) throw new GraphQLError('Policy name is required');
      if (input.maxConcurrentPercent < 1 || input.maxConcurrentPercent > 100) {
        throw new GraphQLError('Max concurrent rollout must be between 1 and 100%');
      }
      input.locationIds.forEach(locationById);
      const policy: FirmwarePolicy = {
        ...input,
        id: input.id ?? nextId('pol'),
        updatedAt: new Date().toISOString(),
      };
      const idx = firmwarePolicies.findIndex((p) => p.id === policy.id);
      if (idx >= 0) firmwarePolicies[idx] = policy;
      else firmwarePolicies.push(policy);
      return policy;
    },

    deleteFirmwarePolicy: (_: unknown, { id }: { id: string }) => {
      const idx = firmwarePolicies.findIndex((p) => p.id === id);
      if (idx < 0) throw new GraphQLError(`Policy ${id} not found`);
      firmwarePolicies.splice(idx, 1);
      return id;
    },

    createOtaUpdate: (
      _: unknown,
      { input }: { input: Pick<OtaUpdate, 'model' | 'firmwareVersion' | 'locationIds' | 'scheduledAt'> },
    ) => {
      if (input.locationIds.length === 0) throw new GraphQLError('Select at least one location');
      input.locationIds.forEach(locationById);
      const ota: OtaUpdate = {
        ...input,
        id: nextId('ota'),
        status: 'SCHEDULED',
        targetCount: 0,
        completedCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString(),
      };
      ota.targetCount = eligibleDevices(ota).length;
      otaUpdates.push(ota);
      return ota;
    },

    setOtaUpdateStatus: (_: unknown, { id, status }: { id: string; status: OtaStatus }) => {
      const ota = otaUpdates.find((o) => o.id === id);
      if (!ota) throw new GraphQLError(`OTA update ${id} not found`);
      if (!OTA_TRANSITIONS[ota.status].includes(status)) {
        throw new GraphQLError(`Cannot move update from ${ota.status} to ${status}`);
      }
      ota.status = status;
      return ota;
    },
  },

  Subscription: {
    deviceStatusChanged: {
      subscribe: () => pubsub.subscribe('device:status'),
      resolve: (payload: StatusEvent[]) => payload,
    },
  },

  Device: { location: (d: Device) => locationById(d.locationId) },
  FirmwarePolicy: { locations: (p: FirmwarePolicy) => p.locationIds.map(locationById) },
  OtaUpdate: { locations: (o: OtaUpdate) => o.locationIds.map(locationById) },
});
