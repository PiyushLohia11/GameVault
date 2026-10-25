import React from 'react';
import { Library } from 'lucide-react';
import './PagesPlaceholder.css';

export default function MyLibraryPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <Library size={26} color="var(--accent-primary)" />
          My Library
        </h1>
        <p className="page-description">Track, manage, and filter your personal video game collection.</p>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Step 2 Placeholder — Ready for Library Implementation</span>
        <p className="placeholder-info">
          This page corresponds to <code>02-my-library.md</code>. When implemented, it will feature:
        </p>
        <ul className="placeholder-features">
          <li>Full game library table & grid views with sorting and search.</li>
          <li>Status tracking (Playing, Completed, On Hold, Dropped, Plan to Play).</li>
          <li>Playtime logging, user ratings, and completion dates.</li>
          <li>Add, edit, and remove games from your library.</li>
        </ul>
      </div>
    </div>
  );
}
