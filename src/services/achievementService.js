import { mockAchievements, mockUserAchievements } from '../mockData/achievements';
import { mockGames } from '../mockData/games';
import { mockUserLibrary } from '../mockData/userLibrary';
import { simulateDelay } from './apiConfig';

// In-memory relational state for user achievements during the session
let userAchievementsState = [...mockUserAchievements];

/**
 * Service handling relational database-like queries and mutations
 * for the Achievements / Mastery module.
 * 
 * Conforms to requirements/05-achievements.md:
 * - Joins USER_ACHIEVEMENT with ACHIEVEMENT and GAME tables.
 * - Displays user-specific unlock states, timestamps, and point metrics.
 * - Calculates per-game telemetry and global mastery summaries.
 */
export const achievementService = {
  /**
   * Get all games that have achievements, with per-game progress metrics
   * @param {number} userId 
   */
  async getTrackedGames(userId = 1) {
    await simulateDelay(60);

    // Get list of unique game IDs present in achievements
    const gameIds = [...new Set(mockAchievements.map((a) => a.gameId))];

    return gameIds.map((gameId) => {
      const game = mockGames.find((g) => g.id === gameId) || { id: gameId, title: 'Unknown Title' };
      const libraryEntry = mockUserLibrary.find((l) => l.userId === userId && l.gameId === gameId);

      const gameAchievements = mockAchievements.filter((a) => a.gameId === gameId);
      const userRecords = userAchievementsState.filter((ua) => ua.userId === userId);

      const userGameUnlocks = gameAchievements.filter((ach) => {
        const ua = userRecords.find((r) => r.achievementId === ach.id);
        return ua ? ua.isUnlocked : false;
      });

      const totalPoints = gameAchievements.reduce((sum, a) => sum + (a.points || 0), 0);
      const pointsEarned = userGameUnlocks.reduce((sum, a) => sum + (a.points || 0), 0);
      const progressPercent = gameAchievements.length > 0 
        ? Math.round((userGameUnlocks.length / gameAchievements.length) * 100) 
        : 0;

      // Find last unlock date
      const unlockDates = userGameUnlocks
        .map((ach) => {
          const ua = userRecords.find((r) => r.achievementId === ach.id);
          return ua?.unlockedAt ? new Date(ua.unlockedAt).getTime() : 0;
        })
        .filter(Boolean);
      const lastUnlockTimestamp = unlockDates.length > 0 ? Math.max(...unlockDates) : null;
      const lastUnlockDate = lastUnlockTimestamp ? new Date(lastUnlockTimestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : null;

      return {
        id: game.id,
        title: game.title,
        developer: game.developer || 'Unknown Studio',
        releaseYear: game.releaseYear || 2022,
        coverImage: game.coverImage || '/images/eldenring.jpg',
        platforms: game.platforms || ['PC'],
        status: libraryEntry?.status || 'Archived',
        playtimeHours: libraryEntry?.playtimeHours || 0,
        totalAchievements: gameAchievements.length,
        unlockedCount: userGameUnlocks.length,
        progressPercent,
        totalPoints,
        pointsEarned,
        isMastered: progressPercent === 100 && gameAchievements.length > 0,
        lastUnlockDate,
      };
    });
  },

  /**
   * Get user achievements with full relational joins
   * Joins: USER_ACHIEVEMENT -> ACHIEVEMENT -> GAME
   */
  async getUserAchievements(userId = 1, filters = {}) {
    await simulateDelay(100);

    const {
      gameId = null,
      status = 'all', // 'all', 'unlocked', 'locked'
      search = '',
      sortBy = 'points_desc', // 'points_desc', 'points_asc', 'recent', 'rarity', 'alpha'
      category = 'all',
    } = filters;

    // 1. Relational join
    let joined = mockAchievements.map((ach) => {
      const userRecord = userAchievementsState.find(
        (ua) => ua.userId === userId && ua.achievementId === ach.id
      );
      const game = mockGames.find((g) => g.id === ach.gameId) || {};

      const isUnlocked = userRecord ? Boolean(userRecord.isUnlocked) : false;
      const unlockedAt = userRecord ? userRecord.unlockedAt : null;
      const currentStep = userRecord?.currentStep || ach.currentStep || null;

      return {
        id: ach.id,
        gameId: ach.gameId,
        gameTitle: game.title || 'Unknown Title',
        gameCover: game.coverImage || null,
        title: ach.title,
        description: ach.description,
        points: ach.points,
        category: ach.category || 'Campaign',
        rarityPercent: ach.rarityPercent || 25.0,
        rarityLabel: ach.rarityLabel || 'Common',
        iconName: ach.iconName || 'trophy',
        milestoneCode: ach.milestoneCode || `ML-${String(ach.id).padStart(3, '0')}`,
        isSecret: Boolean(ach.isSecret),
        totalSteps: ach.totalSteps || null,
        currentStep,
        stepLabel: ach.stepLabel || null,
        missingItems: ach.missingItems || null,
        isUnlocked,
        unlockedAt,
      };
    });

    // 2. Filter by game
    if (gameId && gameId !== 'all') {
      const numGameId = Number(gameId);
      joined = joined.filter((a) => a.gameId === numGameId);
    }

    // 3. Filter by category
    if (category && category !== 'all') {
      joined = joined.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }

    // 4. Filter by unlock status
    if (status === 'unlocked') {
      joined = joined.filter((a) => a.isUnlocked);
    } else if (status === 'locked') {
      joined = joined.filter((a) => !a.isUnlocked);
    }

    // 5. Filter by text search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      joined = joined.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.gameTitle.toLowerCase().includes(q) ||
          a.milestoneCode.toLowerCase().includes(q)
      );
    }

    // 6. Sorting
    joined.sort((a, b) => {
      switch (sortBy) {
        case 'points_desc':
          return b.points - a.points;
        case 'points_asc':
          return a.points - b.points;
        case 'recent': {
          if (!a.unlockedAt && !b.unlockedAt) return 0;
          if (!a.unlockedAt) return 1;
          if (!b.unlockedAt) return -1;
          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
        }
        case 'rarity':
          return a.rarityPercent - b.rarityPercent;
        case 'alpha':
          return a.title.localeCompare(b.title);
        default:
          return b.points - a.points;
      }
    });

    return joined;
  },

  /**
   * Get high-level telemetry and KPI summary for user
   * @param {number} userId 
   */
  async getTelemetrySummary(userId = 1) {
    await simulateDelay(60);

    const all = mockAchievements.map((ach) => {
      const ua = userAchievementsState.find(
        (u) => u.userId === userId && u.achievementId === ach.id
      );
      return {
        ...ach,
        isUnlocked: ua ? Boolean(ua.isUnlocked) : false,
        unlockedAt: ua ? ua.unlockedAt : null,
      };
    });

    const totalPossiblePoints = all.reduce((sum, a) => sum + a.points, 0);
    const unlockedList = all.filter((a) => a.isUnlocked);
    const totalPointsAccrued = unlockedList.reduce((sum, a) => sum + a.points, 0);
    const totalMilestonesAvailable = all.length;
    const totalMilestonesUnlocked = unlockedList.length;

    // Per-game calculation for mastered titles
    const gameIds = [...new Set(all.map((a) => a.gameId))];
    let masteredCount = 0;
    let totalCompletionPercentageSum = 0;

    gameIds.forEach((gId) => {
      const gameAchs = all.filter((a) => a.gameId === gId);
      const gameUnlocks = gameAchs.filter((a) => a.isUnlocked);
      const percent = gameAchs.length > 0 ? (gameUnlocks.length / gameAchs.length) * 100 : 0;
      totalCompletionPercentageSum += percent;
      if (percent === 100 && gameAchs.length > 0) {
        masteredCount += 1;
      }
    });

    const averageCompletionRate = gameIds.length > 0 
      ? (totalCompletionPercentageSum / gameIds.length).toFixed(1) 
      : '0.0';

    const pointsYieldPercent = totalPossiblePoints > 0
      ? ((totalPointsAccrued / totalPossiblePoints) * 100).toFixed(1)
      : '0.0';

    const milestoneYieldPercent = totalMilestonesAvailable > 0
      ? ((totalMilestonesUnlocked / totalMilestonesAvailable) * 100).toFixed(1)
      : '0.0';

    return {
      totalPointsAccrued,
      totalPossiblePoints,
      pointsYieldPercent,
      monthlyDelta: '+340',
      totalMilestonesUnlocked,
      totalMilestonesAvailable,
      milestoneYieldPercent,
      milestonesRemaining: totalMilestonesAvailable - totalMilestonesUnlocked,
      gamesMasteredCount: masteredCount,
      totalGamesTracked: gameIds.length,
      gamesMasteredPercent: gameIds.length > 0 ? ((masteredCount / gameIds.length) * 100).toFixed(1) : '0.0',
      averageCompletionRate,
    };
  },

  /**
   * Toggle unlock state of an achievement (interactive simulation)
   * @param {number} achievementId 
   * @param {number} userId 
   */
  async toggleAchievementUnlock(achievementId, userId = 1) {
    await simulateDelay(80);

    const index = userAchievementsState.findIndex(
      (ua) => ua.userId === userId && ua.achievementId === achievementId
    );

    if (index >= 0) {
      const current = userAchievementsState[index];
      const nextUnlocked = !current.isUnlocked;
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      userAchievementsState[index] = {
        ...current,
        isUnlocked: nextUnlocked,
        unlockedAt: nextUnlocked ? nowStr : null,
      };

      // Also update mockAchievements for backwards compatibility with dashboardService
      const baseAch = mockAchievements.find((a) => a.id === achievementId);
      if (baseAch) {
        baseAch.isUnlocked = nextUnlocked;
        baseAch.unlockedAt = nextUnlocked ? nowStr : null;
      }

      return {
        success: true,
        achievementId,
        isUnlocked: nextUnlocked,
        unlockedAt: nextUnlocked ? nowStr : null,
      };
    }

    return { success: false, message: 'Record not found' };
  },

  /**
   * Export user achievements to CSV format and trigger download
   * @param {number} userId 
   */
  async exportAchievementsCSV(userId = 1) {
    const list = await this.getUserAchievements(userId, { status: 'all', sortBy: 'points_desc' });

    const headers = ['Milestone Code', 'Game Title', 'Achievement Title', 'Points', 'Status', 'Unlocked Date', 'Rarity', 'Category', 'Description'];
    const rows = list.map((a) => [
      `"${a.milestoneCode}"`,
      `"${a.gameTitle.replace(/"/g, '""')}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      a.points,
      a.isUnlocked ? 'UNLOCKED' : 'LOCKED',
      a.unlockedAt ? `"${a.unlockedAt}"` : '""',
      `"${a.rarityPercent}% (${a.rarityLabel})"`,
      `"${a.category}"`,
      `"${a.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `valence_vault_achievements_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, count: list.length };
  },
};
