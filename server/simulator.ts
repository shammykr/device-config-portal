// Simulates fleet activity: random connectivity changes, reboots coming back
// online, and OTA rollouts progressing through batches of devices.
import { devices, otaUpdates, rand, type Device, type DeviceStatus, type OtaUpdate } from './data.js';

export interface StatusEvent {
  id: string;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeen: string;
}

const TICK_MS = 2000;
const OTA_BATCH = 6;

const rebootingUntil = new Map<string, number>();
// OTA id -> device ids currently being flashed by that rollout
const inFlight = new Map<string, Set<string>>();

export const scheduleReboot = (id: string) => {
  rebootingUntil.set(id, Date.now() + 3000 + rand() * 3000);
};

export const eligibleDevices = (ota: Pick<OtaUpdate, 'model' | 'firmwareVersion' | 'locationIds'>) =>
  devices.filter(
    (d) =>
      d.model === ota.model &&
      ota.locationIds.includes(d.locationId) &&
      d.firmwareVersion !== ota.firmwareVersion,
  );

export const toStatusEvent = (d: Device): StatusEvent => ({
  id: d.id,
  status: d.status,
  firmwareVersion: d.firmwareVersion,
  lastSeen: d.lastSeen,
});

const isBusy = (d: Device) =>
  rebootingUntil.has(d.id) || [...inFlight.values()].some((s) => s.has(d.id));

function randomChurn(changed: Map<string, Device>, now: string) {
  const count = 4 + Math.floor(rand() * 8);
  for (let i = 0; i < count; i++) {
    const d = devices[Math.floor(rand() * devices.length)];
    if (isBusy(d) || d.status === 'UPDATING') continue;
    if (d.status === 'ONLINE') {
      // Most online devices stay online; keeps the fleet ~85-90% healthy.
      const r = rand();
      if (r > 0.15) continue;
      d.status = r < 0.11 ? 'OFFLINE' : 'ERROR';
    } else {
      d.status = 'ONLINE';
    }
    d.lastSeen = now;
    changed.set(d.id, d);
  }
}

function finishReboots(changed: Map<string, Device>, now: string) {
  for (const [id, until] of rebootingUntil) {
    if (until > Date.now()) continue;
    rebootingUntil.delete(id);
    const d = devices.find((x) => x.id === id)!;
    d.status = 'ONLINE';
    d.lastSeen = now;
    changed.set(d.id, d);
  }
}

function advanceOta(ota: OtaUpdate, changed: Map<string, Device>, now: string) {
  if (ota.status === 'SCHEDULED' && Date.parse(ota.scheduledAt) <= Date.now()) {
    ota.status = 'IN_PROGRESS';
  }
  const flashing = inFlight.get(ota.id) ?? new Set<string>();
  inFlight.set(ota.id, flashing);

  if (ota.status === 'CANCELLED') {
    // Abort: devices mid-flash fall back to their previous firmware.
    for (const id of flashing) {
      const d = devices.find((x) => x.id === id)!;
      d.status = 'ONLINE';
      d.lastSeen = now;
      changed.set(d.id, d);
    }
    inFlight.delete(ota.id);
    return;
  }
  if (ota.status !== 'IN_PROGRESS') return;

  // Finish the current batch.
  for (const id of flashing) {
    const d = devices.find((x) => x.id === id)!;
    if (rand() < 0.04) {
      d.status = 'ERROR';
      ota.failedCount++;
    } else {
      d.status = 'ONLINE';
      d.firmwareVersion = ota.firmwareVersion;
      ota.completedCount++;
    }
    d.lastSeen = now;
    changed.set(d.id, d);
  }
  flashing.clear();

  // Start the next batch.
  const remaining = ota.targetCount - ota.completedCount - ota.failedCount;
  const next = eligibleDevices(ota)
    .filter((d) => d.status === 'ONLINE' && !isBusy(d))
    .slice(0, Math.min(OTA_BATCH, remaining));
  for (const d of next) {
    d.status = 'UPDATING';
    d.lastSeen = now;
    flashing.add(d.id);
    changed.set(d.id, d);
  }
  if (next.length === 0) {
    ota.status = 'COMPLETED';
    ota.failedCount += Math.max(0, remaining); // devices that never came online
    inFlight.delete(ota.id);
  }
}

export function startSimulator(publish: (events: StatusEvent[]) => void) {
  return setInterval(() => {
    const now = new Date().toISOString();
    const changed = new Map<string, Device>();
    finishReboots(changed, now);
    otaUpdates.forEach((ota) => advanceOta(ota, changed, now));
    randomChurn(changed, now);
    if (changed.size) publish([...changed.values()].map(toStatusEvent));
  }, TICK_MS);
}
