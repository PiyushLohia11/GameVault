import { mockUserLibrary } from '../mockData/userLibrary';
import { mockGames } from '../mockData/games';
import { simulateDelay, USE_MOCK, API_BASE_URL } from './apiConfig';

// In-memory working copy for the session
let userLibraryState = [...mockUserLibrary];

/**
 * Service providing database-like queries and mutations for My Library.
 * Fully integrated with Member 3's Java Backend & JDBC Server.
 */
export const libraryService = {
  /**
   * Helper to enrich a library record with full game metadata
   */
  _enrichRecord(record, idx = 0) {
    const gid = Number(record.gameId || record.id);
    const game = mockGames.find(
      (g) => g.id === gid || g.gameId === gid || (record.title && g.title?.toLowerCase() === record.title?.toLowerCase())
    ) || {};

    const playtime = record.playtimeHours !== undefined ? parseFloat(record.playtimeHours) : 0.0;
    const today = new Date().toISOString().split('T')[0];

    return {
      id: record.id || idx + 1,
      userId: record.userId || 1,
      gameId: gid,
      title: record.title || game.title || 'Unknown Title',
      developer: record.developer || game.developer || game.developerName || 'Featured Studio',
      platform: record.platform || (game.platforms ? game.platforms[0] : 'PC'),
      genres: record.genres && record.genres.length > 0 ? record.genres : (game.genres || ['Action', 'RPG']),
      status: record.status || 'Backlog',
      playtimeHours: isNaN(playtime) ? 0.0 : playtime,
      lastPlayedDate: record.lastPlayedDate || today,
      avgRating: record.avgRating || game.avgRating || 9.0,
      releaseYear: record.releaseYear || game.releaseYear || 2022,
      availablePlatforms: game.platforms || [record.platform || 'PC'],
      coverImage: record.coverImage || game.coverImage || '/images/default-game.jpg',
      tag: record.tag || game.tag || null,
      progressPercent: record.progressPercent || game.progressPercent || Math.min(100, Math.round((playtime / 50) * 100)),
      subGoal: record.subGoal || game.subGoal || 'Main Campaign Quest',
    };
  },

  /**
   * Get library records for a user with joined game metadata
   * @param {number} userId 
   */
  async getUserLibrary(userId = 1) {
    await simulateDelay(80);

    // If live Java backend is active, fetch from ServerSocket API
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE_URL}/library?userId=${userId}`);
        if (res.ok) {
          const backendRecords = await res.json();
          if (Array.isArray(backendRecords) && backendRecords.length > 0) {
            // Merge backend records with any newly added local session records
            const enrichedBackend = backendRecords.map((r, i) => this._enrichRecord(r, i));
            // Also keep any locally added records that aren't in backend
            userLibraryState.forEach((local) => {
              const alreadyInBackend = enrichedBackend.some(
                (b) => b.gameId === local.gameId && b.platform === local.platform
              );
              if (!alreadyInBackend) {
                enrichedBackend.push(this._enrichRecord(local, enrichedBackend.length));
              }
            });
            return enrichedBackend;
          }
        }
      } catch (err) {
        console.warn('[libraryService] Java Backend library fetch failed, using memory state:', err.message);
      }
    }

    const userRecords = userLibraryState.filter((record) => (record.userId || 1) === userId);
    return userRecords.map((r, idx) => this._enrichRecord(r, idx));
  },

  /**
   * Get available catalog games to add to the library
   */
  async getAvailableCatalogGames(userId = 1) {
    await simulateDelay(60);
    return mockGames.map((g) => ({
      id: g.id || g.gameId,
      gameId: g.id || g.gameId,
      title: g.title,
      developer: g.developer,
      platforms: g.platforms || ['PC'],
      genres: g.genres || [],
      coverImage: g.coverImage || null,
    }));
  },

  /**
   * Add a new game record to the user's library
   * Supports both: addLibraryEntry(userId, data) and addLibraryEntry(data)
   */
  async addLibraryEntry(...args) {
    await simulateDelay(80);

    let userId = 1;
    let data = {};
    if (args.length >= 2) {
      userId = args[0] || 1;
      data = args[1] || {};
    } else if (args.length === 1) {
      data = args[0] || {};
    }

    const { gameId, platform, status = 'Backlog', playtimeHours = 0 } = data;

    const parsedPlaytime = parseFloat(playtimeHours);
    if (isNaN(parsedPlaytime) || parsedPlaytime < 0) {
      throw new Error('Playtime must be a non-negative number.');
    }

    const numGameId = Number(gameId);
    if (!numGameId) {
      throw new Error('Invalid game ID provided.');
    }

    // Attempt live Java backend sync
    if (!USE_MOCK) {
      try {
        await fetch(`${API_BASE_URL}/library`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            gameId: numGameId,
            platformId: 1,
            status,
          }),
        });
      } catch (err) {
        console.warn('[libraryService] Java Backend add failed, adding to memory state:', err.message);
      }
    }

    const newId = Math.max(0, ...userLibraryState.map((e) => Number(e.id) || 0)) + 1;
    const today = new Date().toISOString().split('T')[0];

    // Build the fully enriched entry so the frontend never sees "undefined"
    const rawEntry = {
      id: newId,
      userId,
      gameId: numGameId,
      platform: platform || 'PC',
      status,
      playtimeHours: parsedPlaytime,
      lastPlayedDate: today,
    };

    const fullRecord = this._enrichRecord(rawEntry, newId);
    userLibraryState.unshift(fullRecord);
    return fullRecord;
  },

  /**
   * Update an existing library record (status, playtime, platform)
   * Supports both: updateLibraryEntry(userId, entryId, updates) and updateLibraryEntry(entryId, updates)
   */
  async updateLibraryEntry(...args) {
    await simulateDelay(80);

    let entryId;
    let updates;
    if (args.length >= 3) {
      // Called as: updateLibraryEntry(userId, entryId, updates)
      entryId = args[1];
      updates = args[2] || {};
    } else {
      // Called as: updateLibraryEntry(entryId, updates)
      entryId = args[0];
      updates = args[1] || {};
    }

    const index = userLibraryState.findIndex((e) => Number(e.id) === Number(entryId));
    if (index === -1) {
      throw new Error('Library record not found.');
    }

    const current = userLibraryState[index];
    const newUpdates = {};
    if (updates.status) newUpdates.status = updates.status;
    if (updates.platform) newUpdates.platform = updates.platform;

    if (updates.playtimeHours !== undefined && updates.playtimeHours !== '') {
      const parsed = parseFloat(updates.playtimeHours);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Playtime must be a non-negative number.');
      }
      newUpdates.playtimeHours = parsed;
      newUpdates.lastPlayedDate = new Date().toISOString().split('T')[0];
    }

    // Attempt live Java backend sync
    if (!USE_MOCK) {
      try {
        await fetch(`${API_BASE_URL}/library`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: current.userId || 1,
            gameId: current.gameId,
            status: newUpdates.status || current.status,
            platform: newUpdates.platform || current.platform,
            playtimeHours: newUpdates.playtimeHours !== undefined ? newUpdates.playtimeHours : current.playtimeHours,
          }),
        });
      } catch (err) {
        console.warn('[libraryService] Java Backend update failed:', err.message);
      }
    }

    const updatedRecord = this._enrichRecord({
      ...current,
      ...newUpdates,
    });

    userLibraryState[index] = updatedRecord;
    return updatedRecord;
  },

  /**
   * Quick update playtime hours (+1 hr)
   * Supports both: updatePlaytimeHours(userId, entryId, newHours) and updatePlaytimeHours(entryId, newHours)
   */
  async updatePlaytimeHours(...args) {
    let entryId, newHours;
    if (args.length >= 3) {
      entryId = args[1];
      newHours = args[2];
    } else {
      entryId = args[0];
      newHours = args[1];
    }
    return this.updateLibraryEntry(entryId, { playtimeHours: newHours });
  },

  /**
   * Remove a record from the library
   * Supports both: removeLibraryEntry(userId, entryId) and removeLibraryEntry(entryId)
   */
  async removeLibraryEntry(...args) {
    await simulateDelay(80);

    let entryId;
    if (args.length >= 2) {
      entryId = args[1];
    } else {
      entryId = args[0];
    }

    const index = userLibraryState.findIndex((e) => Number(e.id) === Number(entryId));
    if (index === -1) {
      throw new Error('Record not found or already deleted.');
    }

    const removed = userLibraryState.splice(index, 1)[0];
    return removed;
  },
};
