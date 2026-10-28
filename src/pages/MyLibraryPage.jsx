import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Table as TableIcon,
  LayoutGrid,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Clock,
  Play,
  RotateCcw,
  FileDown,
  Database,
  CheckCircle2,
  Hourglass,
  Layers,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

import { libraryService } from '../services/libraryService';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import './MyLibraryPage.css';

export default function MyLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Data & loading state
  const [library, setLibrary] = useState([]);
  const [catalogGames, setCatalogGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters, search & view controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [sortBy, setSortBy] = useState('lastPlayed_desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form states & validation errors
  const [formData, setFormData] = useState({
    gameId: '',
    platform: '',
    status: 'Backlog',
    playtimeHours: 0,
  });
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Load library data on mount
  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const records = await libraryService.getUserLibrary(1);
      const catalog = await libraryService.getAvailableCatalogGames(1);
      setLibrary(records);
      setCatalogGames(catalog);
    } catch (err) {
      console.error('Error fetching library records:', err);
      showToast(err.message || 'Failed to load library records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  // Update status filter if query param changes (e.g. from Dashboard stat cards)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (searchParams.get('add') === 'true') {
      handleOpenAddModal();
    }
  }, [searchParams]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // KPI Calculations
  const totalCount = library.length;
  const playingCount = library.filter((r) => r.status === 'Playing').length;
  const completedCount = library.filter((r) => r.status === 'Completed').length;
  const backlogCount = library.filter((r) => r.status === 'Backlog').length;
  const completionRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : '0.0';

  // Derive all unique platforms and genres for the filter dropdowns
  const availablePlatforms = useMemo(() => {
    const platforms = new Set();
    library.forEach((item) => {
      if (item.platform) platforms.add(item.platform);
    });
    return Array.from(platforms).sort();
  }, [library]);

  const availableGenres = useMemo(() => {
    const genres = new Set();
    library.forEach((item) => {
      if (item.genres) item.genres.forEach((g) => genres.add(g));
    });
    return Array.from(genres).sort();
  }, [library]);

  // Filter and sort library records
  const filteredRecords = useMemo(() => {
    return library
      .filter((record) => {
        // Search query (title or developer)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = (record.title || '').toLowerCase().includes(q);
          const matchesDev = (record.developer || '').toLowerCase().includes(q);
          const matchesGenre = (record.genres || []).some((g) => g.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDev && !matchesGenre) return false;
        }

        // Status filter
        if (statusFilter !== 'All' && record.status !== statusFilter) {
          return false;
        }

        // Platform filter
        if (platformFilter !== 'All' && record.platform !== platformFilter) {
          return false;
        }

        // Genre filter
        if (genreFilter !== 'All' && (!record.genres || !record.genres.includes(genreFilter))) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'title_asc':
            return a.title.localeCompare(b.title);
          case 'title_desc':
            return b.title.localeCompare(a.title);
          case 'playtime_desc':
            return b.playtimeHours - a.playtimeHours;
          case 'playtime_asc':
            return a.playtimeHours - b.playtimeHours;
          case 'rating_desc':
            return b.avgRating - a.avgRating;
          case 'progress_desc':
            return (b.progressPercent || 0) - (a.progressPercent || 0);
          case 'lastPlayed_desc':
          default:
            return new Date(b.lastPlayedDate || 0) - new Date(a.lastPlayedDate || 0);
        }
      });
  }, [library, searchQuery, statusFilter, platformFilter, genreFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  // Reset to page 1 if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, platformFilter, genreFilter, sortBy, itemsPerPage]);

  // Quick Playtime update (+1h)
  const handleQuickAddHour = async (e, record) => {
    e.stopPropagation();
    try {
      const updated = await libraryService.updatePlaytimeHours(
        1,
        record.id,
        record.playtimeHours + 1.0
      );
      setLibrary((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast(`Updated playtime for "${record.title}" (+1.0 hr recorded)`);
    } catch (err) {
      showToast(err.message || 'Failed to update playtime');
    }
  };

  // Add Game Modal open
  const handleOpenAddModal = () => {
    const unownedCatalog = catalogGames.filter(
      (g) => !library.some((libItem) => libItem.gameId === g.id)
    );
    const initialGame = unownedCatalog[0] || catalogGames[0];
    setFormData({
      gameId: initialGame ? initialGame.id : '',
      platform: initialGame && initialGame.platforms ? initialGame.platforms[0] : 'PC',
      status: 'Backlog',
      playtimeHours: 0,
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Add Game Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.gameId) {
      setFormError('Please select a game from the catalog.');
      return;
    }
    if (parseFloat(formData.playtimeHours) < 0) {
      setFormError('Playtime hours cannot be negative.');
      return;
    }

    try {
      const newRecord = await libraryService.addLibraryEntry(1, {
        gameId: parseInt(formData.gameId, 10),
        platform: formData.platform,
        status: formData.status,
        playtimeHours: parseFloat(formData.playtimeHours) || 0,
      });
      setLibrary((prev) => [newRecord, ...prev]);
      setIsAddModalOpen(false);
      showToast(`Successfully added "${newRecord.title}" to your library.`);
    } catch (err) {
      setFormError(err.message || 'Failed to add game entry');
    }
  };

  // Edit Modal open
  const handleOpenEditModal = (e, record) => {
    e.stopPropagation();
    setSelectedRecord(record);
    setFormData({
      gameId: record.gameId,
      platform: record.platform,
      status: record.status,
      playtimeHours: record.playtimeHours,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.playtimeHours) < 0) {
      setFormError('Playtime hours cannot be negative.');
      return;
    }

    try {
      const updated = await libraryService.updateLibraryEntry(1, selectedRecord, {
        platform: formData.platform,
        status: formData.status,
        playtimeHours: parseFloat(formData.playtimeHours) || 0,
      });
      setLibrary((prev) => prev.map((item) => (item.id === selectedRecord.id ? updated : item)));
      setIsEditModalOpen(false);
      showToast(`Updated "${updated.title}" successfully.`);
    } catch (err) {
      setFormError(err.message || 'Failed to update record');
    }
  };

  // Delete Confirm open
  const handleOpenDeleteConfirm = (e, record) => {
    e.stopPropagation();
    setSelectedRecord(record);
    setIsDeleteConfirmOpen(true);
  };

  // Delete Confirm execute
  const handleDeleteConfirm = async () => {
    try {
      await libraryService.removeLibraryEntry(1, selectedRecord);
      setLibrary((prev) => prev.filter((item) => item.id !== selectedRecord.id));
      setIsDeleteConfirmOpen(false);
      showToast(`Removed "${selectedRecord.title}" from your library.`);
      setSelectedRecord(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete record');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setPlatformFilter('All');
    setGenreFilter('All');
    setSortBy('lastPlayed_desc');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (library.length === 0) {
      showToast('No library records to export.');
      return;
    }
    const headers = ['Title', 'Developer', 'Platform', 'Status', 'PlaytimeHours', 'LastPlayedDate', 'Rating'];
    const rows = library.map((r) => [
      `"${r.title}"`,
      `"${r.developer}"`,
      `"${r.platform}"`,
      `"${r.status}"`,
      r.playtimeHours,
      `"${r.lastPlayedDate}"`,
      r.avgRating,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'vault_library_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Library exported to vault_library_export.csv');
  };

  return (
    <div className="my-library-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="library-toast">
          <Sparkles size={16} color="var(--accent-primary)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 1: HEADER & BREADCRUMB TELEMETRY                              */}
      {/* ===================================================================== */}
      <section className="library-header-section">
        <div className="library-title-group">
          <div className="telemetry-eyebrow">
            <span className="live-dot" />
            <span className="eyebrow-text">VAULT TELEMETRY</span>
            <span className="eyebrow-sep">/</span>
            <span className="eyebrow-sub">PERSONAL ARCHIVE</span>
          </div>

          <h1 className="library-display-title">MY LIBRARY</h1>

          <p className="library-subtext">
            Direct entitlement management, cloud telemetry synchronization, and backlog dispatch across{' '}
            <span className="highlight-count">{totalCount} catalogued software titles</span>.
          </p>
        </div>

        {/* View Mode & Actions */}
        <div className="library-header-actions">
          {/* Segmented View Mode Toggle */}
          <div className="view-mode-pill">
            <button
              type="button"
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={14} />
              <span>Grid</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            className="hud-action-btn export-btn"
            onClick={handleExportCSV}
            title="Export library records to CSV"
          >
            <FileDown size={14} />
            <span>Export CSV</span>
          </button>

          {/* Add Game Primary Button */}
          <button
            type="button"
            className="primary-gold-btn"
            onClick={handleOpenAddModal}
            title="Catalog a new game into your personal library"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Game</span>
          </button>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 2: KPI SUMMARY STRIP (Continuous Sleek Glass Band)             */}
      {/* ===================================================================== */}
      <section className="kpi-summary-strip glass-liquid-card">
        {/* KPI 1: Total Catalogued */}
        <div
          className={`kpi-segment ${statusFilter === 'All' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('All')}
          title="Filter all titles"
        >
          <div className="kpi-top-row">
            <span className="kpi-label">TOTAL CATALOGUED</span>
            <Gamepad2 size={16} className="text-gold" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{totalCount}</span>
            <span className="kpi-trend text-completed font-mono">+4 this mo</span>
          </div>
          <p className="kpi-subtext">Physical &amp; Digital • 94% Ready</p>
        </div>

        {/* KPI 2: Active Rotations */}
        <div
          className={`kpi-segment ${statusFilter === 'Playing' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('Playing')}
          title="Filter currently playing titles"
        >
          <div className="kpi-top-row">
            <span className="kpi-label text-gold">ACTIVE ROTATIONS</span>
            <Clock size={16} className="text-gold" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number text-gold">{playingCount < 10 ? `0${playingCount}` : playingCount}</span>
            <span className="kpi-trend text-muted font-mono">games ongoing</span>
          </div>
          <p className="kpi-subtext">Session Average 2.4 hrs/day</p>
        </div>

        {/* KPI 3: Mastery Completed */}
        <div
          className={`kpi-segment ${statusFilter === 'Completed' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('Completed')}
          title="Filter completed titles"
        >
          <div className="kpi-top-row">
            <span className="kpi-label text-completed">MASTERY COMPLETED</span>
            <CheckCircle2 size={16} className="text-completed" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{completedCount}</span>
            <span className="kpi-trend text-completed font-mono">{completionRate}% rate</span>
          </div>
          <p className="kpi-subtext">Perfect 100% Run {Math.max(1, Math.floor(completedCount / 2))} Titles</p>
        </div>

        {/* KPI 4: Unplayed Backlog */}
        <div
          className={`kpi-segment ${statusFilter === 'Backlog' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('Backlog')}
          title="Filter unplayed backlog titles"
        >
          <div className="kpi-top-row">
            <span className="kpi-label">UNPLAYED BACKLOG</span>
            <Hourglass size={16} className="text-muted" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number text-muted">{backlogCount}</span>
            <span className="kpi-trend text-muted font-mono">-6 Q1 burn</span>
          </div>
          <p className="kpi-subtext">Est. Clearance Time ~{backlogCount * 25} hrs</p>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 3: SEARCH & FILTER TOOLBAR                                    */}
      {/* ===================================================================== */}
      <section className="library-toolbar glass-liquid-card">
        {/* Row 1: Search input + Status Pills + Sort select */}
        <div className="toolbar-primary-row">
          {/* Real-time Search Box */}
          <div className="toolbar-search-box">
            <Search size={16} color="#71717A" />
            <input
              type="text"
              placeholder="Search catalogue by title, developer, or tags..."
              className="toolbar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-kbd-hint font-mono">⌘F</span>
          </div>

          {/* Status Filter Pills */}
          <div className="status-filter-pills">
            <button
              type="button"
              className={`status-pill ${statusFilter === 'All' ? 'active' : ''}`}
              onClick={() => setStatusFilter('All')}
            >
              <span>All Titles</span>
              <span className="pill-count">{totalCount}</span>
            </button>

            <button
              type="button"
              className={`status-pill ${statusFilter === 'Playing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Playing')}
            >
              <span className="status-dot-pulse bg-gold" />
              <span>Playing</span>
              <span className="pill-count">{playingCount}</span>
            </button>

            <button
              type="button"
              className={`status-pill ${statusFilter === 'Completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Completed')}
            >
              <span className="status-dot bg-completed" />
              <span>Completed</span>
              <span className="pill-count">{completedCount}</span>
            </button>

            <button
              type="button"
              className={`status-pill ${statusFilter === 'Backlog' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Backlog')}
            >
              <span className="status-dot bg-muted" />
              <span>Backlog</span>
              <span className="pill-count">{backlogCount}</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="sort-select-wrapper">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="lastPlayed_desc">Sort: Last Played (Desc)</option>
              <option value="playtime_desc">Sort: Playtime (Highest)</option>
              <option value="playtime_asc">Sort: Playtime (Lowest)</option>
              <option value="title_asc">Sort: Title (A → Z)</option>
              <option value="title_desc">Sort: Title (Z → A)</option>
              <option value="progress_desc">Sort: Completion % (Desc)</option>
              <option value="rating_desc">Sort: Rating (Highest)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Platform and Hardware filter chips */}
        <div className="toolbar-secondary-row">
          <div className="platform-chips-group">
            <span className="filter-prefix-label font-mono">
              <Filter size={12} />
              <span>PLATFORM:</span>
            </span>

            <button
              type="button"
              className={`platform-chip ${platformFilter === 'All' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('All')}
            >
              All Platforms
            </button>

            {availablePlatforms.map((plat) => {
              const count = library.filter((r) => r.platform === plat).length;
              return (
                <button
                  key={plat}
                  type="button"
                  className={`platform-chip ${platformFilter === plat ? 'active' : ''}`}
                  onClick={() => setPlatformFilter(plat)}
                >
                  <Gamepad2 size={13} className="text-gold" />
                  <span>{plat}</span>
                  <span className="chip-count font-mono">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Genre & Reset Controls */}
          <div className="secondary-right-controls">
            {availableGenres.length > 0 && (
              <div className="genre-select-wrapper">
                <select
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  className="genre-select"
                >
                  <option value="All">All Genres</option>
                  {availableGenres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(searchQuery || statusFilter !== 'All' || platformFilter !== 'All' || genreFilter !== 'All') && (
              <button
                type="button"
                className="reset-filters-btn"
                onClick={handleResetFilters}
                title="Clear all active search and filter constraints"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* SECTION 4: MASTER CATALOGUE DISPLAY (Table vs Grid View)              */}
      {/* ===================================================================== */}
      {filteredRecords.length > 0 ? (
        viewMode === 'table' ? (
          /* TABLE VIEW MODE */
          <section className="master-catalogue-table-card glass-liquid-card">
            <div className="table-responsive-wrapper">
              <table className="master-library-table">
                <thead>
                  <tr className="table-header-row font-mono">
                    <th className="th-col th-idx">#</th>
                    <th className="th-col th-title">Game Title &amp; Software Index</th>
                    <th className="th-col th-platform">Platform</th>
                    <th className="th-col th-status">Status</th>
                    <th className="th-col th-playtime">Playtime &amp; Progress</th>
                    <th className="th-col th-lastsession">Last Session</th>
                    <th className="th-col th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {paginatedRecords.map((record, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    const formattedIdx = rowNumber < 10 ? `0${rowNumber}` : `${rowNumber}`;

                    return (
                      <tr key={record.id} className="table-record-row">
                        {/* Index */}
                        <td className="td-col td-idx font-mono">{formattedIdx}</td>

                        {/* Title & Cover Image */}
                        <td className="td-col td-title">
                          <div className="game-title-cell">
                            <div className="table-thumb-box">
                              {record.coverImage ? (
                                <img
                                  src={record.coverImage}
                                  alt={record.title}
                                  className="table-thumb-img"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="table-thumb-fallback">
                                  <Gamepad2 size={20} className="text-gold" />
                                </div>
                              )}
                            </div>
                            <div className="game-meta-col">
                              <Link
                                to={`/games/${record.gameId}`}
                                className="game-title-link"
                                title="View Game Details"
                              >
                                {record.title}
                              </Link>
                              <span className="game-dev-year">
                                {record.developer} ({record.releaseYear})
                              </span>
                              <div className="genre-tags-list">
                                {record.genres?.slice(0, 2).map((g) => (
                                  <span key={g} className="genre-micro-tag font-mono">
                                    {g}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Platform Badge */}
                        <td className="td-col td-platform">
                          <div className="table-platform-pill font-mono">
                            <Gamepad2 size={13} className="text-gold" />
                            <span>{record.platform}</span>
                            <span className="cloud-synced-dot" title="Cloud Synced" />
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="td-col td-status">
                          <StatusBadge status={record.status} />
                        </td>

                        {/* Playtime & Progress Bar */}
                        <td className="td-col td-playtime">
                          <div className="table-playtime-wrapper">
                            <div className="playtime-numbers font-mono">
                              <span className="hours-val">{record.playtimeHours}h</span>
                              <span className={`percent-val ${record.status === 'Completed' ? 'text-completed' : 'text-gold'}`}>
                                {record.progressPercent || 0}%
                              </span>
                            </div>
                            <div className="table-progress-track">
                              <div
                                className={`table-progress-fill ${record.status === 'Completed' ? 'fill-completed' : 'fill-gold'}`}
                                style={{ width: `${record.progressPercent || 0}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Last Session */}
                        <td className="td-col td-lastsession font-mono">
                          {record.lastPlayedDate || 'Never'}
                        </td>

                        {/* Actions */}
                        <td className="td-col td-actions">
                          <div className="table-actions-cell">
                            <Link
                              to={`/games/${record.gameId}`}
                              className="table-resume-btn"
                              title="Inspect Game Details"
                            >
                              Resume
                            </Link>

                            <button
                              type="button"
                              className="quick-add-btn"
                              onClick={(e) => handleQuickAddHour(e, record)}
                              title="Log 1 additional hour (+1.0h)"
                            >
                              +1h
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={(e) => handleOpenEditModal(e, record)}
                              title="Edit Record"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              className="icon-action-btn delete-btn"
                              onClick={(e) => handleOpenDeleteConfirm(e, record)}
                              title="Remove from Library"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Telemetry Status & Pagination */}
            <div className="table-footer-bar">
              <div className="footer-telemetry-status font-mono">
                <span className="node-indicator">
                  <span className="live-dot" />
                  <span>DAO Sync Node #892 Active</span>
                </span>
                <span>•</span>
                <span>{filteredRecords.length} titles indexed</span>
                <span>•</span>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`page-num-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Per Page Selector */}
              <div className="per-page-selector font-mono">
                <span>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
                  className="per-page-select"
                >
                  <option value={6}>6 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                </select>
              </div>
            </div>
          </section>
        ) : (
          /* GRID VIEW MODE */
          <div className="library-grid-container">
            <div className="library-cards-grid">
              {paginatedRecords.map((record) => (
                <div key={record.id} className="library-grid-card glass-liquid-card">
                  {/* Card Cover Header */}
                  <div className="grid-cover-box">
                    {record.coverImage ? (
                      <img
                        src={record.coverImage}
                        alt={record.title}
                        className="grid-cover-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid-cover-fallback">
                        <Gamepad2 size={40} className="text-gold" />
                      </div>
                    )}
                    <div className="grid-cover-gradient" />

                    <div className="grid-top-badges">
                      <span className="grid-platform-badge font-mono">{record.platform}</span>
                      <StatusBadge status={record.status} />
                    </div>

                    <div className="grid-bottom-caption">
                      <span className="grid-genre-tag font-mono">
                        {record.genres?.[0] || 'Software'}
                      </span>
                      <h3 className="grid-game-title">{record.title}</h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="grid-card-body">
                    <div className="grid-meta-row font-mono">
                      <span className="grid-hours">
                        <Clock size={12} className="text-muted" />
                        <span>{record.playtimeHours}h logged</span>
                      </span>
                      <span className="grid-last-played">
                        {record.lastPlayedDate || 'Never'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="grid-progress-wrapper">
                      <div className="grid-progress-labels">
                        <span className="progress-subgoal">{record.subGoal || 'Campaign Progress'}</span>
                        <span className={`progress-percent font-mono ${record.status === 'Completed' ? 'text-completed' : 'text-gold'}`}>
                          {record.progressPercent || 0}%
                        </span>
                      </div>
                      <div className="table-progress-track">
                        <div
                          className={`table-progress-fill ${record.status === 'Completed' ? 'fill-completed' : 'fill-gold'}`}
                          style={{ width: `${record.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="grid-actions-row">
                      <Link
                        to={`/games/${record.gameId}`}
                        className="grid-launch-btn"
                        title="View Details"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Resume</span>
                      </Link>

                      <button
                        type="button"
                        className="quick-add-btn"
                        onClick={(e) => handleQuickAddHour(e, record)}
                        title="Log 1 additional hour (+1.0h)"
                      >
                        +1h
                      </button>

                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={(e) => handleOpenEditModal(e, record)}
                        title="Edit Record"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        className="icon-action-btn delete-btn"
                        onClick={(e) => handleOpenDeleteConfirm(e, record)}
                        title="Remove from Library"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Pagination Footer */}
            <div className="grid-footer-bar glass-liquid-card">
              <div className="footer-telemetry-status font-mono">
                <span>{filteredRecords.length} titles indexed</span>
                <span>•</span>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`page-num-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* EMPTY RESULTS STATE */
        <EmptyState
          title={searchQuery || statusFilter !== 'All' || platformFilter !== 'All' ? 'No Games Match Filters' : 'Your Library is Empty'}
          description={
            searchQuery || statusFilter !== 'All' || platformFilter !== 'All'
              ? 'Try clearing search terms or selecting different status/platform chips.'
              : 'Start cataloguing games you own, play, or plan to complete.'
          }
          icon={Gamepad2}
          actionLabel={searchQuery || statusFilter !== 'All' || platformFilter !== 'All' ? 'Clear All Filters' : 'Catalog a Game'}
          onAction={searchQuery || statusFilter !== 'All' || platformFilter !== 'All' ? handleResetFilters : handleOpenAddModal}
        />
      )}

      {/* ===================================================================== */}
      {/* SECTION 5: TELEMETRY PROTOCOL BANNER                                  */}
      {/* ===================================================================== */}
      <section className="telemetry-protocol-banner glass-liquid-card">
        <div className="protocol-info-col">
          <div className="protocol-icon-box">
            <Database size={20} className="text-gold" />
          </div>
          <div className="protocol-text-group">
            <div className="protocol-title-row">
              <span className="protocol-title">Custom Backlog Queues &amp; Steam Metadata Sync</span>
              <span className="protocol-pill font-mono">REAL-TIME HOOK</span>
            </div>
            <p className="protocol-desc">
              External manifest connectors synchronize DLC entitlements, save game checkpoints, and trophy telemetry automatically.
            </p>
          </div>
        </div>

        <div className="protocol-actions">
          <button
            type="button"
            className="hud-action-btn"
            onClick={handleExportCSV}
          >
            Vault Log History
          </button>
          <button
            type="button"
            className="primary-gold-btn"
            onClick={handleOpenAddModal}
          >
            Manage Library
          </button>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD GAME MODAL                                               */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Game to Library"
      >
        <form onSubmit={handleAddSubmit} className="library-modal-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Game Title</label>
            <select
              className="form-control"
              value={formData.gameId}
              onChange={(e) => {
                const selectedId = parseInt(e.target.value, 10);
                const g = catalogGames.find((item) => item.id === selectedId);
                setFormData({
                  ...formData,
                  gameId: e.target.value,
                  platform: g && g.platforms ? g.platforms[0] : 'PC',
                });
              }}
              required
            >
              {catalogGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.title} ({game.developer})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Platform</label>
            <select
              className="form-control"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              required
            >
              <option value="Steam / PC">Steam / PC</option>
              <option value="PC">PC</option>
              <option value="PlayStation 5">PlayStation 5</option>
              <option value="PlayStation 4">PlayStation 4</option>
              <option value="Xbox Series X">Xbox Series X</option>
              <option value="Xbox Cloud">Xbox Cloud</option>
              <option value="Nintendo Switch">Nintendo Switch</option>
              <option value="GOG Galaxy">GOG Galaxy</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Backlog">Backlog</option>
              <option value="Playing">Playing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Playtime (Hours)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="form-control"
              value={formData.playtimeHours}
              onChange={(e) => setFormData({ ...formData, playtimeHours: e.target.value })}
              placeholder="0.0"
              required
            />
          </div>

          <div className="modal-actions-bar">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="primary-gold-btn">
              Add to Library
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT GAME RECORD MODAL                                       */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Record: ${selectedRecord?.title || ''}`}
      >
        <form onSubmit={handleEditSubmit} className="library-modal-form">
          {formError && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Platform</label>
            <select
              className="form-control"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              required
            >
              <option value="Steam / PC">Steam / PC</option>
              <option value="PC">PC</option>
              <option value="PlayStation 5">PlayStation 5</option>
              <option value="PlayStation 4">PlayStation 4</option>
              <option value="Xbox Series X">Xbox Series X</option>
              <option value="Xbox Cloud">Xbox Cloud</option>
              <option value="Nintendo Switch">Nintendo Switch</option>
              <option value="GOG Galaxy">GOG Galaxy</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Backlog">Backlog</option>
              <option value="Playing">Playing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Playtime (Hours)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="form-control"
              value={formData.playtimeHours}
              onChange={(e) => setFormData({ ...formData, playtimeHours: e.target.value })}
              required
            />
          </div>

          <div className="modal-actions-bar">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="primary-gold-btn">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION DIALOG                                   */}
      {/* ===================================================================== */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove from Library?"
        message={`Are you sure you want to remove "${selectedRecord?.title}" from your library? Your tracked playtime and progress will be deleted from your active archive.`}
        confirmLabel="Remove Title"
        cancelLabel="Keep Game"
        variant="danger"
      />
    </div>
  );
}
