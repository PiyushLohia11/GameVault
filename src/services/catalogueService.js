import { mockGames } from '../mockData/games';
import { libraryService } from './libraryService';
import { simulateDelay, USE_MOCK, API_BASE_URL } from './apiConfig';

/**
 * Service providing database-like queries and operations for the Discover / Game Catalogue.
 * Handles joins between master catalogue games and the user's active library state.
 * Fully integrated with Member 3's Java Backend & JDBC Server.
 */
export const catalogueService = {
  /**
   * Helper to fetch raw games from Java Backend or fallback to mockGames
   */
  async _fetchBaseGames() {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE_URL}/games`);
        if (res.ok) {
          const backendGames = await res.json();
          if (Array.isArray(backendGames) && backendGames.length > 0) {
            // Merge with mock game metadata (covers, tags) for rich UI display
            return backendGames.map((bg) => {
              const matchedMock = mockGames.find(
                (mg) => mg.title?.toLowerCase() === bg.title?.toLowerCase() || mg.id === bg.gameId
              ) || {};
              return {
                ...matchedMock,
                id: bg.gameId || matchedMock.id || 1,
                title: bg.title || matchedMock.title,
                developer: bg.developerName || matchedMock.developer,
                releaseYear: bg.releaseYear || matchedMock.releaseYear || 2022,
                genres: bg.genres && bg.genres.length > 0 ? bg.genres : (matchedMock.genres || []),
                platforms: bg.platforms && bg.platforms.length > 0 ? bg.platforms : (matchedMock.platforms || []),
                avgRating: bg.avgRating !== undefined ? bg.avgRating : (matchedMock.avgRating || 0),
                coverImage: matchedMock.coverImage || '/images/default-game.jpg',
                tag: matchedMock.tag || 'Verified Vault',
                progressPercent: matchedMock.progressPercent || 0,
                subGoal: matchedMock.subGoal || 'Main Campaign Quest',
              };
            });
          }
        }
      } catch (err) {
        console.warn('[catalogueService] Java Backend unavailable, falling back to mockGames:', err.message);
      }
    }
    return mockGames;
  },

  /**
   * Get games for the catalogue with user ownership annotations, filtering, and sorting
   */
  async getCatalogueGames(userId = 1, filters = {}) {
    await simulateDelay(100);

    const {
      search = '',
      genre = 'All',
      platform = 'All',
      hideInLibrary = false,
      highRating = false,
      sortBy = 'popularity',
      page = 1,
      limit = 8,
    } = filters;

    const baseGames = await this._fetchBaseGames();

    // Get user's current library records to annotate ownership
    const userLibrary = await libraryService.getUserLibrary(userId);
    const libraryGameMap = new Map();
    userLibrary.forEach((entry) => {
      const gid = entry.gameId || entry.id;
      if (!libraryGameMap.has(gid)) {
        libraryGameMap.set(gid, []);
      }
      libraryGameMap.get(gid).push(entry);
    });

    // Annotate all catalogue games with library state
    let enrichedGames = baseGames.map((game) => {
      const userEntries = libraryGameMap.get(game.id) || [];
      const isInLibrary = userEntries.length > 0;
      const ownedPlatforms = userEntries.map((e) => e.platform);

      return {
        ...game,
        isInLibrary,
        ownedPlatforms,
        libraryEntries: userEntries,
      };
    });

    // 1. Text Search Filter (Title, Developer, Publisher, Genres)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      enrichedGames = enrichedGames.filter((g) => {
        const titleMatch = (g.title || '').toLowerCase().includes(q);
        const devMatch = (g.developer || '').toLowerCase().includes(q);
        const pubMatch = (g.publisher || '').toLowerCase().includes(q);
        const genreMatch = (g.genres || []).some((genreName) => genreName.toLowerCase().includes(q));
        return titleMatch || devMatch || pubMatch || genreMatch;
      });
    }

    // 2. Genre Filter
    if (genre && genre !== 'All' && genre !== 'All Genres') {
      enrichedGames = enrichedGames.filter((g) =>
        (g.genres || []).some((item) => item.toLowerCase() === genre.toLowerCase())
      );
    }

    // 3. Platform Filter
    if (platform && platform !== 'All' && platform !== 'All Platforms') {
      enrichedGames = enrichedGames.filter((g) =>
        (g.platforms || []).some((p) => {
          if (platform === 'Steam') return p.toLowerCase().includes('steam') || p.toLowerCase().includes('pc');
          if (platform === 'PlayStation 5') return p.toLowerCase().includes('playstation') || p.toLowerCase().includes('ps5');
          if (platform === 'GOG') return p.toLowerCase().includes('gog') || p.toLowerCase().includes('pc');
          if (platform === 'Xbox Cloud' || platform === 'Xbox') return p.toLowerCase().includes('xbox');
          if (platform === 'Switch') return p.toLowerCase().includes('switch') || p.toLowerCase().includes('nintendo');
          return p.toLowerCase().includes(platform.toLowerCase());
        })
      );
    }

    // 4. Hide in-library titles toggle
    if (hideInLibrary) {
      enrichedGames = enrichedGames.filter((g) => !g.isInLibrary);
    }

    // 5. High rating (8.5+) toggle
    if (highRating) {
      enrichedGames = enrichedGames.filter((g) => (g.avgRating || 0) >= 8.5);
    }

    // 6. Sorting
    enrichedGames.sort((a, b) => {
      switch (sortBy) {
        case 'rating_desc':
          return (b.avgRating || 0) - (a.avgRating || 0);
        case 'year_desc':
          return (b.releaseYear || 0) - (a.releaseYear || 0);
        case 'year_asc':
          return (a.releaseYear || 0) - (b.releaseYear || 0);
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title_desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'popularity':
        default:
          const scoreA = (a.avgRating || 0) * 10 + (a.releaseYear || 2020);
          const scoreB = (b.avgRating || 0) * 10 + (b.releaseYear || 2020);
          return scoreB - scoreA;
      }
    });

    const total = enrichedGames.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * limit;
    const paginatedGames = enrichedGames.slice(startIndex, startIndex + limit);

    return {
      games: paginatedGames,
      allMatchingGames: enrichedGames,
      total,
      page: safePage,
      totalPages,
      limit,
    };
  },

  /**
   * Get the featured spotlight game
   */
  async getFeaturedSpotlight(userId = 1) {
    await simulateDelay(60);
    const baseGames = await this._fetchBaseGames();
    const spotlightGame = baseGames.find((g) => g.isSpotlight) || baseGames[0];
    const userLibrary = await libraryService.getUserLibrary(userId);
    const userEntries = userLibrary.filter((e) => (e.gameId || e.id) === spotlightGame.id);

    return {
      ...spotlightGame,
      isInLibrary: userEntries.length > 0,
      ownedPlatforms: userEntries.map((e) => e.platform),
      libraryEntries: userEntries,
    };
  },

  /**
   * Get high-level telemetry and KPI statistics for the Discover header
   */
  async getCatalogueTelemetry(userId = 1) {
    await simulateDelay(60);
    const userLibrary = await libraryService.getUserLibrary(userId);
    const baseGames = await this._fetchBaseGames();

    return {
      totalCatalogued: baseGames.length >= 10 ? baseGames.length : 4820,
      platformsIndexed: 6,
      newReleasesMonth: 24,
      vaultOwnership: userLibrary.length,
      vaultTotalRatio: `${userLibrary.length} / ${baseGames.length >= 10 ? baseGames.length : '4,820'}`,
    };
  },

  /**
   * Direct fetch single game by ID
   */
  async getGameById(id) {
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE_URL}/games?id=${id}`);
        if (res.ok) {
          const bg = await res.json();
          const matchedMock = mockGames.find((mg) => mg.id === Number(id)) || {};
          return {
            ...matchedMock,
            id: bg.gameId || id,
            title: bg.title || matchedMock.title,
            developer: bg.developerName || matchedMock.developer,
            releaseYear: bg.releaseYear || matchedMock.releaseYear,
            genres: bg.genres || matchedMock.genres || [],
            platforms: bg.platforms || matchedMock.platforms || [],
            avgRating: bg.avgRating !== undefined ? bg.avgRating : matchedMock.avgRating,
          };
        }
      } catch (err) {
        console.warn('[catalogueService] getGameById fallback:', err.message);
      }
    }
    return mockGames.find((g) => g.id === Number(id)) || null;
  },

  /**
   * Add a game release from catalogue directly into the user's library
   */
  async addGameToUserLibrary(userId = 1, { gameId, platform, status = 'Backlog', playtimeHours = 0 }) {
    return await libraryService.addLibraryEntry(userId, {
      gameId: Number(gameId),
      platform,
      status,
      playtimeHours,
    });
  },
};
