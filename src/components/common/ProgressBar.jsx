import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ label, percentage, color, showPercent = true }) {
  const clamped = Math.min(100, Math.max(0, percentage || 0));

  return (
    <div className="progress-bar-container">
      {(label || showPercent) && (
        <div className="progress-bar-header">
          {label && <span>{label}</span>}
          {showPercent && <span className="progress-bar-percent">{clamped}%</span>}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${clamped}%`,
            backgroundColor: color || 'var(--accent-primary)',
          }}
        />
      </div>
    </div>
  );
}
