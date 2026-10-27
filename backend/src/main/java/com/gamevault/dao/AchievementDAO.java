package com.gamevault.dao;

import com.gamevault.config.DBConnection;
import com.gamevault.exception.DatabaseException;
import com.gamevault.model.Achievement;
import com.gamevault.model.UserAchievement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * AchievementDAO — JDBC operations for SYSTEM.ACHIEVEMENT and SYSTEM.USER_ACHIEVEMENT.
 */
public class AchievementDAO {

    private static final Logger log = LoggerFactory.getLogger(AchievementDAO.class);

    // ── Achievements for a game ───────────────────────────────────────────────
    public List<Achievement> findByGame(int gameId) {
        String sql = "SELECT a.ACHIEVEMENT_ID, a.GAME_ID, a.ACHIEVEMENT_NAME, " +
                     "       a.DESCRIPTION, a.POINTS, g.TITLE AS GAME_TITLE " +
                     "FROM SYSTEM.ACHIEVEMENT a " +
                     "JOIN SYSTEM.GAME g ON a.GAME_ID = g.GAME_ID " +
                     "WHERE a.GAME_ID = ? ORDER BY a.POINTS DESC";
        List<Achievement> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, gameId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapAchievement(rs));
            }
        } catch (SQLException e) {
            log.error("findByGame({}) failed", gameId, e);
            throw new DatabaseException("Failed to fetch achievements for game " + gameId, e);
        }
        return list;
    }

    // ── All achievements a user has unlocked ──────────────────────────────────
    public List<UserAchievement> findUnlockedByUser(int userId) {
        String sql = "SELECT ua.USER_ID, ua.ACHIEVEMENT_ID, ua.UNLOCK_DATE, " +
                     "       a.ACHIEVEMENT_NAME, a.DESCRIPTION, a.POINTS, " +
                     "       a.GAME_ID, g.TITLE AS GAME_TITLE " +
                     "FROM SYSTEM.USER_ACHIEVEMENT ua " +
                     "JOIN SYSTEM.ACHIEVEMENT a ON ua.ACHIEVEMENT_ID = a.ACHIEVEMENT_ID " +
                     "JOIN SYSTEM.GAME g ON a.GAME_ID = g.GAME_ID " +
                     "WHERE ua.USER_ID = ? ORDER BY ua.UNLOCK_DATE DESC";
        List<UserAchievement> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapUserAchievement(rs));
            }
        } catch (SQLException e) {
            log.error("findUnlockedByUser({}) failed", userId, e);
            throw new DatabaseException("Failed to fetch unlocked achievements", e);
        }
        return list;
    }

    // ── Achievements still locked for a user on a specific game ──────────────
    public List<Achievement> findLockedByUserForGame(int userId, int gameId) {
        String sql = "SELECT a.ACHIEVEMENT_ID, a.GAME_ID, a.ACHIEVEMENT_NAME, " +
                     "       a.DESCRIPTION, a.POINTS, g.TITLE AS GAME_TITLE " +
                     "FROM SYSTEM.ACHIEVEMENT a " +
                     "JOIN SYSTEM.GAME g ON a.GAME_ID = g.GAME_ID " +
                     "WHERE a.GAME_ID = ? " +
                     "  AND a.ACHIEVEMENT_ID NOT IN (" +
                     "      SELECT ACHIEVEMENT_ID FROM SYSTEM.USER_ACHIEVEMENT " +
                     "      WHERE USER_ID = ?) " +
                     "ORDER BY a.POINTS DESC";
        List<Achievement> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, gameId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapAchievement(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch locked achievements", e);
        }
        return list;
    }

    // ── Check if already unlocked ─────────────────────────────────────────────
    public boolean isUnlocked(int userId, int achievementId) {
        String sql = "SELECT COUNT(*) FROM SYSTEM.USER_ACHIEVEMENT " +
                     "WHERE USER_ID = ? AND ACHIEVEMENT_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, achievementId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("isUnlocked check failed", e);
        }
    }

    // ── Unlock (INSERT into USER_ACHIEVEMENT) ─────────────────────────────────
    /**
     * Called inside a transaction from AchievementService.
     * Uses the provided Connection to participate in the outer transaction.
     */
    public boolean unlock(Connection conn, int userId, int achievementId) throws SQLException {
        String sql = "INSERT INTO SYSTEM.USER_ACHIEVEMENT (USER_ID, ACHIEVEMENT_ID, UNLOCK_DATE) " +
                     "VALUES (?, ?, SYSDATE)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, achievementId);
            int rows = ps.executeUpdate();
            log.info("Unlocked achievement {} for user {}", achievementId, userId);
            return rows > 0;
        }
        // Caller (service) handles SQLException and rollback
    }

    // ── Total points earned by user ───────────────────────────────────────────
    public int getTotalPointsByUser(int userId) {
        String sql = "SELECT NVL(SUM(a.POINTS), 0) " +
                     "FROM SYSTEM.USER_ACHIEVEMENT ua " +
                     "JOIN SYSTEM.ACHIEVEMENT a ON ua.ACHIEVEMENT_ID = a.ACHIEVEMENT_ID " +
                     "WHERE ua.USER_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to compute total points", e);
        }
    }

    // ── Completion % for a user on a game ─────────────────────────────────────
    public double getCompletionPercent(int userId, int gameId) {
        String total = "SELECT COUNT(*) FROM SYSTEM.ACHIEVEMENT WHERE GAME_ID = ?";
        String done  = "SELECT COUNT(*) FROM SYSTEM.USER_ACHIEVEMENT ua " +
                       "JOIN SYSTEM.ACHIEVEMENT a ON ua.ACHIEVEMENT_ID = a.ACHIEVEMENT_ID " +
                       "WHERE ua.USER_ID = ? AND a.GAME_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            int totalCount, doneCount;
            try (PreparedStatement ps = conn.prepareStatement(total)) {
                ps.setInt(1, gameId);
                ResultSet rs = ps.executeQuery();
                totalCount = rs.next() ? rs.getInt(1) : 0;
            }
            if (totalCount == 0) return 0.0;
            try (PreparedStatement ps = conn.prepareStatement(done)) {
                ps.setInt(1, userId);
                ps.setInt(2, gameId);
                ResultSet rs = ps.executeQuery();
                doneCount = rs.next() ? rs.getInt(1) : 0;
            }
            return (doneCount * 100.0) / totalCount;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to compute completion percent", e);
        }
    }

    // ── Row mappers ───────────────────────────────────────────────────────────
    private Achievement mapAchievement(ResultSet rs) throws SQLException {
        Achievement a = new Achievement(
            rs.getInt("ACHIEVEMENT_ID"),
            rs.getInt("GAME_ID"),
            rs.getString("ACHIEVEMENT_NAME"),
            rs.getString("DESCRIPTION"),
            rs.getInt("POINTS")
        );
        a.setGameTitle(rs.getString("GAME_TITLE"));
        return a;
    }

    private UserAchievement mapUserAchievement(ResultSet rs) throws SQLException {
        UserAchievement ua = new UserAchievement(
            rs.getInt("USER_ID"),
            rs.getInt("ACHIEVEMENT_ID"),
            rs.getDate("UNLOCK_DATE").toLocalDate()
        );
        ua.setAchievementName(rs.getString("ACHIEVEMENT_NAME"));
        ua.setDescription(rs.getString("DESCRIPTION"));
        ua.setPoints(rs.getInt("POINTS"));
        ua.setGameId(rs.getInt("GAME_ID"));
        ua.setGameTitle(rs.getString("GAME_TITLE"));
        return ua;
    }
}
