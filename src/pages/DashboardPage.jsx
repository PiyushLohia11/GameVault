import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Gamepad2,
  CheckCircle2,
  Clock,
  Hourglass,
  PlayCircle,
  Search,
  RefreshCw,
  Trophy,
  Star,
  UserPlus,
  Play,
  Zap,
  ArrowRight,
  TrendingUp,
  PieChart,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  History,
  FileText,
  MoreHorizontal,
  Flame,
} from 'lucide-react';

import { dashboardService } from '../services/dashboardService';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import './DashboardPage.css';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePeriod, setActivePeriod] = useState('30D'); // '7D' | '30D' | 'ALL TIME'
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();

  // Load dashboard data on mount and whenever simulateEmpty toggles
  const loadDashboardData = async (empty = simulateEmpty) => {
    setLoading(true);
    try {
      const result = await dashboardService.getDashboardData(1, empty);
      setData(result);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast('Error loading telemetry records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(simulateEmpty);
  }, [simulateEmpty]);

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quick Playtime update interaction
  const handleQuickAddHour = (e, gameTitle) => {
    e.preventDefault();
    e.stopPropagation();
    showToast(`Updated telemetry for ${gameTitle}: +1.0 hr recorded`);
  };

  // Search entry point handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Export logs simulation
  const handleExportLogs = () => {
    showToast('Telemetry stream exported: vault_telemetry_log.json');
  };

  // Calculation for top genre donut chart
  const genres = data?.playtimeByGenre || [];
  const topGenre = genres[0] || { genre: 'RPG', percentage: 42 };
  const totalGenreHours = data?.totalCategorizedHours || 365.3;

  return (
    <div className="dashboard-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dashboard-toast">
          <Sparkles size={16} color="var(--accent-primary)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SECTION 1: Page Header & Telemetry Range Controls */}
      <section className="dashboard-header-section">
        <div className="telemetry-info-col">
          <div className="telemetry-tag-row">
            <span className="telemetry-pill">Vault Telemetry</span>
            <span className="telemetry-sep">/</span>
            <span className="telemetry-subtext">Updated 12m ago across 4 platforms</span>
          </div>
          <h1 className="dashboard-hero-title">
            WELCOME BACK, <span className="username-highlight">{data?.user?.username?.toUpperCase() || 'ALEX_GAMER'}</span>
          </h1>
        </div>

        <div className="dashboard-header-controls">
          {/* Period Range Switcher */}
          <div className="period-switch-group">
            {['7D', '30D', 'ALL TIME'].map((period) => (
              <button
                key={period}
                type="button"
                className={`period-btn ${activePeriod === period ? 'active' : ''}`}
                onClick={() => setActivePeriod(period)}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Test Empty State Toggle */}
          <button
            type="button"
            className={`hud-action-btn toggle-empty ${simulateEmpty ? 'active' : ''}`}
            onClick={() => setSimulateEmpty(!simulateEmpty)}
            title="Toggle empty state to verify zero-data handling"
          >
            {simulateEmpty ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            <span>Empty Test</span>
          </button>
        </div>
      </section>

      {/* SECTION 2: 4 Summary Metric Cards Grid (Stitch Unified Glass Bar) */}
      <section className="summary-telemetry-bar glass-liquid-card">
        {/* Metric 1: Total Catalogued */}
        <Link to="/library" className="telemetry-segment" title="View complete library">
          <div className="segment-header">
            <span className="segment-label">Total Catalogued</span>
            <Gamepad2 size={16} className="segment-icon text-gold" />
          </div>
          <div className="segment-stat-row">
            <span className="segment-number">{data?.summary?.ownedCount ?? 0}</span>
            <span className="segment-badge badge-gold">+4 this mo</span>
          </div>
          <div className="segment-footer">
            <span>Physical &amp; Digital</span>
            <span className="segment-mono">94% Ready</span>
          </div>
        </Link>

        {/* Metric 2: Active Rotations (Playing) */}
        <Link to="/library?status=Playing" className="telemetry-segment" title="View ongoing games">
          <div className="segment-header">
            <span className="segment-label">Active Rotations</span>
            <PlayCircle size={16} className="segment-icon text-gold" />
          </div>
          <div className="segment-stat-row">
            <span className="segment-number">{data?.summary?.playingCount ?? 0}</span>
            <span className="segment-badge badge-muted">games ongoing</span>
          </div>
          <div className="segment-footer">
            <span>Session Average</span>
            <span className="segment-mono">2.4 hrs/day</span>
          </div>
        </Link>

        {/* Metric 3: Mastery Completed */}
        <Link to="/library?status=Completed" className="telemetry-segment" title="View completed titles">
          <div className="segment-header">
            <span className="segment-label">Mastery Completed</span>
            <CheckCircle2 size={16} className="segment-icon text-completed" />
          </div>
          <div className="segment-stat-row">
            <span className="segment-number">{data?.summary?.completedCount ?? 0}</span>
            <span className="segment-badge badge-completed">{data?.summary?.completedRate ?? '26.8'}% rate</span>
          </div>
          <div className="segment-footer">
            <span>Perfect 100% Run</span>
            <span className="segment-mono text-gold">{data?.summary?.perfectRuns ?? 14} Titles</span>
          </div>
        </Link>

        {/* Metric 4: Unplayed Backlog */}
        <Link to="/library?status=Backlog" className="telemetry-segment" title="View backlog queue">
          <div className="segment-header">
            <span className="segment-label">Unplayed Backlog</span>
            <Hourglass size={16} className="segment-icon text-muted" />
          </div>
          <div className="segment-stat-row">
            <span className="segment-number">{data?.summary?.backlogCount ?? 0}</span>
            <span className="segment-badge badge-muted">-6 Q1 burn</span>
          </div>
          <div className="segment-footer">
            <span>Est. Clearance Time</span>
            <span className="segment-mono">~180 hrs</span>
          </div>
        </Link>
      </section>

      {/* SECTION 3: Continue Playing (Hero Cards Showcase) */}
      <section className="continue-playing-container">
        <div className="section-title-bar">
          <div className="title-lead-group">
            <Zap size={18} className="text-gold" />
            <h2 className="section-heading">CONTINUE PLAYING</h2>
            <span className="count-pill">
              {data?.continuePlaying?.length || 0} SESSIONS
            </span>
          </div>
          <Link to="/library?status=Playing" className="view-vault-link">
            <span>Open Full Vault</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {data?.continuePlaying?.length > 0 ? (
          <div className="continue-hero-grid">
            {data.continuePlaying.slice(0, 3).map((game) => (
              <div key={game.id} className="continue-hero-card glass-liquid-card">
                {/* Game Box Artwork & Atmospheric Header */}
                <div className="card-cover-container">
                  {game.coverImage ? (
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="card-cover-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="card-cover-fallback">
                      <Gamepad2 size={44} color="rgba(244, 191, 78, 0.35)" />
                    </div>
                  )}
                  <div className="cover-dark-gradient" />

                  {/* Top Badges */}
                  <div className="cover-top-tags">
                    <span className="cover-badge">{game.platform}</span>
                    <span className="cover-badge badge-accent">{game.tag || 'Ongoing'}</span>
                  </div>

                  {/* Bottom Title on Artwork */}
                  <div className="cover-bottom-caption">
                    <span className="genre-lead-tag">
                      {game.genres?.[0] || 'Action RPG'}
                    </span>
                    <h3 className="game-hero-title">{game.title}</h3>
                  </div>
                </div>

                {/* Card Content & Telemetry */}
                <div className="card-body-content">
                  <div className="playtime-log-row">
                    <span className="logged-hours">
                      <Clock size={12} className="text-muted" />
                      <span>{game.playtimeHours}h logged</span>
                    </span>
                    <span className="last-played-meta">
                      {game.lastPlayedDate === '2026-10-25' ? '2h ago' : game.lastPlayedDate === '2026-10-24' ? 'Yesterday' : game.lastPlayedDate}
                    </span>
                  </div>

                  {/* Milestone & Linear Progress Bar */}
                  <div className="milestone-progress-group">
                    <div className="milestone-label-row">
                      <span className="milestone-name">{game.subGoal || 'Campaign Progress'}</span>
                      <span className="milestone-percent">{game.progressPercent || 78}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${game.progressPercent || 78}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="card-actions-row">
                    <Link to={`/games/${game.gameId}`} className="launch-action-btn">
                      <Play size={13} fill="currentColor" />
                      <span>Resume</span>
                    </Link>
                    <button
                      type="button"
                      className="quick-hour-btn"
                      onClick={(e) => handleQuickAddHour(e, game.title)}
                      title="Log 1 additional hour of playtime (+1.0h)"
                    >
                      +1h
                    </button>
                    <Link
                      to={`/games/${game.gameId}`}
                      className="more-options-btn"
                      title="View Game Details"
                    >
                      <MoreHorizontal size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Active Rotations"
            description="You do not have any games currently marked as Playing in your library."
            icon={Gamepad2}
            actionLabel="Discover Games to Play"
            actionTo="/discover"
          />
        )}
      </section>

      {/* SECTION 4: Three Interactive Analytics Chart Panels */}
      <section className="analytics-panels-grid">
        {/* Panel 1: Playtime By Genre (SVG Donut Chart) */}
        <div className="analytics-card glass-liquid-card">
          <div className="panel-header">
            <div className="panel-title-lead">
              <PieChart size={16} className="text-gold" />
              <h3 className="panel-heading">PLAYTIME BY GENRE</h3>
            </div>
            <span className="panel-badge-mono">{totalGenreHours}h Total</span>
          </div>

          {genres.length > 0 ? (
            <div className="genre-chart-body">
              {/* SVG Donut Circle */}
              <div className="donut-chart-wrapper">
                <svg className="donut-svg" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="10"
                  />
                  {/* Outer Gold Arc: RPG (42%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#F4BF4E"
                    strokeWidth="10"
                    strokeDasharray="238.76"
                    strokeDashoffset="138.48"
                    strokeLinecap="round"
                  />
                  {/* Middle Arc: Action (28%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#ffdfa5"
                    strokeWidth="10"
                    strokeDasharray="238.76"
                    strokeDashoffset="171.9"
                    strokeLinecap="round"
                    className="opacity-80"
                  />
                  {/* Third Arc: Sci-Fi / Strategy */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#c8c5cb"
                    strokeWidth="10"
                    strokeDasharray="238.76"
                    strokeDashoffset="195.78"
                    strokeLinecap="round"
                    className="opacity-60"
                  />
                </svg>
                <div className="donut-center-label">
                  <span className="center-percent">{topGenre.percentage}%</span>
                  <span className="center-tag">{topGenre.genre?.split(' ')[0] || 'RPG'}</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="donut-legend-col">
                {genres.map((g, idx) => {
                  const colors = ['#F4BF4E', '#ffdfa5', '#c8c5cb', '#71717A'];
                  const color = colors[idx % colors.length];
                  return (
                    <div key={g.genre} className="legend-row">
                      <span className="legend-dot" style={{ backgroundColor: color }} />
                      <span className="legend-name">{g.genre} ({g.percentage}%)</span>
                      <span className="legend-hours">{g.hours}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Genre Data"
              description="Playtime distribution will calculate as you record gaming hours in your library."
              icon={PieChart}
            />
          )}

          <div className="panel-footer-row">
            <span>Velocity: {topGenre.genre} (+18h)</span>
            <span className="text-gold">Dominant Segment</span>
          </div>
        </div>

        {/* Panel 2: Backlog Velocity (SVG Area Chart) */}
        <div className="analytics-card glass-liquid-card">
          <div className="panel-header">
            <div className="panel-title-lead">
              <TrendingUp size={16} className="text-gold" />
              <h3 className="panel-heading">BACKLOG VELOCITY</h3>
            </div>
            <span className="panel-badge-mono text-completed">-18 Cleared</span>
          </div>

          {data?.summary?.ownedCount > 0 ? (
            <div className="velocity-chart-body">
              <div className="svg-chart-container">
                <svg className="velocity-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="subtleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F4BF4E" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#F4BF4E" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Dashed Grid Lines */}
                  <line x1="0" y1="25" x2="300" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  <line x1="0" y1="65" x2="300" y2="65" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  {/* Area Gradient Fill */}
                  <path
                    d="M0,25 C60,30 120,48 180,45 C240,43 270,75 300,78 L300,100 L0,100 Z"
                    fill="url(#subtleGrad)"
                  />
                  {/* Curve Stroke Line */}
                  <path
                    d="M0,25 C60,30 120,48 180,45 C240,43 270,75 300,78"
                    fill="none"
                    stroke="#F4BF4E"
                    strokeWidth="2"
                  />
                  {/* Data Points */}
                  <circle cx="0" cy="25" r="3" fill="#F4BF4E" />
                  <circle cx="180" cy="45" r="3" fill="#F4BF4E" />
                  <circle cx="300" cy="78" r="3.5" fill="#FFFFFF" stroke="#F4BF4E" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Month Horizon */}
              <div className="chart-month-axis">
                <span>NOV</span>
                <span>DEC</span>
                <span>JAN</span>
                <span>FEB</span>
                <span>MAR</span>
                <span className="active-month">APR ({data?.summary?.backlogCount || 99})</span>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Library Empty"
              description="Add games to your backlog to track completion trajectory."
              icon={TrendingUp}
              actionLabel="Explore Catalog"
              actionTo="/discover"
            />
          )}

          <div className="panel-footer-row">
            <span>Target Zero: Q4 2025</span>
            <span className="text-completed">-15.4% 6M Trajectory</span>
          </div>
        </div>

        {/* Panel 3: Achievement Vault (Circular Gauge & Points) */}
        <div className="analytics-card glass-liquid-card">
          <div className="panel-header">
            <div className="panel-title-lead">
              <Trophy size={16} className="text-gold" />
              <h3 className="panel-heading">ACHIEVEMENT VAULT</h3>
            </div>
            <span className="panel-badge-mono text-gold">Tier I</span>
          </div>

          {data?.achievementStats?.totalAvailable > 0 ? (
            <div className="achievement-chart-body">
              {/* Circular Meter */}
              <div className="radial-gauge-wrapper">
                <svg className="radial-svg" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#F4BF4E"
                    strokeWidth="6"
                    strokeDasharray="251.32"
                    strokeDashoffset={251.32 * (1 - (data.achievementStats.percentage / 100))}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="radial-center-content">
                  <span className="radial-number">{data.achievementStats.percentage}%</span>
                  <span className="radial-sub">Mastered</span>
                </div>
              </div>

              {/* Points Unlocked & Featured Milestone */}
              <div className="achievement-info-col">
                <div className="points-tally-group">
                  <span className="meta-small-label">Points Unlocked</span>
                  <div className="points-lead-row">
                    <span className="points-lead text-gold font-mono">
                      {data.achievementStats.pointsEarned?.toLocaleString() || '1,420'}
                    </span>
                    <span className="points-total font-mono">
                      / {data.achievementStats.totalPoints?.toLocaleString() || '2,088'} PTS
                    </span>
                  </div>
                </div>

                {/* Featured Badge Card */}
                <div className="featured-milestone-pill">
                  <Trophy size={14} className="text-gold" />
                  <div className="milestone-text-group">
                    <span className="milestone-title">Master of Void</span>
                    <span className="milestone-sub">Elden Ring • +50 PTS</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Achievements"
              description="Unlock achievements in games to track your gamer score."
              icon={Trophy}
            />
          )}

          <div className="panel-footer-row">
            <span>668 PTS to LVL 49</span>
            <Link to="/achievements" className="footer-action-link">
              <span>View Showcase</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: Recent Telemetry & Activity Feed */}
      <section className="telemetry-feed-section glass-liquid-card">
        <div className="feed-header-bar">
          <div className="feed-title-lead">
            <History size={18} className="text-gold" />
            <div>
              <h3 className="feed-heading">RECENT TELEMETRY &amp; ACTIVITY</h3>
              <p className="feed-subheading">Real-time stream across linked ecosystems</p>
            </div>
          </div>
          <button
            type="button"
            className="export-logs-btn"
            onClick={handleExportLogs}
            title="Download activity telemetry stream"
          >
            <span>Export Logs</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {data?.recentActivity?.length > 0 ? (
          <div className="feed-rows-list">
            {data.recentActivity.map((activity) => {
              // Icon selection based on event type
              let Icon = Trophy;
              let iconClass = 'text-gold';
              let tagBadgeClass = 'badge-gold';

              if (activity.type === 'review') {
                Icon = Star;
                iconClass = 'text-gold';
                tagBadgeClass = 'badge-subtle';
              } else if (activity.type === 'friend') {
                Icon = UserPlus;
                iconClass = 'text-completed';
                tagBadgeClass = 'badge-completed';
              } else if (activity.type === 'library') {
                Icon = Gamepad2;
                iconClass = 'text-muted';
                tagBadgeClass = 'badge-muted';
              }

              return (
                <div key={activity.id} className="feed-row-item">
                  <div className="feed-row-left">
                    <div className={`feed-icon-box ${iconClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className="feed-content-col">
                      <div className="feed-title-line">
                        <span className="feed-event-title">{activity.title}</span>
                        {activity.tag && (
                          <span className={`event-tag-pill ${tagBadgeClass}`}>
                            {activity.tag}
                          </span>
                        )}
                      </div>
                      <span className="feed-event-desc">
                        {activity.description || `${activity.gameTitle || ''}`}
                      </span>
                    </div>
                  </div>

                  <div className="feed-row-right">
                    <span className="feed-timestamp font-mono">{activity.timestamp}</span>
                    <span className="feed-ecosystem-tag font-mono">
                      {activity.ecosystem || 'Archive Sync'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Recent Activity"
            description="Your gaming events, achievement unlocks, and reviews will appear here."
            icon={History}
          />
        )}

        <div className="feed-status-footer">
          <span className="status-live-indicator">
            <span className="live-dot" />
            <span>DAO Sync Node #892 Active</span>
          </span>
          <span className="status-bandwidth font-mono">Bandwidth: 42.1 KB/s</span>
        </div>
      </section>
    </div>
  );
}
