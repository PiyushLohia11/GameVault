import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import './PagesPlaceholder.css';

export default function NotFoundPage() {
  return (
    <div className="page-container" style={{ textAlign: 'center', paddingTop: '64px' }}>
      <div className="placeholder-card" style={{ maxWidth: '520px', margin: '0 auto', alignItems: 'center' }}>
        <AlertCircle size={48} color="var(--accent-primary)" />
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>404 — Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          The page or route you requested does not exist in this database interface.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600',
            fontSize: '14px',
            marginTop: '8px',
          }}
        >
          <Home size={16} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
