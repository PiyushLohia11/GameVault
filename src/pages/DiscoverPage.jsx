import React from 'react';
import { Compass } from 'lucide-react';
import './PagesPlaceholder.css';

export default function DiscoverPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <Compass size={26} color="var(--accent-primary)" />
          Discover Catalogue
        </h1>
        <p className="page-description">Browse and search the global database to discover new games to play.</p>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Step 3 Placeholder — Ready for Discover Implementation</span>
        <p className="placeholder-info">
          This page corresponds to <code>03-discover-catalogue.md</code>. When implemented, it will feature:
        </p>
        <ul className="placeholder-features">
          <li>Global video game database search and multi-facet filtering.</li>
          <li>Genre, platform, release year, and rating filters.</li>
          <li>One-click quick add to personal library with custom backlog status.</li>
          <li>Detailed game overview cards with metadata and tags.</li>
        </ul>
      </div>
    </div>
  );
}
