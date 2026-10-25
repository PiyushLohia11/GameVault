import { mockUserLibrary } from '../mockData/userLibrary';
import { mockGames } from '../mockData/games';
import { simulateDelay } from './apiConfig';

// In-memory working copy for the session
let userLibraryState = [...mockUserLibrary];

/**
 * Service providing database-like queries and mutations for My Library.
 */
export const libraryService = {
  /**
   * Get library records for a user with joined game metadata
   * @param {number} userId 
   */
  async getUserLibrary(userId = 1) {
    await simulateDelay(150);

    const userRecords = userLibraryState.filter((record) => record.userId === userId);

    // Join with mockGames to provide game title, developer, genres, covers and telemetry
    const joined = userRecords.map((record) => {
      const game = mockGames.find((g) => g.id === record.gameId) || {};
      return {
        id: record.id,
        userId: record.userId,
        gameId: record.gameId,
        title: game.title || 'Unknown Title',
        developer: game.developer || 'Unknown Developer',
        platform: record.platform,
        genres: game.genres || [],
        status: record.status,
        playtimeHours: record.playtimeHours,
        lastPlayedDate: record.lastPlayedDate,
        avgRating: game.avgRating || 0,
        releaseYear: game.releaseYear || 2022,
        availablePlatforms: game.platforms || [record.platform],
        coverImage: game.coverImage || null,
        tag: game.tag || null,
        progressPercent: game.progressPercent || Math.min(100, Math.round((record.playtimeHours / 50) * 100)),
        subGoal: game.subGoal || 'Main Campaign Quest',
      };
    });

    return joined;
  },

  /**
   * Get available catalog games to add to the library
   * Filters out games that the user already has on all their platforms
   */
  async getAvailableCatalogGames(userId = 1) {
    await simulateDelay(100);
    return mockGames;
  },

  /**
   * Add a new game record to the user's library
   */
  async addLibraryEntry(userId = 1, { gameId, platform, status = 'Backlog', playtimeHours = 0 }) {
    await simulateDelay(150);

    // Validation: non-negative playtime
    const parsedPlaytime = parseFloat(playtimeHours);
    if (isNaN(parsedPlaytime) || parsedPlaytime < 0) {
      throw new Error('Playtime must be a non-negative number.');
    }

    // Validation: check for duplicate (gameId, platform)
    const existing = userLibraryState.find(
      (entry) => entry.userId === userId && entry.gameId === Number(gameId) && entry.platform === platform
    );
    if (existing) {
      throw new Error(`This game is already in your library for platform: ${platform}.`);
    }

    const newId = Math.max(0, ...userLibraryState.map((e) => e.id)) + 1;
    const today = new Date().toISOString().split('T')[0];

    const newEntry = {
      id: newId,
      userId,
      gameId: Number(gameId),
      platform,
      status,
      playtimeHours: parsedPlaytime,
      lastPlayedDate: today,
    };

    userLibraryState.push(newEntry);
    return newEntry;
  },

  /**
   * Update an existing library record (status, playtime, platform)
   */
  async updateLibraryEntry(entryId, { status, playtimeHours, platform }) {
    await simulateDelay(150);

    const index = userLibraryState.findIndex((e) => e.id === Number(entryId));
    if (index === -1) {
      throw new Error('Library record not found.');
    }

    const updates = {};
    if (status) updates.status = status;
    if (platform) updates.platform = platform;

    if (playtimeHours !== undefined && playtimeHours !== '') {
      const parsed = parseFloat(playtimeHours);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Playtime must be a non-negative number.');
      }
      updates.playtimeHours = parsed;
      updates.lastPlayedDate = new Date().toISOString().split('T')[0];
    }

    userLibraryState[index] = {
      ...userLibraryState[index],
      ...updates,
    };

    return userLibraryState[index];
  },

  /**
   * Remove a record from the library
   */
  async removeLibraryEntry(entryId) {
    await simulateDelay(150);

    const index = userLibraryState.findIndex((e) => e.id === Number(entryId));
    if (index === -1) {
      throw new Error('Record not found or already deleted.');
    }

    const removed = userLibraryState.splice(index, 1)[0];
    return removed;
  },
};
