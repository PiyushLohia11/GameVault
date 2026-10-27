package com.gamevault.dao;

import com.gamevault.config.DBConnection;
import com.gamevault.exception.DatabaseException;
import com.gamevault.model.UserGame;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * UserGameDAO — JDBC operations for SYSTEM.USER_GAME table.
 * The PK is composite: (USER_ID, GAME_ID, PLATFORM_ID).
 */
public class UserGameDAO {

    private static final Logger log = LoggerFactory.getLogger(UserGameDAO.class);

    private static final String BASE_SELECT =
        "SELECT ug.USER_ID, ug.GAME_ID, ug.PLATFORM_ID, ug.STATUS, " +
        "       ug.PLAYTIME_HRS, ug.LAST_PLAYED, " +
        "       g.TITLE AS GAME_TITLE, p.PLATFORM_NAME, d.DEVELOPER_NAME " +
        "FROM SYSTEM.USER_GAME ug " +
        "JOIN SYSTEM.GAME g     ON ug.GAME_ID = g.GAME_ID " +
        "JOIN SYSTEM.PLATFORM p ON ug.PLATFORM_ID = p.PLATFORM_ID " +
        "JOIN SYSTEM.DEVELOPER d ON g.DEVELOPER_ID = d.DEVELOPER_ID ";

    // ── Find all library entries for a user ───────────────────────────────────
    public List<UserGame> findByUserId(int userId) {
        String sql = BASE_SELECT + "WHERE ug.USER_ID = ? ORDER BY ug.LAST_PLAYED DESC NULLS LAST";
        List<UserGame> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            log.error("findByUserId({}) failed", userId, e);
            throw new DatabaseException("Failed to fetch library for user " + userId, e);
        }
        return list;
    }

    // ── Find by status ────────────────────────────────────────────────────────
    public List<UserGame> findByStatus(int userId, String status) {
        String sql = BASE_SELECT +
                     "WHERE ug.USER_ID = ? AND ug.STATUS = ? " +
                     "ORDER BY ug.LAST_PLAYED DESC NULLS LAST";
        List<UserGame> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, status);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch library by status", e);
        }
        return list;
    }

    // ── Find a specific entry ─────────────────────────────────────────────────
    public Optional<UserGame> findEntry(int userId, int gameId, int platformId) {
        String sql = BASE_SELECT +
                     "WHERE ug.USER_ID = ? AND ug.GAME_ID = ? AND ug.PLATFORM_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, gameId);
            ps.setInt(3, platformId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find library entry", e);
        }
        return Optional.empty();
    }

    // ── Check if game is in user's library (any platform) ────────────────────
    public boolean gameInLibrary(int userId, int gameId) {
        String sql = "SELECT COUNT(*) FROM SYSTEM.USER_GAME WHERE USER_ID = ? AND GAME_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, gameId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("gameInLibrary check failed", e);
        }
    }

    // ── Insert ────────────────────────────────────────────────────────────────
    public boolean insert(UserGame entry) {
        String sql = "INSERT INTO SYSTEM.USER_GAME " +
                     "(USER_ID, GAME_ID, PLATFORM_ID, STATUS, PLAYTIME_HRS, LAST_PLAYED) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, entry.getUserId());
            ps.setInt(2, entry.getGameId());
            ps.setInt(3, entry.getPlatformId());
            ps.setString(4, entry.getStatus());
            ps.setDouble(5, entry.getPlaytimeHrs());
            if (entry.getLastPlayed() != null) {
                ps.setDate(6, Date.valueOf(entry.getLastPlayed()));
            } else {
                ps.setNull(6, Types.DATE);
            }
            int rows = ps.executeUpdate();
            log.info("Inserted UserGame: userId={}, gameId={}, platform={}",
                    entry.getUserId(), entry.getGameId(), entry.getPlatformId());
            return rows > 0;
        } catch (SQLException e) {
            if (e.getErrorCode() == 1) {
                throw new DatabaseException(
                    "Game already in library on this platform.", e);
            }
            log.error("insert(UserGame) failed", e);
            throw new DatabaseException("Failed to add game to library", e);
        }
    }

    // ── Update status ─────────────────────────────────────────────────────────
    public boolean updateStatus(int userId, int gameId, int platformId, String newStatus) {
        String sql = "UPDATE SYSTEM.USER_GAME SET STATUS = ? " +
                     "WHERE USER_ID = ? AND GAME_ID = ? AND PLATFORM_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newStatus);
            ps.setInt(2, userId);
            ps.setInt(3, gameId);
            ps.setInt(4, platformId);
            int rows = ps.executeUpdate();
            log.info("Updated status to '{}' for userId={}, gameId={}", newStatus, userId, gameId);
            return rows > 0;
        } catch (SQLException e) {
            log.error("updateStatus failed", e);
            throw new DatabaseException("Failed to update game status", e);
        }
    }

    // ── Update playtime ───────────────────────────────────────────────────────
    public boolean updatePlaytime(int userId, int gameId, int platformId,
                                   double totalHours) {
        String sql = "UPDATE SYSTEM.USER_GAME SET PLAYTIME_HRS = ?, LAST_PLAYED = SYSDATE " +
                     "WHERE USER_ID = ? AND GAME_ID = ? AND PLATFORM_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setDouble(1, totalHours);
            ps.setInt(2, userId);
            ps.setInt(3, gameId);
            ps.setInt(4, platformId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Failed to update playtime", e);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public boolean delete(int userId, int gameId, int platformId) {
        String sql = "DELETE FROM SYSTEM.USER_GAME " +
                     "WHERE USER_ID = ? AND GAME_ID = ? AND PLATFORM_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, gameId);
            ps.setInt(3, platformId);
            int rows = ps.executeUpdate();
            log.info("Deleted library entry: userId={}, gameId={}, rows={}", userId, gameId, rows);
            return rows > 0;
        } catch (SQLException e) {
            log.error("delete() failed", e);
            throw new DatabaseException("Failed to remove game from library", e);
        }
    }

    // ── Aggregate: total playtime for a user ──────────────────────────────────
    public double getTotalPlaytime(int userId) {
        String sql = "SELECT NVL(SUM(PLAYTIME_HRS), 0) FROM SYSTEM.USER_GAME WHERE USER_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getDouble(1) : 0.0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to compute total playtime", e);
        }
    }

    // ── Aggregate: game count by status ───────────────────────────────────────
    public int countByStatus(int userId, String status) {
        String sql = "SELECT COUNT(*) FROM SYSTEM.USER_GAME WHERE USER_ID = ? AND STATUS = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, status);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to count by status", e);
        }
    }

    // ── Row mapper ────────────────────────────────────────────────────────────
    private UserGame mapRow(ResultSet rs) throws SQLException {
        UserGame ug = new UserGame(
            rs.getInt("USER_ID"),
            rs.getInt("GAME_ID"),
            rs.getInt("PLATFORM_ID"),
            rs.getString("STATUS"),
            rs.getDouble("PLAYTIME_HRS"),
            null
        );
        Date lastPlayed = rs.getDate("LAST_PLAYED");
        if (lastPlayed != null) {
            ug.setLastPlayed(lastPlayed.toLocalDate());
        }
        ug.setGameTitle(rs.getString("GAME_TITLE"));
        ug.setPlatformName(rs.getString("PLATFORM_NAME"));
        ug.setDeveloperName(rs.getString("DEVELOPER_NAME"));
        return ug;
    }
}
