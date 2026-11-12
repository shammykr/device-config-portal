import { useMemo } from 'react';
import type { DeviceStatus } from '../../api/types';
import { useDevices } from '../../hooks/useDevices';
import styles from './AppLayout.module.css';

const ORDER: DeviceStatus[] = ['ONLINE', 'UPDATING', 'OFFLINE', 'ERROR'];

/** Live fleet-wide counts, updated by the device status subscription. */
export function FleetStatusSummary() {
  const { data } = useDevices();
  const counts = useMemo(() => {
    const c: Record<DeviceStatus, number> = { ONLINE: 0, OFFLINE: 0, UPDATING: 0, ERROR: 0 };
    data?.forEach((d) => c[d.status]++);
    return c;
  }, [data]);

  if (!data) return null;
  return (
    <ul className={styles.summary} aria-label="Fleet status">
      <li className={styles.live}>
        <span className={styles.liveDot} aria-hidden="true" /> Live
      </li>
      {ORDER.map((s) => (
        <li key={s} className={styles[`count${s}`]}>
          <strong>{counts[s]}</strong> {s.toLowerCase()}
        </li>
      ))}
    </ul>
  );
}
