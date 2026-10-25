import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Info, ArrowLeft } from 'lucide-react';
import './PagesPlaceholder.css';

export default function GameDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          marginBottom: '20px',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} />
        Back to previous page
      </button>

      <div className="page-header">
        <h1 className="page-title">
          <Info size={26} color="var(--accent-primary)" />
          Game Details {id ? `(#${id})` : ''}
        </h1>
        <p className="page-description">Detailed metadata, status, achievements, and reviews for this game.</p>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Step 3 Placeholder — Ready for Phase 2</span>
        <p className="placeholder-info">
          This page corresponds to <code>04-game-details.md</code>. When implemented, it will feature:
        </p>
        <ul className="placeholder-features">
          <li>Complete catalog overview: developer, release platforms, and genres.</li>
          <li>Signed-in user's personal status, playtime, and quick-edit shortcuts.</li>
          <li>Game-specific achievement highlights.</li>
          <li>Community review summary, average score, and direct link to reviews.</li>
        </ul>
      </div>
    </div>
  );
}
