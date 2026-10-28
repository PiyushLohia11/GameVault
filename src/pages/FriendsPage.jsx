import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Gamepad2,
  Trophy,
  Crown,
  Clock,
  Search,
  Filter,
  Check,
  X,
  ChevronRight,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Activity,
  History,
  Layers,
  ExternalLink,
  MessageSquare,
  Flame,
  ArrowRightLeft,
  Share2,
} from 'lucide-react';
import { friendsService } from '../services/friendsService';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import './FriendsPage.css';

export default function FriendsPage() {
  // -------------------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------------------
  // Default selected friend to Nyx_Runner (ID 2) as highlighted in the Stitch reference
  const [selectedFriendId, setSelectedFriendId] = useState(2);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'all', 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('online_first'); // 'online_first', 'playtime', 'mutuals', 'alpha'

  // Data states
  const [friends, setFriends] = useState([]);
  const [dossier, setDossier] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  // -------------------------------------------------------------------------
  // DATA LOADING
  // -------------------------------------------------------------------------
  const loadData = async () => {
    try {
      const [friendsList, telemetryData, pendingList] = await Promise.all([
        friendsService.getFriends(1, {
          tab: activeTab === 'pending' ? 'all' : activeTab,
          search: searchQuery,
          sortBy,
        }),
        friendsService.getNetworkTelemetry(1),
        friendsService.getPendingRequests(1),
      ]);

      setFriends(friendsList);
      setTelemetry(telemetryData);
      setPendingRequests(pendingList);

      // If active selection is invalid or empty, default to first friend
      if (friendsList.length > 0 && !friendsList.some((f) => f.id === selectedFriendId)) {
        setSelectedFriendId(friendsList[0].id);
      }
    } catch (err) {
      console.error('Failed to load friends data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDossier = async (friendId) => {
    if (!friendId) return;
    try {
      const comp = await friendsService.getFriendComparison(friendId, 1);
      setDossier(comp);
    } catch (err) {
      console.error('Failed to load friend comparison dossier:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery, sortBy]);

  useEffect(() => {
    if (selectedFriendId) {
      loadDossier(selectedFriendId);
    }
  }, [selectedFriendId]);

  // -------------------------------------------------------------------------
  // INTERACTIVE HANDLERS
  // -------------------------------------------------------------------------
  const handleAcceptRequest = async (requestId, username) => {
    try {
      const res = await friendsService.acceptRequest(requestId);
      if (res.success) {
        showToast(`Friend connection with ${username} established.`);
        await loadData();
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleDeclineRequest = async (requestId, username) => {
    try {
      const res = await friendsService.declineRequest(requestId);
      if (res.success) {
        showToast(`Request from ${username} dismissed.`);
        await loadData();
      }
    } catch (err) {
      console.error('Error declining friend request:', err);
    }
  };

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;

    try {
      const res = await friendsService.sendFriendRequest(addFriendInput.trim(), 1);
      if (res.success) {
        showToast(res.message);
        setAddFriendInput('');
        setIsAddFriendOpen(false);
        await loadData();
        if (res.friend) {
          setSelectedFriendId(res.friend.id);
        }
      } else {
        showToast(res.message || 'Unable to send request');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleSendPing = (username) => {
    showToast(`Vault Ping sent to ${username}: Telemetry synchronized.`);
  };

  return (
    <div className="friends-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="friends-toast">
          <CheckCircle2 size={16} color="var(--accent-primary)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          1. HEADER & BREADCRUMB TELEMETRY STRIP
          ===================================================================== */}
      <section className="friends-header-section">
        <div className="friends-title-group">
          <div className="friends-eyebrow">
            <span className="friends-eyebrow-dot" />
            <span>VAULT TELEMETRY / SOCIAL MESH &amp; PEER ARCHIVES</span>
          </div>
          <h1 className="friends-title">FRIENDS &amp; NETWORK</h1>
          <p className="friends-description">
            Compare game libraries, track peer playtime telemetry, and inspect real-time archive milestones.
          </p>
        </div>

        <div className="friends-header-controls">
          {/* Filter Pill Tabs */}
          <div className="friends-tabs-cluster">
            <button
              type="button"
              className={`friends-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              <span>ACTIVE ({telemetry?.activeInSessionCount ?? 0})</span>
            </button>
            <button
              type="button"
              className={`friends-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>ALL FRIENDS ({friends.length})</span>
            </button>
            <button
              type="button"
              className={`friends-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <span>PENDING ({pendingRequests.length})</span>
              {pendingRequests.length > 0 && <span className="friends-tab-badge-dot" />}
            </button>
          </div>

          {/* Add Peer CTA */}
          <button
            type="button"
            className="friends-add-peer-btn"
            onClick={() => setIsAddFriendOpen(true)}
            title="Connect a new verified gaming peer"
          >
            <UserPlus size={15} />
            <span>Connect Peer</span>
          </button>
        </div>
      </section>

      {/* =====================================================================
          2. KPI SUMMARY 4-CARD TELEMETRY STRIP
          ===================================================================== */}
      {telemetry && (
        <section className="friends-kpi-grid">
          {/* Card 1: Linked Peers */}
          <div className="friends-kpi-card">
            <div className="friends-kpi-header">
              <span className="friends-kpi-label">LINKED PEERS</span>
              <span className="friends-kpi-icon">
                <Users size={18} />
              </span>
            </div>
            <div className="friends-kpi-value">{telemetry.linkedPeersCount}</div>
            <div className="friends-kpi-sub green">
              <span className="friends-status-dot-active" />
              <span>{telemetry.activeInSessionCount} active in session</span>
            </div>
          </div>

          {/* Card 2: Mutual Titles */}
          <div className="friends-kpi-card">
            <div className="friends-kpi-header">
              <span className="friends-kpi-label">MUTUAL TITLES</span>
              <span className="friends-kpi-icon">
                <Layers size={18} />
              </span>
            </div>
            <div className="friends-kpi-value">{telemetry.mutualTitlesCount}</div>
            <div className="friends-kpi-sub">
              <span>{telemetry.libraryOverlapPercent} library overlap</span>
            </div>
          </div>

          {/* Card 3: Playtime Differential */}
          <div className="friends-kpi-card">
            <div className="friends-kpi-header">
              <span className="friends-kpi-label">PLAYTIME DIFFERENTIAL</span>
              <span className="friends-kpi-icon">
                <Clock size={18} />
              </span>
            </div>
            <div className="friends-kpi-value gold">{telemetry.playtimeDifferentialLead}</div>
            <div className="friends-kpi-sub">
              <span>Lead across mutuals</span>
            </div>
          </div>

          {/* Card 4: Network Mastery */}
          <div className="friends-kpi-card">
            <div className="friends-kpi-header">
              <span className="friends-kpi-label">NETWORK MASTERY</span>
              <span className="friends-kpi-icon">
                <Crown size={18} />
              </span>
            </div>
            <div className="friends-kpi-value">{telemetry.networkMasteryCount}</div>
            <div className="friends-kpi-sub">
              <span>Combined perfect titles</span>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          3. MAIN SPLIT GRID (SECTION A & SECTION B)
          ===================================================================== */}
      <div className="friends-split-grid">
        {/* ===================================================================
            SECTION A: FRIENDS LIST & SELECTOR (LEFT COLUMN)
            =================================================================== */}
        <div className="friends-list-col">
          {/* Filter Card */}
          <div className="friends-filter-card">
            <div className="friends-search-row">
              <Search size={15} className="friends-search-icon" />
              <input
                type="text"
                className="friends-search-input"
                placeholder="Filter friends by alias, status, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="friends-sort-row">
              <span className="friends-sort-label">Sort by</span>
              <div className="friends-sort-pills">
                <button
                  type="button"
                  className={`friends-sort-pill ${sortBy === 'online_first' ? 'active' : ''}`}
                  onClick={() => setSortBy('online_first')}
                >
                  Online First
                </button>
                <button
                  type="button"
                  className={`friends-sort-pill ${sortBy === 'playtime' ? 'active' : ''}`}
                  onClick={() => setSortBy('playtime')}
                >
                  Playtime
                </button>
                <button
                  type="button"
                  className={`friends-sort-pill ${sortBy === 'mutuals' ? 'active' : ''}`}
                  onClick={() => setSortBy('mutuals')}
                >
                  Mutuals
                </button>
              </div>
            </div>
          </div>

          {/* Friends List Container */}
          {friends.length > 0 ? (
            <div className="friends-items-container">
              {friends.map((friend) => {
                const isSelected = friend.id === selectedFriendId;

                return (
                  <div
                    key={friend.id}
                    className={`friend-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedFriendId(friend.id)}
                    title={`Select ${friend.username} for head-to-head comparison`}
                  >
                    {isSelected && <span className="friend-item-active-bar" />}

                    <div className="friend-item-top">
                      <div className="friend-item-user-cluster">
                        <div className="friend-item-avatar-wrap">
                          <img
                            src={friend.avatarUrl}
                            alt={friend.username}
                            className="friend-item-avatar"
                          />
                          <span className={`friend-item-status-dot ${friend.status}`} />
                        </div>

                        <div className="friend-item-names">
                          <div className="friend-item-name-row">
                            <h3 className="friend-item-name">{friend.username}</h3>
                            <span className="friend-item-level">LVL {friend.level}</span>
                          </div>
                          <span className="friend-item-meta-sub">
                            {friend.curatorTitle} • {friend.mutualTitlesCount} Shared Games
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="friend-item-inspect-tag">
                          <span>INSPECTION</span>
                          <ChevronRight size={13} />
                        </span>
                      ) : friend.status === 'online' ? (
                        <span className="friend-item-badge-online">Online</span>
                      ) : friend.status === 'offline' ? (
                        <span className="friend-item-badge-offline">{friend.statusLabel}</span>
                      ) : null}
                    </div>

                    {/* Active In-Session Title */}
                    <div className="friend-item-telemetry-strip">
                      <div className="friend-item-game-active">
                        <Gamepad2 size={13} className="friend-item-game-active-icon" />
                        <span className="truncate">
                          {friend.status === 'playing'
                            ? `Playing ${friend.currentTitle}`
                            : friend.currentTitle}
                        </span>
                      </div>
                      <div className="friend-item-sub-timestamps">
                        <span>{friend.currentTitleHours}h logged in title</span>
                        <span>Friend since {friend.friendSince}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Friends Found"
              description="No connections match the current filter or search criteria."
              actionLabel="Show All Friends"
              onAction={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
            />
          )}

          {/* Pending Requests Accordion Tile (Section C) */}
          {pendingRequests.length > 0 && (
            <div className="friends-pending-tile">
              <div className="friends-pending-header">
                <div className="friends-pending-title-group">
                  <UserPlus size={16} color="var(--accent-primary)" />
                  <div>
                    <h4 className="friends-pending-title">Incoming Vault Sync Requests</h4>
                    <p className="friends-pending-sub">
                      {pendingRequests.length} pending connection from verified peer
                    </p>
                  </div>
                </div>
                <span className="friends-pending-badge">{pendingRequests.length} NEW</span>
              </div>

              {pendingRequests.map((req) => (
                <div key={req.id} className="friends-pending-item">
                  <div className="friends-pending-user-info">
                    <div className="friends-pending-avatar-circle">{req.avatarInitials}</div>
                    <div>
                      <p className="font-label-md text-text-primary">{req.username}</p>
                      <p className="font-label-sm text-text-muted">
                        {req.mutualTitles} Mutual titles • LVL {req.level}
                      </p>
                    </div>
                  </div>

                  <div className="friends-pending-actions">
                    <button
                      type="button"
                      className="friends-accept-btn"
                      onClick={() => handleAcceptRequest(req.id, req.username)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="friends-decline-btn"
                      onClick={() => handleDeclineRequest(req.id, req.username)}
                      title="Decline request"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===================================================================
            SECTION B: SELECTED FRIEND DOSSIER & HEAD-TO-HEAD (RIGHT COLUMN)
            =================================================================== */}
        {dossier ? (
          <div className="friends-dossier-col">
            {/* Friend Dossier Header Card */}
            <div className="friend-dossier-hero">
              <div className="friend-dossier-ambient" />

              <div className="friend-dossier-top">
                <div className="friend-dossier-profile">
                  <div className="friend-dossier-avatar-wrap">
                    <img
                      src={dossier.friend.avatarUrl}
                      alt={dossier.friend.username}
                      className="friend-dossier-avatar"
                    />
                    <span className="friend-dossier-lvl-badge">LVL {dossier.friend.level}</span>
                  </div>

                  <div className="friend-dossier-info">
                    <div className="friend-dossier-title-row">
                      <h2 className="friend-dossier-username">{dossier.friend.username}</h2>
                      <span className={`friend-dossier-status-pill ${dossier.friend.status}`}>
                        {dossier.friend.status === 'playing' ? (
                          <>
                            <span className="friends-status-dot-active" />
                            <span>In-Game Session</span>
                          </>
                        ) : dossier.friend.status === 'online' ? (
                          <span>Online</span>
                        ) : (
                          <span>Offline</span>
                        )}
                      </span>
                    </div>

                    <p className="friend-dossier-friendship-meta">
                      Friend since {dossier.friend.friendSince} • Endpoint ID:{' '}
                      <span className="font-mono">{dossier.friend.endpointId}</span>
                    </p>

                    <div className="friend-dossier-badges-row">
                      <span className="flex items-center space-x-1">
                        <ShieldCheck size={13} className="gold" />
                        <span>Verified {dossier.friend.curatorTitle}</span>
                      </span>
                      <span>•</span>
                      <span>{dossier.friend.totalTitles} Total Vault Titles</span>
                    </div>
                  </div>
                </div>

                <div className="friend-dossier-actions">
                  <button
                    type="button"
                    className="ach-btn-primary"
                    onClick={() => setIsCompareModalOpen(true)}
                    title="Compare all mutual titles"
                  >
                    <ArrowRightLeft size={13} />
                    <span>Compare All {dossier.macro.mutualCount} Titles</span>
                  </button>
                  <button
                    type="button"
                    className="ach-btn-secondary"
                    onClick={() => handleSendPing(dossier.friend.username)}
                    title="Send instant network ping"
                  >
                    <Send size={13} />
                    <span>Send Vault Ping</span>
                  </button>
                </div>
              </div>

              {/* Active Game Telemetry Strip */}
              {dossier.friend.status === 'playing' && (
                <div className="friend-dossier-active-title-box">
                  <div className="friend-dossier-active-left">
                    <Gamepad2 size={24} className="friend-dossier-active-icon" />
                    <div>
                      <div className="friend-dossier-active-title-label">CURRENT ACTIVE TITLE</div>
                      <h3 className="friend-dossier-active-game-name">{dossier.friend.currentTitle}</h3>
                    </div>
                  </div>

                  <div>
                    <div className="friend-dossier-active-hours">{dossier.friend.currentTitleHours}h</div>
                    <div className="friend-dossier-active-hours-sub">Total Session Playtime</div>
                  </div>
                </div>
              )}
            </div>

            {/* HEAD-TO-HEAD COMPARISON MATRIX */}
            <div className="friend-matrix-card">
              <div className="friend-matrix-header">
                <div className="friend-matrix-title-cluster">
                  <Activity size={17} color="var(--accent-primary)" />
                  <h3 className="friend-matrix-title">HEAD-TO-HEAD COMPARISON</h3>
                </div>
                <span className="friend-matrix-subtag">SYNCHRONIZED TELEMETRY</span>
              </div>

              {/* Macro Metric Comparison 3-Grid */}
              <div className="friend-matrix-macro-grid">
                <div className="friend-macro-item">
                  <span className="friend-macro-label">OWNED TITLES</span>
                  <div className="friend-macro-values">
                    <span className="friend-macro-num">{dossier.macro.yourOwnedCount}</span>
                    <span className="friend-macro-sub">vs</span>
                    <span className="friend-macro-num gold">{dossier.macro.friendOwnedCount}</span>
                  </div>
                  <span className="friend-macro-sub">You | {dossier.friend.username.split('_')[0]}</span>
                </div>

                <div className="friend-macro-item highlight">
                  <span className="friend-macro-label gold">SHARED TITLES</span>
                  <div className="friend-macro-values">
                    <span className="friend-macro-num gold">{dossier.macro.mutualCount}</span>
                  </div>
                  <span className="friend-macro-sub">Mutual Games</span>
                </div>

                <div className="friend-macro-item">
                  <span className="friend-macro-label">MASTERED (100%)</span>
                  <div className="friend-macro-values">
                    <span className="friend-macro-num">{dossier.macro.yourMasteredCount}</span>
                    <span className="friend-macro-sub">vs</span>
                    <span className="friend-macro-num gold">{dossier.macro.friendMasteredCount}</span>
                  </div>
                  <span className="friend-macro-sub">Perfect Archive Badges</span>
                </div>
              </div>

              {/* Top Mutual Titles Playtime Bars */}
              <div className="friend-mutual-section">
                <h4 className="friend-mutual-sec-title">TOP MUTUAL TITLE PLAYTIME METRICS</h4>

                {dossier.mutualGames.slice(0, 4).map((game) => (
                  <div key={game.gameId} className="friend-mutual-card">
                    <div className="friend-mutual-card-header">
                      <span className="friend-mutual-game-title">{game.title}</span>
                      <div className="friend-mutual-hours-tag">
                        <span className="you">You: <strong>{game.yourHours}h</strong></span>
                        <span className="friend">{dossier.friend.username.split('_')[0]}: <strong>{game.friendHours}h</strong></span>
                      </div>
                    </div>

                    {/* Comparative Dual Gauge Bar */}
                    <div className="friend-dual-bar-track">
                      <div
                        className="friend-dual-bar-you"
                        style={{ width: `${game.yourPct}%` }}
                        title={`You: ${game.yourHours}h (${game.yourPct}%)`}
                      />
                      <div
                        className="friend-dual-bar-friend"
                        style={{ width: `${game.friendPct}%` }}
                        title={`${dossier.friend.username}: ${game.friendHours}h (${game.friendPct}%)`}
                      />
                    </div>

                    <div className="friend-mutual-footer">
                      <span className={`friend-mutual-lead ${game.leadUser}`}>{game.leadText}</span>
                      <span>{game.milestoneNote}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECENT FRIEND ACTIVITY STREAM */}
            <div className="friend-activity-card">
              <div className="friend-activity-header">
                <div className="friend-activity-title-group">
                  <History size={17} color="var(--accent-primary)" />
                  <h3 className="friend-activity-title">RECENT FRIEND ACTIVITY STREAM</h3>
                </div>
                <span className="font-label-sm text-text-muted uppercase">REAL-TIME ARCHIVE LOGS</span>
              </div>

              <div className="space-y-3">
                {dossier.activities.map((act) => (
                  <div key={act.id} className="friend-activity-item">
                    <div className={`friend-activity-icon-box ${act.type}`}>
                      {act.type === 'mastery' ? (
                        <Trophy size={18} />
                      ) : act.type === 'review' ? (
                        <MessageSquare size={18} />
                      ) : (
                        <Gamepad2 size={18} />
                      )}
                    </div>

                    <div className="friend-activity-details">
                      <div className="friend-activity-top-meta">
                        <div className="flex items-center">
                          <span className={`friend-activity-badge ${act.type}`}>{act.badge}</span>
                          {act.score && <span className="friend-activity-score">{act.score}</span>}
                        </div>
                        <span className="friend-activity-time">{act.timeAgo}</span>
                      </div>

                      <h4 className="friend-activity-headline">{act.title}</h4>
                      {act.description && <p className="friend-activity-desc">{act.description}</p>}
                      {act.quote && <blockquote className="friend-activity-quote">"{act.quote}"</blockquote>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Select a Friend"
            description="Choose a peer from the list on the left to inspect their dossier and head-to-head comparison."
          />
        )}
      </div>

      {/* =====================================================================
          MODAL 1: CONNECT NEW PEER (ADD FRIEND)
          ===================================================================== */}
      {isAddFriendOpen && (
        <Modal
          isOpen={isAddFriendOpen}
          onClose={() => setIsAddFriendOpen(false)}
          title="Connect Gaming Peer"
          icon={UserPlus}
          footer={
            <div className="flex justify-end gap-2 w-full">
              <button
                type="button"
                className="ach-btn-secondary"
                onClick={() => setIsAddFriendOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ach-btn-primary"
                onClick={handleSendFriendRequest}
              >
                Send Request
              </button>
            </div>
          }
        >
          <form onSubmit={handleSendFriendRequest} className="friends-modal-form">
            <div className="friends-form-field">
              <label className="friends-form-label">Gamer Alias or Vault Endpoint ID</label>
              <input
                type="text"
                className="friends-form-input"
                placeholder="e.g. Ghost_Operator or NX-8820-VAL"
                value={addFriendInput}
                onChange={(e) => setAddFriendInput(e.target.value)}
                autoFocus
              />
              <span className="friends-form-hint">
                You can search by public gamer handle or 10-digit hexadecimal vault address.
              </span>
            </div>
          </form>
        </Modal>
      )}

      {/* =====================================================================
          MODAL 2: ALL MUTUAL TITLES COMPARISON TABLE
          ===================================================================== */}
      {isCompareModalOpen && dossier && (
        <Modal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          title={`Mutual Titles with ${dossier.friend.username}`}
          icon={ArrowRightLeft}
          footer={
            <div className="flex justify-end w-full">
              <button
                type="button"
                className="ach-btn-primary"
                onClick={() => setIsCompareModalOpen(false)}
              >
                Close Comparison
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="font-body-sm text-text-secondary">
              Direct comparison of all shared video game titles logged across both libraries.
            </p>

            <div className="friends-mutual-table-wrap">
              <table className="friends-mutual-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Your Hours</th>
                    <th>{dossier.friend.username.split('_')[0]}'s Hours</th>
                    <th>Playtime Differential</th>
                    <th>Archive Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.mutualGames.map((game) => (
                    <tr key={game.gameId}>
                      <td className="font-semibold text-text-primary">{game.title}</td>
                      <td>{game.yourHours} hrs</td>
                      <td className="text-accent-gold">{game.friendHours} hrs</td>
                      <td className={game.leadUser === 'you' ? 'text-status-completed' : 'text-accent-gold'}>
                        {game.leadText}
                      </td>
                      <td>{game.milestoneNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
