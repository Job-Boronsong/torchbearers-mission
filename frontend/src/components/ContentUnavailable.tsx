import type { ReactNode } from 'react';
import { useId } from 'react';

interface ContentUnavailableProps {
  title: string;
  description: string;
  onRetry: () => void;
  children?: ReactNode;
}

export default function ContentUnavailable({
  title,
  description,
  onRetry,
  children,
}: ContentUnavailableProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--bg-subtle)',
        textAlign: 'center',
      }}
    >
      <div className="container">
        <div
          role="alert"
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '3rem 1.5rem',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h1 id={titleId} className="h2">{title}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {description}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Try again
            </button>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}