import { mockGames } from '../mockData/games';
import { libraryService } from './libraryService';
import { achievementService } from './achievementService';
import { simulateDelay } from './apiConfig';

/**
 * Mock Reviews database state
 * Relational table: REVIEWS (id, game_id, user_id, author_name, author_badge, rating, quote, hours_logged, posted_date, edited_date, helpful_count)
 */
let mockReviewsState = [
  // Elden Ring (101)
  {
    id: 1,
    gameId: 101,
    userId: 1,
    authorName: 'Kaelen_V',
    authorAvatar: '/images/avatar.jpg',
    authorBadge: 'MASTER CURATOR',
    isUserReview: true,
    hoursLogged: 140.2,
    rating: 10,
    ratingLabel: 'Masterpiece',
    quote: 'A defining triumph of environmental storytelling and combat mastery. The Lands Between sets a standard for open-world freedom that respects player agency while delivering immaculate boss architecture.',
    postedDate: 'Oct 20, 2023',
    editedDate: 'Nov 10, 2023',
    helpfulCount: 86,
    isHelpfulMarked: false,
  },
  {
    id: 2,
    gameId: 101,
    userId: 2,
    authorName: 'Vesper_88',
    authorAvatar: null,
    authorInitial: 'V',
    authorBadge: 'MASTER ANALYST',
    isUserReview: false,
    hoursLogged: 218.0,
    rating: 10,
    ratingLabel: '10/10',
    quote: 'The density of secret dungeons and legacy castles surpasses even Dark Souls 1. Boss encounters demand total composure, and the poise mechanics make builds deeply expressive.',
    postedDate: 'Nov 14, 2023',
    helpfulCount: 48,
    isHelpfulMarked: false,
  },
  {
    id: 3,
    gameId: 101,
    userId: 3,
    authorName: 'SynapseX',
    authorAvatar: null,
    authorInitial: 'S',
    authorBadge: 'CURATOR TIER IV',
    isUserReview: false,
    hoursLogged: 112.0,
    rating: 9.0,
    ratingLabel: '9.0/10',
    quote: 'Unrivaled art direction that continually rewards vertical exploration. Minor endgame scaling spikes are easily counteracted by summon versatility and weapon ash customisation.',
    postedDate: 'Dec 02, 2023',
    helpfulCount: 32,
    isHelpfulMarked: false,
  },

  // Cyberpunk 2077 (102)
  {
    id: 4,
    gameId: 102,
    userId: 1,
    authorName: 'Kaelen_V',
    authorAvatar: '/images/avatar.jpg',
    authorBadge: 'MASTER CURATOR',
    isUserReview: true,
    hoursLogged: 84.5,
    rating: 9.2,
    ratingLabel: 'Phenomenal',
    quote: 'Night City is the premier dystopian urban simulation in gaming history. Phantom Liberty elevates the storytelling to spy-thriller perfection with unforgettable characters and path tracing splendor.',
    postedDate: 'Jan 15, 2024',
    editedDate: null,
    helpfulCount: 54,
    isHelpfulMarked: false,
  },
  {
    id: 5,
    gameId: 102,
    userId: 4,
    authorName: 'NeonDrifter',
    authorAvatar: null,
    authorInitial: 'N',
    authorBadge: 'NETRUNNER ELITE',
    isUserReview: false,
    hoursLogged: 165.0,
    rating: 9.0,
    ratingLabel: '9.0/10',
    quote: 'The 2.0 overhaul rebuilt progression into a kinetic playground. Combat flows effortlessly between dash mechanics, sandy time-dilation, and lethal cyberware synergies.',
    postedDate: 'Feb 03, 2024',
    helpfulCount: 41,
    isHelpfulMarked: false,
  },

  // Hollow Knight (103)
  {
    id: 6,
    gameId: 103,
    userId: 1,
    authorName: 'Kaelen_V',
    authorAvatar: '/images/avatar.jpg',
    authorBadge: 'MASTER CURATOR',
    isUserReview: true,
    hoursLogged: 56.5,
    rating: 9.8,
    ratingLabel: 'Masterpiece',
    quote: 'Hallownest is a melancholic labyrinth crafted with sublime hand-drawn elegance. Responsive swordplay and tight platforming culminate in one of the greatest indie accomplishments ever.',
    postedDate: 'Sep 22, 2026',
    editedDate: null,
    helpfulCount: 77,
    isHelpfulMarked: false,
  },
  {
    id: 7,
    gameId: 103,
    userId: 5,
    authorName: 'PaleKing_V',
    authorAvatar: null,
    authorInitial: 'P',
    authorBadge: 'STEEL SOUL MASTER',
    isUserReview: false,
    hoursLogged: 120.0,
    rating: 9.5,
    ratingLabel: '9.5/10',
    quote: 'Christopher Larkin’s orchestral score alongside the tightest aerial controls in the metroidvania genre. Pantheon 5 tested every ounce of mechanical patience.',
    postedDate: 'Sep 25, 2026',
    helpfulCount: 29,
    isHelpfulMarked: false,
  },

  // Baldur's Gate 3 (104)
  {
    id: 8,
    gameId: 104,
    userId: 2,
    authorName: 'Vesper_88',
    authorAvatar: null,
    authorInitial: 'V',
    authorBadge: 'MASTER ANALYST',
    isUserReview: false,
    hoursLogged: 190.0,
    rating: 10,
    ratingLabel: '10/10 Masterpiece',
    quote: 'Larian Studios delivered a monumental CPRG milestone. Branching narrative consequences, rich companion arcs, and tactile tabletop reactivity make every playthrough distinct.',
    postedDate: 'Nov 18, 2023',
    helpfulCount: 92,
    isHelpfulMarked: false,
  },

  // Hades (105)
  {
    id: 9,
    gameId: 105,
    userId: 3,
    authorName: 'SynapseX',
    authorAvatar: null,
    authorInitial: 'S',
    authorBadge: 'CURATOR TIER IV',
    isUserReview: false,
    hoursLogged: 74.0,
    rating: 9.6,
    ratingLabel: '9.6/10',
    quote: 'Flawless synergy between isometric roguelike combat and episodic Olympian character drama. Failure never feels punishing—it unlocks deeper narrative layers.',
    postedDate: 'Dec 12, 2023',
    helpfulCount: 38,
    isHelpfulMarked: false,
  },
];

/**
 * Service providing database-like queries and operations for Game Details.
 * Fully relational: joins GAMES, USER_LIBRARY, ACHIEVEMENTS, and REVIEWS.
 */
export const gameDetailsService = {
  /**
   * Get complete game details with user enrollment, achievements, and reviews
   * @param {string|number} gameId 
   * @param {number} userId 
   */
  async getGameDetails(gameId, userId = 1) {
    await simulateDelay(120);

    const numId = Number(gameId);
    const game = mockGames.find((g) => g.id === numId);
    if (!game) {
      return null;
    }

    // 1. User Library relational join
    const userLibrary = await libraryService.getUserLibrary(userId);
    const libraryEntry = userLibrary.find((e) => e.gameId === numId);

    // 2. Achievements relational query
    const achievements = await achievementService.getUserAchievements(userId, { gameId: numId });
    const unlockedAchievements = achievements.filter((a) => a.isUnlocked);
    const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);
    const earnedPoints = unlockedAchievements.reduce((sum, a) => sum + (a.points || 0), 0);
    const achievementProgress = achievements.length > 0
      ? Math.round((unlockedAchievements.length / achievements.length) * 100)
      : 0;

    // 3. Reviews query
    const gameReviews = mockReviewsState.filter((r) => r.gameId === numId);
    const userReview = gameReviews.find((r) => r.userId === userId) || null;
    const communityReviews = gameReviews.filter((r) => r.userId !== userId);

    // Calculate community average rating
    const avgScore = gameReviews.length > 0
      ? (gameReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / gameReviews.length).toFixed(1)
      : (game.avgRating || 9.0).toFixed(1);

    // Default metadata specs
    const developer = game.developer || 'Unknown Developer';
    const publisher = game.publisher || (numId === 101 ? 'Bandai Namco' : developer);
    const director = game.director || (numId === 101 ? 'Hidetaka Miyazaki' : `${developer} Lead`);
    const franchise = game.franchise || (numId === 101 ? 'SoulsBorne Universe' : `${game.title} Universe`);
    const storageFootprint = game.storageFootprint || (numId === 101 ? '60 GB NVMe' : '55 GB SSD');
    const releaseYear = game.releaseYear || 2022;

    const platforms = game.platforms && game.platforms.length > 0
      ? game.platforms
      : ['PC (Steam)', 'PlayStation 5', 'Xbox Series X/S'];

    const heroBackdrop = game.heroBackdrop || (numId === 101
      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQ_SJYkjDfoqOGfBb1oDlgnIyuwjICCF3qS0mpy857SWdSUFu0N8doue8AEFDFM-oxxVnJHAn5M3cSPl3UCZfMh_PVujpS1adOxtacpnF5Si5Nk6a9PFsPLsGJknykn1b4ntRC9gptYAy49G9UtO6z_qW0k8gs4A_S2ohdpF8oqfh8A50ow5DQNZ9g4kod1YtdnbzpEACCOuDbJTL--W4nQY_wEP3swIJdSTFqFW1rhdxBtaMgY2GnJw'
      : game.coverImage);

    const description = game.description || (numId === 101
      ? 'Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.'
      : `Immerse yourself in ${game.title}, an acclaimed experience developed by ${developer}. Featuring tactical depth, rich worldbuilding, and immersive systems.`);

    return {
      id: game.id,
      title: game.title,
      developer,
      publisher,
      director,
      franchise,
      releaseYear,
      avgRating: game.avgRating || 9.2,
      coverImage: game.coverImage || '/images/eldenring.jpg',
      heroBackdrop,
      description,
      genres: game.genres || ['Action', 'Adventure'],
      platforms,
      storageFootprint,
      refCode: `ARCHIVE • REF #${game.title.slice(0, 2).toUpperCase()}-${releaseYear}`,
      criticConsensus: '97% Universal Acclaim',
      verifiedCritiquesCount: 1482,

      // Hardware feature badges
      supportedFeatures: [
        { label: 'Ray Tracing', icon: 'hdr_on', isGold: true },
        { label: 'Cloud Saves', icon: 'cloud_done', isGreen: true },
        { label: 'Steam Deck Verified', icon: 'verified', isGold: true },
        { label: 'Full Controller Support', icon: 'sports_esports' },
        { label: '4K HDR Ready', icon: 'tv' },
      ],

      // User Enrollment Telemetry
      enrollment: libraryEntry ? {
        isInLibrary: true,
        libraryEntryId: libraryEntry.id,
        platform: libraryEntry.platform,
        status: libraryEntry.status,
        playtimeHours: libraryEntry.playtimeHours,
        lastPlayedDate: libraryEntry.lastPlayedDate,
        progressPercent: libraryEntry.progressPercent || game.progressPercent || 85,
        subGoal: libraryEntry.subGoal || game.subGoal || 'Main Campaign Mastery',
        vaultRank: '#04 / 142',
        tierLabel: 'Tier: Diamond S',
        percentile: '98.4th Percentile',
      } : {
        isInLibrary: false,
        libraryEntryId: null,
        platform: platforms[0],
        status: null,
        playtimeHours: 0,
        lastPlayedDate: null,
        progressPercent: 0,
        subGoal: 'Not Enrolled in Vault',
        vaultRank: 'Unranked',
        tierLabel: 'Uncatalogued',
        percentile: 'N/A',
      },

      // Achievements Data
      achievements: {
        totalCount: achievements.length,
        unlockedCount: unlockedAchievements.length,
        totalPoints,
        earnedPoints,
        progressPercent: achievementProgress,
        list: achievements,
        showcase: achievements.slice(0, 5),
      },

      // Reviews & Critiques Data
      reviews: {
        communityAvg: avgScore,
        totalCritiques: gameReviews.length,
        userReview,
        curatorReviews: communityReviews,
      },
    };
  },

  /**
   * Update the user's library enrollment status for this game
   * @param {number} gameId 
   * @param {string} newStatus 'Playing', 'Backlog', 'Completed', 'On Hold', 'Dropped'
   * @param {number} userId 
   */
  async updateGameStatus(gameId, newStatus, userId = 1) {
    await simulateDelay(100);
    const numId = Number(gameId);
    const userLibrary = await libraryService.getUserLibrary(userId);
    const existing = userLibrary.find((e) => e.gameId === numId);

    if (existing) {
      return await libraryService.updateLibraryEntry(existing.id, { status: newStatus });
    } else {
      const game = mockGames.find((g) => g.id === numId);
      const defaultPlatform = game?.platforms?.[0] || 'PC';
      return await libraryService.addLibraryEntry(userId, {
        gameId: numId,
        platform: defaultPlatform,
        status: newStatus,
        playtimeHours: 0,
      });
    }
  },

  /**
   * Update the archive record details: status, playtime, rating, and notes
   */
  async updateArchiveRecord(gameId, { status, playtimeHours, rating, notes, platform }, userId = 1) {
    await simulateDelay(150);
    const numId = Number(gameId);
    const userLibrary = await libraryService.getUserLibrary(userId);
    const existing = userLibrary.find((e) => e.gameId === numId);

    let updatedEntry;
    if (existing) {
      updatedEntry = await libraryService.updateLibraryEntry(existing.id, {
        status,
        playtimeHours,
        platform,
      });
    } else {
      updatedEntry = await libraryService.addLibraryEntry(userId, {
        gameId: numId,
        platform: platform || 'PC',
        status: status || 'Playing',
        playtimeHours: playtimeHours || 0,
      });
    }

    // If rating or notes provided, save to user review
    if (rating !== undefined || (notes && notes.trim() !== '')) {
      await this.saveUserReview(numId, {
        rating: rating !== undefined ? Number(rating) : 10,
        quote: notes || '',
        hoursLogged: playtimeHours || existing?.playtimeHours || 0,
      }, userId);
    }

    return updatedEntry;
  },

  /**
   * Remove a game from the user's personal vault
   */
  async removeGameFromVault(gameId, userId = 1) {
    await simulateDelay(120);
    const numId = Number(gameId);
    const userLibrary = await libraryService.getUserLibrary(userId);
    const existing = userLibrary.find((e) => e.gameId === numId);
    if (existing) {
      return await libraryService.removeLibraryEntry(existing.id);
    }
    return null;
  },

  /**
   * Save or update signed-in user's critique for this game
   */
  async saveUserReview(gameId, { rating, quote, hoursLogged }, userId = 1) {
    await simulateDelay(120);
    const numId = Number(gameId);
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const existingIndex = mockReviewsState.findIndex((r) => r.gameId === numId && r.userId === userId);
    if (existingIndex !== -1) {
      mockReviewsState[existingIndex] = {
        ...mockReviewsState[existingIndex],
        rating: Number(rating),
        quote: quote || mockReviewsState[existingIndex].quote,
        hoursLogged: hoursLogged !== undefined ? Number(hoursLogged) : mockReviewsState[existingIndex].hoursLogged,
        editedDate: today,
      };
      return mockReviewsState[existingIndex];
    } else {
      const newReview = {
        id: Math.max(0, ...mockReviewsState.map((r) => r.id)) + 1,
        gameId: numId,
        userId,
        authorName: 'Kaelen_V',
        authorAvatar: '/images/avatar.jpg',
        authorBadge: 'MASTER CURATOR',
        isUserReview: true,
        hoursLogged: Number(hoursLogged || 0),
        rating: Number(rating || 10),
        ratingLabel: Number(rating) === 10 ? 'Masterpiece' : `${rating}/10`,
        quote: quote || 'A remarkable addition to the Master Vault archive.',
        postedDate: today,
        editedDate: null,
        helpfulCount: 1,
        isHelpfulMarked: false,
      };
      mockReviewsState.push(newReview);
      return newReview;
    }
  },

  /**
   * Toggle helpful vote on a curator review
   */
  async toggleHelpfulReview(reviewId) {
    await simulateDelay(60);
    const review = mockReviewsState.find((r) => r.id === Number(reviewId));
    if (review) {
      if (review.isHelpfulMarked) {
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        review.isHelpfulMarked = false;
      } else {
        review.helpfulCount += 1;
        review.isHelpfulMarked = true;
      }
      return { helpfulCount: review.helpfulCount, isHelpfulMarked: review.isHelpfulMarked };
    }
    return null;
  },
};
