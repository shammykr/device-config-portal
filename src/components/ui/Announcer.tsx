import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const AnnounceContext = createContext<(message: string) => void>(() => {});

/**
 * A polite ARIA live region shared across the app, so actions like
 * "Rebooting 12 devices" are read out by screen readers.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const announce = useCallback((text: string) => {
    // Clear first so repeating the same message is still announced.
    setMessage('');
    requestAnimationFrame(() => setMessage(text));
  }, []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" className="visually-hidden">
        {message}
      </div>
    </AnnounceContext.Provider>
  );
}

export const useAnnounce = () => useContext(AnnounceContext);
