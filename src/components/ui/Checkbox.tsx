import { useEffect, useId, useRef, type InputHTMLAttributes } from 'react';
import styles from './Checkbox.module.css';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  /** Visually hide the label but keep it for assistive tech. */
  hideLabel?: boolean;
  indeterminate?: boolean;
}

export function Checkbox({ label, hideLabel, indeterminate = false, ...rest }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={styles.checkbox}>
      <input
        ref={ref}
        type="checkbox"
        aria-checked={indeterminate ? 'mixed' : undefined}
        {...rest}
      />
      <span className={hideLabel ? 'visually-hidden' : undefined}>{label}</span>
    </label>
  );
}

interface CheckboxGroupProps {
  legend: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

/** A fieldset of checkboxes with a legend, for multi-select form inputs. */
export function CheckboxGroup({ legend, options, value, onChange, error }: CheckboxGroupProps) {
  const toggle = (v: string, checked: boolean) =>
    onChange(checked ? [...value, v] : value.filter((x) => x !== v));
  const errorId = `${useId()}-error`;

  return (
    <fieldset className={styles.group} aria-describedby={error ? errorId : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((o) => (
          <Checkbox
            key={o.value}
            label={o.label}
            checked={value.includes(o.value)}
            onChange={(e) => toggle(o.value, e.target.checked)}
          />
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
