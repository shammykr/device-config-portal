import { useState } from 'react';
import type { FirmwarePolicy } from '../../api/types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Dialog, useAnnounce } from '../../components/ui';
import { useDeleteFirmwarePolicy, useFirmwarePolicies } from '../../hooks/useFirmware';
import { formatDateTime } from '../../utils/format';
import styles from '../forms.module.css';
import { PolicyFormDialog } from './PolicyFormDialog';

export function FirmwarePoliciesPage() {
  const { data: policies, isLoading, error } = useFirmwarePolicies();
  const remove = useDeleteFirmwarePolicy();
  const announce = useAnnounce();
  const [editing, setEditing] = useState<FirmwarePolicy | 'new' | null>(null);
  const [deleting, setDeleting] = useState<FirmwarePolicy | null>(null);

  const confirmDelete = () => {
    if (!deleting) return;
    const { id, name } = deleting;
    remove.mutate(id, {
      onSuccess: () => announce(`Policy “${name}” deleted`),
      onError: (e) => announce(`Delete failed: ${(e as Error).message}`),
    });
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title="Firmware policies"
        description="Define which firmware each device model should run, where, and when it may update."
        actions={
          <Button variant="primary" onClick={() => setEditing('new')}>
            New policy
          </Button>
        }
      />

      {isLoading && <p role="status">Loading policies…</p>}
      {error && <p role="alert">Could not load policies: {(error as Error).message}</p>}
      {policies && policies.length === 0 && <p>No policies yet.</p>}
      {policies && policies.length > 0 && (
        <table className={styles.table}>
          <caption className="visually-hidden">Firmware policies</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Model</th>
              <th scope="col">Target</th>
              <th scope="col">Window</th>
              <th scope="col">Concurrency</th>
              <th scope="col">Locations</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => {
              const pending = p.id.startsWith('temp-');
              return (
                <tr key={p.id} className={pending ? styles.pending : undefined} aria-busy={pending || undefined}>
                  <td>
                    <strong>{p.name}</strong>
                    <div className={styles.muted}>
                      {p.autoApprove ? 'Auto-approve' : 'Manual approval'} · updated {formatDateTime(p.updatedAt)}
                    </div>
                  </td>
                  <td data-label="Model">{p.model}</td>
                  <td data-label="Target">
                    <code>{p.targetVersion}</code> <span className={styles.muted}>{p.channel.toLowerCase()}</span>
                  </td>
                  <td data-label="Window">
                    {p.maintenanceWindowStart}–{p.maintenanceWindowEnd}
                  </td>
                  <td data-label="Concurrency">{p.maxConcurrentPercent}%</td>
                  <td data-label="Locations">{p.locations.map((l) => l.name).join(', ')}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Button size="sm" disabled={pending} onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => setDeleting(p)}
                        aria-label={`Delete ${p.name}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {editing && (
        <PolicyFormDialog policy={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <Dialog
          title="Delete policy?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>
                Delete
              </Button>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            “{deleting.name}” will be removed. Devices it covers will keep their current firmware.
          </p>
        </Dialog>
      )}
    </>
  );
}
