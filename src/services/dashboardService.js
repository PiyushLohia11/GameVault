import { mockCurrentUser } from '../mockData/users';
import { mockGames } from '../mockData/games';
import { mockUserLibrary } from '../mockData/userLibrary';
import { mockAchievements } from '../mockData/achievements';
import { mockRecentActivity } from '../mockData/activity';
import { simulateDelay, USE_MOCK, API_BASE_URL } from './apiConfig';

/**
 * Service providing aggregated queries for the Dashboard.
 * In a future phase, these methods can swap mock queries for real HTTP API calls.
 */
export const dashboardService = {
  /**
   * Fetch complete dashboard dataset
   * @param {number} userId - ID of current user
   * @param {boolean} simulateEmpty - when true, returns empty sets to test empty states
   */
  async getDashboardData(userId = 1, simulateEmpty = false) {
    if (!USE_MOCK) {
      const [games, library, achievements] = await Promise.all([
        apiRequest('/games'), apiRequest(`/users/${userId}/library`), apiRequest(`/users/${userId}/achievements`),
      ]);
      const records = simulateEmpty ? [] : library;
      const byStatus = status => records.filter(e=>e.status?.toLowerCase()===status.toLowerCase()).length;
      const totalPlaytimeHours = records.reduce((n,e)=>n+(e.playtimeHours||0),0);
      const continuePlaying = records.filter(e=>e.status==='Playing').map(e=>{
        const g=games.find(x=>x.id===e.gameId)||{}; return { ...e,title:e.title||g.title,developer:e.developer||g.developer,genres:g.genres||[],avgRating:g.avgRating,coverImage:g.coverImage||'/images/eldenring.jpg',progressPercent:0 };
      });
      const genreMap={}; records.forEach(e=>{const g=games.find(x=>x.id===e.gameId);(g?.genres||[]).forEach(name=>genreMap[name]=(genreMap[name]||0)+(e.playtimeHours||0));});
      const totalGenre=Object.values(genreMap).reduce((a,b)=>a+b,0);
      const playtimeByGenre=Object.entries(genreMap).map(([genre,hours])=>({genre,hours,percentage:totalGenre?Math.round(hours/totalGenre*100):0})).sort((a,b)=>b.hours-a.hours).slice(0,4);
      const unlocked=achievements.filter(a=>a.isUnlocked), pointsEarned=unlocked.reduce((n,a)=>n+a.points,0), totalPoints=achievements.reduce((n,a)=>n+a.points,0);
      return { user:{username:'GameVault User'}, summary:{ownedCount:records.length,completedCount:byStatus('Completed'),playingCount:byStatus('Playing'),backlogCount:byStatus('Backlog'),totalPlaytimeHours,completedRate:records.length?((byStatus('Completed')/records.length)*100).toFixed(1):'0.0',perfectRuns:0},
        continuePlaying,recentActivity:[],playtimeByGenre,totalCategorizedHours:totalGenre,
        backlogDistribution:['Playing','Completed','Backlog'].map(status=>({status,count:byStatus(status),percentage:records.length?Math.round(byStatus(status)/records.length*100):0,color:`var(--status-${status.toLowerCase()})`})),
        achievementStats:{totalUnlocked:unlocked.length,totalAvailable:achievements.length,pointsEarned,totalPoints,percentage:totalPoints?Math.round(pointsEarned/totalPoints*100):0,featured:unlocked[0]||null} };
    }
    await simulateDelay(150);

    if (simulateEmpty) {
      return {
        user: mockCurrentUser,
        summary: {
          ownedCount: 0,
          completedCount: 0,
          playingCount: 0,
          backlogCount: 0,
          totalPlaytimeHours: 0,
        },
        continuePlaying: [],
        recentActivity: [],
        playtimeByGenre: [],
        backlogDistribution: [],
        achievementStats: {
          totalUnlocked: 0,
          totalAvailable: 0,
          pointsEarned: 0,
          totalPoints: 0,
          percentage: 0,
        },
      };
    }

    // Fetch live dashboard KPIs from Java Backend if active
    let backendSummary = null;
    if (!USE_MOCK) {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard?userId=${userId}`);
        if (res.ok) {
          backendSummary = await res.json();
        }
      } catch (err) {
        console.warn('[dashboardService] Java Backend dashboard fetch fallback:', err.message);
      }
    }

    // 1. Filter library by active user
    const userLibrary = mockUserLibrary.filter((entry) => entry.userId === userId);

    // 2. Compute summary counts directly from library records
    const ownedCount = backendSummary?.vaultTotal !== undefined ? backendSummary.vaultTotal : userLibrary.length;
    const completedCount = userLibrary.filter((e) => e.status === 'Completed').length;
    const playingCount = userLibrary.filter((e) => e.status === 'Playing').length;
    const backlogCount = userLibrary.filter((e) => e.status === 'Backlog').length;
    const totalPlaytimeHours = backendSummary?.totalPlaytimeHours !== undefined
      ? backendSummary.totalPlaytimeHours
      : userLibrary.reduce((sum, e) => sum + (e.playtimeHours || 0), 0);

    // 3. Continue Playing area: join userLibrary records with mockGames
    const continuePlaying = userLibrary
      .filter((e) => e.status === 'Playing')
      .map((entry) => {
        const game = mockGames.find((g) => g.id === entry.gameId) || {};
        return {
          id: entry.id,
          gameId: entry.gameId,
          title: game.title || 'Unknown Game',
          developer: game.developer || 'Unknown Dev',
          platform: entry.platform,
          genres: game.genres || [],
          playtimeHours: entry.playtimeHours,
          lastPlayedDate: entry.lastPlayedDate,
          avgRating: game.avgRating,
          coverImage: game.coverImage || null,
          tag: game.tag || 'Ongoing',
          progressPercent: game.progressPercent || 75,
          subGoal: game.subGoal || 'Main Campaign Quest',
        };
      })
      .sort((a, b) => new Date(b.lastPlayedDate) - new Date(a.lastPlayedDate));

    // 4. Playtime by Genre (Aggregated Query)
    const genrePlaytimeMap = {};
    let totalCategorizedHours = 0;
    userLibrary.forEach((entry) => {
      const game = mockGames.find((g) => g.id === entry.gameId);
      if (game && game.genres) {
        game.genres.forEach((genre) => {
          genrePlaytimeMap[genre] = (genrePlaytimeMap[genre] || 0) + entry.playtimeHours;
          totalCategorizedHours += entry.playtimeHours;
        });
      }
    });

    const playtimeByGenre = Object.entries(genrePlaytimeMap)
      .map(([genre, hours]) => ({
        genre,
        hours: Math.round(hours * 10) / 10,
        percentage: totalCategorizedHours > 0 ? Math.round((hours / totalCategorizedHours) * 100) : 0,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 4); // Top 4 genres

    // 5. Backlog Trend / Distribution
    const backlogDistribution = [
      {
        status: 'Playing',
        count: playingCount,
        percentage: ownedCount > 0 ? Math.round((playingCount / ownedCount) * 100) : 0,
        color: 'var(--status-playing)',
      },
      {
        status: 'Completed',
        count: completedCount,
        percentage: ownedCount > 0 ? Math.round((completedCount / ownedCount) * 100) : 0,
        color: 'var(--status-completed)',
      },
      {
        status: 'Backlog',
        count: backlogCount,
        percentage: ownedCount > 0 ? Math.round((backlogCount / ownedCount) * 100) : 0,
        color: 'var(--status-backlog)',
      },
    ];

    // 6. Achievement progress
    const unlockedAchievements = mockAchievements.filter((a) => a.isUnlocked);
    const pointsEarned = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
    const totalPoints = mockAchievements.reduce((sum, a) => sum + a.points, 0);
    const finalPoints = backendSummary?.achievementPoints !== undefined ? backendSummary.achievementPoints : pointsEarned;
    const achievementStats = {
      totalUnlocked: unlockedAchievements.length,
      totalAvailable: mockAchievements.length,
      pointsEarned: finalPoints,
      totalPoints,
      percentage: totalPoints > 0 ? Math.round((finalPoints / totalPoints) * 100) : 0,
      featured: unlockedAchievements[0] || null,
    };

    return {
      user: mockCurrentUser,
      summary: {
        ownedCount,
        completedCount,
        playingCount,
        backlogCount,
        totalPlaytimeHours: Math.round(totalPlaytimeHours * 10) / 10,
        completedRate: ownedCount > 0 ? ((completedCount / ownedCount) * 100).toFixed(1) : '0.0',
        perfectRuns: Math.max(1, Math.floor(completedCount / 2)),
      },
      continuePlaying,
      recentActivity: mockRecentActivity,
      playtimeByGenre,
      totalCategorizedHours: Math.round(totalCategorizedHours * 10) / 10,
      backlogDistribution,
      achievementStats,
    };
  },
};
