import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  ArrowLeft,
  CheckCircle2,
  User,
  ShieldCheck,
  Sliders,
  Cloud,
  RefreshCw,
  Clock,
  Radio,
  RotateCcw,
  Save,
  HardDrive,
  Zap,
  Trash2,
  Lock,
  Compass,
  Gamepad2,
  LayoutDashboard,
  Trophy,
  Users,
  Star,
  Info,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { settingsService, DEFAULT_SETTINGS } from '../services/settingsService';
import './SettingsPage.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  const [toast, setToast] = useState({ show: false, message: '', savePath: '' });
  const [integrityState, setIntegrityState] = useState('idle'); // 'idle' | 'verifying' | 'verified'
  const [isPurging, setIsPurging] = useState(false);

  // Load initial settings on mount
  useEffect(() => {
    const loaded = settingsService.getSettings();
    setSettings(loaded);
    setFormData(loaded);
  }, []);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Handlers for form changes
  const handleProfileChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }));
  };

  const handleDisplayChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      display: {
        ...prev.display,
        [field]: value,
      },
    }));
  };

  const handleSyncChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      sync: {
        ...prev.sync,
        [field]: value,
      },
    }));
  };

  // Save profile dossier
  const handleUpdateDossier = (e) => {
    e.preventDefault();
    const result = settingsService.saveSettings({ profile: formData.profile });
    if (result.success) {
      setSettings(result.settings);
      setFormData(result.settings);
      setToast({
        show: true,
        message: 'Curator profile dossier successfully validated and stored to local cache.',
        savePath: 'SAVE_PATH: ~/.valence/user_dossier.meta (localStorage)',
      });
    }
  };

  // Save all settings
  const handleSaveAll = () => {
    const result = settingsService.saveSettings(formData);
    if (result.success) {
      setSettings(result.settings);
      setFormData(result.settings);
      setToast({
        show: true,
        message: 'Curator preferences successfully validated and stored to local indexed archive storage.',
        savePath: result.savePath,
      });
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    setFormData(settings);
    setToast({
      show: true,
      message: 'Unsaved modifications discarded. Restored last synchronized cache state.',
      savePath: 'STATUS: Restored from cache',
    });
  };

  // Reset to factory defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset all archive settings and preferences to default values?')) {
      const result = settingsService.resetToDefaults();
      if (result.success) {
        setSettings(result.settings);
        setFormData(result.settings);
        setToast({
          show: true,
          message: 'All system preferences restored to baseline factory defaults.',
          savePath: result.savePath,
        });
      }
    }
  };

  // Integrity verification simulation
  const handleVerifyIntegrity = async () => {
    setIntegrityState('verifying');
    await settingsService.verifyIntegrity();
    setIntegrityState('verified');
    setTimeout(() => {
      setIntegrityState('idle');
    }, 3000);
  };

  // Cache purge handler
  const handlePurgeCache = () => {
    if (
      window.confirm(
        'Purge temporary thumbnail and telemetry cache? Archive titles and curator configurations will not be deleted.'
      )
    ) {
      setIsPurging(true);
      const res = settingsService.purgeTemporaryCache();
      if (res.success) {
        setSettings(res.settings);
        setFormData(res.settings);
        setToast({
          show: true,
          message: `Temporary cache purged (${res.reclaimedMB} MB reclaimed). Vault manifest remains intact.`,
          savePath: 'STORAGE: Reclaimed local space',
        });
      }
      setIsPurging(false);
    }
  };

  const { profile, display, sync, storage } = formData;
  const storagePercentage = Math.round(
    ((storage.footprintSizeMB || 48.2) / (storage.totalStorageMB || 1024)) * 100
  );

  return (
    <div className="settings-page-wrapper">
      {/* ------------------------------------------------------------------- */}
      {/* Breadcrumbs & Navigation Header                                     */}
      {/* ------------------------------------------------------------------- */}
      <div className="settings-breadcrumbs-bar">
        <div className="settings-breadcrumbs-left">
          <Terminal size={14} className="settings-breadcrumb-icon" />
          <span>VAULT TELEMETRY</span>
          <span className="settings-breadcrumb-sep">/</span>
          <span className="settings-breadcrumb-active">PREFERENCES &amp; SYSTEM CONFIGURATION</span>
        </div>

        <Link to="/" className="settings-return-link" title="Return to Dashboard Overview">
          <ArrowLeft size={16} />
          <span>Return to Overview</span>
        </Link>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Hero Header Banner                                                  */}
      {/* ------------------------------------------------------------------- */}
      <header className="settings-hero-header">
        <div className="settings-title-group">
          <h1>SETTINGS</h1>
          <p>
            Manage archive preferences, display protocols, and verified curator identity parameters.
          </p>
        </div>

        <div className="settings-status-badge">
          <span className="settings-status-dot" />
          <span>Status: Local Cache Synchronized</span>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* Toast Notification Strip                                            */}
      {/* ------------------------------------------------------------------- */}
      {toast.show && (
        <div className="settings-toast-banner" role="alert">
          <div className="settings-toast-content">
            <CheckCircle2 size={18} color="#F4BF4E" />
            <span>{toast.message}</span>
          </div>
          <span className="settings-toast-path">{toast.savePath}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2-Column Grid Matrix Layout                                         */}
      {/* ------------------------------------------------------------------- */}
      <div className="settings-grid-layout">
        {/* ================================================================= */}
        {/* LEFT COLUMN: Identity, Display, Sync (8 Columns)                 */}
        {/* ================================================================= */}
        <div className="settings-column-left">
          {/* PANEL 1: Profile & Identity Dossier */}
          <section className="settings-panel">
            <div className="settings-panel-glow" />
            <div className="settings-panel-header">
              <div className="settings-panel-title-wrap">
                <User size={18} className="settings-panel-title-icon" />
                <h2>Curator Identity &amp; Dossier</h2>
              </div>
              <span className="settings-panel-tag gold">{profile.curatorId}</span>
            </div>

            {/* Presentation Strip */}
            <div className="curator-strip">
              <div className="curator-avatar-box">
                <div className="curator-avatar-inner">
                  <img
                    src={profile.avatar}
                    alt={profile.displayName}
                    className="curator-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="curator-avatar-initials" style={{ display: 'none' }}>
                    {profile.displayName ? profile.displayName.charAt(0) : 'A'}
                  </div>
                </div>
                <div className="curator-verified-dot" title="Verified Curator">
                  <ShieldCheck size={11} />
                </div>
              </div>

              <div className="curator-meta-col">
                <div className="curator-meta-row">
                  <h3>{profile.displayName}</h3>
                  <span className="curator-role-badge">{profile.role}</span>
                  <span className="curator-lvl-badge">LVL {profile.level}</span>
                </div>
                <p className="curator-meta-desc">
                  Verified Archive Member since {profile.memberSince} • {profile.nodeId}
                </p>
              </div>

              <div className="curator-audit-stat">
                <span className="curator-audit-label">Audit Rating</span>
                <span className="curator-audit-value">{profile.auditRating}</span>
              </div>
            </div>

            {/* Profile Form */}
            <form className="settings-form" onSubmit={handleUpdateDossier}>
              <div className="settings-form-row">
                <div className="settings-form-field">
                  <label className="settings-form-label" htmlFor="curator-alias-input">
                    Curator Display Alias <span className="req">*</span>
                  </label>
                  <input
                    id="curator-alias-input"
                    type="text"
                    className="settings-input"
                    required
                    value={profile.displayName}
                    onChange={(e) => handleProfileChange('displayName', e.target.value)}
                  />
                  <span className="settings-field-hint">
                    Visible across peer comparisons and friend leaderboards.
                  </span>
                </div>

                <div className="settings-form-field">
                  <label className="settings-form-label" htmlFor="curator-designation-input">
                    Curator Designation Tag
                  </label>
                  <input
                    id="curator-designation-input"
                    type="text"
                    className="settings-input"
                    value={profile.designation}
                    onChange={(e) => handleProfileChange('designation', e.target.value)}
                  />
                  <span className="settings-field-hint">
                    Displays on published review manifests and telemetry feeds.
                  </span>
                </div>
              </div>

              <div className="settings-form-field">
                <label className="settings-form-label" htmlFor="curator-bio-textarea">
                  Archival Bio &amp; Manifesto
                </label>
                <textarea
                  id="curator-bio-textarea"
                  className="settings-textarea"
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                />
              </div>

              <div className="settings-form-footer">
                <span className="settings-footer-info">
                  <Info size={14} />
                  <span>Backed by local profile manifest (~/.valence/user_dossier.meta)</span>
                </span>

                <button type="submit" className="btn-glass-secondary">
                  <Save size={15} color="#F4BF4E" />
                  <span>Update Dossier</span>
                </button>
              </div>
            </form>
          </section>

          {/* PANEL 2: Library & Catalog Display Protocols */}
          <section className="settings-panel">
            <div className="settings-panel-header">
              <div className="settings-panel-title-wrap">
                <Sliders size={18} className="settings-panel-title-icon" />
                <h2>Library &amp; Catalog Display Protocols</h2>
              </div>
              <span className="settings-panel-tag">RENDER ENGINE: 60FPS UI</span>
            </div>

            <div className="settings-select-grid">
              {/* Startup View */}
              <div className="settings-form-field">
                <label className="settings-form-label" htmlFor="startup-view-select">
                  Default Startup View
                </label>
                <div className="settings-select-wrap">
                  <select
                    id="startup-view-select"
                    className="settings-select"
                    value={display.defaultStartupView}
                    onChange={(e) => handleDisplayChange('defaultStartupView', e.target.value)}
                  >
                    <option value="overview">Overview / Dashboard</option>
                    <option value="library">My Library (Detailed)</option>
                    <option value="discover">Discover Catalogue</option>
                    <option value="achievements">Mastery &amp; Achievements</option>
                  </select>
                  <ChevronDown size={16} className="settings-select-chevron" />
                </div>
              </div>

              {/* Sort Priority */}
              <div className="settings-form-field">
                <label className="settings-form-label" htmlFor="sort-priority-select">
                  Catalogue Sort Priority
                </label>
                <div className="settings-select-wrap">
                  <select
                    id="sort-priority-select"
                    className="settings-select"
                    value={display.catalogueSortPriority}
                    onChange={(e) => handleDisplayChange('catalogueSortPriority', e.target.value)}
                  >
                    <option value="playtime">Highest Playtime Hours</option>
                    <option value="recent">Recently Launched</option>
                    <option value="mastery">Mastery % Completion</option>
                    <option value="score">Curator Score (1-10)</option>
                    <option value="alpha">Alphabetical (A-Z)</option>
                  </select>
                  <ChevronDown size={16} className="settings-select-chevron" />
                </div>
              </div>

              {/* Metric Scale */}
              <div className="settings-form-field">
                <label className="settings-form-label" htmlFor="metric-scale-select">
                  Curator Metric Scale
                </label>
                <div className="settings-select-wrap">
                  <select
                    id="metric-scale-select"
                    className="settings-select"
                    value={display.curatorMetricScale}
                    onChange={(e) => handleDisplayChange('curatorMetricScale', e.target.value)}
                  >
                    <option value="10">1-10 Standard Decimal (e.g. 9.4)</option>
                    <option value="100">0-100 Percentage Gauge</option>
                    <option value="tier">S/A/B/C/D Tier Hierarchy</option>
                  </select>
                  <ChevronDown size={16} className="settings-select-chevron" />
                </div>
              </div>
            </div>

            {/* Display Toggles */}
            <div className="settings-toggles-list">
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <Gamepad2 size={18} className="settings-toggle-icon" />
                  <div>
                    <span className="settings-toggle-title">Compact High-Density Table Layout</span>
                    <span className="settings-toggle-desc">
                      Condenses table rows to 48px with numeric telemetry metrics for high-resolution displays.
                    </span>
                  </div>
                </div>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="toggle-compact-table"
                    checked={display.compactTableLayout}
                    onChange={(e) => handleDisplayChange('compactTableLayout', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <Sparkles size={18} className="settings-toggle-icon" />
                  <div>
                    <span className="settings-toggle-title">Dynamic Specular Edge Lighting</span>
                    <span className="settings-toggle-desc">
                      Renders hardware-accelerated refractive glass edge highlights and background substrate blur.
                    </span>
                  </div>
                </div>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="toggle-specular-lighting"
                    checked={display.specularEdgeLighting}
                    onChange={(e) => handleDisplayChange('specularEdgeLighting', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </section>

          {/* PANEL 3: Sync & Telemetry Protocols */}
          <section className="settings-panel">
            <div className="settings-panel-header">
              <div className="settings-panel-title-wrap">
                <RefreshCw size={18} className="settings-panel-title-icon" />
                <h2>Sync &amp; Telemetry Protocols</h2>
              </div>
              <span className="settings-panel-tag green">
                <span className="tiny-dot" />
                <span>ACTIVE PROTOCOL</span>
              </span>
            </div>

            <div className="sync-cards-list">
              {/* Steam Sync */}
              <div className="sync-card">
                <div className="sync-card-left">
                  <div className="sync-icon-avatar">
                    <Cloud size={18} />
                  </div>
                  <div>
                    <div className="sync-card-headline">
                      <span className="sync-card-title">Steam Platform Gateway Sync</span>
                      <span className="sync-card-pill">AUTOMATED</span>
                    </div>
                    <span className="sync-card-desc">
                      Continuously polls public achievements and session hours. Last verified handshake: 12 minutes ago.
                    </span>
                  </div>
                </div>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="toggle-steam-sync"
                    checked={sync.steamGatewaySync}
                    onChange={(e) => handleSyncChange('steamGatewaySync', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Session Logging */}
              <div className="sync-card">
                <div className="sync-card-left">
                  <div className="sync-icon-avatar muted">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="sync-card-title">Automatic Precision Session Logging</span>
                    <span className="sync-card-desc">
                      Tracks real-time playtime telemetry with fractional minute accuracy and frame stability counters.
                    </span>
                  </div>
                </div>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="toggle-precision-logging"
                    checked={sync.precisionSessionLogging}
                    onChange={(e) => handleSyncChange('precisionSessionLogging', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Peer Broadcast */}
              <div className="sync-card">
                <div className="sync-card-left">
                  <div className="sync-icon-avatar muted">
                    <Radio size={18} />
                  </div>
                  <div>
                    <span className="sync-card-title">Peer Broadcast to Curator Network</span>
                    <span className="sync-card-desc">
                      Enables mutual comparison matrices with 3 active network peers (Alex_R, Maya_K, Silas_G).
                    </span>
                  </div>
                </div>

                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    id="toggle-peer-broadcast"
                    checked={sync.peerNetworkBroadcast}
                    onChange={(e) => handleSyncChange('peerNetworkBroadcast', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className="settings-action-bar">
              <div className="settings-saved-timestamp">
                <Clock size={14} />
                <span>Last saved: {sync.lastSaved || 'Today at 14:38:19 UTC'}</span>
              </div>

              <div className="settings-actions-group">
                <button
                  type="button"
                  className="btn-glass-secondary"
                  onClick={handleDiscardChanges}
                  title="Discard changes made in this session"
                >
                  <RotateCcw size={15} />
                  <span>Discard Changes</span>
                </button>

                <button
                  type="button"
                  className="btn-primary-gold"
                  onClick={handleSaveAll}
                  title="Save preferences to local storage"
                >
                  <CheckCircle2 size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Storage, Security, Return Paths (4 Columns)         */}
        {/* ================================================================= */}
        <div className="settings-column-right">
          {/* PANEL 4: System Architecture & Local Cache Storage */}
          <section className="settings-panel">
            <div className="settings-panel-header">
              <div className="settings-panel-title-wrap">
                <HardDrive size={18} className="settings-panel-title-icon" />
                <h2>Storage &amp; Integrity</h2>
              </div>
              <span className="settings-panel-tag">CACHE ENGINE</span>
            </div>

            {/* Storage Metrics Breakdown */}
            <div className="storage-stat-card">
              <div className="storage-stat-row">
                <span className="storage-stat-label">Archival Manifests</span>
                <span className="storage-stat-val">{storage.manifestCount || 142} Titles</span>
              </div>
              <div className="storage-stat-sub">
                <span>Footprint Size</span>
                <span className="footprint">{storage.footprintSizeMB || 48.2} MB</span>
              </div>

              <div className="storage-progress-bar">
                <div
                  className="storage-progress-fill"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>

            {/* Client Version */}
            <div className="version-info-box">
              <div>
                <span className="version-title">Client Version</span>
                <span className="version-detail">{storage.clientVersion}</span>
              </div>
              <span className="version-status-pill">{storage.channel || 'STABLE'}</span>
            </div>

            {/* Cache Actions */}
            <div className="storage-actions-col">
              <button
                type="button"
                className="btn-glass-secondary"
                id="integrity-btn"
                onClick={handleVerifyIntegrity}
                disabled={integrityState === 'verifying'}
                style={{ width: '100%' }}
              >
                {integrityState === 'verifying' ? (
                  <>
                    <RefreshCw size={15} color="#F4BF4E" className="animate-spin" />
                    <span>Verifying 142 Manifests...</span>
                  </>
                ) : integrityState === 'verified' ? (
                  <>
                    <CheckCircle2 size={15} color="#34D399" />
                    <span style={{ color: '#34D399' }}>All Manifests Verified (100%)</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} color="#F4BF4E" />
                    <span>Verify Local Archive Integrity</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-destructive"
                onClick={handlePurgeCache}
                disabled={isPurging}
              >
                <Trash2 size={15} />
                <span>Purge Temporary Cache</span>
              </button>
            </div>
          </section>

          {/* PANEL 5: Security & Zero-Secret Protocol Policy (Strict 08-settings.md) */}
          <section className="settings-panel" style={{ borderColor: 'rgba(244, 191, 78, 0.25)' }}>
            <div className="settings-panel-header">
              <div className="settings-panel-title-wrap">
                <ShieldCheck size={18} className="settings-panel-title-icon" />
                <h2>Security &amp; Protocol Vault</h2>
              </div>
            </div>

            <div className="security-alert-box">
              <div className="security-alert-head">
                <Lock size={20} className="security-alert-icon" />
                <div>
                  <h4 className="security-alert-title">Zero-Client-Secret Architecture</h4>
                  <p className="security-alert-text">
                    Database credentials, tokens, and storage secrets are managed via an isolated server-side vault protocol. <strong>No raw connection strings, master database keys, or client-side passwords</strong> are stored or exposed in this interface.
                  </p>
                </div>
              </div>
            </div>

            <div className="security-guarantees-list">
              <div className="security-guarantee-item">
                <CheckCircle2 size={14} className="security-guarantee-icon" />
                <span>Encrypted local preference payload</span>
              </div>
              <div className="security-guarantee-item">
                <CheckCircle2 size={14} className="security-guarantee-icon" />
                <span>No password reset required for curated viewer mode</span>
              </div>
              <div className="security-guarantee-item">
                <CheckCircle2 size={14} className="security-guarantee-icon" />
                <span>Strict schema compliance enforced by Node 01</span>
              </div>
            </div>
          </section>

          {/* PANEL 6: Navigation Return Matrix (Direct Return Paths) */}
          <section className="settings-panel">
            <div className="settings-panel-header">
              <div className="settings-panel-title-wrap">
                <Sliders size={18} className="settings-panel-title-icon" />
                <h2>Archive Destinations</h2>
              </div>
              <span className="settings-panel-tag">RETURN PATHS</span>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#71717A', margin: '0.75rem 0 0 0' }}>
              Direct telemetry links back to primary archive operational sectors:
            </p>

            <div className="destinations-grid">
              <Link to="/" className="destination-tile" title="Return to Dashboard">
                <LayoutDashboard size={16} className="destination-tile-icon" />
                <span>Overview</span>
              </Link>

              <Link to="/library" className="destination-tile" title="Return to My Library">
                <Gamepad2 size={16} className="destination-tile-icon" />
                <span>My Library</span>
              </Link>

              <Link to="/discover" className="destination-tile" title="Return to Discover Catalogue">
                <Compass size={16} className="destination-tile-icon" />
                <span>Discover</span>
              </Link>

              <Link to="/achievements" className="destination-tile" title="Return to Achievements">
                <Trophy size={16} className="destination-tile-icon" />
                <span>Achievements</span>
              </Link>

              <Link to="/friends" className="destination-tile" title="Return to Friends Network">
                <Users size={16} className="destination-tile-icon" />
                <span>Friends</span>
              </Link>

              <Link to="/reviews" className="destination-tile" title="Return to Game Reviews">
                <Star size={16} className="destination-tile-icon" />
                <span>Reviews</span>
              </Link>
            </div>
          </section>

          {/* Factory Reset Action */}
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={handleResetDefaults}
              style={{
                background: 'none',
                border: 'none',
                color: '#71717A',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
              onMouseEnter={(e) => (e.target.style.color = '#F4BF4E')}
              onMouseLeave={(e) => (e.target.style.color = '#71717A')}
            >
              Reset all archive preferences to factory defaults
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* System Diagnostic Footer Line                                       */}
      {/* ------------------------------------------------------------------- */}
      <footer className="settings-system-footer">
        <div className="settings-footer-brand">
          <span className="brand">GAME VAULT</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
          <span>Tactile Liquid Glass Gaming Archive • Build 8842-PROD</span>
        </div>

        <div className="settings-footer-telemetry">
          <span>MEM: {storage.footprintSizeMB || 48.2} MB / 1024 MB</span>
          <span>LATENCY: {storage.latencyMs || 14}ms</span>
          <span className="verified">VERIFIED SESSION</span>
        </div>
      </footer>
    </div>
  );
}
