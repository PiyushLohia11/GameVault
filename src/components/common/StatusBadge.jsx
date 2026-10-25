import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();
  let className = 'backlog';
  if (normalized === 'playing') className = 'playing';
  if (normalized === 'completed') className = 'completed';

  return (
    <span className={`status-badge ${className}`}>
      <span className="status-badge-dot"></span>
      {status || 'Unknown'}
    </span>
  );
}
