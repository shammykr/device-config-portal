import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22 }}>{title}</h1>
        {description && <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>{description}</p>}
      </div>
      {actions}
    </div>
  );
}
