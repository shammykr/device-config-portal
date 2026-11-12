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
  location: Location;
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
  locations: Location[];
  updatedAt: string;
}

export interface FirmwarePolicyInput {
  id?: string;
  name: string;
  model: string;
  targetVersion: string;
  channel: Channel;
  autoApprove: boolean;
  maintenanceWindowStart: string;
  maintenanceWindowEnd: string;
  maxConcurrentPercent: number;
  locationIds: string[];
}

export interface OtaUpdate {
  id: string;
  model: string;
  firmwareVersion: string;
  locations: Location[];
  status: OtaStatus;
  scheduledAt: string;
  targetCount: number;
  completedCount: number;
  failedCount: number;
  createdAt: string;
}

export interface OtaUpdateInput {
  model: string;
  firmwareVersion: string;
  locationIds: string[];
  scheduledAt: string;
}

export interface DeviceStatusEvent {
  id: string;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeen: string;
}
