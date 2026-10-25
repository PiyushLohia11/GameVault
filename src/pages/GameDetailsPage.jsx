import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  CheckCircle2,
  AlertCircle,
  Star,
  Play,
  SlidersHorizontal,
  Trash2,
  Trophy,
  TrendingUp,
  Edit3,
  Clock,
  Monitor,
  Cloud,
  ShieldCheck,
  Check,
  Lock,
  ThumbsUp,
  X,
  Layers,
  Tv,
  Gamepad2,
  Swords,
  Crown,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { gameDetailsService } from '../services/gameDetailsService';
import './GameDetailsPage.css';

export default function GameDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Primary data state
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviews sorting state
  const [reviewSort, setReviewSort] = useState('highest'); // 'highest' or 'newest'

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalFormData, setModalFormData] = useState({
    status: 'Playing',
    platform: 'PC',
    playtimeHours: 0,
    rating: 10,
    notes: '',
  });

  // Toast feedback state
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3800);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load game details
  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gameDetailsService.getGameDetails(id, 1);
      if (!data) {
        setError(`Archive record for ID #${id} could not be located in the vault database.`);
      } else {
        setGameData(data);
        // Prepopulate modal form
        setModalFormData({
          status: data.enrollment.status || 'Playing',
          platform: data.enrollment.platform || data.platforms[0] || 'PC',
          playtimeHours: data.enrollment.playtimeHours || 0,
          rating: data.reviews.userReview?.rating || 10,
          notes: data.reviews.userReview?.quote || '',
        });
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading game details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Back Navigation handler
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/library');
    }
  };

  // Status Change handler
  const handleStatusChange = async (newStatus) => {
    if (!gameData) return;
    try {
      await gameDetailsService.updateGameStatus(gameData.id, newStatus, 1);
      setToast({
        title: 'Vault Status Updated',
        message: `"${gameData.title}" status changed to ${newStatus}.`,
      });
      fetchDetails();
    } catch (err) {
      setToast({
        title: 'Update Error',
        message: err.message || 'Failed to update game status.',
      });
    }
  };

  // Launch Game handler
  const handleLaunchGame = () => {
    if (!gameData) return;
    const platform = gameData.enrollment.platform || gameData.platforms[0] || 'Steam';
    setToast({
      title: 'Game Client Dispatched',
      message: `Initializing "${gameData.title}" via ${platform} protocol...`,
    });
  };

  // Open Edit Modal
  const handleOpenEditModal = () => {
    if (!gameData) return;
    setModalFormData({
      status: gameData.enrollment.status || 'Playing',
      platform: gameData.enrollment.platform || gameData.platforms[0] || 'PC',
      playtimeHours: gameData.enrollment.playtimeHours || 0,
      rating: gameData.reviews.userReview?.rating || 10,
      notes: gameData.reviews.userReview?.quote || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Modal changes
  const handleSaveArchiveRecord = async (e) => {
    e.preventDefault();
    if (!gameData) return;

    try {
      await gameDetailsService.updateArchiveRecord(gameData.id, {
        status: modalFormData.status,
        platform: modalFormData.platform,
        playtimeHours: parseFloat(modalFormData.playtimeHours) || 0,
        rating: parseFloat(modalFormData.rating),
        notes: modalFormData.notes,
      }, 1);

      setIsEditModalOpen(false);
      setToast({
        title: 'Archive Record Updated',
        message: `Telemetry and critique for "${gameData.title}" saved successfully.`,
      });
      fetchDetails();
    } catch (err) {
      setToast({
        title: 'Save Failed',
        message: err.message || 'Could not save archive record.',
      });
    }
  };

  // Remove from Vault
  const handleRemoveFromVault = async () => {
    if (!gameData) return;
    if (window.confirm(`Are you sure you want to remove "${gameData.title}" from your personal vault?`)) {
      try {
        await gameDetailsService.removeGameFromVault(gameData.id, 1);
        setToast({
          title: 'Removed from Vault',
          message: `"${gameData.title}" has been unindexed from your library.`,
        });
        fetchDetails();
      } catch (err) {
        setToast({
          title: 'Removal Error',
          message: err.message || 'Failed to remove game from vault.',
        });
      }
    }
  };

  // Toggle helpful review
  const handleHelpfulVote = async (reviewId) => {
    try {
      const res = await gameDetailsService.toggleHelpfulReview(reviewId);
      if (res) {
        setGameData((prev) => {
          if (!prev) return prev;
          const updatedCurator = prev.reviews.curatorReviews.map((r) => {
            if (r.id === reviewId) {
              return {
                ...r,
                helpfulCount: res.helpfulCount,
                isHelpfulMarked: res.isHelpfulMarked,
              };
            }
            return r;
          });
          return {
            ...prev,
            reviews: {
              ...prev.reviews,
              curatorReviews: updatedCurator,
            },
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sorted curator reviews
  const sortedCuratorReviews = useMemo(() => {
    if (!gameData?.reviews?.curatorReviews) return [];
    const list = [...gameData.reviews.curatorReviews];
    if (reviewSort === 'highest') {
      return list.sort((a, b) => b.rating - a.rating);
    } else {
      return list.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    }
  }, [gameData, reviewSort]);

  // Loading state
  if (loading) {
    return (
      <div className="game-details-page">
        <div className="gd-breadcrumb-bar">
          <button className="gd-back-link" onClick={handleBack}>
            <ArrowLeft size={16} />
            <span>Back to Catalogue / Library</span>
          </button>
        </div>
        <div className="gd-glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="gd-pulse-dot" style={{ margin: '0 auto 16px auto', width: '12px', height: '12px' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: '#FFFFFF', margin: 0 }}>
            ACCESSING MASTER ARCHIVE TELEMETRY...
          </h2>
          <p style={{ color: '#71717A', fontSize: '13px', marginTop: '6px' }}>
            Querying relational tables for game registry #{id}
          </p>
        </div>
      </div>
    );
  }

  // Not Found / Error state
  if (error || !gameData) {
    return (
      <div className="game-details-page">
        <div className="gd-breadcrumb-bar">
          <button className="gd-back-link" onClick={handleBack}>
            <ArrowLeft size={16} />
            <span>Back to Catalogue / Library</span>
          </button>
        </div>
        <div className="gd-glass-card gd-empty-notfound">
          <div className="gd-empty-icon-box">
            <AlertCircle size={32} />
          </div>
          <h2 className="gd-empty-title">Archive Record Not Found</h2>
          <p className="gd-empty-desc">
            {error || `No catalogued title corresponds to game ID #${id}.`}
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Link to="/discover" className="gd-primary-launch-btn" style={{ textDecoration: 'none' }}>
              Explore Master Catalogue
            </Link>
            <Link to="/library" className="gd-secondary-edit-btn" style={{ textDecoration: 'none' }}>
              Return to My Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-details-page">
      {/* ===================================================================== */}
      {/* SECTION 1: Breadcrumb / Context Return Bar                            */}
      {/* ===================================================================== */}
      <section className="gd-breadcrumb-bar">
        <div className="gd-breadcrumb-left">
          <button
            id="back-to-catalogue-btn"
            className="gd-back-link"
            onClick={handleBack}
            title="Return to previous page"
          >
            <ArrowLeft size={16} />
            <span>Back to Catalogue / Library</span>
          </button>
          <span className="gd-bar-divider">|</span>
          <span className="gd-ref-badge">{gameData.refCode}</span>
          <span className="gd-sync-protocol">
            <ShieldCheck size={14} />
            SYNCED VIA ARCHIVE PROTOCOL
          </span>
        </div>
        <div className="gd-breadcrumb-right">
          <span className="gd-pulse-dot" />
          <span>Last Telemetry Sync: Just now</span>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 2: Prominent Hero & Game Identity Section                     */}
      {/* ===================================================================== */}
      <section className="gd-hero-section">
        {/* Backdrop container with layered gradients */}
        <div className="gd-hero-backdrop-container">
          <img
            src={gameData.heroBackdrop}
            alt={gameData.title}
            className="gd-hero-backdrop-image"
          />
          <div className="gd-hero-gradient-overlay-bottom" />
          <div className="gd-hero-gradient-overlay-side" />
          <div className="gd-hero-top-specular-edge" />
        </div>

        {/* Overlaid Game Identity Content */}
        <div className="gd-hero-content">
          <div className="gd-hero-row">
            <div className="gd-hero-left">
              {/* Studio, Publisher, Year */}
              <div className="gd-hero-meta-row">
                <span className="gd-meta-studio">{gameData.developer.toUpperCase()}</span>
                <span className="gd-meta-sep">•</span>
                <span>{gameData.publisher}</span>
                <span className="gd-meta-sep">•</span>
                <span className="gd-year-pill">{gameData.releaseYear}</span>
                <span className="gd-meta-sep">•</span>
                <span className="gd-status-connected">
                  <span className="gd-dot-green" />
                  Cloud Connected
                </span>
              </div>

              {/* Anton Title */}
              <h1 className="gd-hero-title">{gameData.title}</h1>

              {/* Description */}
              <p className="gd-hero-description">{gameData.description}</p>

              {/* Genre & Platform Badges */}
              <div className="gd-tags-row">
                {(gameData.genres || []).map((genre, idx) => (
                  <span
                    key={genre}
                    className={`gd-genre-badge ${idx === 0 ? 'primary' : ''}`}
                  >
                    {genre}
                  </span>
                ))}
                <span className="gd-meta-sep" style={{ margin: '0 4px' }}>|</span>
                <div className="gd-platforms-inline">
                  <Monitor size={14} />
                  <span>{(gameData.platforms || []).join(' • ')}</span>
                </div>
              </div>
            </div>

            {/* Aggregate Review Score Badge */}
            <div className="gd-aggregate-score-card">
              <div className="gd-score-top">
                <div className="gd-score-number-group">
                  <span className="gd-score-number">{gameData.avgRating}</span>
                  <span className="gd-score-max">/10</span>
                </div>
                <div className="gd-score-label-col">
                  <div className="gd-score-label">
                    <Star size={16} fill="#F4BF4E" color="#F4BF4E" />
                    <span>{gameData.avgRating >= 9.5 ? 'Masterpiece' : 'Acclaimed'}</span>
                  </div>
                  <span className="gd-score-critiques-count">
                    {gameData.verifiedCritiquesCount.toLocaleString()} verified critiques
                  </span>
                </div>
              </div>
              <div className="gd-score-consensus-row">
                <span>Critic Consensus</span>
                <span className="gd-consensus-status">{gameData.criticConsensus}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 3 & 4: Telemetry Hub & System Specs (12 Columns)              */}
      {/* ===================================================================== */}
      <section className="gd-columns-grid">
        {/* Left Column: Vault Enrolment Telemetry Hub (8 Columns) */}
        <div className="gd-glass-card gd-telemetry-hub">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header row with status dropdown */}
            <div className="gd-section-header-row">
              <div className="gd-section-title-wrap">
                <Database size={20} />
                <h2 className="gd-section-title">Vault Enrolment Telemetry</h2>
              </div>

              {/* Status Selector Dropdown */}
              <div className="gd-status-control-wrap">
                <span className="gd-status-label">Status:</span>
                <div className="gd-status-select-wrap">
                  <select
                    id="status-select-dropdown"
                    className="gd-status-select"
                    value={gameData.enrollment.status || 'not_enrolled'}
                    onChange={(e) => {
                      if (e.target.value !== 'not_enrolled') {
                        handleStatusChange(e.target.value);
                      }
                    }}
                    aria-label="Library enrollment status"
                  >
                    {!gameData.enrollment.isInLibrary && (
                      <option value="not_enrolled">+ Add to Vault</option>
                    )}
                    <option value="Playing">● Playing (Active Focus)</option>
                    <option value="Backlog">○ Backlog</option>
                    <option value="Completed">✓ Completed / Mastered</option>
                    <option value="On Hold">⏸ On Hold</option>
                    <option value="Dropped">✕ Dropped</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Telemetry Metrics Grid (4 items) */}
            <div className="gd-telemetry-metrics-grid">
              {/* Playtime Metric */}
              <div className="gd-telemetry-metric-box">
                <span className="gd-metric-title">Total Playtime</span>
                <div>
                  <div className="gd-metric-main-value">
                    {gameData.enrollment.playtimeHours}
                    <span className="gd-metric-unit">hrs</span>
                  </div>
                  <div className="gd-metric-subtext green" style={{ marginTop: '4px' }}>
                    <TrendingUp size={12} />
                    <span>Active Record</span>
                  </div>
                </div>
                <button
                  id="update-log-btn"
                  type="button"
                  className="gd-metric-action-btn"
                  onClick={handleOpenEditModal}
                >
                  <Edit3 size={12} />
                  <span>Update Log</span>
                </button>
              </div>

              {/* Completion Metric */}
              <div className="gd-telemetry-metric-box">
                <span className="gd-metric-title">Story &amp; Quests</span>
                <div>
                  <div className="gd-metric-main-value gold">
                    {gameData.enrollment.progressPercent}%
                  </div>
                  <div className="gd-metric-progress-gauge">
                    <div
                      className="gd-metric-progress-fill"
                      style={{ width: `${gameData.enrollment.progressPercent}%` }}
                    />
                  </div>
                </div>
                <span className="gd-metric-subtext">{gameData.enrollment.subGoal}</span>
              </div>

              {/* Last Session Metric */}
              <div className="gd-telemetry-metric-box">
                <span className="gd-metric-title">Last Session</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>
                    {gameData.enrollment.lastPlayedDate || 'No session logged'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
                    Platform: {gameData.enrollment.platform || 'Unspecified'}
                  </div>
                </div>
                <span className="gd-metric-subtext">Synced via Steam</span>
              </div>

              {/* Vault Rank Metric */}
              <div className="gd-telemetry-metric-box">
                <span className="gd-metric-title">Vault Rank</span>
                <div>
                  <div className="gd-metric-main-value">
                    {gameData.enrollment.vaultRank}
                  </div>
                  <div className="gd-metric-subtext gold" style={{ marginTop: '2px' }}>
                    {gameData.enrollment.tierLabel}
                  </div>
                </div>
                <span className="gd-metric-subtext">{gameData.enrollment.percentile}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons Cluster */}
          <div className="gd-telemetry-actions-cluster">
            <div className="gd-actions-left-group">
              <button
                id="launch-game-btn"
                type="button"
                className="gd-primary-launch-btn"
                onClick={handleLaunchGame}
              >
                <Play size={18} fill="#040404" />
                <span>Launch Game via {gameData.enrollment.platform || 'Steam'}</span>
              </button>

              <button
                id="edit-archive-record-btn"
                type="button"
                className="gd-secondary-edit-btn"
                onClick={handleOpenEditModal}
              >
                <SlidersHorizontal size={16} />
                <span>Edit Archive Record</span>
              </button>
            </div>

            {gameData.enrollment.isInLibrary && (
              <button
                type="button"
                className="gd-remove-vault-btn"
                onClick={handleRemoveFromVault}
                title="Remove game from your library"
              >
                <Trash2 size={15} />
                <span>Remove from Vault</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: System Specs Card (4 Columns) */}
        <div className="gd-glass-card gd-specs-card">
          <div>
            <div className="gd-section-header-row" style={{ paddingBottom: '10px' }}>
              <h3 className="gd-section-title">System Specs</h3>
              <span style={{ fontSize: '11.5px', color: '#F4BF4E', fontWeight: 600 }}>DirectX 12</span>
            </div>

            {/* Tabular metadata */}
            <div className="gd-specs-table">
              <div className="gd-specs-row">
                <span className="gd-specs-label">Developer</span>
                <span className="gd-specs-val">{gameData.developer}</span>
              </div>
              <div className="gd-specs-row">
                <span className="gd-specs-label">Publisher</span>
                <span className="gd-specs-val">{gameData.publisher}</span>
              </div>
              <div className="gd-specs-row">
                <span className="gd-specs-label">Director</span>
                <span className="gd-specs-val gold">{gameData.director}</span>
              </div>
              <div className="gd-specs-row">
                <span className="gd-specs-label">Franchise</span>
                <span className="gd-specs-val">{gameData.franchise}</span>
              </div>
              <div className="gd-specs-row">
                <span className="gd-specs-label">Storage Footprint</span>
                <span className="gd-specs-val mono">{gameData.storageFootprint}</span>
              </div>
              <div className="gd-specs-row">
                <span className="gd-specs-label">Release Year</span>
                <span className="gd-specs-val mono">{gameData.releaseYear}</span>
              </div>
            </div>
          </div>

          {/* Hardware Feature Chips */}
          <div className="gd-features-section">
            <span className="gd-features-label">Supported Hardware &amp; Features:</span>
            <div className="gd-features-chips-wrap">
              {(gameData.supportedFeatures || []).map((feat) => (
                <span
                  key={feat.label}
                  className={`gd-feature-chip ${feat.isGold ? 'gold' : feat.isGreen ? 'green' : ''}`}
                >
                  {feat.isGreen ? (
                    <Cloud size={13} />
                  ) : feat.isGold ? (
                    <Sparkles size={13} />
                  ) : (
                    <Gamepad2 size={13} />
                  )}
                  <span>{feat.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 5: Archive Mastery & Achievements Breakdown                   */}
      {/* ===================================================================== */}
      <section className="gd-glass-card gd-achievements-section">
        <div className="gd-achievements-header">
          <div className="gd-achievements-subhead">
            <h2 className="gd-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="#F4BF4E" />
              <span>Archive Mastery &amp; Achievements</span>
            </h2>
            <span className="gd-achievements-metric-txt">
              {gameData.achievements.unlockedCount} of {gameData.achievements.totalCount} Unlocked ({gameData.achievements.progressPercent}%) • {gameData.achievements.earnedPoints.toLocaleString()} / {gameData.achievements.totalPoints.toLocaleString()} Points
            </span>
          </div>

          <Link
            to={`/achievements?gameId=${gameData.id}`}
            className="gd-view-all-ach-link"
          >
            <span>View All {gameData.achievements.totalCount} Achievements</span>
            <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
          </Link>
        </div>

        {/* Overall Progress Gauge */}
        <div className="gd-ach-progress-gauge-overall">
          <div
            className="gd-ach-progress-fill-overall"
            style={{ width: `${gameData.achievements.progressPercent}%` }}
          />
        </div>

        {/* Bento Grid 5 Showcase Cards */}
        {gameData.achievements.showcase.length > 0 ? (
          <div className="gd-achievements-bento-grid">
            {gameData.achievements.showcase.map((ach) => {
              const isLocked = !ach.isUnlocked;
              return (
                <div
                  key={ach.id}
                  className={`gd-achievement-card ${isLocked ? 'locked' : ''}`}
                >
                  <div className="gd-ach-card-top">
                    <div className="gd-ach-icon-box">
                      {isLocked ? (
                        <Lock size={18} />
                      ) : ach.category === 'Boss' ? (
                        <Swords size={20} />
                      ) : ach.title.toLowerCase().includes('lord') ? (
                        <Crown size={20} />
                      ) : (
                        <Trophy size={20} />
                      )}
                    </div>
                    <span className="gd-ach-pts-pill">{ach.points} PTS</span>
                  </div>

                  <div className="gd-ach-card-body">
                    <h4 className="gd-ach-card-title">{ach.title}</h4>
                    <p className="gd-ach-card-desc">{ach.description}</p>
                  </div>

                  <div className="gd-ach-card-footer">
                    {ach.isUnlocked ? (
                      <>
                        <span className="gd-ach-status-tag unlocked">
                          <CheckCircle2 size={12} />
                          <span>Unlocked</span>
                        </span>
                        <span>{ach.unlockedAt ? ach.unlockedAt.split(' ')[0] : 'Completed'}</span>
                      </>
                    ) : (
                      <>
                        <span className="gd-ach-status-tag locked">
                          <Clock size={12} />
                          <span>{ach.stepLabel || 'In Progress'}</span>
                        </span>
                        <span>Locked</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#71717A', fontSize: '13px' }}>
            No achievements registered for this title yet.
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* SECTION 6: Reviews & Vault Critiques                                  */}
      {/* ===================================================================== */}
      <section className="gd-glass-card gd-reviews-section">
        {/* Section Header */}
        <div className="gd-reviews-header-row">
          <div className="gd-reviews-left-group">
            <h2 className="gd-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} color="#F4BF4E" />
              <span>Reviews &amp; Vault Critiques</span>
            </h2>
            <div className="gd-community-avg-pill">
              <span>{gameData.reviews.communityAvg}</span>
              <span className="muted">Community Avg</span>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="gd-reviews-sort-group">
            <span className="gd-sort-label">Sort By:</span>
            <button
              type="button"
              className={`gd-sort-chip ${reviewSort === 'highest' ? 'active' : ''}`}
              onClick={() => setReviewSort('highest')}
            >
              Highest Rating
            </button>
            <button
              type="button"
              className={`gd-sort-chip ${reviewSort === 'newest' ? 'active' : ''}`}
              onClick={() => setReviewSort('newest')}
            >
              Newest
            </button>
          </div>
        </div>

        {/* Signed-in User Review Feature Block (Kaelen_V) */}
        {gameData.reviews.userReview ? (
          <div className="gd-user-review-card">
            <div className="gd-user-review-header">
              <div className="gd-user-review-author-wrap">
                <img
                  src={gameData.reviews.userReview.authorAvatar || '/images/avatar.jpg'}
                  alt={gameData.reviews.userReview.authorName}
                  className="gd-user-avatar"
                />
                <div className="gd-author-meta">
                  <div className="gd-author-line">
                    <span className="gd-author-name">{gameData.reviews.userReview.authorName}</span>
                    <span className="gd-your-review-tag">YOUR REVIEW</span>
                    <span className="gd-author-playtime">
                      • {gameData.reviews.userReview.hoursLogged} hrs logged at review
                    </span>
                  </div>
                  <div className="gd-stars-rating-row">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        size={15}
                        fill="#F4BF4E"
                        color="#F4BF4E"
                      />
                    ))}
                    <span className="rating-txt">
                      {gameData.reviews.userReview.rating} / 10 {gameData.reviews.userReview.ratingLabel}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="gd-edit-review-btn"
                onClick={handleOpenEditModal}
              >
                <Edit3 size={14} />
                <span>Edit Your Review</span>
              </button>
            </div>

            <blockquote className="gd-user-review-quote">
              "{gameData.reviews.userReview.quote}"
            </blockquote>

            <div className="gd-user-review-footer">
              <span>
                Posted: {gameData.reviews.userReview.postedDate}
                {gameData.reviews.userReview.editedDate && ` • Edited: ${gameData.reviews.userReview.editedDate}`}
              </span>
              <span style={{ color: '#D4D4D8' }}>
                {gameData.reviews.userReview.helpfulCount} Curators marked this review helpful
              </span>
            </div>
          </div>
        ) : (
          <div className="gd-no-user-review-box">
            <h4 className="gd-no-user-review-title">You Haven't Reviewed This Title Yet</h4>
            <p className="gd-no-user-review-sub">
              Share your gameplay impression, performance notes, and numeric rating with the Master Archive community.
            </p>
            <button
              type="button"
              className="gd-primary-launch-btn"
              onClick={handleOpenEditModal}
              style={{ marginTop: '6px' }}
            >
              <Edit3 size={15} />
              <span>Write a Critique</span>
            </button>
          </div>
        )}

        {/* Other Verified Vault Reviews */}
        <div className="gd-curator-reviews-grid">
          {sortedCuratorReviews.map((rev) => (
            <div key={rev.id} className="gd-curator-review-card">
              <div className="gd-curator-card-top">
                <div className="gd-curator-author-wrap">
                  <div className="gd-curator-initial-box">
                    {rev.authorInitial || rev.authorName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                        {rev.authorName}
                      </span>
                      <span className="gd-curator-badge">{rev.authorBadge}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#71717A' }}>
                      {rev.hoursLogged} hrs logged
                    </span>
                  </div>
                </div>

                <div className="gd-curator-rating-pill">
                  <Star size={14} fill="#F4BF4E" color="#F4BF4E" />
                  <span>{rev.rating}/10</span>
                </div>
              </div>

              <p className="gd-curator-quote-txt">"{rev.quote}"</p>

              <div className="gd-curator-card-footer">
                <span>{rev.postedDate}</span>
                <button
                  type="button"
                  className={`gd-helpful-vote-btn ${rev.isHelpfulMarked ? 'voted' : ''}`}
                  onClick={() => handleHelpfulVote(rev.id)}
                  title="Mark this critique as helpful"
                >
                  <ThumbsUp size={13} />
                  <span>{rev.helpfulCount} Helpful</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MODAL: Edit Archive Record & Review Form                              */}
      {/* ===================================================================== */}
      {isEditModalOpen && (
        <div className="gd-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="gd-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="gd-modal-header">
              <div className="gd-modal-header-left">
                <SlidersHorizontal size={20} />
                <h3 className="gd-modal-title">Edit Archive Record</h3>
              </div>
              <button
                type="button"
                className="gd-modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveArchiveRecord}>
              <div className="gd-modal-body">
                {/* Status & Platform Row */}
                <div className="gd-form-row">
                  <div className="gd-form-group">
                    <label className="gd-form-label">Vault Status:</label>
                    <select
                      className="gd-form-select"
                      value={modalFormData.status}
                      onChange={(e) => setModalFormData({ ...modalFormData, status: e.target.value })}
                    >
                      <option value="Playing">Playing</option>
                      <option value="Backlog">Backlog</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Dropped">Dropped</option>
                    </select>
                  </div>

                  <div className="gd-form-group">
                    <label className="gd-form-label">Active Platform:</label>
                    <select
                      className="gd-form-select"
                      value={modalFormData.platform}
                      onChange={(e) => setModalFormData({ ...modalFormData, platform: e.target.value })}
                    >
                      {(gameData.platforms || ['PC']).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Playtime Hours & Personal Rating */}
                <div className="gd-form-row">
                  <div className="gd-form-group">
                    <label className="gd-form-label">Total Playtime (Hours):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="gd-form-input"
                      value={modalFormData.playtimeHours}
                      onChange={(e) => setModalFormData({ ...modalFormData, playtimeHours: e.target.value })}
                    />
                  </div>

                  <div className="gd-form-group">
                    <label className="gd-form-label">Your Score (1 - 10):</label>
                    <select
                      className="gd-form-select"
                      value={modalFormData.rating}
                      onChange={(e) => setModalFormData({ ...modalFormData, rating: e.target.value })}
                    >
                      <option value="10">10 — Masterpiece</option>
                      <option value="9.5">9.5 — Outstanding</option>
                      <option value="9.0">9.0 — Exceptional</option>
                      <option value="8.5">8.5 — Great</option>
                      <option value="8.0">8.0 — Very Good</option>
                      <option value="7.5">7.5 — Good</option>
                      <option value="7.0">7.0 — Decent</option>
                      <option value="6.0">6.0 — Mediocre</option>
                      <option value="5.0">5.0 — Flawed</option>
                    </select>
                  </div>
                </div>

                {/* Review Quote / Notes */}
                <div className="gd-form-group">
                  <label className="gd-form-label">Critique / Archive Notes:</label>
                  <textarea
                    rows={4}
                    className="gd-form-textarea"
                    placeholder="Document your verdict, boss strategies, performance settings, or lore impressions..."
                    value={modalFormData.notes}
                    onChange={(e) => setModalFormData({ ...modalFormData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="gd-modal-footer">
                <button
                  type="button"
                  className="gd-btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gd-btn-submit"
                >
                  <Check size={16} />
                  <span>Save Record &amp; Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Toast Notification Banner                                             */}
      {/* ===================================================================== */}
      {toast && (
        <div className="gd-toast-banner" role="alert">
          <CheckCircle2 size={20} color="#F4BF4E" />
          <div>
            <div className="gd-toast-title">{toast.title}</div>
            <div className="gd-toast-msg">{toast.message}</div>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717A',
              cursor: 'pointer',
              marginLeft: '8px',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
