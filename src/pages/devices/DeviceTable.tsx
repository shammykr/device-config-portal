import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Device } from '../../api/types';
import { Checkbox, StatusBadge } from '../../components/ui';
import { timeAgo } from '../../utils/format';
import styles from './DeviceTable.module.css';

const ROW_HEIGHT = 48;

interface DeviceTableProps {
  devices: Device[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (device: Device) => void;
}

/**
 * Virtualized device grid. Only the rows in view (plus overscan) are mounted,
 * so thousands of devices scroll smoothly. Exposed as an ARIA grid with
 * roving focus: Arrow keys / Home / End / PageUp / PageDown move between rows,
 * Space toggles selection, Enter opens the device's settings.
 */
export function DeviceTable({ devices, selected, onToggle, onToggleAll, onOpen }: DeviceTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pendingFocus = useRef(false);

  const virtualizer = useVirtualizer({
    count: devices.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // Keep the active index valid when filters shrink the list.
  useEffect(() => {
    if (activeIndex >= devices.length) setActiveIndex(Math.max(0, devices.length - 1));
  }, [devices.length, activeIndex]);

  // After keyboard navigation, focus the newly active row once it is rendered.
  useEffect(() => {
    if (!pendingFocus.current) return;
    const row = scrollRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (row) {
      row.focus({ preventScroll: true });
      pendingFocus.current = false;
    }
  });

  const moveTo = (index: number) => {
    const next = Math.min(Math.max(index, 0), devices.length - 1);
    setActiveIndex(next);
    virtualizer.scrollToIndex(next, { align: 'auto' });
    pendingFocus.current = true;
  };

  const pageSize = Math.max(1, Math.floor((scrollRef.current?.clientHeight ?? 480) / ROW_HEIGHT) - 1);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number, device: Device) => {
    switch (e.key) {
      case 'ArrowDown':
        moveTo(index + 1);
        break;
      case 'ArrowUp':
        moveTo(index - 1);
        break;
      case 'PageDown':
        moveTo(index + pageSize);
        break;
      case 'PageUp':
        moveTo(index - pageSize);
        break;
      case 'Home':
        moveTo(0);
        break;
      case 'End':
        moveTo(devices.length - 1);
        break;
      case ' ':
        onToggle(device.id);
        break;
      case 'Enter':
        onOpen(device);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const allSelected = devices.length > 0 && devices.every((d) => selected.has(d.id));
  const someSelected = !allSelected && devices.some((d) => selected.has(d.id));

  return (
    <div
      role="grid"
      aria-label="Devices"
      aria-rowcount={devices.length + 1}
      aria-multiselectable="true"
      className={styles.grid}
    >
      <div role="row" aria-rowindex={1} className={`${styles.row} ${styles.headerRow}`}>
        <div role="columnheader" className={styles.cellCheck}>
          <Checkbox
            label={allSelected ? 'Deselect all devices' : 'Select all devices'}
            hideLabel
            checked={allSelected}
            indeterminate={someSelected}
            onChange={onToggleAll}
          />
        </div>
        <div role="columnheader">Device</div>
        <div role="columnheader" className={styles.optional}>Model</div>
        <div role="columnheader">Location</div>
        <div role="columnheader">Firmware</div>
        <div role="columnheader">Status</div>
        <div role="columnheader" className={styles.optional}>Last seen</div>
      </div>

      <div ref={scrollRef} className={styles.scroller}>
        {devices.length === 0 && <p className={styles.empty}>No devices match the current filters.</p>}
        <div role="presentation" style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((item) => {
            const device = devices[item.index];
            const isSelected = selected.has(device.id);
            return (
              <div
                key={device.id}
                role="row"
                data-index={item.index}
                aria-rowindex={item.index + 2}
                aria-selected={isSelected}
                tabIndex={item.index === activeIndex ? 0 : -1}
                onKeyDown={(e) => onKeyDown(e, item.index, device)}
                onFocus={() => setActiveIndex(item.index)}
                onDoubleClick={() => onOpen(device)}
                className={`${styles.row} ${isSelected ? styles.selected : ''}`}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ROW_HEIGHT, transform: `translateY(${item.start}px)` }}
              >
                <div role="gridcell" className={styles.cellCheck}>
                  <Checkbox
                    label={`Select ${device.name}`}
                    hideLabel
                    tabIndex={-1}
                    checked={isSelected}
                    onChange={() => onToggle(device.id)}
                  />
                </div>
                <div role="gridcell" className={styles.nameCell}>
                  <button type="button" tabIndex={-1} className={styles.nameButton} onClick={() => onOpen(device)}>
                    {device.name}
                  </button>
                  <span className={styles.muted}>{device.serial}</span>
                </div>
                <div role="gridcell" className={styles.optional}>{device.model}</div>
                <div role="gridcell" className={styles.truncate}>{device.location.name}</div>
                <div role="gridcell"><code>{device.firmwareVersion}</code></div>
                <div role="gridcell"><StatusBadge status={device.status} /></div>
                <div role="gridcell" className={`${styles.optional} ${styles.muted}`}>{timeAgo(device.lastSeen)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
