import type { OtaStatus, OtaUpdate } from '../../api/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, ProgressBar, StatusBadge, useAnnounce } from '../../components/ui';
import { useOtaUpdates, useSetOtaStatus } from '../../hooks/useOtaUpdates';
import { formatDateTime } from '../../utils/format';
import styles from '../forms.module.css';
import { ScheduleOtaForm } from './ScheduleOtaForm';

const ACTIONS: Partial<Record<OtaStatus, { label: string; to: OtaStatus }[]>> = {
  SCHEDULED: [{ label: 'Start now', to: 'IN_PROGRESS' }, { label: 'Cancel', to: 'CANCELLED' }],
  IN_PROGRESS: [{ label: 'Pause', to: 'PAUSED' }, { label: 'Cancel', to: 'CANCELLED' }],
  PAUSED: [{ label: 'Resume', to: 'IN_PROGRESS' }, { label: 'Cancel', to: 'CANCELLED' }],
};

export function OtaUpdatesPage() {
  const { data: updates, isLoading, error } = useOtaUpdates();
  const setStatus = useSetOtaStatus();
  const announce = useAnnounce();

  const change = (u: OtaUpdate, to: OtaStatus, label: string) =>
    setStatus.mutate(
      { id: u.id, status: to },
      {
        onSuccess: () => announce(`${label}: ${u.model} ${u.firmwareVersion}`),
        onError: (e) => announce(`Could not update rollout: ${(e as Error).message}`),
      },
    );

  return (
    <>
      <PageHeader title="OTA updates" description="Schedule over-the-air firmware rollouts and track their progress." />

      <section className={styles.card} aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" style={{ fontSize: 16, marginBottom: 16 }}>
          Schedule a rollout
        </h2>
        <ScheduleOtaForm />
      </section>

      <section aria-labelledby="rollouts-heading" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 id="rollouts-heading" style={{ fontSize: 16 }}>
          Rollouts
        </h2>
        {isLoading && <p role="status">Loading rollouts…</p>}
        {error && <p role="alert">Could not load rollouts: {(error as Error).message}</p>}
        {updates && updates.length === 0 && <p>No rollouts yet.</p>}
        {updates && updates.length > 0 && (
          <table className={styles.table}>
            <caption className="visually-hidden">OTA rollouts</caption>
            <thead>
              <tr>
                <th scope="col">Firmware</th>
                <th scope="col">Locations</th>
                <th scope="col">Status</th>
                <th scope="col" style={{ width: '28%' }}>
                  Progress
                </th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => {
                const pending = u.id.startsWith('temp-');
                const done = u.completedCount + u.failedCount;
                return (
                  <tr key={u.id} className={pending ? styles.pending : undefined} aria-busy={pending || undefined}>
                    <td>
                      <strong>
                        {u.model} → <code>{u.firmwareVersion}</code>
                      </strong>
                      <div className={styles.muted}>Scheduled {formatDateTime(u.scheduledAt)}</div>
                    </td>
                    <td data-label="Locations">{u.locations.map((l) => l.name).join(', ')}</td>
                    <td data-label="Status">
                      <StatusBadge status={u.status} />
                    </td>
                    <td data-label="Progress">
                      <ProgressBar label={`${u.model} ${u.firmwareVersion} rollout`} value={done} max={u.targetCount} />
                      <div className={styles.muted}>
                        {pending
                          ? 'Calculating targets…'
                          : `${u.completedCount} updated · ${u.failedCount} failed · ${u.targetCount} targeted`}
                      </div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {!pending &&
                          ACTIONS[u.status]?.map((a) => (
                            <Button
                              key={a.to}
                              size="sm"
                              variant={a.to === 'CANCELLED' ? 'ghost' : 'secondary'}
                              onClick={() => change(u, a.to, a.label)}
                              aria-label={`${a.label} ${u.model} ${u.firmwareVersion} rollout`}
                            >
                              {a.label}
                            </Button>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
