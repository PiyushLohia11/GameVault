/**
 * Friends & Social Mesh Relational Mock Data
 * 
 * Maps directly to relational database entities:
 * - USERS (friend accounts)
 * - FRIENDSHIPS (relationships between users)
 * - FRIEND_LIBRARY (games owned and played by friends)
 * - FRIEND_ACTIVITY (event stream: achievements, reviews, completions)
 */

export const mockFriendUsers = [
  {
    id: 2,
    username: 'Nyx_Runner',
    displayName: 'Nyx_Runner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    level: 52,
    curatorTitle: 'Master Analyst',
    status: 'playing', // 'playing', 'online', 'offline'
    statusLabel: 'In-Game Session',
    currentTitle: 'Armored Core VI: Fires of Rubicon',
    currentTitleHours: 114.0,
    endpointId: 'NX-8820-VAL',
    isVerified: true,
    totalTitles: 168,
    masteredTitles: 41,
    friendSince: 'March 14, 2023',
    lastActive: 'Now in-game',
  },
  {
    id: 3,
    username: 'Vesper_88',
    displayName: 'Vesper_88',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    level: 44,
    curatorTitle: 'Curator Tier IV',
    status: 'online',
    statusLabel: 'Online',
    currentTitle: 'Vault Catalogue Inspection',
    currentTitleHours: 42.5,
    endpointId: 'VS-4410-VAL',
    isVerified: false,
    totalTitles: 124,
    masteredTitles: 26,
    friendSince: 'January 09, 2023',
    lastActive: 'Idle in Vault catalogue',
  },
  {
    id: 4,
    username: 'SynapseX',
    displayName: 'SynapseX',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    level: 39,
    curatorTitle: 'System Archivist',
    status: 'offline',
    statusLabel: 'Offline • 4h ago',
    currentTitle: 'Cyberpunk 2077',
    currentTitleHours: 62.1,
    endpointId: 'SX-3990-VAL',
    isVerified: false,
    totalTitles: 98,
    masteredTitles: 18,
    friendSince: 'November 22, 2023',
    lastActive: '4h ago',
  },
  {
    id: 5,
    username: 'Aethelgard',
    displayName: 'Aethelgard',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    level: 50,
    curatorTitle: 'Master Curator',
    status: 'offline',
    statusLabel: 'Offline • 2d ago',
    currentTitle: 'Elden Ring',
    currentTitleHours: 245.0,
    endpointId: 'AG-5002-VAL',
    isVerified: true,
    totalTitles: 182,
    masteredTitles: 45,
    friendSince: 'August 05, 2022',
    lastActive: '2d ago',
  },
  {
    id: 6,
    username: 'Kaelen_Echo',
    displayName: 'Kaelen_Echo',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    level: 47,
    curatorTitle: 'Tactical Operative',
    status: 'playing',
    statusLabel: 'In-Game Session',
    currentTitle: 'Hades II',
    currentTitleHours: 38.5,
    endpointId: 'KE-4712-VAL',
    isVerified: false,
    totalTitles: 110,
    masteredTitles: 22,
    friendSince: 'May 12, 2024',
    lastActive: 'Now in-game',
  },
  {
    id: 7,
    username: 'Chronos_V',
    displayName: 'Chronos_V',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    level: 41,
    curatorTitle: 'Lore Archivist',
    status: 'playing',
    statusLabel: 'In-Game Session',
    currentTitle: 'Baldur’s Gate 3',
    currentTitleHours: 145.2,
    endpointId: 'CV-4118-VAL',
    isVerified: false,
    totalTitles: 135,
    masteredTitles: 29,
    friendSince: 'February 18, 2024',
    lastActive: 'Now in-game',
  },
  {
    id: 8,
    username: 'Morpheus_K',
    displayName: 'Morpheus_K',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    level: 36,
    curatorTitle: 'Explorer Tier II',
    status: 'offline',
    statusLabel: 'Offline',
    currentTitle: 'Starfield',
    currentTitleHours: 52.0,
    endpointId: 'MK-3610-VAL',
    isVerified: false,
    totalTitles: 85,
    masteredTitles: 14,
    friendSince: null,
    lastActive: '1d ago',
  },
];

/**
 * FRIENDSHIP RELATIONSHIPS (Relational Join Table)
 */
export const mockFriendships = [
  { id: 1, userId: 1, friendId: 2, status: 'accepted', createdAt: '2023-03-14' },
  { id: 2, userId: 1, friendId: 3, status: 'accepted', createdAt: '2023-01-09' },
  { id: 3, userId: 1, friendId: 4, status: 'accepted', createdAt: '2023-11-22' },
  { id: 4, userId: 1, friendId: 5, status: 'accepted', createdAt: '2022-08-05' },
  { id: 5, userId: 1, friendId: 6, status: 'accepted', createdAt: '2024-05-12' },
  { id: 6, userId: 1, friendId: 7, status: 'accepted', createdAt: '2024-02-18' },
  { id: 7, userId: 1, friendId: 8, status: 'pending', createdAt: '2026-10-24', direction: 'incoming' },
];

/**
 * FRIEND LIBRARIES (Game IDs and Playtime for mutual comparisons)
 */
export const mockFriendLibraries = [
  // Nyx_Runner (ID 2)
  { friendId: 2, gameId: 101, title: 'Elden Ring', playtimeHours: 215.4, status: 'Completed', isMastered: true },
  { friendId: 2, gameId: 102, title: 'Cyberpunk 2077', playtimeHours: 62.1, status: 'Completed', isMastered: false },
  { friendId: 2, gameId: 104, title: "Baldur's Gate 3", playtimeHours: 145.2, status: 'Playing', isMastered: false },
  { friendId: 2, gameId: 110, title: 'Armored Core VI: Fires of Rubicon', playtimeHours: 114.0, status: 'Completed', isMastered: true },
  { friendId: 2, gameId: 105, title: 'Hades', playtimeHours: 76.5, status: 'Completed', isMastered: true },
  { friendId: 2, gameId: 103, title: 'Hollow Knight', playtimeHours: 48.0, status: 'Playing', isMastered: false },
  { friendId: 2, gameId: 106, title: 'God of War Ragnarök', playtimeHours: 54.0, status: 'Completed', isMastered: true },
  { friendId: 2, gameId: 109, title: 'Doom Eternal', playtimeHours: 35.0, status: 'Completed', isMastered: false },
  { friendId: 2, gameId: 111, title: 'Hades II', playtimeHours: 24.0, status: 'Playing', isMastered: false },
  { friendId: 2, gameId: 112, title: 'Starfield', playtimeHours: 42.0, status: 'Backlog', isMastered: false },

  // Vesper_88 (ID 3)
  { friendId: 3, gameId: 101, title: 'Elden Ring', playtimeHours: 94.0, status: 'Completed', isMastered: false },
  { friendId: 3, gameId: 102, title: 'Cyberpunk 2077', playtimeHours: 110.5, status: 'Completed', isMastered: true },
  { friendId: 3, gameId: 105, title: 'Hades', playtimeHours: 85.0, status: 'Completed', isMastered: true },
  { friendId: 3, gameId: 104, title: "Baldur's Gate 3", playtimeHours: 88.0, status: 'Playing', isMastered: false },
  { friendId: 3, gameId: 103, title: 'Hollow Knight', playtimeHours: 65.0, status: 'Completed', isMastered: true },

  // SynapseX (ID 4)
  { friendId: 4, gameId: 102, title: 'Cyberpunk 2077', playtimeHours: 140.0, status: 'Completed', isMastered: true },
  { friendId: 4, gameId: 109, title: 'Doom Eternal', playtimeHours: 48.0, status: 'Completed', isMastered: true },
  { friendId: 4, gameId: 101, title: 'Elden Ring', playtimeHours: 72.0, status: 'Playing', isMastered: false },

  // Aethelgard (ID 5)
  { friendId: 5, gameId: 101, title: 'Elden Ring', playtimeHours: 320.0, status: 'Completed', isMastered: true },
  { friendId: 5, gameId: 104, title: "Baldur's Gate 3", playtimeHours: 195.0, status: 'Completed', isMastered: true },
  { friendId: 5, gameId: 103, title: 'Hollow Knight', playtimeHours: 112.0, status: 'Completed', isMastered: true },
  { friendId: 5, gameId: 106, title: 'God of War Ragnarök', playtimeHours: 68.0, status: 'Completed', isMastered: true },

  // Kaelen_Echo (ID 6)
  { friendId: 6, gameId: 111, title: 'Hades II', playtimeHours: 58.0, status: 'Playing', isMastered: false },
  { friendId: 6, gameId: 105, title: 'Hades', playtimeHours: 92.0, status: 'Completed', isMastered: true },
  { friendId: 6, gameId: 101, title: 'Elden Ring', playtimeHours: 115.0, status: 'Completed', isMastered: false },

  // Chronos_V (ID 7)
  { friendId: 7, gameId: 104, title: "Baldur's Gate 3", playtimeHours: 180.0, status: 'Playing', isMastered: true },
  { friendId: 7, gameId: 101, title: 'Elden Ring', playtimeHours: 140.0, status: 'Completed', isMastered: false },
  { friendId: 7, gameId: 113, title: 'Disco Elysium: The Final Cut', playtimeHours: 85.0, status: 'Completed', isMastered: true },
];

/**
 * RECENT FRIEND ACTIVITY STREAM
 */
export const mockFriendActivities = [
  {
    id: 1,
    friendId: 2,
    friendName: 'Nyx_Runner',
    type: 'mastery', // 'mastery', 'review', 'backlog', 'achievement'
    badge: '100% ARCHIVE MASTERED',
    timeAgo: '2d ago',
    title: 'Unlocked Platinum Trophy / All Achievements',
    gameTitle: 'Armored Core VI: Fires of Rubicon',
    description: 'Completed ending "Fires of Raven" and finalized all S-Rank mission archives.',
  },
  {
    id: 2,
    friendId: 2,
    friendName: 'Nyx_Runner',
    type: 'review',
    badge: 'PUBLISHED CURATOR REVIEW',
    timeAgo: '5d ago',
    score: '10 / 10',
    title: 'Elden Ring: Shadow of the Erdtree',
    gameTitle: 'Elden Ring',
    quote: 'A towering masterclass in vertical world geometry and boss pacing. The realm of shadow rewards pure build dedication.',
  },
  {
    id: 3,
    friendId: 2,
    friendName: 'Nyx_Runner',
    type: 'backlog',
    badge: 'VAULT CATALOGUE UPDATE',
    timeAgo: '1w ago',
    title: 'Added to Active Backlog',
    gameTitle: 'Metaphor: ReFantazio',
    description: 'Categorized under: Turn-based JRPG, High Priority Expedition.',
  },
  {
    id: 4,
    friendId: 3,
    friendName: 'Vesper_88',
    type: 'achievement',
    badge: 'ACHIEVEMENT UNLOCKED',
    timeAgo: '3d ago',
    title: 'Unlocked "Pure Completion"',
    gameTitle: 'Hollow Knight',
    description: 'Achieved 112% game completion and defeated the Radiance.',
  },
  {
    id: 5,
    friendId: 5,
    friendName: 'Aethelgard',
    type: 'mastery',
    badge: 'CAMPAIGN COMPLETED',
    timeAgo: '2d ago',
    title: 'Completed NG+ 3 Journey',
    gameTitle: 'Elden Ring',
    description: 'Defeated Elden Beast in 42 minutes with pure strength Colossal Greatsword build.',
  },
];
