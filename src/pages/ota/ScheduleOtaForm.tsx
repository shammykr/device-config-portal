import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Button, CheckboxGroup, Field, Select, Switch, TextInput, useAnnounce } from '../../components/ui';
import { useDevices } from '../../hooks/useDevices';
import { useFirmwareReleases, useLocations } from '../../hooks/useFirmware';
import { useFocusFirstError } from '../../hooks/useFocusFirstError';
import { useCreateOtaUpdate } from '../../hooks/useOtaUpdates';
import styles from '../forms.module.css';

const MODELS = ['GW-100', 'SENSE-2', 'EDGE-X'];

interface Values {
  model: string;
  firmwareVersion: string;
  locationIds: string[];
  startNow: boolean;
  scheduledAt: string;
}

type Errors = Partial<Record<keyof Values, string>>;

const initial: Values = { model: MODELS[0], firmwareVersion: '', locationIds: [], startNow: true, scheduledAt: '' };

export function ScheduleOtaForm() {
  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const markSubmitAttempt = useFocusFirstError(formRef, errors);

  const { data: releases } = useFirmwareReleases();
  const { data: locations } = useLocations();
  const { data: devices } = useDevices();
  const create = useCreateOtaUpdate();
  const announce = useAnnounce();

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const versions = (releases ?? []).filter((r) => r.model === values.model);

  // Preview how many devices the rollout would target, from the cached device list.
  const targetCount = useMemo(
    () =>
      (devices ?? []).filter(
        (d) =>
          d.model === values.model &&
          values.locationIds.includes(d.location.id) &&
          values.firmwareVersion &&
          d.firmwareVersion !== values.firmwareVersion,
      ).length,
    [devices, values.model, values.locationIds, values.firmwareVersion],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (!values.firmwareVersion) found.firmwareVersion = 'Choose a firmware version';
    if (values.locationIds.length === 0) found.locationIds = 'Select at least one location';
    if (!values.startNow) {
      if (!values.scheduledAt) found.scheduledAt = 'Pick a start time';
      else if (Date.parse(values.scheduledAt) < Date.now()) found.scheduledAt = 'Start time must be in the future';
    }
    if (Object.keys(found).length) {
      markSubmitAttempt();
      setErrors(found);
      return;
    }
    const scheduledAt = values.startNow ? new Date().toISOString() : new Date(values.scheduledAt).toISOString();
    create.mutate(
      { model: values.model, firmwareVersion: values.firmwareVersion, locationIds: values.locationIds, scheduledAt },
      {
        onSuccess: (u) => announce(`Rollout of ${u.firmwareVersion} scheduled for ${u.targetCount} devices`),
        onError: (err) => announce(`Scheduling failed: ${(err as Error).message}`),
      },
    );
    setValues(initial);
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className={styles.formGrid}>
      <Field label="Device model" required>
        <Select
          value={values.model}
          onChange={(e) => {
            set('model', e.target.value);
            set('firmwareVersion', '');
          }}
        >
          {MODELS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
      </Field>
      <Field label="Firmware version" required error={errors.firmwareVersion}>
        <Select value={values.firmwareVersion} onChange={(e) => set('firmwareVersion', e.target.value)}>
          <option value="">Select a version…</option>
          {versions.map((r) => (
            <option key={r.version} value={r.version}>
              {r.version}
              {r.channel === 'BETA' ? ' (beta)' : ''}
            </option>
          ))}
        </Select>
      </Field>
      <div className={styles.full}>
        <CheckboxGroup
          legend="Target locations"
          options={(locations ?? []).map((l) => ({ value: l.id, label: `${l.name} (${l.region})` }))}
          value={values.locationIds}
          onChange={(ids) => set('locationIds', ids)}
          error={errors.locationIds}
        />
      </div>
      <Switch
        label="Start immediately"
        description="Turn off to schedule the rollout for later."
        checked={values.startNow}
        onChange={(v) => set('startNow', v)}
      />
      {!values.startNow && (
        <Field label="Start time" required error={errors.scheduledAt}>
          <TextInput
            type="datetime-local"
            value={values.scheduledAt}
            onChange={(e) => set('scheduledAt', e.target.value)}
          />
        </Field>
      )}
      <div className={`${styles.full} ${styles.actions}`} style={{ alignItems: 'center' }}>
        <span className={styles.muted} aria-live="polite" style={{ marginRight: 'auto' }}>
          {values.firmwareVersion && values.locationIds.length > 0
            ? `${targetCount} device${targetCount === 1 ? '' : 's'} will be updated`
            : ''}
        </span>
        <Button variant="primary" type="submit">
          Schedule rollout
        </Button>
      </div>
    </form>
  );
}
