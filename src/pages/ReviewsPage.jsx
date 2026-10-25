import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Star,
  ThumbsUp,
  Hourglass,
  Filter,
  Calendar,
  Edit3,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  MessageSquare,
  X,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { reviewsService } from '../services/reviewsService';
import { mockGames } from '../mockData/games';
import './ReviewsPage.css';

export default function ReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const formRef = useRef(null);

  // Filter & Query States
  const [viewTab, setViewTab] = useState('all'); // 'all', 'my_reviews', 'pending'
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', 'masterpiece', 'positive', 'my_verified'
  const [selectedGameId, setSelectedGameId] = useState(searchParams.get('gameId') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('highest'); // 'highest', 'newest', 'helpful'

  // Primary Data States
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [eligibleGames, setEligibleGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for Submit / Edit Review
  const [formData, setFormData] = useState({
    gameId: '',
    rating: 10,
    headline: '',
    quote: '',
    recommend: true,
    spoilers: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [formError, setFormError] = useState('');

  // Toast Notification
  const [toast, setToast] = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3600);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load reviews and stats
  const loadData = async () => {
    try {
      setLoading(true);
      const [revs, st, eligible] = await Promise.all([
        reviewsService.getReviews(1, {
          viewTab,
          ratingFilter,
          gameId: selectedGameId,
          search: searchQuery,
          sortBy,
        }),
        reviewsService.getReviewStats(1),
        reviewsService.getEligibleOwnedGames(1),
      ]);

      setReviews(revs);
      setStats(st);
      setEligibleGames(eligible);

      // Pre-select first eligible game if form is empty
      if (!formData.gameId && eligible.length > 0) {
        setFormData((prev) => ({
          ...prev,
          gameId: eligible[0].gameId,
        }));
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [viewTab, ratingFilter, selectedGameId, searchQuery, sortBy]);

  // Handle rating click on 1-10 bar
  const handleRatingSelect = (score) => {
    setFormData((prev) => ({ ...prev, rating: score }));
    setFormError('');
  };

  // Pre-fill form when user clicks "Edit Review"
  const handleEditClick = (rev) => {
    setIsEditing(true);
    setEditingReviewId(rev.id);
    setFormData({
      gameId: rev.gameId,
      rating: rev.rating,
      headline: rev.headline || '',
      quote: rev.quote || '',
      recommend: rev.recommend !== undefined ? rev.recommend : true,
      spoilers: Boolean(rev.spoilers),
    });
    setFormError('');
    // Scroll form into view smoothly
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Pre-fill form from unreviewed title card
  const handleWriteForGame = (gameId) => {
    setIsEditing(false);
    setEditingReviewId(null);
    setFormData((prev) => ({
      ...prev,
      gameId,
      headline: '',
      quote: '',
      rating: 10,
    }));
    setFormError('');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingReviewId(null);
    setFormData((prev) => ({
      ...prev,
      headline: '',
      quote: '',
      rating: 10,
    }));
    setFormError('');
  };

  // Submit Critique Form
  const handleSubmitCritique = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.gameId) {
      setFormError('Please select a valid target title from your vault.');
      return;
    }

    if (formData.rating < 1 || formData.rating > 10) {
      setFormError('Rating validation failed: Score must range between 1 and 10.');
      return;
    }

    if (!formData.quote.trim()) {
      setFormError('Please enter review critique text before publishing.');
      return;
    }

    try {
      const saved = await reviewsService.submitReview(1, {
        gameId: formData.gameId,
        rating: formData.rating,
        headline: formData.headline,
        quote: formData.quote,
        recommend: formData.recommend,
        spoilers: formData.spoilers,
      });

      const selectedGame = mockGames.find((g) => g.id === Number(formData.gameId));

      setToast({
        title: isEditing ? 'Critique Updated' : 'Critique Published',
        message: `Your ${formData.rating}/10 review for "${selectedGame?.title || 'Game'}" is now indexed in the vault network.`,
      });

      handleCancelEdit();
      loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to submit review.');
    }
  };

  // Delete user review
  const handleDeleteReview = async (reviewId, gameTitle) => {
    if (window.confirm(`Are you sure you want to permanently delete your review for "${gameTitle}"?`)) {
      try {
        await reviewsService.deleteReview(reviewId, 1);
        setToast({
          title: 'Review Deleted',
          message: `Your critique for "${gameTitle}" was removed.`,
        });
        loadData();
      } catch (err) {
        setToast({
          title: 'Error',
          message: err.message || 'Failed to delete review.',
        });
      }
    }
  };

  // Toggle helpful vote
  const handleHelpfulClick = async (reviewId) => {
    try {
      const res = await reviewsService.toggleHelpfulVote(reviewId);
      if (res) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, helpfulCount: res.helpfulCount, isHelpfulMarked: res.isHelpfulMarked }
              : r
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Rating label helper
  const getScoreLabel = (score) => {
    if (score === 10) return '10 - Masterpiece';
    if (score >= 9) return `${score} - Exceptional`;
    if (score >= 8) return `${score} - Great`;
    if (score >= 7) return `${score} - Good`;
    if (score >= 6) return `${score} - Decent`;
    return `${score} - Mixed`;
  };

  return (
    <div className="reviews-page">
      {/* ===================================================================== */}
      {/* 1. Page Header & View Filter Tabs                                     */}
      {/* ===================================================================== */}
      <section className="rev-header-section">
        <div className="rev-tracker-subtitle">
          <Star size={14} fill="#F4BF4E" />
          <span>VAULT TELEMETRY / CRITIQUE ARCHIVE &amp; REVIEWS REPOSITORY</span>
        </div>

        <div className="rev-header-row">
          <div className="rev-title-group">
            <h1 className="rev-page-title">GAME REVIEWS</h1>
            <p className="rev-page-description">
              Inspect published community critiques, manage your personal game ratings (1–10 scale), and submit verified reviews for owned titles.
            </p>
          </div>

          {/* View Tab Filter Pills */}
          <div className="rev-tabs-bar" role="tablist">
            <button
              id="tab-all-reviews"
              type="button"
              className={`rev-tab-btn ${viewTab === 'all' ? 'active' : ''}`}
              onClick={() => setViewTab('all')}
            >
              <span>All Reviews</span>
              {stats && <span className="rev-tab-badge">{stats.totalEvaluations}</span>}
            </button>

            <button
              id="tab-my-reviews"
              type="button"
              className={`rev-tab-btn ${viewTab === 'my_reviews' ? 'active' : ''}`}
              onClick={() => setViewTab('my_reviews')}
            >
              <span>My Published Reviews</span>
              {stats && <span className="rev-tab-badge">{stats.reviewsPenned}</span>}
            </button>

            <button
              id="tab-pending-reviews"
              type="button"
              className={`rev-tab-btn ${viewTab === 'pending' ? 'active' : ''}`}
              onClick={() => setViewTab('pending')}
            >
              <span>Pending Review</span>
              {stats && (
                <span className="rev-tab-badge" style={{ color: '#F4BF4E' }}>
                  {stats.unreviewedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. Telemetry KPI Strip (4 Liquid Glass Cards)                         */}
      {/* ===================================================================== */}
      {stats && (
        <section className="rev-telemetry-strip">
          {/* Metric 1: Reviews Penned */}
          <div className="rev-glass-card rev-kpi-card">
            <div className="rev-kpi-top">
              <span className="rev-kpi-label">Reviews Penned</span>
              <div className="rev-kpi-icon-box gold">
                <Star size={16} fill="#F4BF4E" />
              </div>
            </div>
            <div>
              <div className="rev-kpi-value-row">
                <span className="rev-kpi-number">{stats.reviewsPenned}</span>
                <span className="rev-kpi-subtext">{stats.percentageReviewed}% of library</span>
              </div>
              <div className="rev-kpi-progress-bar">
                <div
                  className="rev-kpi-progress-fill"
                  style={{ width: `${Math.min(100, stats.percentageReviewed)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Metric 2: Average Rating Given */}
          <div className="rev-glass-card rev-kpi-card">
            <div className="rev-kpi-top">
              <span className="rev-kpi-label">Average Rating Given</span>
              <div className="rev-kpi-icon-box">
                <Star size={16} />
              </div>
            </div>
            <div>
              <div className="rev-kpi-value-row">
                <span className="rev-kpi-number">{stats.avgRatingGiven}</span>
                <span style={{ fontSize: '14px', color: '#71717A' }}>/ 10</span>
                <span className="rev-kpi-subtext green" style={{ marginLeft: 'auto' }}>
                  High Standards
                </span>
              </div>
              <p className="rev-kpi-desc" style={{ marginTop: '4px' }}>
                Across {stats.reviewsPenned} authored evaluations
              </p>
            </div>
          </div>

          {/* Metric 3: Community Helpful Votes */}
          <div className="rev-glass-card rev-kpi-card">
            <div className="rev-kpi-top">
              <span className="rev-kpi-label">Helpful Endorsements</span>
              <div className="rev-kpi-icon-box green">
                <ThumbsUp size={16} />
              </div>
            </div>
            <div>
              <div className="rev-kpi-value-row">
                <span className="rev-kpi-number">{stats.totalHelpful}</span>
                <span className="rev-kpi-subtext green">+38 this month</span>
              </div>
              <p className="rev-kpi-desc" style={{ marginTop: '4px' }}>
                94% positive community consensus
              </p>
            </div>
          </div>

          {/* Metric 4: Unreviewed Owned Titles */}
          <div className="rev-glass-card rev-kpi-card">
            <div className="rev-kpi-top">
              <span className="rev-kpi-label">Unreviewed Owned</span>
              <div className="rev-kpi-icon-box">
                <Hourglass size={16} />
              </div>
            </div>
            <div>
              <div className="rev-kpi-value-row">
                <span className="rev-kpi-number">{stats.unreviewedCount}</span>
                <span style={{ fontSize: '13px', color: '#71717A' }}>Titles</span>
                <span className="rev-kpi-subtext" style={{ marginLeft: 'auto' }}>
                  Eligible
                </span>
              </div>
              <p className="rev-kpi-desc" style={{ marginTop: '4px' }}>
                Requires personal vault ownership
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 3. Main Two-Column Layout (Review Stream + Right Action Form)         */}
      {/* ===================================================================== */}
      <div className="rev-main-grid">
        {/* =================================================================== */}
        {/* LEFT COLUMN: Filter Toolbar & Review Feed Cards                     */}
        {/* =================================================================== */}
        <div className="rev-feed-column">
          {/* Filter Toolbar */}
          <div className="rev-glass-card rev-filter-toolbar">
            <div className="rev-toolbar-top-row">
              {/* Text Search */}
              <div className="rev-search-box">
                <Filter size={16} className="rev-search-icon" />
                <input
                  id="reviews-search-input"
                  type="text"
                  className="rev-search-input"
                  placeholder="Filter by title / studio / author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Game Specific Filter & Sort */}
              <div className="rev-select-controls-row">
                {/* Specific Game Filter (07-reviews.md requirement) */}
                <div className="rev-select-wrap">
                  <select
                    id="game-filter-select"
                    className="rev-custom-select"
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    aria-label="Filter reviews by game"
                  >
                    <option value="all">All Catalogued Titles</option>
                    {mockGames.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="rev-select-arrow" />
                </div>

                {/* Sort Select */}
                <div className="rev-select-wrap">
                  <select
                    id="sort-by-select"
                    className="rev-custom-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort reviews by"
                  >
                    <option value="highest">Highest Rating</option>
                    <option value="newest">Newest First</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                  <ChevronDown size={14} className="rev-select-arrow" />
                </div>
              </div>
            </div>

            {/* Rating Filter Chips */}
            <div className="rev-filter-chips-row">
              <button
                id="rating-filter-all"
                type="button"
                className={`rev-filter-chip ${ratingFilter === 'all' ? 'active' : ''}`}
                onClick={() => setRatingFilter('all')}
              >
                All Ratings
              </button>
              <button
                id="rating-filter-masterpiece"
                type="button"
                className={`rev-filter-chip ${ratingFilter === 'masterpiece' ? 'active' : ''}`}
                onClick={() => setRatingFilter('masterpiece')}
              >
                Masterpiece (9-10)
              </button>
              <button
                id="rating-filter-positive"
                type="button"
                className={`rev-filter-chip ${ratingFilter === 'positive' ? 'active' : ''}`}
                onClick={() => setRatingFilter('positive')}
              >
                Positive (7-8)
              </button>
              <button
                id="rating-filter-my-verified"
                type="button"
                className={`rev-filter-chip ${ratingFilter === 'my_verified' ? 'active' : ''}`}
                onClick={() => setRatingFilter('my_verified')}
              >
                My Verified Only
              </button>
            </div>
          </div>

          {/* Reviews Stream */}
          {loading ? (
            <div className="rev-glass-card rev-empty-feed">
              <div className="rev-kpi-icon-box gold" style={{ margin: '0 auto 8px auto' }}>
                <Star size={20} />
              </div>
              <h3 className="rev-empty-title">Loading Reviews...</h3>
              <p className="rev-empty-desc">Synchronizing critique archive and ownership telemetry</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rev-glass-card rev-empty-feed">
              <div className="rev-empty-icon">
                <MessageSquare size={24} />
              </div>
              <h3 className="rev-empty-title">No Reviews Found</h3>
              <p className="rev-empty-desc">
                No critiques match your active filters or search terms. Try adjusting your query or write a new review.
              </p>
            </div>
          ) : (
            <div className="rev-cards-stream">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className={`rev-glass-card rev-feed-card ${rev.isUserReview ? 'my-review' : ''}`}
                >
                  {/* Card Header: Game Cover, Title, Score */}
                  <div className="rev-card-header">
                    <div className="rev-card-game-info">
                      {/* Thumbnail Link */}
                      <Link
                        to={`/games/${rev.gameId}`}
                        className="rev-game-thumb-link"
                        title={`View details for ${rev.gameTitle}`}
                      >
                        <img
                          src={rev.gameCover}
                          alt={rev.gameTitle}
                          className="rev-game-thumb-img"
                        />
                      </Link>

                      {/* Title & Metadata */}
                      <div className="rev-game-meta-group">
                        <div className="rev-verification-badge-row">
                          {rev.isUserReview ? (
                            <span className="rev-verified-pill">
                              <CheckCircle2 size={12} fill="#F4BF4E" color="#040404" />
                              <span>Your Verified Review</span>
                            </span>
                          ) : (
                            <span className="rev-verified-pill green">
                              <CheckCircle2 size={12} fill="#34D399" color="#040404" />
                              <span>{rev.authorName} • {rev.authorBadge}</span>
                            </span>
                          )}
                          <span className="rev-playtime-logged">
                            • {rev.hoursLogged} hrs logged
                          </span>
                        </div>

                        <Link
                          to={`/games/${rev.gameId}`}
                          className="rev-game-title-link"
                        >
                          {rev.gameTitle}
                        </Link>

                        <div className="rev-game-subline">
                          {rev.gameDeveloper} • {rev.gameReleaseYear} • {(rev.gameGenres || []).join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Score Display */}
                    <div className="rev-card-score-box">
                      <div className="rev-score-numbers">
                        <span className="rev-score-big">{rev.rating}</span>
                        <span className="rev-score-denominator">/10</span>
                      </div>
                      <span className={`rev-score-tier-pill ${rev.rating < 9 ? 'dim' : ''}`}>
                        {rev.ratingLabel}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Headline & Quote */}
                  <div className="rev-card-body">
                    <div className="rev-author-date-line">
                      <Calendar size={13} />
                      <span>
                        Published {rev.postedDate}
                        {rev.editedDate && ` • Edited ${rev.editedDate}`}
                      </span>
                    </div>

                    {rev.headline && (
                      <h4 className="rev-headline-text">"{rev.headline}"</h4>
                    )}

                    <p className="rev-quote-text">{rev.quote}</p>
                  </div>

                  {/* Card Footer: Helpful counter, actions */}
                  <div className="rev-card-footer">
                    <div className="rev-helpful-stats-group">
                      <ThumbsUp size={14} color="#F4BF4E" />
                      <span>
                        <strong style={{ color: '#FFFFFF' }}>{rev.helpfulCount} Curators</strong> marked helpful
                      </span>
                      {rev.commentsCount !== undefined && (
                        <span style={{ marginLeft: '8px', color: '#71717A' }}>
                          • {rev.commentsCount} comments
                        </span>
                      )}
                    </div>

                    <div className="rev-card-actions-group">
                      {/* Helpful Button */}
                      <button
                        type="button"
                        className={`rev-action-btn-sm ${rev.isHelpfulMarked ? 'active' : ''}`}
                        onClick={() => handleHelpfulClick(rev.id)}
                        title="Mark this critique as helpful"
                      >
                        <ThumbsUp size={13} />
                        <span>Helpful</span>
                      </button>

                      {/* If User Review: Edit and Delete buttons */}
                      {rev.isUserReview && (
                        <>
                          <button
                            type="button"
                            className="rev-action-btn-sm"
                            onClick={() => handleEditClick(rev)}
                            title="Edit your review"
                          >
                            <Edit3 size={13} color="#F4BF4E" />
                            <span>Edit Review</span>
                          </button>

                          <button
                            type="button"
                            className="rev-delete-btn-sm"
                            onClick={() => handleDeleteReview(rev.id, rev.gameTitle)}
                            title="Delete this review"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}

                      {/* Return Path to Game Details (07-reviews.md suggested requirement) */}
                      <Link
                        to={`/games/${rev.gameId}`}
                        className="rev-action-btn-sm"
                        style={{ textDecoration: 'none' }}
                        title="Open Game Details page"
                      >
                        <ExternalLink size={13} />
                        <span>Game Details</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Submit Form & Unreviewed Games                        */}
        {/* =================================================================== */}
        <div className="rev-sidebar-column">
          {/* CARD A: SUBMIT OR UPDATE CRITIQUE FORM (Core requirement) */}
          <section ref={formRef} className="rev-glass-card rev-form-card">
            <div className="rev-specular-top-accent" />

            <div className="rev-form-header">
              <div>
                <h3 className="rev-form-title">
                  {isEditing ? 'UPDATE ARCHIVE CRITIQUE' : 'SUBMIT ARCHIVE CRITIQUE'}
                </h3>
                <p className="rev-form-subtitle">
                  Only owned titles in your vault are eligible for review.
                </p>
              </div>
              <Star size={20} color="#F4BF4E" />
            </div>

            <form className="rev-critique-form" onSubmit={handleSubmitCritique}>
              {/* 1. Target Vault Game Dropdown */}
              <div className="rev-form-group">
                <label className="rev-form-label">Target Vault Title:</label>
                <select
                  id="form-target-game"
                  className="rev-select-field"
                  value={formData.gameId}
                  disabled={isEditing}
                  onChange={(e) => {
                    setFormData({ ...formData, gameId: e.target.value });
                    setFormError('');
                  }}
                  required
                >
                  {eligibleGames.map((eg) => (
                    <option key={eg.gameId} value={eg.gameId}>
                      {eg.title} [{eg.playtimeHours}h logged • {eg.platform}]
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Interactive Rating Selector (1-10 Scale) */}
              <div className="rev-form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="rev-form-label">Rating (1–10 Scale):</label>
                  <span style={{ fontSize: '12px', color: '#F4BF4E', fontWeight: 700 }}>
                    {getScoreLabel(formData.rating)}
                  </span>
                </div>

                {/* 10-Segmented Bar */}
                <div className="rev-rating-segmented-bar" role="radiogroup" aria-label="Rating scale 1 to 10">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      type="button"
                      className={`rev-rating-segment-btn ${formData.rating === score ? 'selected' : ''}`}
                      onClick={() => handleRatingSelect(score)}
                      title={`Rate ${score}/10`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: '#71717A' }}>
                  Validation note: Score must range between 1 and 10.
                </span>
              </div>

              {/* 3. Review Headline */}
              <div className="rev-form-group">
                <label className="rev-form-label">Review Headline:</label>
                <input
                  id="form-headline"
                  type="text"
                  className="rev-input-field"
                  placeholder="E.g., A sprawling narrative achievement..."
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                />
              </div>

              {/* 4. Critique Body */}
              <div className="rev-form-group">
                <label className="rev-form-label">In-Depth Critique &amp; Analysis:</label>
                <textarea
                  id="form-critique-body"
                  rows={4}
                  className="rev-textarea-field"
                  placeholder="Write your in-depth assessment, mechanical critiques, performance notes, and recommendations..."
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  required
                />
              </div>

              {/* 5. Toggles & Checkboxes */}
              <div className="rev-form-checkbox-row">
                <label className="rev-checkbox-label">
                  <input
                    type="checkbox"
                    className="rev-checkbox-input"
                    checked={formData.recommend}
                    onChange={(e) => setFormData({ ...formData, recommend: e.target.checked })}
                  />
                  <span>Recommend to Vault Network</span>
                </label>

                <label className="rev-checkbox-label">
                  <input
                    type="checkbox"
                    className="rev-checkbox-input"
                    checked={formData.spoilers}
                    onChange={(e) => setFormData({ ...formData, spoilers: e.target.checked })}
                  />
                  <span style={{ color: '#A1A1AA' }}>Contains Narrative Spoilers</span>
                </label>
              </div>

              {/* Error Banner */}
              {formError && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FFB4AB',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <AlertCircle size={15} color="#EF4444" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 6. Action Triggers */}
              <div className="rev-form-actions-row">
                <button
                  id="publish-critique-btn"
                  type="submit"
                  className="rev-submit-btn"
                >
                  <Sparkles size={16} />
                  <span>{isEditing ? 'Save Critique Updates' : 'Publish Critique'}</span>
                </button>

                {isEditing && (
                  <button
                    type="button"
                    className="rev-cancel-draft-btn"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* 7. Security & API Verification Line */}
              <div className="rev-ownership-security-note">
                <ShieldCheck size={14} />
                <span>Verified Ownership Confirmed via Steam Protocol API</span>
              </div>
            </form>
          </section>

          {/* CARD B: UNREVIEWED VAULT GAMES QUICK LIST */}
          <section className="rev-glass-card rev-unreviewed-card">
            <div className="rev-unreviewed-header">
              <div className="rev-unreviewed-title-group">
                <Clock size={18} color="#F4BF4E" />
                <h4 className="rev-unreviewed-title">Unreviewed Vault Titles</h4>
              </div>
              <span style={{ fontSize: '11px', color: '#F4BF4E', fontWeight: 700 }}>
                {eligibleGames.filter((g) => !g.hasReviewed).length} Total
              </span>
            </div>

            <div className="rev-unreviewed-list">
              {eligibleGames.filter((g) => !g.hasReviewed).slice(0, 4).map((game) => (
                <div key={game.gameId} className="rev-unreviewed-item">
                  <div className="rev-unreviewed-game-left">
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="rev-unreviewed-thumb"
                    />
                    <div className="rev-unreviewed-text">
                      <p className="rev-unreviewed-game-name">{game.title}</p>
                      <p className="rev-unreviewed-hours">{game.playtimeHours}h logged</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rev-write-review-btn"
                    onClick={() => handleWriteForGame(game.gameId)}
                  >
                    Write Review
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* CARD C: RATING DISTRIBUTION TELEMETRY HISTOGRAM */}
          {stats?.distribution && (
            <section className="rev-glass-card rev-histogram-card">
              <div className="rev-histogram-header">
                <h4 className="rev-histogram-title">Curator Score Distribution</h4>
                <span style={{ fontSize: '11px', color: '#71717A' }}>
                  {stats.totalEvaluations} Evaluations
                </span>
              </div>

              <div className="rev-histogram-rows">
                {[10, 9, 8, 7, 6, 5].map((tier) => {
                  const count = stats.distribution[tier] || 0;
                  const pct = stats.totalEvaluations > 0
                    ? Math.round((count / stats.totalEvaluations) * 100)
                    : 0;
                  return (
                    <div key={tier} className="rev-histogram-row">
                      <span className="rev-hist-score-label">
                        {tier === 5 ? '≤5' : tier}
                      </span>
                      <div className="rev-hist-bar-track">
                        <div
                          className="rev-hist-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="rev-hist-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Toast Notification Banner                                             */}
      {/* ===================================================================== */}
      {toast && (
        <div className="rev-toast-banner" role="alert">
          <CheckCircle2 size={20} color="#F4BF4E" />
          <div>
            <div className="rev-toast-title">{toast.title}</div>
            <div className="rev-toast-msg">{toast.message}</div>
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
