import React from 'react';
import { Star } from 'lucide-react';
import './PagesPlaceholder.css';

export default function ReviewsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <Star size={26} color="var(--accent-primary)" />
          Game Reviews
        </h1>
        <p className="page-description">Read community opinions and submit ratings for games you own.</p>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Step 3 Placeholder — Ready for Phase 3</span>
        <p className="placeholder-info">
          This page corresponds to <code>07-reviews.md</code>. When implemented, it will feature:
        </p>
        <ul className="placeholder-features">
          <li>Review feed per game with 1–10 ratings and review dates.</li>
          <li>Sorting by newest or highest rating.</li>
          <li>Review submission form with strict ownership validation.</li>
          <li>Average rating calculation and score breakdowns.</li>
        </ul>
      </div>
    </div>
  );
}
