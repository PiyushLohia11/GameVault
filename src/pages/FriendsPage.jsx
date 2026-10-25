import React from 'react';
import { Users } from 'lucide-react';
import './PagesPlaceholder.css';

export default function FriendsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <Users size={26} color="var(--accent-primary)" />
          Friends & Community
        </h1>
        <p className="page-description">Connect with fellow players and compare library progress.</p>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Step 3 Placeholder — Ready for Phase 3</span>
        <p className="placeholder-info">
          This page corresponds to <code>06-friends.md</code>. When implemented, it will feature:
        </p>
        <ul className="placeholder-features">
          <li>Friend list with friendship dates and profile cards.</li>
          <li>Side-by-side library comparison (shared games, playtime differences).</li>
          <li>Live friend activity feed (unlocked achievements, completions, reviews).</li>
        </ul>
      </div>
    </div>
  );
}
