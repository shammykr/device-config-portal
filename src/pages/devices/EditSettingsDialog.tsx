import { useState, type FormEvent } from 'react';
import type { Device, DeviceSettings, LogLevel } from '../../api/types';
import { Button, Dialog, Field, Select, TextInput, useAnnounce } from '../../components/ui';
import { useUpdateDeviceSettings } from '../../hooks/useDevices';

interface Props {
  devices: Device[];
  onClose: () => void;
}

const LOG_LEVELS: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
const UNCHANGED = '';

/**
 * Edits settings for one device or many. For bulk edits every field starts as
 * "No change" so only the fields the operator touches are sent.
 */
export function EditSettingsDialog({ devices, onClose }: Props) {
  const single = devices.length === 1 ? devices[0] : null;
  const update = useUpdateDeviceSettings();
  const announce = useAnnounce();

  const [intervalSec, setIntervalSec] = useState(single ? String(single.settings.telemetryIntervalSec) : UNCHANGED);
  const [logLevel, setLogLevel] = useState<string>(single?.settings.logLevel ?? UNCHANGED);
  const [autoUpdate, setAutoUpdate] = useState(single ? String(single.settings.autoUpdate) : UNCHANGED);
  const [error, setError] = useState<string>();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input: Partial<DeviceSettings> = {};
    if (intervalSec !== UNCHANGED) {
      const n = Number(intervalSec);
      if (!Number.isInteger(n) || n < 5 || n > 3600) {
        setError('Enter a whole number between 5 and 3600');
        return;
      }
      input.telemetryIntervalSec = n;
    }
    if (logLevel !== UNCHANGED) input.logLevel = logLevel as LogLevel;
    if (autoUpdate !== UNCHANGED) input.autoUpdate = autoUpdate === 'true';
    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }

    // The cache is updated optimistically, so the dialog can close immediately.
    update.mutate(
      { ids: devices.map((d) => d.id), input },
      {
        onSuccess: () => announce(`Settings saved for ${devices.length} device${devices.length > 1 ? 's' : ''}`),
        onError: (err) => announce(`Saving settings failed: ${(err as Error).message}`),
      },
    );
    onClose();
  };

  const title = single ? `Settings – ${single.name}` : `Edit settings for ${devices.length} devices`;

  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="device-settings-form">
            Save
          </Button>
        </>
      }
    >
      {single && (
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
          <dt>Serial</dt>
          <dd style={{ margin: 0 }}>{single.serial}</dd>
          <dt>Model</dt>
          <dd style={{ margin: 0 }}>{single.model}</dd>
          <dt>Firmware</dt>
          <dd style={{ margin: 0 }}>{single.firmwareVersion}</dd>
        </dl>
      )}
      <form id="device-settings-form" onSubmit={onSubmit} noValidate style={{ display: 'contents' }}>
        <Field
          label="Telemetry interval (seconds)"
          hint={single ? 'Between 5 and 3600.' : 'Leave empty to keep each device’s current value.'}
          error={error}
        >
          <TextInput
            type="number"
            inputMode="numeric"
            min={5}
            max={3600}
            value={intervalSec}
            onChange={(e) => {
              setIntervalSec(e.target.value);
              setError(undefined);
            }}
          />
        </Field>
        <Field label="Log level">
          <Select value={logLevel} onChange={(e) => setLogLevel(e.target.value)}>
            {!single && <option value={UNCHANGED}>No change</option>}
            {LOG_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Automatic updates">
          <Select value={autoUpdate} onChange={(e) => setAutoUpdate(e.target.value)}>
            {!single && <option value={UNCHANGED}>No change</option>}
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </Select>
        </Field>
      </form>
    </Dialog>
  );
}
