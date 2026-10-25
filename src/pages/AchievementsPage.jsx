import React from 'react';
import { Trophy } from 'lucide-react';
import './PagesPlaceholder.css';

export default function AchievementsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <Trophy size={26} color="var(--accent-primary)" />
          Achievements & Milestones
        </h1>
        <p className="page-description">Inspect your unlocked gaming accomplishments and milestone scores.</p>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Step 3 Placeholder — Ready for Phase 3</span>
        <p className="placeholder-info">
          This page corresponds to <code>05-achievements.md</code>. When implemented, it will feature:
        </p>
        <ul className="placeholder-features">
          <li>Clear visual distinction between locked and unlocked achievements.</li>
          <li>Points breakdown and unlock timestamps.</li>
          <li>Per-game achievement selector and completion progress bars.</li>
          <li>Total gamer score and overall completion metrics.</li>
        </ul>
      </div>
    </div>
  );
}
