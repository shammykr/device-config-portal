import { useEffect, useRef, type RefObject } from 'react';

/**
 * After a failed submit, moves focus to the first invalid control in the form
 * so keyboard and screen reader users land directly on what needs fixing.
 */
export function useFocusFirstError(formRef: RefObject<HTMLFormElement | null>, errors: Record<string, unknown>) {
  const attempt = useRef(0);
  const handled = useRef(0);

  useEffect(() => {
    if (attempt.current === handled.current) return;
    handled.current = attempt.current;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], fieldset[aria-describedby] input')?.focus();
  }, [errors, formRef]);

  return () => {
    attempt.current++;
  };
}
