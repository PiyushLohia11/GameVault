import React from 'react';
import { Settings } from 'lucide-react';
import './PagesPlaceholder.css';

export default function SettingsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <Settings size={26} color="var(--accent-primary)" />
          Settings & Preferences
        </h1>
        <p className="page-description">Manage local preferences and view current session status.</p>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Step 3 Placeholder — Ready for Phase 3</span>
        <p className="placeholder-info">
          This page corresponds to <code>08-settings.md</code>. When implemented, it will feature:
        </p>
        <ul className="placeholder-features">
          <li>Signed-in user identity and basic session details.</li>
          <li>Safe preferences backed by defined schema or local configuration.</li>
          <li>Strict masking of database credentials and internal secrets.</li>
        </ul>
      </div>
    </div>
  );
}
