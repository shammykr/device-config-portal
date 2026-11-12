import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
}

export function ProgressBar({ label, value, max }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max} devices (${pct}%)`}
      className={styles.track}
    >
      <div className={styles.fill} style={{ width: `${pct}%` }} />
    </div>
  );
}
