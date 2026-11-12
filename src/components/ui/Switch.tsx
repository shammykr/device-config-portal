import { useId } from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

/** A toggle exposed as role="switch"; Space and Enter toggle it natively via <button>. */
export function Switch({ label, checked, onChange, description }: SwitchProps) {
  const id = useId();
  return (
    <div className={styles.row}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={styles.track}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.thumb} />
      </button>
      <div>
        <span id={`${id}-label`} className={styles.label}>
          {label}
        </span>
        {description && (
          <p id={`${id}-desc`} className={styles.description}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
