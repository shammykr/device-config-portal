import type { DeviceStatus, OtaStatus } from '../../api/types';
import styles from './StatusBadge.module.css';

const LABELS: Record<DeviceStatus | OtaStatus, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  UPDATING: 'Updating',
  ERROR: 'Error',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/** Status shown as colour + text so it never relies on colour alone. */
export function StatusBadge({ status }: { status: DeviceStatus | OtaStatus }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}
