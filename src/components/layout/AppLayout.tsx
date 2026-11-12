import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FleetStatusSummary } from './FleetStatusSummary';
import styles from './AppLayout.module.css';

const NAV = [
  { to: '/devices', label: 'Devices' },
  { to: '/firmware', label: 'Firmware policies' },
  { to: '/ota', label: 'OTA updates' },
];

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const firstRender = useRef(true);

  // On client-side navigation move focus to the main region so screen reader
  // and keyboard users land at the new page's content.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <span className={styles.brand}>Device Config Portal</span>
        <nav aria-label="Primary" className={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <FleetStatusSummary />
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
