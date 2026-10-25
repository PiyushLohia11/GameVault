import React from 'react';
import { Link } from 'react-router-dom';
import './StatCard.css';

export default function StatCard({ label, value, icon: Icon, iconColor, to }) {
  const content = (
    <>
      <div className="stat-card-info">
        <span className="stat-card-label">{label}</span>
        <span className="stat-card-value">{value}</span>
      </div>
      {Icon && (
        <div className="stat-card-icon-wrapper">
          <Icon size={22} color={iconColor || 'var(--accent-primary)'} />
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="stat-card" title={`View ${label} in Library`}>
        {content}
      </Link>
    );
  }

  return <div className="stat-card">{content}</div>;
}
