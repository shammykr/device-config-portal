import { useMemo, useRef, useState, type FormEvent } from 'react';
import type { Channel, FirmwarePolicy, FirmwarePolicyInput } from '../../api/types';
import { Button, CheckboxGroup, Dialog, Field, Select, Switch, TextInput, useAnnounce } from '../../components/ui';
import { useFirmwareReleases, useLocations, useSaveFirmwarePolicy } from '../../hooks/useFirmware';
import { useFocusFirstError } from '../../hooks/useFocusFirstError';
import styles from '../forms.module.css';

const MODELS = ['GW-100', 'SENSE-2', 'EDGE-X'];

type Errors = Partial<Record<keyof FirmwarePolicyInput, string>>;

const emptyPolicy: FirmwarePolicyInput = {
  name: '',
  model: MODELS[0],
  targetVersion: '',
  channel: 'STABLE',
  autoApprove: false,
  maintenanceWindowStart: '02:00',
  maintenanceWindowEnd: '04:00',
  maxConcurrentPercent: 10,
  locationIds: [],
};

function validate(v: FirmwarePolicyInput): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = 'Name is required';
  if (!v.targetVersion) e.targetVersion = 'Choose a target firmware version';
  if (!v.maintenanceWindowStart) e.maintenanceWindowStart = 'Start time is required';
  if (!v.maintenanceWindowEnd) e.maintenanceWindowEnd = 'End time is required';
  else if (v.maintenanceWindowEnd === v.maintenanceWindowStart) e.maintenanceWindowEnd = 'Window cannot be empty';
  if (!Number.isInteger(v.maxConcurrentPercent) || v.maxConcurrentPercent < 1 || v.maxConcurrentPercent > 100)
    e.maxConcurrentPercent = 'Enter a whole number from 1 to 100';
  if (v.locationIds.length === 0) e.locationIds = 'Select at least one location';
  return e;
}

interface Props {
  policy?: FirmwarePolicy;
  onClose: () => void;
}

export function PolicyFormDialog({ policy, onClose }: Props) {
  const [values, setValues] = useState<FirmwarePolicyInput>(() =>
    policy
      ? {
          id: policy.id,
          name: policy.name,
          model: policy.model,
          targetVersion: policy.targetVersion,
          channel: policy.channel,
          autoApprove: policy.autoApprove,
          maintenanceWindowStart: policy.maintenanceWindowStart,
          maintenanceWindowEnd: policy.maintenanceWindowEnd,
          maxConcurrentPercent: policy.maxConcurrentPercent,
          locationIds: policy.locations.map((l) => l.id),
        }
      : emptyPolicy,
  );
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const markSubmitAttempt = useFocusFirstError(formRef, errors);

  const { data: releases } = useFirmwareReleases();
  const { data: locations } = useLocations();
  const save = useSaveFirmwarePolicy();
  const announce = useAnnounce();

  const versions = useMemo(
    () => (releases ?? []).filter((r) => r.model === values.model && r.channel === values.channel),
    [releases, values.model, values.channel],
  );

  const set = <K extends keyof FirmwarePolicyInput>(key: K, value: FirmwarePolicyInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    if (Object.keys(found).length) {
      markSubmitAttempt();
      setErrors(found);
      return;
    }
    save.mutate(values, {
      onSuccess: (p) => announce(`Policy “${p.name}” saved`),
      onError: (err) => announce(`Saving policy failed: ${(err as Error).message}`),
    });
    onClose();
  };

  return (
    <Dialog
      title={policy ? 'Edit firmware policy' : 'New firmware policy'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="policy-form">
            Save policy
          </Button>
        </>
      }
    >
      <form id="policy-form" ref={formRef} onSubmit={onSubmit} noValidate className={styles.formGrid}>
        <div className={styles.full}>
          <Field label="Policy name" required error={errors.name}>
            <TextInput value={values.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" />
          </Field>
        </div>
        <Field label="Device model" required>
          <Select
            value={values.model}
            onChange={(e) => {
              set('model', e.target.value);
              set('targetVersion', '');
            }}
          >
            {MODELS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Release channel" required>
          <Select
            value={values.channel}
            onChange={(e) => {
              set('channel', e.target.value as Channel);
              set('targetVersion', '');
            }}
          >
            <option value="STABLE">Stable</option>
            <option value="BETA">Beta</option>
          </Select>
        </Field>
        <div className={styles.full}>
          <Field label="Target firmware version" required error={errors.targetVersion}>
            <Select value={values.targetVersion} onChange={(e) => set('targetVersion', e.target.value)}>
              <option value="">Select a version…</option>
              {versions.map((r) => (
                <option key={r.version} value={r.version}>
                  {r.version}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Maintenance window start" required hint="Local device time" error={errors.maintenanceWindowStart}>
          <TextInput
            type="time"
            value={values.maintenanceWindowStart}
            onChange={(e) => set('maintenanceWindowStart', e.target.value)}
          />
        </Field>
        <Field label="Maintenance window end" required error={errors.maintenanceWindowEnd}>
          <TextInput
            type="time"
            value={values.maintenanceWindowEnd}
            onChange={(e) => set('maintenanceWindowEnd', e.target.value)}
          />
        </Field>
        <div className={styles.full}>
          <Field
            label="Max concurrent rollout (%)"
            required
            hint="Share of matching devices allowed to update at the same time."
            error={errors.maxConcurrentPercent}
          >
            <TextInput
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={Number.isNaN(values.maxConcurrentPercent) ? '' : values.maxConcurrentPercent}
              onChange={(e) => set('maxConcurrentPercent', e.target.valueAsNumber)}
            />
          </Field>
        </div>
        <div className={styles.full}>
          <CheckboxGroup
            legend="Locations"
            options={(locations ?? []).map((l) => ({ value: l.id, label: l.name }))}
            value={values.locationIds}
            onChange={(ids) => set('locationIds', ids)}
            error={errors.locationIds}
          />
        </div>
        <div className={styles.full}>
          <Switch
            label="Auto-approve rollouts"
            description="Start OTA updates automatically when a matching release is published."
            checked={values.autoApprove}
            onChange={(v) => set('autoApprove', v)}
          />
        </div>
      </form>
    </Dialog>
  );
}
