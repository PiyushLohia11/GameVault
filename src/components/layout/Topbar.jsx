import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Bell } from 'lucide-react';
import './Topbar.css';

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSyncVault = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);
  };

  return (
    <header className="topbar">
      {/* Search Bar - Width 384px with ⌘K Badge */}
      <form onSubmit={handleSearchSubmit} className="topbar-search-form">
        <div className="search-icon-wrapper">
          <Search size={15} color="#71717A" />
        </div>
        <input
          type="text"
          className="topbar-search-input"
          placeholder="Quick search catalogue, tags, achievements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="search-kbd-badge">
          <kbd className="kbd-shortcut">⌘K</kbd>
        </div>
      </form>

      {/* Action Controls & User Profile */}
      <div className="topbar-actions">
        {/* Sync Vault Button */}
        <button
          type="button"
          className="topbar-btn sync-vault-btn"
          onClick={handleSyncVault}
          title="Synchronize linked ecosystem libraries"
        >
          <RefreshCw size={13} className={`sync-icon text-gold ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Vault'}</span>
        </button>

        {/* Notifications Button */}
        <button
          type="button"
          className="topbar-icon-btn notification-btn"
          title="Notifications"
        >
          <Bell size={16} />
          <span className="notification-dot" />
        </button>

        {/* Vertical Divider */}
        <div className="topbar-divider" />

        {/* Profile Capsule */}
        <div className="user-profile-capsule" title="Alex Mercer (Master Curator)">
          <div className="avatar-wrapper">
            <img
              src="/images/avatar.jpg"
              alt="Alex Mercer"
              className="user-avatar-img"
              onError={(e) => {
                // Graceful fallback to initial if image fails
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="user-avatar-initial" style={{ display: 'none' }}>A</div>
            <span className="avatar-online-dot" />
          </div>

          <div className="profile-text-col">
            <div className="profile-name-row">
              <span className="profile-username">alex_gamer</span>
              <span className="profile-lvl-badge">LVL 48</span>
            </div>
            <span className="profile-role-tag">MASTER CURATOR</span>
          </div>
        </div>
      </div>
    </header>
  );
}
