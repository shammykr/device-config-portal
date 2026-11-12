import { useDeferredValue, useMemo, useState } from 'react';
import type { Device, DeviceStatus } from '../../api/types';
import { Button, Field, Select, TextInput, useAnnounce } from '../../components/ui';
import { useDevices, useRebootDevices } from '../../hooks/useDevices';
import { useLocations } from '../../hooks/useFirmware';
import { PageHeader } from '../../components/layout/PageHeader';
import { DeviceTable } from './DeviceTable';
import { EditSettingsDialog } from './EditSettingsDialog';
import styles from './DevicesPage.module.css';

const STATUSES: DeviceStatus[] = ['ONLINE', 'OFFLINE', 'UPDATING', 'ERROR'];

export function DevicesPage() {
  const { data: devices, isLoading, error } = useDevices();
  const { data: locations } = useLocations();
  const reboot = useRebootDevices();
  const announce = useAnnounce();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [locationId, setLocationId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Device[] | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filtered = useMemo(
    () =>
      (devices ?? []).filter(
        (d) =>
          (!status || d.status === status) &&
          (!locationId || d.location.id === locationId) &&
          (!deferredSearch ||
            d.name.includes(deferredSearch) ||
            d.serial.toLowerCase().includes(deferredSearch)),
      ),
    [devices, status, locationId, deferredSearch],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => {
    const allSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.id));
    const next = new Set(selected);
    filtered.forEach((d) => (allSelected ? next.delete(d.id) : next.add(d.id)));
    setSelected(next);
    announce(allSelected ? 'Selection cleared' : `${filtered.length} devices selected`);
  };

  const selectedDevices = useMemo(
    () => (devices ?? []).filter((d) => selected.has(d.id)),
    [devices, selected],
  );

  const onReboot = () => {
    const ids = [...selected];
    reboot.mutate(ids, {
      onSuccess: (res) => announce(`Reboot sent to ${res.length} devices`),
      onError: (e) => announce(`Reboot failed: ${(e as Error).message}`),
    });
  };

  return (
    <>
      <PageHeader
        title="Devices"
        description={devices ? `${filtered.length.toLocaleString()} of ${devices.length.toLocaleString()} devices` : undefined}
      />

      <form className={styles.filters} role="search" aria-label="Filter devices" onSubmit={(e) => e.preventDefault()}>
        <Field label="Search">
          <TextInput
            type="search"
            placeholder="Name or serial"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Location">
          <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">All locations</option>
            {locations?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      </form>

      <div className={styles.bulkBar} role="toolbar" aria-label="Bulk actions">
        <span aria-live="polite">
          <strong>{selected.size}</strong> selected
        </span>
        <Button size="sm" disabled={!selected.size || reboot.isPending} onClick={onReboot}>
          Reboot
        </Button>
        <Button size="sm" variant="primary" disabled={!selected.size} onClick={() => setEditing(selectedDevices)}>
          Edit settings
        </Button>
        <Button size="sm" variant="ghost" disabled={!selected.size} onClick={() => setSelected(new Set())}>
          Clear selection
        </Button>
      </div>

      {isLoading && <p role="status">Loading devices…</p>}
      {error && <p role="alert">Could not load devices: {(error as Error).message}</p>}
      {devices && (
        <DeviceTable
          devices={filtered}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onOpen={(d) => setEditing([d])}
        />
      )}

      {editing && <EditSettingsDialog devices={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
