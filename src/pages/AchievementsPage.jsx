import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Award,
  Shield,
  Swords,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  Flame,
  Target,
  Skull,
  Crown,
  Diamond,
  Zap,
  Wrench,
  Search,
  Filter,
  ChevronDown,
  Download,
  ExternalLink,
  Clock,
  Gamepad2,
  Check,
  HelpCircle,
  WifiOff,
  History,
  FileSpreadsheet,
  CheckCheck,
  TrendingUp,
  Layers,
  CircleDot,
  Radio,
} from 'lucide-react';
import { achievementService } from '../services/achievementService';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import './AchievementsPage.css';

/**
 * Icon renderer helper based on milestone metadata
 */
const renderMilestoneIcon = (iconName, size = 20) => {
  switch (iconName?.toLowerCase()) {
    case 'swords':
      return <Swords size={size} />;
    case 'shield':
    case 'castle':
      return <Shield size={size} />;
    case 'hardware':
    case 'wrench':
      return <Wrench size={size} />;
    case 'sparkles':
      return <Sparkles size={size} />;
    case 'target':
      return <Target size={size} />;
    case 'skull':
      return <Skull size={size} />;
    case 'flame':
      return <Flame size={size} />;
    case 'crown':
      return <Crown size={size} />;
    case 'diamond':
      return <Diamond size={size} />;
    case 'infinity':
    case 'zap':
      return <Zap size={size} />;
    case 'trophy':
    default:
      return <Trophy size={size} />;
  }
};

export default function AchievementsPage() {
  // -------------------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------------------
  // Default to Elden Ring (101) as demonstrated in the Stitch reference design
  const [selectedGameId, setSelectedGameId] = useState('101');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unlocked', 'locked'
  const [sortBy, setSortBy] = useState('points_desc'); // 'points_desc', 'points_asc', 'recent', 'rarity', 'alpha'
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [trackedGames, setTrackedGames] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail modal state
  const [inspectAchievement, setInspectAchievement] = useState(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  // -------------------------------------------------------------------------
  // DATA LOADING
  // -------------------------------------------------------------------------
  const loadData = async () => {
    try {
      const [gamesData, telemetryData, achsData] = await Promise.all([
        achievementService.getTrackedGames(1),
        achievementService.getTelemetrySummary(1),
        achievementService.getUserAchievements(1, {
          gameId: selectedGameId,
          status: statusFilter,
          sortBy,
          search: searchQuery,
        }),
      ]);

      setTrackedGames(gamesData);
      setTelemetry(telemetryData);
      setAchievements(achsData);
    } catch (err) {
      console.error('Failed to load achievements data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGameId, statusFilter, sortBy, searchQuery]);

  // Show a toast message with auto-dismiss
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  // -------------------------------------------------------------------------
  // INTERACTIVE HANDLERS
  // -------------------------------------------------------------------------
  const handleToggleUnlock = async (achievement) => {
    try {
      const res = await achievementService.toggleAchievementUnlock(achievement.id, 1);
      if (res.success) {
        showToast(
          res.isUnlocked
            ? `Milestone "${achievement.title}" marked as UNLOCKED (+${achievement.points} PTS)`
            : `Milestone "${achievement.title}" locked`
        );
        // Refresh data
        await loadData();
        // If modal is open, update inspection object
        if (inspectAchievement && inspectAchievement.id === achievement.id) {
          setInspectAchievement((prev) => ({
            ...prev,
            isUnlocked: res.isUnlocked,
            unlockedAt: res.unlockedAt,
          }));
        }
      }
    } catch (err) {
      console.error('Error toggling achievement unlock state:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await achievementService.exportAchievementsCSV(1);
      showToast(`Exported ${res.count} vault achievements to CSV successfully.`);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  // Active game metadata calculation
  const activeGame = useMemo(() => {
    if (selectedGameId === 'all') return null;
    return trackedGames.find((g) => String(g.id) === String(selectedGameId)) || null;
  }, [selectedGameId, trackedGames]);

  // Derived counts for the active view
  const unlockedCount = useMemo(() => achievements.filter((a) => a.isUnlocked).length, [achievements]);
  const lockedCount = useMemo(() => achievements.filter((a) => !a.isUnlocked).length, [achievements]);

  return (
    <div className="achievements-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="achievements-toast">
          <CheckCircle2 size={16} color="var(--accent-primary)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          1. HEADER & BREADCRUMB TELEMETRY STRIP
          ===================================================================== */}
      <section className="achievements-header-section">
        <div className="achievements-title-group">
          <div className="achievements-eyebrow">
            <span className="achievements-eyebrow-dot" />
            <span>VAULT TELEMETRY • USER_ACHIEVEMENT REPOSITORY • SIGNED IN AS KAELEN_V</span>
          </div>
          <h1 className="achievements-title">ACHIEVEMENTS</h1>
          <p className="achievements-description">
            Inspect unlocked milestones, tracked point progression, and game mastery across your personal archive.
          </p>
        </div>

        <div className="achievements-header-actions">
          <button
            type="button"
            className="ach-btn-secondary"
            onClick={handleExportCSV}
            title="Download full achievement records as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="ach-btn-primary"
            onClick={() => {
              const firstLocked = achievements.find((a) => !a.isUnlocked);
              if (firstLocked) {
                handleToggleUnlock(firstLocked);
              } else {
                showToast('All currently visible achievements are already unlocked!');
              }
            }}
            title="Simulate unlocking the next locked milestone"
          >
            <CheckCheck size={14} />
            <span>Simulate Unlock</span>
          </button>
        </div>
      </section>

      {/* =====================================================================
          2. KPI SUMMARY 4-CARD TELEMETRY STRIP
          ===================================================================== */}
      {telemetry && (
        <section className="achievements-kpi-grid">
          {/* Card 1: Total Mastery Points */}
          <div className="ach-kpi-card">
            <div className="ach-kpi-header">
              <span className="ach-kpi-label">Total Mastery Points</span>
              <span className="ach-kpi-icon">
                <Trophy size={18} />
              </span>
            </div>
            <div className="ach-kpi-value-row">
              <span className="ach-kpi-value gold">
                {telemetry.totalPointsAccrued.toLocaleString()}
              </span>
              <span className="ach-kpi-subtext">
                / {telemetry.totalPossiblePoints.toLocaleString()} PTS
              </span>
            </div>
            <div className="ach-kpi-footer">
              <span>{telemetry.pointsYieldPercent}% recorded yield</span>
              <span className="ach-kpi-badge-gold">{telemetry.monthlyDelta} this month</span>
            </div>
            <div className="ach-kpi-bar-track">
              <div
                className="ach-kpi-bar-fill gold"
                style={{ width: `${Math.min(100, telemetry.pointsYieldPercent)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Milestones Unlocked */}
          <div className="ach-kpi-card">
            <div className="ach-kpi-header">
              <span className="ach-kpi-label">Milestones Unlocked</span>
              <span className="ach-kpi-icon" style={{ color: 'var(--text-secondary)' }}>
                <CheckCircle2 size={18} />
              </span>
            </div>
            <div className="ach-kpi-value-row">
              <span className="ach-kpi-value">
                {telemetry.totalMilestonesUnlocked}
              </span>
              <span className="ach-kpi-subtext">
                / {telemetry.totalMilestonesAvailable}
              </span>
            </div>
            <div className="ach-kpi-footer">
              <span>{telemetry.milestoneYieldPercent}% completion rate</span>
              <span className="ach-kpi-badge-emerald">{telemetry.milestonesRemaining} remaining</span>
            </div>
            <div className="ach-kpi-bar-track">
              <div
                className="ach-kpi-bar-fill white"
                style={{ width: `${Math.min(100, telemetry.milestoneYieldPercent)}%` }}
              />
            </div>
          </div>

          {/* Card 3: Games Mastered (100%) */}
          <div className="ach-kpi-card">
            <div className="ach-kpi-header">
              <span className="ach-kpi-label">Games Mastered (100%)</span>
              <span className="ach-kpi-icon">
                <Crown size={18} />
              </span>
            </div>
            <div className="ach-kpi-value-row">
              <span className="ach-kpi-value">
                {telemetry.gamesMasteredCount}
              </span>
              <span className="ach-kpi-subtext">
                / {telemetry.totalGamesTracked} TITLES
              </span>
            </div>
            <div className="ach-kpi-footer">
              <span>{telemetry.gamesMasteredPercent}% archive completion</span>
              <span className="ach-kpi-badge-gold">Top 4% Global</span>
            </div>
            <div className="ach-kpi-bar-track">
              <div
                className="ach-kpi-bar-fill gold"
                style={{ width: `${Math.min(100, telemetry.gamesMasteredPercent)}%` }}
              />
            </div>
          </div>

          {/* Card 4: Active Completion Avg */}
          <div className="ach-kpi-card">
            <div className="ach-kpi-header">
              <span className="ach-kpi-label">Active Completion Avg</span>
              <span className="ach-kpi-icon" style={{ color: 'var(--status-completed)' }}>
                <TrendingUp size={18} />
              </span>
            </div>
            <div className="ach-kpi-value-row">
              <span className="ach-kpi-value emerald">
                {telemetry.averageCompletionRate}%
              </span>
            </div>
            <div className="ach-kpi-footer">
              <span>Across {telemetry.totalGamesTracked} focus titles</span>
              <span className="ach-kpi-badge-emerald">↑ 3.2% vs Q2</span>
            </div>
            <div className="ach-kpi-bar-track">
              <div
                className="ach-kpi-bar-fill emerald"
                style={{ width: `${Math.min(100, telemetry.averageCompletionRate)}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          3. GAME SELECTOR & FILTER CONTROLS STRIP
          ===================================================================== */}
      <section className="ach-selector-section">
        <div className="ach-selector-header">
          <div className="ach-selector-title">
            <Filter size={14} color="var(--accent-primary)" />
            <span>Archived Titles</span>
          </div>
          <span className="ach-selector-count">
            Displaying {trackedGames.length} Tracked Titles in Vault
          </span>
        </div>

        <div className="ach-filter-bar">
          {/* Horizontal Game Selector Carousel */}
          <div className="ach-carousel-scroll">
            {/* All Games Tab */}
            <button
              type="button"
              className={`ach-game-tab ${selectedGameId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedGameId('all')}
            >
              <Layers size={14} />
              <span>All Games</span>
              <span className="ach-tab-badge">{telemetry?.totalMilestonesAvailable || 0}</span>
            </button>

            {/* Individual Game Tabs */}
            {trackedGames.map((game) => {
              const isActive = String(game.id) === String(selectedGameId);
              return (
                <button
                  key={game.id}
                  type="button"
                  className={`ach-game-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedGameId(String(game.id))}
                >
                  {isActive && <span className="ach-tab-active-dot" />}
                  <span>{game.title}</span>
                  {game.isMastered ? (
                    <span className="ach-tab-badge mastered">100% • {game.totalPoints} PTS</span>
                  ) : (
                    <span className="ach-tab-badge">
                      {game.unlockedCount}/{game.totalAchievements} ({game.progressPercent}%) • {game.pointsEarned} PTS
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter & Sort Controls */}
          <div className="ach-controls-group">
            {/* Status Dropdown */}
            <div className="ach-select-wrap">
              <select
                className="ach-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter achievements by status"
              >
                <option value="all">Status: All ({achievements.length})</option>
                <option value="unlocked">Status: Unlocked Only ({unlockedCount})</option>
                <option value="locked">Status: Locked Only ({lockedCount})</option>
              </select>
              <ChevronDown size={14} className="ach-select-chevron" />
            </div>

            {/* Sort Dropdown */}
            <div className="ach-select-wrap">
              <select
                className="ach-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort achievements"
              >
                <option value="points_desc">Sort: Highest Points</option>
                <option value="points_asc">Sort: Lowest Points</option>
                <option value="recent">Sort: Recent Unlock</option>
                <option value="rarity">Sort: Rarity (Rarest First)</option>
                <option value="alpha">Sort: Alphabetical</option>
              </select>
              <ChevronDown size={14} className="ach-select-chevron" />
            </div>

            {/* Real-time Search Box */}
            <div className="ach-search-wrap">
              <Search size={14} className="ach-search-icon" />
              <input
                type="text"
                className="ach-search-input"
                placeholder="Filter title or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. SELECTED GAME OVERVIEW FOCUS BANNER
          ===================================================================== */}
      {activeGame ? (
        <section className="ach-focus-banner">
          <div className="ach-banner-ambient" />

          {/* Left: Thumbnail & Game Metadata */}
          <div className="ach-banner-left">
            <div className="ach-banner-thumb-wrap">
              <img
                src={activeGame.coverImage}
                alt={activeGame.title}
                className="ach-banner-thumb"
              />
              <span className="ach-banner-thumb-badge">
                {activeGame.platforms?.[0] || 'PC'}
              </span>
            </div>

            <div className="ach-banner-info">
              <div className="ach-banner-meta-top">
                <span className={`ach-banner-status-pill ${activeGame.isMastered ? 'mastered' : ''}`}>
                  {activeGame.isMastered ? 'Mastered (100%)' : `${activeGame.status} (Active Focus)`}
                </span>
                <span className="ach-banner-studio">
                  {activeGame.developer} • {activeGame.releaseYear}
                </span>
              </div>

              <h2 className="ach-banner-title">{activeGame.title}</h2>

              <p className="ach-banner-desc">
                Inspect tactical achievements, campaign secrets, and trophy progression for {activeGame.title} in your archive.
              </p>

              <div className="ach-banner-meta-bottom">
                <span className="ach-banner-meta-item">
                  <Clock size={13} className="gold" />
                  <span>Playtime: {activeGame.playtimeHours} hrs</span>
                </span>
                <span className="ach-banner-meta-item">
                  <History size={13} />
                  <span>Last Unlock: {activeGame.lastUnlockDate || 'In Progress'}</span>
                </span>
                <span className="ach-banner-meta-item">
                  <Trophy size={13} className="gold" />
                  <span>Tier: {activeGame.isMastered ? 'Master Archive Platinum' : 'Master Archive Gold'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Progress Telemetry & Action Shortcuts */}
          <div className="ach-banner-right">
            <div className="ach-banner-progress-block">
              <div className="ach-banner-progress-header">
                <span className="ach-banner-percent">{activeGame.progressPercent}%</span>
                <span className="ach-banner-ratio">
                  {activeGame.unlockedCount} of {activeGame.totalAchievements} Unlocked
                </span>
              </div>
              <div className="ach-banner-points-sub">
                {activeGame.pointsEarned.toLocaleString()} / {activeGame.totalPoints.toLocaleString()} Points Accrued
              </div>
              <div className="ach-banner-bar-track">
                <div
                  className="ach-banner-bar-fill"
                  style={{ width: `${Math.min(100, activeGame.progressPercent)}%` }}
                />
              </div>
            </div>

            <div className="ach-banner-actions">
              <Link
                to={`/library?search=${encodeURIComponent(activeGame.title)}`}
                className="ach-banner-btn"
                title="Open game in personal library"
              >
                <Gamepad2 size={13} />
                <span>View in Library</span>
              </Link>
              <Link
                to={`/games/${activeGame.id}`}
                className="ach-banner-btn"
                title="View full title specifications"
              >
                <ExternalLink size={13} />
                <span>Game Details</span>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        /* All Games Vault Overview Banner */
        <section className="ach-focus-banner">
          <div className="ach-banner-ambient" />
          <div className="ach-banner-left">
            <div className="ach-banner-thumb-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(244, 191, 78, 0.08)' }}>
              <Layers size={36} color="var(--accent-primary)" />
            </div>
            <div className="ach-banner-info">
              <div className="ach-banner-meta-top">
                <span className="ach-banner-status-pill">
                  GLOBAL ARCHIVE • ALL TITLES
                </span>
                <span className="ach-banner-studio">
                  {trackedGames.length} Tracked Games • {telemetry?.totalMilestonesAvailable || 0} Total Milestones
                </span>
              </div>
              <h2 className="ach-banner-title">VALENCE ARCHIVE PROTOCOL</h2>
              <p className="ach-banner-desc">
                Comprehensive overview of all unlocked milestones, collection challenges, and gamer score accrued across your library.
              </p>
              <div className="ach-banner-meta-bottom">
                <span className="ach-banner-meta-item">
                  <Trophy size={13} className="gold" />
                  <span>Total Yield: {telemetry?.pointsYieldPercent || 0}%</span>
                </span>
                <span className="ach-banner-meta-item">
                  <Crown size={13} className="gold" />
                  <span>{telemetry?.gamesMasteredCount || 0} 100% Mastered Games</span>
                </span>
              </div>
            </div>
          </div>

          <div className="ach-banner-right">
            <div className="ach-banner-progress-block">
              <div className="ach-banner-progress-header">
                <span className="ach-banner-percent">{telemetry?.milestoneYieldPercent || 0}%</span>
                <span className="ach-banner-ratio">
                  {telemetry?.totalMilestonesUnlocked || 0} / {telemetry?.totalMilestonesAvailable || 0} Completed
                </span>
              </div>
              <div className="ach-banner-points-sub">
                {telemetry?.totalPointsAccrued?.toLocaleString() || 0} / {telemetry?.totalPossiblePoints?.toLocaleString() || 0} Points Accrued
              </div>
              <div className="ach-banner-bar-track">
                <div
                  className="ach-banner-bar-fill"
                  style={{ width: `${Math.min(100, Number(telemetry?.milestoneYieldPercent || 0))}%` }}
                />
              </div>
            </div>

            <div className="ach-banner-actions">
              <Link to="/library" className="ach-banner-btn">
                <Gamepad2 size={13} />
                <span>Open Library</span>
              </Link>
              <button
                type="button"
                className="ach-banner-btn"
                onClick={handleExportCSV}
              >
                <Download size={13} />
                <span>Export Audit</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          5. ACHIEVEMENT BENTO GRID (UNLOCKED & LOCKED MILESTONES)
          ===================================================================== */}
      <section className="ach-grid-section">
        <div className="ach-grid-header">
          <div className="ach-grid-title-cluster">
            <h3 className="ach-grid-title">CAMPAIGN & MASTERY MILESTONES</h3>
            <span className="ach-badge-unlocked-count">{unlockedCount} UNLOCKED</span>
            <span className="ach-badge-locked-count">{lockedCount} LOCKED</span>
          </div>
          <span className="ach-sort-applied-hint">
            Sort applied: <strong>{sortBy.replace('_', ' ').toUpperCase()}</strong>
          </span>
        </div>

        {achievements.length > 0 ? (
          <div className="ach-cards-grid">
            {achievements.map((ach) => {
              const isUnlocked = ach.isUnlocked;

              return (
                <div
                  key={ach.id}
                  className={`ach-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                  onClick={() => setInspectAchievement(ach)}
                  title={`Click to inspect ${ach.title}`}
                >
                  {isUnlocked && <div className="ach-card-ambient-glow" />}

                  {/* Header Row */}
                  <div className="ach-card-header">
                    <div className="ach-card-header-left">
                      <div className="ach-card-icon-box">
                        {isUnlocked ? (
                          renderMilestoneIcon(ach.iconName, 22)
                        ) : (
                          <Lock size={20} />
                        )}
                      </div>
                      <div className="ach-card-title-group">
                        <h4 className="ach-card-title">{ach.title}</h4>
                        {isUnlocked ? (
                          <span className="ach-card-status-sub unlocked">
                            <Check size={12} strokeWidth={2.5} />
                            <span>Unlocked {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
                          </span>
                        ) : (
                          <span className="ach-card-status-sub locked">
                            <Lock size={11} />
                            <span>{ach.stepLabel || 'Locked Milestone'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="ach-card-points-pill">
                      {ach.points} PTS
                    </span>
                  </div>

                  {/* Description */}
                  <p className="ach-card-desc">{ach.description}</p>

                  {/* Quest / Collection Step Tracker (if applicable) */}
                  {!isUnlocked && ach.totalSteps && (
                    <div className="ach-card-quest-block">
                      <div className="ach-card-quest-header">
                        <span>Questline Tracking</span>
                        <span>{Math.round(((ach.currentStep || 0) / ach.totalSteps) * 100)}%</span>
                      </div>
                      <div className="ach-card-quest-track">
                        <div
                          className="ach-card-quest-fill"
                          style={{
                            width: `${Math.min(100, Math.round(((ach.currentStep || 0) / ach.totalSteps) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer Row */}
                  <div className="ach-card-footer">
                    <span
                      className={`ach-card-rarity ${
                        ach.rarityPercent < 10
                          ? 'ultra-rare'
                          : ach.rarityPercent < 25
                          ? 'rare'
                          : 'common'
                      }`}
                    >
                      {ach.rarityPercent < 10 ? (
                        <Diamond size={11} />
                      ) : (
                        <Sparkles size={11} />
                      )}
                      <span>
                        {ach.rarityPercent}% Rarity ({ach.rarityLabel})
                      </span>
                    </span>

                    <button
                      type="button"
                      className="ach-card-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleUnlock(ach);
                      }}
                      title={isUnlocked ? 'Mark as locked' : 'Mark as unlocked'}
                    >
                      <span>{isUnlocked ? 'Lock' : 'Unlock'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Milestones Found"
            description="No achievements match the current game, search query, or status filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedGameId('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
          />
        )}
      </section>

      {/* =====================================================================
          6. ARCHIVAL FALLBACK NOTICE (Stitch Section 5)
          ===================================================================== */}
      <section className="ach-notice-banner">
        <div className="ach-notice-left">
          <div className="ach-notice-icon-box">
            <WifiOff size={20} />
          </div>
          <div className="ach-notice-text-col">
            <h4 className="ach-notice-title">Archival Telemetry Fallback Notice</h4>
            <p className="ach-notice-desc">
              Games imported without native telemetry or third-party API keys will render in unindexed mode. 12 titles currently lack external achievement sync.
            </p>
          </div>
        </div>

        <div className="ach-notice-actions">
          <button
            type="button"
            className="ach-btn-secondary"
            onClick={() => showToast('Telemetry API configuration loaded: Steam, PSN, Xbox, and GOG endpoints connected.')}
          >
            <Radio size={14} />
            <span>Configure Telemetry APIs</span>
          </button>
          <button
            type="button"
            className="ach-btn-secondary"
            onClick={() => showToast('Documentation: Milestones joined via USER_ACHIEVEMENT relational schema.')}
          >
            <HelpCircle size={14} />
            <span>Documentation</span>
          </button>
        </div>
      </section>

      {/* =====================================================================
          7. DETAIL / INSPECTION MODAL
          ===================================================================== */}
      {inspectAchievement && (
        <Modal
          isOpen={Boolean(inspectAchievement)}
          onClose={() => setInspectAchievement(null)}
          title={inspectAchievement.title}
          icon={inspectAchievement.isUnlocked ? Trophy : Lock}
          footer={
            <div className="ach-modal-footer-btn-row">
              <button
                type="button"
                className="ach-btn-secondary"
                onClick={() => setInspectAchievement(null)}
              >
                Close
              </button>
              <button
                type="button"
                className={inspectAchievement.isUnlocked ? 'ach-btn-secondary' : 'ach-btn-primary'}
                onClick={() => handleToggleUnlock(inspectAchievement)}
              >
                {inspectAchievement.isUnlocked ? (
                  <>
                    <Lock size={14} />
                    <span>Mark as Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock size={14} />
                    <span>Unlock Milestone (+{inspectAchievement.points} PTS)</span>
                  </>
                )}
              </button>
            </div>
          }
        >
          <div className="ach-modal-content">
            {/* Top Game & Points Strip */}
            <div className="ach-modal-top-strip">
              <div className="ach-modal-game-info">
                {inspectAchievement.gameCover && (
                  <img
                    src={inspectAchievement.gameCover}
                    alt={inspectAchievement.gameTitle}
                    className="ach-modal-thumb"
                  />
                )}
                <div className="ach-modal-game-titles">
                  <span className="ach-modal-game-name">{inspectAchievement.gameTitle}</span>
                  <span className="ach-modal-code">{inspectAchievement.milestoneCode} • {inspectAchievement.category}</span>
                </div>
              </div>
              <span className="ach-modal-points-badge">
                {inspectAchievement.points} PTS
              </span>
            </div>

            {/* Lore & Unlock Criteria */}
            <div className="ach-modal-lore-box">
              <span className="ach-modal-section-label">Unlock Condition & Lore</span>
              <p className="ach-modal-lore-text">{inspectAchievement.description}</p>
            </div>

            {/* Additional info if missing items */}
            {inspectAchievement.missingItems && (
              <div className="ach-modal-lore-box" style={{ borderColor: 'rgba(244, 191, 78, 0.3)' }}>
                <span className="ach-modal-section-label" style={{ color: 'var(--accent-primary)' }}>Tracking Check</span>
                <p className="ach-modal-lore-text" style={{ color: '#FFFFFF' }}>{inspectAchievement.missingItems}</p>
              </div>
            )}

            {/* Relational Database Telemetry Grid */}
            <div className="ach-modal-telemetry-grid">
              <div className="ach-modal-tel-item">
                <span className="ach-modal-tel-label">Status</span>
                <span className={`ach-modal-tel-val ${inspectAchievement.isUnlocked ? 'green' : 'gold'}`}>
                  {inspectAchievement.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
              <div className="ach-modal-tel-item">
                <span className="ach-modal-tel-label">Global Rarity</span>
                <span className="ach-modal-tel-val">
                  {inspectAchievement.rarityPercent}% ({inspectAchievement.rarityLabel})
                </span>
              </div>
              <div className="ach-modal-tel-item">
                <span className="ach-modal-tel-label">Unlock Date</span>
                <span className="ach-modal-tel-val">
                  {inspectAchievement.unlockedAt
                    ? new Date(inspectAchievement.unlockedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not Unlocked'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
