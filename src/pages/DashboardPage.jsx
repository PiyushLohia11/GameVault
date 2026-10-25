import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import './PagesPlaceholder.css';

export default function DashboardPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <LayoutDashboard size={26} color="var(--accent-primary)" />
          Player Dashboard
        </h1>
        <p className="page-description">Live overview of your gaming metrics, recent backlog, and achievements.</p>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Step 1 Foundation — Ready for Dashboard Implementation</span>
        <p className="placeholder-info">
          This page corresponds to <code>01-dashboard.md</code>. When implemented, it will feature:
        </p>
        <ul className="placeholder-features">
          <li>Key gaming statistics (Total Hours, Completion Rate, Backlog Count, Gamer Score).</li>
          <li>Now Playing hero carousel and currently active sessions.</li>
          <li>Recent backlog queue with progress trackers.</li>
          <li>Recent achievement unlocks and friend activity feed.</li>
        </ul>
      </div>
    </div>
  );
}
