import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  LayoutGrid,
  List,
  Star,
  Info,
  Plus,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  Shield,
  X,
  Check,
  RotateCcw,
  AlertCircle,
  Gamepad2,
  Tv,
} from 'lucide-react';

import { catalogueService } from '../services/catalogueService';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import './DiscoverPage.css';

// Pre-defined genre filter options matching Stitch reference
const GENRE_OPTIONS = [
  'All Genres',
  'Action RPG',
  'Sci-Fi / Space',
  'Souls-like',
  'Cyberpunk',
  'CRPG',
  'Roguelike',
  'Survival Horror',
  'Metroidvania',
  'Strategy',
  'Action',
  'Fantasy',
];

// Pre-defined platform ecosystems matching Stitch reference
const PLATFORM_OPTIONS = [
  { id: 'All', label: 'All Platforms', color: '' },
  { id: 'Steam', label: 'Steam', color: 'blue' },
  { id: 'PlayStation 5', label: 'PlayStation 5', color: 'indigo' },
  { id: 'GOG', label: 'GOG', color: 'teal' },
  { id: 'Xbox Cloud', label: 'Xbox Cloud', color: 'green' },
  { id: 'Switch', label: 'Switch', color: 'red' },
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // Data & loading states
  const [games, setGames] = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [telemetry, setTelemetry] = useState({
    totalCatalogued: 4820,
    platformsIndexed: 6,
    newReleasesMonth: 24,
    vaultOwnership: 14,
    vaultTotalRatio: '14 / 4,820 (0.3%)',
  });
  const [loading, setLoading] = useState(true);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [hideInLibrary, setHideInLibrary] = useState(false);
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [selectedGameForModal, setSelectedGameForModal] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add-to-Library form state
  const [addFormData, setAddFormData] = useState({
    gameId: '',
    platform: '',
    status: 'Backlog',
    playtimeHours: 0,
  });
  const [addFormError, setAddFormError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Global keyboard shortcut for search (⌘F / Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch catalogue, spotlight & telemetry data
  const loadData = async () => {
    setLoading(true);
    try {
      const [catResult, spotlightGame, stats] = await Promise.all([
        catalogueService.getCatalogueGames(1, {
          search: searchQuery,
          genre: selectedGenre,
          platform: selectedPlatform,
          hideInLibrary,
          highRating: highRatingOnly,
          sortBy,
          page: currentPage,
          limit: itemsPerPage,
        }),
        catalogueService.getFeaturedSpotlight(1),
        catalogueService.getCatalogueTelemetry(1),
      ]);

      setGames(catResult.games);
      setTotalCount(catResult.total);
      setTotalPages(catResult.totalPages);
      setSpotlight(spotlightGame);
      setTelemetry(stats);
    } catch (err) {
      console.error('Error loading catalogue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedGenre, selectedPlatform, hideInLibrary, highRatingOnly, sortBy, currentPage, itemsPerPage]);

  // Toast notification auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Reset all filters action
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All Genres');
    setSelectedPlatform('All');
    setHideInLibrary(false);
    setHighRatingOnly(false);
    setSortBy('popularity');
    setCurrentPage(1);
  };

  // Open Game Details Modal
  const handleOpenDetails = (game) => {
    setSelectedGameForModal(game);
    setAddFormData({
      gameId: game.id,
      platform: game.platforms ? game.platforms[0] : 'PC',
      status: 'Backlog',
      playtimeHours: 0,
    });
    setAddFormError('');
    setIsDetailsModalOpen(true);
  };

  // Open Quick Add Modal
  const handleOpenAddModal = (game) => {
    setSelectedGameForModal(game);
    // Find first platform not yet owned, or first platform
    const defaultPlatform = game.platforms && game.platforms.length > 0 ? game.platforms[0] : 'PC';
    setAddFormData({
      gameId: game.id,
      platform: defaultPlatform,
      status: 'Backlog',
      playtimeHours: 0,
    });
    setAddFormError('');
    setIsAddModalOpen(true);
  };

  // Check if currently selected platform is already owned
  const isSelectedPlatformOwned = useMemo(() => {
    if (!selectedGameForModal || !addFormData.platform) return false;
    const owned = selectedGameForModal.ownedPlatforms || [];
    return owned.some((p) => p.toLowerCase() === addFormData.platform.toLowerCase());
  }, [selectedGameForModal, addFormData.platform]);

  // Handle Add to Library Submission
  const handleConfirmAdd = async (e) => {
    e?.preventDefault();
    if (!selectedGameForModal) return;

    if (isSelectedPlatformOwned) {
      setAddFormError(`"${selectedGameForModal.title}" is already in your library on platform ${addFormData.platform}.`);
      return;
    }

    try {
      await catalogueService.addGameToUserLibrary(1, {
        gameId: selectedGameForModal.id,
        platform: addFormData.platform,
        status: addFormData.status,
        playtimeHours: addFormData.playtimeHours,
      });

      setToastMessage({
        title: 'Indexed to Personal Vault',
        message: `"${selectedGameForModal.title}" (${addFormData.platform}) added to Library successfully.`,
      });

      setIsAddModalOpen(false);
      setIsDetailsModalOpen(false);

      // Reload catalogue and telemetry to reflect the newly added title
      loadData();
    } catch (err) {
      setAddFormError(err.message || 'Failed to add game to library.');
    }
  };

  return (
    <div className="discover-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="discover-toast" role="alert">
          <CheckCircle2 size={18} color="var(--accent-primary)" />
          <div>
            <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{toastMessage.title}</div>
            <div style={{ fontSize: '11.5px', color: '#A1A1AA' }}>{toastMessage.message}</div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. BREADCRUMB & TITLE HEADER SECTION                                   */}
      {/* ===================================================================== */}
      <section className="discover-header-section">
        <div className="discover-title-group">
          <div className="discover-eyebrow">
            <span className="discover-beacon" />
            <span>GLOBAL REPOSITORY</span>
            <span className="eyebrow-sep">/</span>
            <span className="eyebrow-sub">SHARED CATALOGUE</span>
          </div>
          <h1 className="discover-display-title">DISCOVER GAMES</h1>
          <p className="discover-subtext">
            Browse the decentralized global master catalogue, inspect multi-platform releases, and index new software into your personal vault.
          </p>
        </div>

        {/* View Switcher & Sorting Controls */}
        <div className="discover-header-actions">
          {/* Grid / List Mode */}
          <div className="view-mode-pill">
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={15} />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={15} />
              <span>List View</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="sort-select-wrapper">
            <span className="sort-select-label">SORT:</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort catalogue by"
            >
              <option value="popularity">Popularity / Release</option>
              <option value="rating_desc">Critic Score (High to Low)</option>
              <option value="year_desc">Release Year (Newest)</option>
              <option value="year_asc">Release Year (Oldest)</option>
              <option value="title_asc">Title (A - Z)</option>
              <option value="title_desc">Title (Z - A)</option>
            </select>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. TELEMETRY / CATALOGUE OVERVIEW STRIP                                 */}
      {/* ===================================================================== */}
      <section className="discover-kpi-strip">
        {/* Metric 1 */}
        <div className="discover-kpi-card glass-liquid-card">
          <div className="kpi-left-col">
            <span className="kpi-label">TOTAL CATALOGUED</span>
            <div className="kpi-value-row">
              <span className="kpi-number">{telemetry.totalCatalogued.toLocaleString()}</span>
              <span className="kpi-subtext">Titles</span>
            </div>
          </div>
          <div className="kpi-icon-box">
            <Database size={20} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="discover-kpi-card glass-liquid-card">
          <div className="kpi-left-col">
            <span className="kpi-label">PLATFORMS INDEXED</span>
            <div className="kpi-value-row">
              <span className="kpi-number">{telemetry.platformsIndexed}</span>
              <span className="kpi-subtext">Major Ecosystems</span>
            </div>
          </div>
          <div className="kpi-icon-box green">
            <Gamepad2 size={20} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="discover-kpi-card glass-liquid-card">
          <div className="kpi-left-col">
            <span className="kpi-label">NEW RELEASES (MONTH)</span>
            <div className="kpi-value-row">
              <span className="kpi-number">{telemetry.newReleasesMonth}</span>
              <span className="kpi-subtext text-completed">Available Now</span>
            </div>
          </div>
          <div className="kpi-icon-box">
            <Sparkles size={20} />
          </div>
        </div>

        {/* Metric 4: Vault Ownership */}
        <div className="discover-kpi-card glass-liquid-card">
          <div className="kpi-left-col">
            <span className="kpi-label">VAULT OWNERSHIP</span>
            <div className="kpi-value-row">
              <span className="kpi-number text-gold">{telemetry.vaultOwnership}</span>
              <span className="kpi-subtext">/ {telemetry.totalCatalogued.toLocaleString()} ({((telemetry.vaultOwnership / telemetry.totalCatalogued) * 100).toFixed(1)}%)</span>
            </div>
          </div>
          <div className="kpi-icon-box">
            <Layers size={20} />
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. CURATED FEATURED SPOTLIGHT HERO BANNER                             */}
      {/* ===================================================================== */}
      {spotlight && (
        <section className="featured-spotlight-card glass-liquid-card">
          <div
            className="spotlight-backdrop"
            style={{ backgroundImage: `url(${spotlight.coverImage})` }}
          />
          <div className="spotlight-overlay-gradient-h" />
          <div className="spotlight-overlay-gradient-v" />

          <div className="spotlight-content">
            <div className="spotlight-top-tags">
              <span className="spotlight-badge-gold">FEATURED SPOTLIGHT</span>
              <span className="spotlight-badge-status">
                <span className="spotlight-dot-green" />
                INDEXED RELEASE • {spotlight.releaseYear}
              </span>
              <span className="spotlight-badge-credits">
                {spotlight.developer} • {spotlight.publisher || 'Konami'}
              </span>
            </div>

            <h2 className="spotlight-title">{spotlight.title}</h2>

            <p className="spotlight-synopsis">{spotlight.description}</p>

            <div className="spotlight-meta-row">
              {(spotlight.genres || []).slice(0, 3).map((g) => (
                <span key={g} className="spotlight-genre-pill">
                  {g}
                </span>
              ))}
              <div className="spotlight-divider" />
              {(spotlight.platforms || []).map((p) => (
                <span key={p} className="spotlight-platform-pill">
                  {p}
                </span>
              ))}
              <div className="spotlight-divider" />
              <div className="spotlight-score">
                <Star size={14} fill="var(--accent-primary)" color="var(--accent-primary)" />
                <span>{spotlight.avgRating} CRITIC SCORE</span>
              </div>
            </div>

            <div className="spotlight-actions-row">
              {spotlight.isInLibrary ? (
                <button type="button" className="spotlight-add-btn in-library" disabled>
                  <CheckCircle2 size={16} />
                  <span>✓ In Library</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="spotlight-add-btn"
                  onClick={() => handleOpenAddModal(spotlight)}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Add to Library</span>
                </button>
              )}

              <button
                type="button"
                className="spotlight-details-btn"
                onClick={() => handleOpenDetails(spotlight)}
              >
                <Info size={16} />
                <span>View Details</span>
              </button>

              <span className="spotlight-sync-meta">
                <span className="spotlight-sync-dot" />
                AVAILABLE TO SYNC ({spotlight.platforms ? spotlight.platforms.length : 2} PLATFORMS)
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 4. SEARCH & MULTI-FILTER SUITE                                        */}
      {/* ===================================================================== */}
      <section className="discover-filter-card glass-liquid-card">
        {/* Top Search bar & quick toggles */}
        <div className="filter-top-row">
          <div className="search-input-box">
            <Search size={18} className="search-icon-inside" />
            <input
              ref={searchInputRef}
              type="text"
              className="discover-search-field"
              placeholder="Search catalogue by game title, developer, publisher, or tags... ⌘F"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
            <span className="search-shortcut-badge">⌘F</span>
          </div>

          {/* Quick Checkbox Toggles */}
          <div className="quick-toggles-group">
            <label
              className={`filter-toggle-label ${hideInLibrary ? 'active' : ''}`}
              onClick={() => {
                setHideInLibrary(!hideInLibrary);
                setCurrentPage(1);
              }}
            >
              <div className="custom-checkbox">
                {hideInLibrary && <Check size={12} strokeWidth={3} />}
              </div>
              <span>Hide In-Library Titles</span>
            </label>

            <label
              className={`filter-toggle-label ${highRatingOnly ? 'active' : ''}`}
              onClick={() => {
                setHighRatingOnly(!highRatingOnly);
                setCurrentPage(1);
              }}
            >
              <div className="custom-checkbox">
                {highRatingOnly && <Check size={12} strokeWidth={3} />}
              </div>
              <span>High Rating (8.5+)</span>
            </label>
          </div>
        </div>

        {/* Genre Classification Filter Pills */}
        <div className="filter-section-row">
          <div className="filter-label-bar">
            <span className="filter-subhead">GENRE CLASSIFICATION</span>
            {(selectedGenre !== 'All Genres' || selectedPlatform !== 'All' || hideInLibrary || highRatingOnly || searchQuery) && (
              <button
                type="button"
                className="reset-filters-action"
                onClick={handleResetFilters}
              >
                RESET FILTERS
              </button>
            )}
          </div>
          <div className="filter-chips-list">
            {GENRE_OPTIONS.map((genre) => {
              const isActive = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  type="button"
                  className={`filter-chip-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedGenre(genre);
                    setCurrentPage(1);
                  }}
                >
                  <span>{genre}</span>
                  {isActive && <Check size={12} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Ecosystem Filter Chips */}
        <div className="filter-section-row">
          <div className="filter-label-bar">
            <span className="filter-subhead">SUPPORTED ECOSYSTEMS</span>
            <span className="filter-count-spec">{totalCount} RELEASES MATCHED</span>
          </div>
          <div className="filter-chips-list">
            {PLATFORM_OPTIONS.map((item) => {
              const isActive = selectedPlatform === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`filter-chip-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPlatform(item.id);
                    setCurrentPage(1);
                  }}
                >
                  {item.color && <span className={`chip-dot-indicator ${item.color}`} />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. CATALOGUE RESULTS (Grid View or List View)                         */}
      {/* ===================================================================== */}
      <section className="catalogue-results-container">
        <div className="catalogue-results-header">
          <div className="results-title-group">
            <h2 className="results-heading">CATALOGUE RESULTS</h2>
            <span className="results-page-tag">
              PAGE {currentPage} / SHOWING {games.length} OF {totalCount}
            </span>
          </div>
          <span className="results-tip-text">CLICK COVER FOR TELEMETRY SPEC</span>
        </div>

        {games.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No Catalogue Titles Found"
            description="No games match your active search, platform, or genre filters."
            actionText="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : viewMode === 'grid' ? (
          /* 4-column Responsive Grid of Liquid Cards */
          <div className="catalogue-cards-grid">
            {games.map((game) => (
              <div key={game.id} className="catalogue-game-card glass-liquid-card">
                {/* Cover Image & Overlays */}
                <div
                  className="card-cover-wrapper"
                  onClick={() => handleOpenDetails(game)}
                  title={`View details for ${game.title}`}
                >
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    className="card-cover-image"
                    loading="lazy"
                  />
                  <div className="card-cover-gradient" />

                  {/* Rating Badge */}
                  <div className="card-rating-badge">
                    <Star size={12} fill="var(--accent-primary)" color="var(--accent-primary)" />
                    <span>{game.avgRating}</span>
                  </div>

                  {/* Genre Micro Tags */}
                  <div className="card-genre-pills">
                    {(game.genres || []).slice(0, 2).map((g) => (
                      <span key={g} className="genre-micro-tag">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body-content">
                  <div className="card-title-group">
                    <h3
                      className="game-card-title"
                      onClick={() => handleOpenDetails(game)}
                    >
                      {game.title}
                    </h3>
                    <div className="card-creator-row">
                      <span>{game.developer}</span>
                      <span style={{ fontFamily: 'monospace' }}>{game.releaseYear}</span>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="card-platforms-row">
                    {(game.platforms || []).map((p) => (
                      <span key={p} className="platform-mini-badge">
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Card Actions: Library State Aware */}
                  <div className="card-actions-area">
                    {game.isInLibrary ? (
                      <>
                        <button type="button" className="card-in-library-btn" disabled>
                          <CheckCircle2 size={15} />
                          <span>✓ In Library</span>
                        </button>
                        <Link
                          to={`/library?search=${encodeURIComponent(game.title)}`}
                          className="card-vault-link"
                          title="View this game in your library vault"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="card-add-btn"
                          onClick={() => handleOpenAddModal(game)}
                        >
                          <Plus size={15} strokeWidth={2.5} />
                          <span>+ Add to Library</span>
                        </button>
                        <button
                          type="button"
                          className="card-info-btn"
                          onClick={() => handleOpenDetails(game)}
                          title="View telemetry specifications and details"
                        >
                          <Info size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List / Table Mode */
          <div className="catalogue-list-card glass-liquid-card">
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="catalogue-list-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                    <th style={{ minWidth: '300px' }}>TITLE &amp; DEVELOPER</th>
                    <th style={{ minWidth: '160px' }}>GENRES</th>
                    <th style={{ minWidth: '160px' }}>PLATFORMS</th>
                    <th style={{ width: '90px' }}>SCORE</th>
                    <th style={{ width: '80px' }}>YEAR</th>
                    <th style={{ textAlign: 'right', minWidth: '180px' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game, idx) => (
                    <tr key={game.id}>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace', color: '#71717A', fontSize: '11px' }}>
                        {String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0')}
                      </td>
                      <td>
                        <div className="list-title-cell">
                          <img src={game.coverImage} alt={game.title} className="list-thumb" />
                          <div>
                            <h4 className="list-title-text" onClick={() => handleOpenDetails(game)}>
                              {game.title}
                            </h4>
                            <span className="list-sub-dev">{game.developer} • {game.publisher || 'Publisher'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(game.genres || []).map((g) => (
                            <span key={g} className="genre-micro-tag">
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(game.platforms || []).map((p) => (
                            <span key={p} className="platform-mini-badge">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent-primary)', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px' }}>
                          ★ {game.avgRating}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#71717A', fontSize: '12px' }}>
                        {game.releaseYear}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {game.isInLibrary ? (
                            <>
                              <button type="button" className="card-in-library-btn" style={{ height: '30px', padding: '0 10px', fontSize: '11px' }} disabled>
                                <CheckCircle2 size={13} />
                                <span>In Library</span>
                              </button>
                              <Link
                                to={`/library?search=${encodeURIComponent(game.title)}`}
                                className="card-vault-link"
                                style={{ width: '30px', height: '30px' }}
                                title="Open in Vault"
                              >
                                <ExternalLink size={14} />
                              </Link>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="card-add-btn"
                                style={{ height: '30px', padding: '0 12px', fontSize: '11.5px' }}
                                onClick={() => handleOpenAddModal(game)}
                              >
                                <Plus size={14} />
                                <span>Add</span>
                              </button>
                              <button
                                type="button"
                                className="card-info-btn"
                                style={{ width: '30px', height: '30px' }}
                                onClick={() => handleOpenDetails(game)}
                              >
                                <Info size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* 6. BOTTOM PAGINATION & FOOTER TELEMETRY                                 */}
      {/* ===================================================================== */}
      <section className="discover-pagination-bar glass-liquid-card">
        {/* Left: Node beacon */}
        <div className="telemetry-node-text">
          <span className="node-green-dot" />
          <span>Catalogue Node #401 Active</span>
          <span style={{ color: '#71717A' }}>•</span>
          <span style={{ color: '#FFFFFF' }}>{totalCount} titles matching</span>
          <span style={{ color: '#71717A' }}>•</span>
          <span style={{ color: 'var(--accent-primary)' }}>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Center: Pagination controls */}
        <div className="pagination-buttons">
          <button
            type="button"
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
            // Display first, last, and window around current page
            if (num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1)) {
              return (
                <button
                  key={num}
                  type="button"
                  className={`page-btn ${currentPage === num ? 'active' : ''}`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              );
            }
            if (num === currentPage - 2 || num === currentPage + 2) {
              return (
                <span key={num} style={{ color: '#71717A', fontFamily: 'monospace', padding: '0 4px' }}>
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            type="button"
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right: Items per page selector */}
        <div className="per-page-group">
          <span>Show:</span>
          <select
            className="per-page-select"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={8}>8 / page</option>
            <option value={16}>16 / page</option>
            <option value={24}>24 / page</option>
          </select>
          <span style={{ color: '#71717A', marginLeft: '8px' }}>CACHE: VALID</span>
        </div>
      </section>

      {/* Continuity Protocol Banner */}
      <div className="protocol-telemetry-banner">
        <div className="protocol-lead-side">
          <Shield size={14} color="var(--accent-primary)" />
          <span>VALENCE DECENTRALIZED PROTOCOL • REPOSITORY SHARD #03 • LATENCY 18ms</span>
        </div>
        <div className="protocol-links-side">
          <span>API SPECS</span>
          <span>SYNC STATUS</span>
          <span>REPORT CATALOGUE ERROR</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 7. GAME DETAILS MODAL (Telemetry Spec & Platform Picker)               */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Game Telemetry Specification"
        icon={Compass}
        footer={
          <div className="modal-footer-btns">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Close
            </button>
            <Link
              to={`/games/${selectedGameForModal?.id}`}
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setIsDetailsModalOpen(false)}
              title="View complete Game Details page"
            >
              <ExternalLink size={14} />
              <span>Full Dossier</span>
            </Link>
            {!selectedGameForModal?.isInLibrary ? (
              <button
                type="button"
                className="btn-primary-gold"
                disabled={isSelectedPlatformOwned}
                onClick={handleConfirmAdd}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add to My Library</span>
              </button>
            ) : (
              <Link
                to={`/library?search=${encodeURIComponent(selectedGameForModal?.title || '')}`}
                className="btn-primary-gold"
                style={{ textDecoration: 'none' }}
                onClick={() => setIsDetailsModalOpen(false)}
              >
                <CheckCircle2 size={15} />
                <span>Open in Library</span>
              </Link>
            )}
          </div>
        }
      >
        {selectedGameForModal && (
          <div className="game-details-modal-content">
            {/* Modal Cover Banner */}
            <div
              className="modal-hero-cover"
              style={{ backgroundImage: `url(${selectedGameForModal.coverImage})` }}
            >
              <div className="modal-cover-gradient" />
              <div className="modal-hero-badges">
                <div>
                  <h3 className="modal-game-heading">{selectedGameForModal.title}</h3>
                  <span className="modal-game-sub">
                    {selectedGameForModal.developer} • {selectedGameForModal.publisher || 'Publisher'} ({selectedGameForModal.releaseYear})
                  </span>
                </div>
                <div className="modal-rating-pill">
                  <Star size={13} fill="var(--accent-primary)" />
                  <span>{selectedGameForModal.avgRating} / 10</span>
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <p className="modal-overview-text">
              {selectedGameForModal.description ||
                'A masterfully crafted title in the global game catalogue. Featuring deep narrative design and high fidelity gameplay mechanics.'}
            </p>

            {/* Metadata Grid */}
            <div className="modal-spec-grid">
              <div className="spec-cell">
                <span className="spec-title">Genres</span>
                <span className="spec-val">{(selectedGameForModal.genres || []).join(', ')}</span>
              </div>
              <div className="spec-cell">
                <span className="spec-title">Supported Platforms</span>
                <span className="spec-val">{(selectedGameForModal.platforms || []).join(', ')}</span>
              </div>
              <div className="spec-cell">
                <span className="spec-title">Developer</span>
                <span className="spec-val">{selectedGameForModal.developer}</span>
              </div>
              <div className="spec-cell">
                <span className="spec-title">Release Year</span>
                <span className="spec-val">{selectedGameForModal.releaseYear}</span>
              </div>
            </div>

            {/* Add to Library Configuration Box */}
            <div className="modal-action-box">
              <h4 className="modal-box-title">
                <Plus size={16} color="var(--accent-primary)" />
                <span>INDEX INTO VAULT</span>
              </h4>

              {/* Duplicate or Owned Status Indicator */}
              {isSelectedPlatformOwned ? (
                <div className="duplicate-warning-banner">
                  <AlertCircle size={16} />
                  <span>
                    You already have <strong>{selectedGameForModal.title}</strong> in your library on{' '}
                    <strong>{addFormData.platform}</strong>. Select a different platform or view it in your vault.
                  </span>
                </div>
              ) : selectedGameForModal.isInLibrary ? (
                <div className="owned-badge-banner">
                  <CheckCircle2 size={16} />
                  <span>
                    You own this game on: <strong>{(selectedGameForModal.ownedPlatforms || []).join(', ')}</strong>. You can add another platform release below.
                  </span>
                </div>
              ) : null}

              {/* Platform Selector Radio Pills */}
              <div className="form-group-item">
                <label className="form-label-txt">Select Platform Release:</label>
                <div className="platform-radio-row">
                  {(selectedGameForModal.platforms || ['PC']).map((platform) => {
                    const isSelected = addFormData.platform === platform;
                    const isOwned = (selectedGameForModal.ownedPlatforms || []).includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        className={`platform-radio-pill ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setAddFormData({ ...addFormData, platform });
                          setAddFormError('');
                        }}
                      >
                        <Gamepad2 size={13} />
                        <span>{platform}</span>
                        {isOwned && <span style={{ fontSize: '10px', color: '#34D399', fontWeight: 600 }}>[Owned]</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Status Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group-item">
                  <label className="form-label-txt">Initial Status:</label>
                  <select
                    className="form-control-select"
                    value={addFormData.status}
                    onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="Playing">Playing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="form-group-item">
                  <label className="form-label-txt">Logged Playtime (Hours):</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="form-control-input"
                    value={addFormData.playtimeHours}
                    onChange={(e) => setAddFormData({ ...addFormData, playtimeHours: e.target.value })}
                  />
                </div>
              </div>

              {addFormError && (
                <div className="duplicate-warning-banner">
                  <AlertCircle size={16} />
                  <span>{addFormError}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ===================================================================== */}
      {/* 8. QUICK ADD PLATFORM SELECTION MODAL                                 */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Title to Library"
        icon={Plus}
        footer={
          <div className="modal-footer-btns">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary-gold"
              disabled={isSelectedPlatformOwned}
              onClick={handleConfirmAdd}
            >
              <CheckCircle2 size={15} />
              <span>Confirm &amp; Index</span>
            </button>
          </div>
        }
      >
        {selectedGameForModal && (
          <form onSubmit={handleConfirmAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img
                src={selectedGameForModal.coverImage}
                alt={selectedGameForModal.title}
                style={{ width: '64px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', color: '#FFFFFF', margin: 0 }}>
                  {selectedGameForModal.title}
                </h4>
                <p style={{ fontSize: '12px', color: '#71717A', margin: '4px 0 0' }}>
                  {selectedGameForModal.developer} • {selectedGameForModal.releaseYear}
                </p>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {(selectedGameForModal.genres || []).slice(0, 3).map((g) => (
                    <span key={g} className="genre-micro-tag">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {isSelectedPlatformOwned ? (
              <div className="duplicate-warning-banner">
                <AlertCircle size={16} />
                <span>
                  You already have <strong>{selectedGameForModal.title}</strong> in your library on{' '}
                  <strong>{addFormData.platform}</strong>. Choose a different platform release.
                </span>
              </div>
            ) : null}

            {/* Platform Selection */}
            <div className="form-group-item">
              <label className="form-label-txt">Select Platform Release:</label>
              <div className="platform-radio-row">
                {(selectedGameForModal.platforms || ['PC']).map((platform) => {
                  const isSelected = addFormData.platform === platform;
                  const isOwned = (selectedGameForModal.ownedPlatforms || []).includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      className={`platform-radio-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setAddFormData({ ...addFormData, platform });
                        setAddFormError('');
                      }}
                    >
                      <Gamepad2 size={13} />
                      <span>{platform}</span>
                      {isOwned && <span style={{ fontSize: '10px', color: '#34D399', fontWeight: 600 }}>[Owned]</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status & Playtime */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group-item">
                <label className="form-label-txt">Status:</label>
                <select
                  className="form-control-select"
                  value={addFormData.status}
                  onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                >
                  <option value="Backlog">Backlog</option>
                  <option value="Playing">Playing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group-item">
                <label className="form-label-txt">Hours Played:</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="form-control-input"
                  value={addFormData.playtimeHours}
                  onChange={(e) => setAddFormData({ ...addFormData, playtimeHours: e.target.value })}
                />
              </div>
            </div>

            {addFormError && (
              <div className="duplicate-warning-banner">
                <AlertCircle size={16} />
                <span>{addFormError}</span>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
