// In-memory seed data for the mock GraphQL API.

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'UPDATING' | 'ERROR';
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type Channel = 'STABLE' | 'BETA';
export type OtaStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Location {
  id: string;
  name: string;
  region: string;
}

export interface DeviceSettings {
  telemetryIntervalSec: number;
  logLevel: LogLevel;
  autoUpdate: boolean;
}

export interface Device {
  id: string;
  name: string;
  serial: string;
  model: string;
  locationId: string;
  firmwareVersion: string;
  status: DeviceStatus;
  lastSeen: string;
  settings: DeviceSettings;
}

export interface FirmwareRelease {
  version: string;
  model: string;
  channel: Channel;
  releasedAt: string;
}

export interface FirmwarePolicy {
  id: string;
  name: string;
  model: string;
  targetVersion: string;
  channel: Channel;
  autoApprove: boolean;
  maintenanceWindowStart: string;
  maintenanceWindowEnd: string;
  maxConcurrentPercent: number;
  locationIds: string[];
  updatedAt: string;
}

export interface OtaUpdate {
  id: string;
  model: string;
  firmwareVersion: string;
  locationIds: string[];
  status: OtaStatus;
  scheduledAt: string;
  targetCount: number;
  completedCount: number;
  failedCount: number;
  createdAt: string;
}

export const MODELS = ['GW-100', 'SENSE-2', 'EDGE-X'];

export const locations: Location[] = [
  { id: 'loc-sea', name: 'Seattle DC', region: 'us-west' },
  { id: 'loc-sfo', name: 'San Francisco Hub', region: 'us-west' },
  { id: 'loc-chi', name: 'Chicago Warehouse', region: 'us-central' },
  { id: 'loc-nyc', name: 'New York Store', region: 'us-east' },
  { id: 'loc-atl', name: 'Atlanta Plant', region: 'us-east' },
  { id: 'loc-ber', name: 'Berlin Office', region: 'eu-central' },
];

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const firmwareReleases: FirmwareRelease[] = MODELS.flatMap((model) => [
  { version: '2.3.0', model, channel: 'STABLE' as Channel, releasedAt: daysAgo(120) },
  { version: '2.4.1', model, channel: 'STABLE' as Channel, releasedAt: daysAgo(45) },
  { version: '2.5.0', model, channel: 'STABLE' as Channel, releasedAt: daysAgo(10) },
  { version: '2.6.0-beta.2', model, channel: 'BETA' as Channel, releasedAt: daysAgo(3) },
]);

// Deterministic pseudo-random generator so the dataset is stable between restarts.
let seed = 42;
export const rand = () => {
  seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
  return seed / 2_147_483_648;
};
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const STATUS_WEIGHTS: DeviceStatus[] = ['ONLINE', 'ONLINE', 'ONLINE', 'ONLINE', 'ONLINE', 'OFFLINE', 'ERROR'];

export const devices: Device[] = Array.from({ length: 1200 }, (_, i) => {
  const model = pick(MODELS);
  const n = String(i + 1).padStart(4, '0');
  return {
    id: `dev-${n}`,
    name: `${model.toLowerCase()}-${n}`,
    serial: `SN${(100000 + Math.floor(rand() * 900000)).toString()}`,
    model,
    locationId: pick(locations).id,
    firmwareVersion: pick(['2.3.0', '2.4.1', '2.4.1', '2.5.0']),
    status: pick(STATUS_WEIGHTS),
    lastSeen: new Date(Date.now() - Math.floor(rand() * 3_600_000)).toISOString(),
    settings: {
      telemetryIntervalSec: pick([15, 30, 60, 300]),
      logLevel: pick<LogLevel>(['INFO', 'INFO', 'WARN', 'DEBUG']),
      autoUpdate: rand() > 0.3,
    },
  };
});

export const firmwarePolicies: FirmwarePolicy[] = [
  {
    id: 'pol-1',
    name: 'Gateways – stable rollout',
    model: 'GW-100',
    targetVersion: '2.5.0',
    channel: 'STABLE',
    autoApprove: true,
    maintenanceWindowStart: '02:00',
    maintenanceWindowEnd: '04:00',
    maxConcurrentPercent: 20,
    locationIds: locations.map((l) => l.id),
    updatedAt: daysAgo(8),
  },
  {
    id: 'pol-2',
    name: 'Edge pilot (beta)',
    model: 'EDGE-X',
    targetVersion: '2.6.0-beta.2',
    channel: 'BETA',
    autoApprove: false,
    maintenanceWindowStart: '01:00',
    maintenanceWindowEnd: '03:00',
    maxConcurrentPercent: 5,
    locationIds: ['loc-sfo'],
    updatedAt: daysAgo(2),
  },
];

export const otaUpdates: OtaUpdate[] = [
  {
    id: 'ota-1',
    model: 'SENSE-2',
    firmwareVersion: '2.4.1',
    locationIds: ['loc-chi', 'loc-nyc'],
    status: 'COMPLETED',
    scheduledAt: daysAgo(30),
    targetCount: 132,
    completedCount: 129,
    failedCount: 3,
    createdAt: daysAgo(31),
  },
];

let counter = 100;
export const nextId = (prefix: string) => `${prefix}-${++counter}`;
