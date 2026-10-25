import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Gamepad2,
  Compass,
  Trophy,
  Users,
  Star,
  Settings,
  Plus,
  Flame,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/library', label: 'Library', icon: Gamepad2, badge: '142' },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/achievements', label: 'Mastery', icon: Trophy },
  { to: '/friends', label: 'Network', icon: Users, pillBadge: '3 ON' },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleAddTitleClick = () => {
    navigate('/library?add=true');
  };

  return (
    <aside className="sidebar">
      {/* Upper Segment: Brand, Primary CTA, Navigation */}
      <div className="sidebar-upper-segment">
        {/* Brand Group */}
        <div className="sidebar-brand-group">
          <div className="brand-token-box">
            <Flame size={18} className="text-gold" />
          </div>
          <div className="brand-text-col">
            <div className="brand-title-row">
              <span className="brand-title-text">VALENCE</span>
              <span className="brand-gold-dot" />
            </div>
            <span className="brand-protocol-sub">ARCHIVE PROTOCOL</span>
          </div>
        </div>

        {/* Primary CTA: Add Title Button */}
        <button
          type="button"
          className="sidebar-add-btn"
          onClick={handleAddTitleClick}
          title="Add a game title to your library"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Title</span>
        </button>

        {/* Navigation List */}
        <nav className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-gold' : 'nav-icon-muted'} />
                    <span className="nav-item-label">{item.label}</span>

                    {/* Numeric Count Badge (e.g. Library 142) */}
                    {item.badge && (
                      <span className="nav-mono-badge">{item.badge}</span>
                    )}

                    {/* Pill Status Badge (e.g. Network 3 ON) */}
                    {item.pillBadge && (
                      <span className="nav-pill-badge">{item.pillBadge}</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Lower Segment: Telemetry Summary Boxes & System Status */}
      <div className="sidebar-lower-segment">
        {/* 2-Column Telemetry Metric Grid */}
        <div className="sidebar-telemetry-grid">
          <div className="sidebar-metric-box">
            <span className="sidebar-metric-label">Vault Count</span>
            <span className="sidebar-metric-value">142</span>
          </div>
          <div className="sidebar-metric-box">
            <span className="sidebar-metric-label">Mastered</span>
            <span className="sidebar-metric-value text-gold">38</span>
          </div>
        </div>

        {/* System Online Status Line */}
        <div className="sidebar-system-status">
          <span className="node-status-wrap">
            <span className="node-online-dot" />
            <span>NODE 01 ONLINE</span>
          </span>
          <span className="system-version-mono">v2.4.9</span>
        </div>
      </div>
    </aside>
  );
}
