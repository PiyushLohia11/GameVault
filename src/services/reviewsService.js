import { mockGames } from '../mockData/games';
import { mockUserLibrary } from '../mockData/userLibrary';
import { simulateDelay, USE_MOCK, API_BASE_URL } from './apiConfig';
import { apiRequest, apiJson } from './apiClient';

/**
 * Initial Relational Reviews Database State
 * Reflects schema: REVIEWS (id, game_id, user_id, author_name, author_badge, rating, headline, quote, hours_logged, recommend, spoilers, posted_date, edited_date, helpful_count, comments_count)
 */
let reviewsState = [
  // 1. User's Verified Review - Elden Ring (101)
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
    ratingLabel: 'MASTERPIECE',
    headline: 'A defining triumph of environmental storytelling and combat mastery.',
    quote: 'The Lands Between sets a standard for open-world freedom that respects player agency while delivering immaculate boss architecture and build diversity. An unmatched magnum opus.',
    recommend: true,
    spoilers: false,
    postedDate: 'Oct 20, 2023',
    editedDate: 'Nov 10, 2023',
    helpfulCount: 86,
    commentsCount: 18,
    isHelpfulMarked: false,
  },

  // 2. User's Verified Review - Armored Core VI (111)
  {
    id: 2,
    gameId: 111,
    userId: 1,
    authorName: 'Kaelen_V',
    authorAvatar: '/images/avatar.jpg',
    authorBadge: 'MASTER CURATOR',
    isUserReview: true,
    hoursLogged: 48.2,
    rating: 9,
    ratingLabel: 'EXCEPTIONAL',
    headline: 'High-octane assembly mechanics paired with blistering combat tempo.',
    quote: 'Mission pacing is razor-sharp, and the NG+ narrative divergences make repeated playthroughs feel mandatory. Customizing frame dynamics and energy loads offers staggering mechanical gratification.',
    recommend: true,
    spoilers: false,
    postedDate: 'Sep 15, 2023',
    editedDate: null,
    helpfulCount: 54,
    commentsCount: 8,
    isHelpfulMarked: false,
  },

  // 3. Community Review - Cyberpunk 2077 (102) by SynapseX
  {
    id: 3,
    gameId: 102,
    userId: 3,
    authorName: 'SynapseX',
    authorAvatar: null,
    authorInitial: 'S',
    authorBadge: 'LVL 39 • System Archivist',
    isUserReview: false,
    hoursLogged: 112.0,
    rating: 9,
    ratingLabel: 'EXCEPTIONAL',
    headline: 'Dogtown represents CDPR at their absolute narrative peak.',
    quote: 'The espionage thriller premise breathes immense depth into Night City’s combat overhaul and cyberware rebalance. Path tracing visually cements Night City as a landmark setting.',
    recommend: true,
    spoilers: false,
    postedDate: 'Dec 02, 2023',
    editedDate: null,
    helpfulCount: 32,
    commentsCount: 6,
    isHelpfulMarked: false,
  },

  // 4. Community Review - Baldur's Gate 3 (104) by Nyx_Runner
  {
    id: 4,
    gameId: 104,
    userId: 4,
    authorName: 'Nyx_Runner',
    authorAvatar: null,
    authorInitial: 'N',
    authorBadge: 'LVL 52 • Master Analyst',
    isUserReview: false,
    hoursLogged: 145.2,
    rating: 10,
    ratingLabel: 'MASTERPIECE',
    headline: 'Unprecedented CRPG reactivity and systemic freedom.',
    quote: 'Every act delivers consequence-laden storytelling where character builds tangibly reshape the narrative arc. Combat rewards tactical experimentation with verticality and environmental surfaces.',
    recommend: true,
    spoilers: false,
    postedDate: 'Aug 28, 2023',
    editedDate: null,
    helpfulCount: 118,
    commentsCount: 14,
    isHelpfulMarked: false,
  },

  // 5. User's Verified Review - Hollow Knight (103)
  {
    id: 5,
    gameId: 103,
    userId: 1,
    authorName: 'Kaelen_V',
    authorAvatar: '/images/avatar.jpg',
    authorBadge: 'MASTER CURATOR',
    isUserReview: true,
    hoursLogged: 56.5,
    rating: 10,
    ratingLabel: 'MASTERPIECE',
    headline: 'Hallownest is a melancholic labyrinth crafted with sublime hand-drawn elegance.',
    quote: 'Responsive swordplay, airtight hitboxes, and an unforgettable orchestral score culminate in the gold standard of 2D action adventure.',
    recommend: true,
    spoilers: false,
    postedDate: 'Sep 22, 2026',
    editedDate: null,
    helpfulCount: 77,
    commentsCount: 11,
    isHelpfulMarked: false,
  },

  // 6. Community Review - God of War Ragnarök (106) by Vesper_88
  {
    id: 6,
    gameId: 106,
    userId: 2,
    authorName: 'Vesper_88',
    authorAvatar: null,
    authorInitial: 'V',
    authorBadge: 'MASTER ANALYST',
    isUserReview: false,
    hoursLogged: 42.0,
    rating: 9,
    ratingLabel: 'EXCEPTIONAL',
    headline: 'A cinematic Norse finale that balances fatherhood with mythical devastation.',
    quote: 'Combat weight and axe recall mechanics remain unmatched in third-person action. The Valhalla expansion elevates rogue-lite loops to legendary narrative heights.',
    recommend: true,
    spoilers: true,
    postedDate: 'Aug 30, 2026',
    editedDate: null,
    helpfulCount: 65,
    commentsCount: 9,
    isHelpfulMarked: false,
  },

  // 7. User's Verified Review - Disco Elysium (113)
  {
    id: 7,
    gameId: 113,
    userId: 1,
    authorName: 'Kaelen_V',
    authorAvatar: '/images/avatar.jpg',
    authorBadge: 'MASTER CURATOR',
    isUserReview: true,
    hoursLogged: 54.0,
    rating: 10,
    ratingLabel: 'MASTERPIECE',
    headline: 'Literary brilliance meets uncompromising political satire.',
    quote: 'Revachol’s thought cabinet and internal psyche dialogues redefine interactive storytelling. There is genuinely nothing else like it in the medium.',
    recommend: true,
    spoilers: false,
    postedDate: 'Aug 25, 2026',
    editedDate: null,
    helpfulCount: 94,
    commentsCount: 15,
    isHelpfulMarked: false,
  },

  // 8. Community Review - Hades (105) by SynapseX
  {
    id: 8,
    gameId: 105,
    userId: 3,
    authorName: 'SynapseX',
    authorAvatar: null,
    authorInitial: 'S',
    authorBadge: 'LVL 39 • System Archivist',
    isUserReview: false,
    hoursLogged: 74.0,
    rating: 9,
    ratingLabel: 'EXCEPTIONAL',
    headline: 'Flawless synergy between isometric roguelike combat and episodic Olympian character drama.',
    quote: 'Failure never feels punishing—it unlocks deeper narrative layers. Boons interlock into chaotic, addictive builds.',
    recommend: true,
    spoilers: false,
    postedDate: 'Dec 12, 2023',
    editedDate: null,
    helpfulCount: 38,
    commentsCount: 5,
    isHelpfulMarked: false,
  },
];

/**
 * Reviews Service conforming strictly to requirements/07-reviews.md:
 * - Shows reviews for a selected game with rating and review date.
 * - Form to submit or update signed-in user review with 1-10 rating and validation.
 * - Sorting by newest, highest rating, or most helpful.
 * - Shows average rating per game.
 * - Enforces the rule that reviews can ONLY be submitted for games owned by the user.
 */
export const reviewsService = {
  /**
   * Get filtered and sorted reviews joined with game metadata and user library ownership
   */
  async getReviews(userId = 1, filters = {}) {
    if (!USE_MOCK) {
      const [raw, games, library] = await Promise.all([apiRequest(`/reviews?voterId=${userId}`), apiRequest('/games'), apiRequest(`/users/${userId}/library`)]);
      let joined = raw.map(r => {
        const game = games.find(g => g.id === r.gameId) || {};
        return { ...r, ratingLabel: `${r.rating}/10`, gameTitle: game.title || r.gameTitle,
          gameCover: game.coverImage || '/images/eldenring.jpg', gameDeveloper: game.developer || '',
          gameReleaseYear: game.releaseYear, gameGenres: game.genres || [], avgGameRating: game.avgRating || r.rating,
          isUserReview: r.userId === userId, isOwnedByCurrentUser: library.some(e => e.gameId === r.gameId),
          userPlaytime: library.find(e => e.gameId === r.gameId)?.playtimeHours || 0 };
      });
      const { viewTab='all', ratingFilter='all', gameId='all', search='', sortBy='highest' } = filters;
      if (viewTab === 'my_reviews' || ratingFilter === 'my_verified') joined = joined.filter(r => r.userId === userId);
      if (ratingFilter === 'masterpiece') joined = joined.filter(r => r.rating >= 9.5);
      if (ratingFilter === 'positive') joined = joined.filter(r => r.rating >= 7 && r.rating < 9.5);
      if (gameId !== 'all') joined = joined.filter(r => r.gameId === Number(gameId));
      if (search) joined = joined.filter(r => `${r.gameTitle} ${r.gameDeveloper} ${r.quote} ${r.authorName}`.toLowerCase().includes(search.toLowerCase()));
      joined.sort((a,b) => sortBy === 'newest' ? new Date(b.postedDate)-new Date(a.postedDate) : b.rating-a.rating);
      return joined;
    }
    await simulateDelay(120);

    const {
      viewTab = 'all', // 'all', 'my_reviews', 'pending'
      ratingFilter = 'all', // 'all', 'masterpiece', 'positive', 'my_verified'
      gameId = 'all',
      search = '',
      sortBy = 'highest', // 'highest', 'newest', 'helpful'
    } = filters;

    // Get user's active library to verify ownership
    const userOwnedGameIds = new Set(
      mockUserLibrary.filter((e) => e.userId === userId).map((e) => e.gameId)
    );

    // Sync live reviews from Java Backend if active
    if (!USE_MOCK) {
      try {
        const url = (gameId && gameId !== 'all') 
          ? `${API_BASE_URL}/reviews?gameId=${gameId}` 
          : `${API_BASE_URL}/reviews`;
        const res = await fetch(url);
        if (res.ok) {
          const backendReviews = await res.json();
          if (Array.isArray(backendReviews)) {
            backendReviews.forEach((br) => {
              const alreadyExists = reviewsState.some(
                (r) => r.gameId === br.gameId && r.userId === br.userId
              );
              if (!alreadyExists) {
                reviewsState.push({
                  id: reviewsState.length + 100,
                  gameId: br.gameId,
                  userId: br.userId,
                  authorName: br.username || 'Arjun',
                  authorAvatar: null,
                  authorBadge: 'JAVA JDBC VERIFIED',
                  isUserReview: br.userId === userId,
                  hoursLogged: 45.0,
                  rating: br.rating,
                  ratingLabel: br.rating === 10 ? 'MASTERPIECE' : br.rating >= 9 ? 'EXCEPTIONAL' : 'GREAT',
                  headline: br.gameTitle ? `Review for ${br.gameTitle}` : 'Verified Critique',
                  quote: br.reviewText || '',
                  recommend: br.rating >= 7,
                  spoilers: false,
                  postedDate: br.reviewDate || 'Oct 26, 2026',
                  editedDate: null,
                  helpfulCount: 15,
                  commentsCount: 3,
                  isHelpfulMarked: false,
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('[reviewsService] Java Backend reviews sync fallback:', err.message);
      }
    }

    // Relational join with mockGames
    let joined = reviewsState.map((rev) => {
      const game = mockGames.find((g) => g.id === rev.gameId) || {};
      const libraryEntry = mockUserLibrary.find((e) => e.userId === rev.userId && e.gameId === rev.gameId);

      // Calculate aggregate rating for this game across all reviews
      const gameReviews = reviewsState.filter((r) => r.gameId === rev.gameId);
      const avgGameRating = gameReviews.length > 0
        ? (gameReviews.reduce((sum, r) => sum + r.rating, 0) / gameReviews.length).toFixed(1)
        : (game.avgRating || 9.0).toFixed(1);

      return {
        ...rev,
        gameTitle: game.title || 'Unknown Game',
        gameCover: game.coverImage || '/images/eldenring.jpg',
        gameDeveloper: game.developer || 'Unknown Studio',
        gameReleaseYear: game.releaseYear || 2022,
        gameGenres: game.genres || ['Action'],
        avgGameRating,
        isOwnedByCurrentUser: userOwnedGameIds.has(rev.gameId),
        userPlaytime: libraryEntry?.playtimeHours || rev.hoursLogged || 0,
      };
    });

    // 1. Filter by View Tab
    if (viewTab === 'my_reviews') {
      joined = joined.filter((r) => r.userId === userId);
    }

    // 2. Filter by Rating Category
    if (ratingFilter === 'masterpiece') {
      joined = joined.filter((r) => r.rating >= 9.5);
    } else if (ratingFilter === 'positive') {
      joined = joined.filter((r) => r.rating >= 7 && r.rating < 9.5);
    } else if (ratingFilter === 'my_verified') {
      joined = joined.filter((r) => r.userId === userId);
    }

    // 3. Filter by Selected Game ID
    if (gameId && gameId !== 'all') {
      const numGameId = Number(gameId);
      joined = joined.filter((r) => r.gameId === numGameId);
    }

    // 4. Text Search Filter (Title, Developer, Headline, Quote, Author)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      joined = joined.filter((r) => {
        return (
          r.gameTitle.toLowerCase().includes(q) ||
          r.gameDeveloper.toLowerCase().includes(q) ||
          (r.headline || '').toLowerCase().includes(q) ||
          r.quote.toLowerCase().includes(q) ||
          r.authorName.toLowerCase().includes(q)
        );
      });
    }

    // 5. Sorting
    if (sortBy === 'highest') {
      joined.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      joined.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    } else if (sortBy === 'helpful') {
      joined.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }

    return joined;
  },

  /**
   * Get aggregate review stats and telemetry metrics
   */
  async getReviewStats(userId = 1) {
    if (!USE_MOCK) {
      const [all, library] = await Promise.all([apiRequest(`/reviews?voterId=${userId}`), apiRequest(`/users/${userId}/library`)]);
      const mine = all.filter(r => r.userId === userId);
      const avg = mine.length ? mine.reduce((n,r)=>n+r.rating,0)/mine.length : 0;
      const reviewed = new Set(mine.map(r=>r.gameId));
      const distribution = {10:0,9:0,8:0,7:0,6:0,5:0};
      all.forEach(r => { const k = Math.max(5, Math.min(10, Math.floor(r.rating))); distribution[k]++; });
      return { reviewsPenned:mine.length, percentageReviewed:library.length?((mine.length/library.length)*100).toFixed(1):'0.0',
        avgRatingGiven:avg.toFixed(1),totalHelpful:mine.reduce((n,r)=>n+(r.helpfulCount||0),0),unreviewedCount:library.filter(e=>!reviewed.has(e.gameId)).length,totalEvaluations:all.length,distribution };
    }
    await simulateDelay(80);

    const userReviews = reviewsState.filter((r) => r.userId === userId);
    const userLibrary = mockUserLibrary.filter((e) => e.userId === userId);

    // Reviews penned
    const reviewsPenned = userReviews.length;
    const libraryCount = userLibrary.length || 1;
    const percentageReviewed = ((reviewsPenned / libraryCount) * 100).toFixed(1);

    // Average rating given
    const avgRatingGiven = userReviews.length > 0
      ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
      : '0.0';

    // Helpful endorsements
    const totalHelpful = userReviews.reduce((sum, r) => sum + (r.helpfulCount || 0), 0);

    // Unreviewed owned games count
    const reviewedGameIds = new Set(userReviews.map((r) => r.gameId));
    const unreviewedCount = userLibrary.filter((e) => !reviewedGameIds.has(e.gameId)).length;

    // Rating distribution histogram (10, 9, 8, 7, 6, <=5)
    const distribution = {
      10: reviewsState.filter((r) => r.rating === 10).length,
      9: reviewsState.filter((r) => r.rating >= 9 && r.rating < 10).length,
      8: reviewsState.filter((r) => r.rating >= 8 && r.rating < 9).length,
      7: reviewsState.filter((r) => r.rating >= 7 && r.rating < 8).length,
      6: reviewsState.filter((r) => r.rating >= 6 && r.rating < 7).length,
      5: reviewsState.filter((r) => r.rating < 6).length,
    };

    return {
      reviewsPenned,
      percentageReviewed,
      avgRatingGiven,
      totalHelpful,
      unreviewedCount,
      totalEvaluations: reviewsState.length,
      distribution,
    };
  },

  /**
   * Get user's owned games eligible for review
   */
  async getEligibleOwnedGames(userId = 1) {
    if (!USE_MOCK) {
      const [library, games, mine] = await Promise.all([apiRequest(`/users/${userId}/library`), apiRequest('/games'), apiRequest(`/users/${userId}/reviews`)]);
      return library.map(e => { const g=games.find(x=>x.id===e.gameId)||{}; const review=mine.find(r=>r.gameId===e.gameId)||null;
        return { gameId:e.gameId,title:e.title||g.title,developer:e.developer||g.developer,coverImage:g.coverImage||'/images/eldenring.jpg',playtimeHours:e.playtimeHours,platform:e.platform,hasReviewed:!!review,existingReview:review }; });
    }
    await simulateDelay(60);

    const userLibrary = mockUserLibrary.filter((e) => e.userId === userId);
    const userReviews = reviewsState.filter((r) => r.userId === userId);
    const reviewedMap = new Map(userReviews.map((r) => [r.gameId, r]));

    return userLibrary.map((entry) => {
      const game = mockGames.find((g) => g.id === entry.gameId) || {};
      const existing = reviewedMap.get(entry.gameId) || null;
      return {
        gameId: entry.gameId,
        title: game.title || 'Unknown Title',
        developer: game.developer || 'Unknown Studio',
        coverImage: game.coverImage || '/images/eldenring.jpg',
        playtimeHours: entry.playtimeHours || 0,
        platform: entry.platform,
        hasReviewed: Boolean(existing),
        existingReview: existing,
      };
    });
  },

  /**
   * Submit or update a review.
   * Strictly enforces:
   * 1. Ownership: user MUST own the game in their personal vault.
   * 2. Rating range: rating MUST be between 1 and 10.
   */
  async submitReview(userId = 1, { gameId, rating, headline, quote, recommend = true, spoilers = false }) {
    if (!USE_MOCK) {
      if (!quote?.trim()) throw new Error('Please enter review text.');
      const result = await apiRequest(`/users/${userId}/reviews`, apiJson('POST', { gameId:Number(gameId), rating:Math.round(Number(rating)), reviewText:quote.trim() }));
      return { ...result, isUserReview:true, ratingLabel:`${result.rating}/10`, headline:headline||'', quote:result.quote, recommend, spoilers };
    }
    await simulateDelay(150);

    const numGameId = Number(gameId);
    const numericRating = parseFloat(rating);

    // Validation 1: Rating range [1, 10]
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 10) {
      throw new Error('Rating validation failed: Score must range between 1 and 10.');
    }

    // Validation 2: User ownership validation
    const ownsGame = mockUserLibrary.some(
      (entry) => entry.userId === userId && entry.gameId === numGameId
    );
    if (!ownsGame) {
      throw new Error('Ownership verification failed: You can only record reviews for games owned in your personal vault.');
    }

    // Find user's playtime for this game
    const libraryEntry = mockUserLibrary.find(
      (entry) => entry.userId === userId && entry.gameId === numGameId
    );
    const hoursLogged = libraryEntry ? libraryEntry.playtimeHours : 0;

    const ratingLabel = numericRating === 10 ? 'MASTERPIECE' : numericRating >= 9 ? 'EXCEPTIONAL' : numericRating >= 8 ? 'GREAT' : numericRating >= 7 ? 'GOOD' : 'MIXED';
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Send to Java Backend if active
    if (!USE_MOCK) {
      try {
        await fetch(`${API_BASE_URL}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            gameId: numGameId,
            rating: Math.round(numericRating),
            reviewText: quote || headline || '',
          }),
        });
      } catch (err) {
        console.warn('[reviewsService] Java Backend review submit fallback:', err.message);
      }
    }

    // Check if review already exists
    const existingIndex = reviewsState.findIndex(
      (r) => r.gameId === numGameId && r.userId === userId
    );

    if (existingIndex !== -1) {
      reviewsState[existingIndex] = {
        ...reviewsState[existingIndex],
        rating: numericRating,
        ratingLabel,
        headline: headline || reviewsState[existingIndex].headline,
        quote: quote || reviewsState[existingIndex].quote,
        hoursLogged,
        recommend: Boolean(recommend),
        spoilers: Boolean(spoilers),
        editedDate: today,
      };
      return reviewsState[existingIndex];
    } else {
      const newReview = {
        id: Math.max(0, ...reviewsState.map((r) => r.id)) + 1,
        gameId: numGameId,
        userId,
        authorName: 'Kaelen_V',
        authorAvatar: '/images/avatar.jpg',
        authorBadge: 'MASTER CURATOR',
        isUserReview: true,
        hoursLogged,
        rating: numericRating,
        ratingLabel,
        headline: headline || 'A noteworthy addition to the archive.',
        quote: quote || 'Solid mechanics, thoughtful execution, and memorable gameplay loops.',
        recommend: Boolean(recommend),
        spoilers: Boolean(spoilers),
        postedDate: today,
        editedDate: null,
        helpfulCount: 0,
        commentsCount: 0,
        isHelpfulMarked: false,
      };
      reviewsState.unshift(newReview);
      return newReview;
    }
  },

  /**
   * Delete a review authored by the user
   */
  async deleteReview(reviewId, userId = 1) {
    if (!USE_MOCK) {
      const own = await apiRequest(`/users/${userId}/reviews`);
      const review = own.find(r => r.id === Number(reviewId));
      if (!review) throw new Error('Review not found for this user.');
      await apiRequest(`/users/${userId}/reviews/${review.gameId}`, { method:'DELETE' });
      return review;
    }
    await simulateDelay(120);

    const index = reviewsState.findIndex(
      (r) => r.id === Number(reviewId) && r.userId === userId
    );
    if (index === -1) {
      throw new Error('Review not found or you are not authorized to delete it.');
    }

    const removed = reviewsState.splice(index, 1)[0];
    return removed;
  },

  /**
   * Toggle helpful vote on a review
   */
  async toggleHelpfulVote(reviewId) {
    if (!USE_MOCK) {
      const list=await apiRequest('/reviews?voterId=1');
      const review=list.find(r=>r.id===Number(reviewId));
      if(!review) throw new Error('Review not found.');
      return apiRequest(`/reviews/${review.userId}/${review.gameId}/helpful?voterId=1`,{method:'POST'});
    }
    await simulateDelay(60);

    const review = reviewsState.find((r) => r.id === Number(reviewId));
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
