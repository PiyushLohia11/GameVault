import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({
  title = 'No Data Available',
  description = 'There are no records to display at this time.',
  icon: Icon = Inbox,
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={24} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-description">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="empty-state-action">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button type="button" onClick={onAction} className="empty-state-action">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
