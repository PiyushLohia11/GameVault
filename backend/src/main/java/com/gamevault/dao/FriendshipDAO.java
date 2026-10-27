package com.gamevault.dao;

import com.gamevault.config.DBConnection;
import com.gamevault.exception.DatabaseException;
import com.gamevault.model.Friendship;
import com.gamevault.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * FriendshipDAO — JDBC operations for SYSTEM.FRIENDSHIP table.
 * PK is (USER_ID, FRIEND_ID). All stored rows are accepted friendships.
 * Friendship is NOT bidirectional in the DB — stored as one direction only.
 */
public class FriendshipDAO {

    private static final Logger log = LoggerFactory.getLogger(FriendshipDAO.class);

    // ── Get all friends of a user (bidirectional lookup) ──────────────────────
    /**
     * Returns User objects for everyone who is friends with userId.
     * Checks both (userId, friendId) and (friendId, userId) rows.
     */
    public List<User> getFriends(int userId) {
        String sql =
            "SELECT u.USER_ID, u.USERNAME, u.EMAIL " +
            "FROM SYSTEM.USERS u " +
            "WHERE u.USER_ID IN (" +
            "    SELECT FRIEND_ID FROM SYSTEM.FRIENDSHIP WHERE USER_ID = ? " +
            "    UNION " +
            "    SELECT USER_ID FROM SYSTEM.FRIENDSHIP WHERE FRIEND_ID = ?" +
            ") ORDER BY u.USERNAME";
        List<User> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new User(
                        rs.getInt("USER_ID"),
                        rs.getString("USERNAME"),
                        rs.getString("EMAIL")
                    ));
                }
            }
        } catch (SQLException e) {
            log.error("getFriends({}) failed", userId, e);
            throw new DatabaseException("Failed to fetch friends list", e);
        }
        return list;
    }

    // ── Get friendships with since_date ───────────────────────────────────────
    public List<Friendship> getFriendships(int userId) {
        String sql =
            "SELECT f.USER_ID, f.FRIEND_ID, f.SINCE_DATE, u.USERNAME, u.EMAIL " +
            "FROM SYSTEM.FRIENDSHIP f " +
            "JOIN SYSTEM.USERS u ON f.FRIEND_ID = u.USER_ID " +
            "WHERE f.USER_ID = ? ORDER BY f.SINCE_DATE DESC";
        List<Friendship> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Friendship f = new Friendship(
                        rs.getInt("USER_ID"),
                        rs.getInt("FRIEND_ID"),
                        rs.getDate("SINCE_DATE").toLocalDate()
                    );
                    f.setFriendUsername(rs.getString("USERNAME"));
                    f.setFriendEmail(rs.getString("EMAIL"));
                    list.add(f);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch friendships", e);
        }
        return list;
    }

    // ── Check if two users are friends ────────────────────────────────────────
    public boolean areFriends(int userId, int friendId) {
        String sql =
            "SELECT COUNT(*) FROM SYSTEM.FRIENDSHIP " +
            "WHERE (USER_ID = ? AND FRIEND_ID = ?) OR (USER_ID = ? AND FRIEND_ID = ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, friendId);
            ps.setInt(3, friendId);
            ps.setInt(4, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("areFriends check failed", e);
        }
    }

    // ── Add friendship ────────────────────────────────────────────────────────
    /**
     * Inserts a friendship row. Since schema has no "status" column,
     * adding a friendship means it's immediately accepted.
     */
    public boolean addFriendship(int userId, int friendId) {
        String sql = "INSERT INTO SYSTEM.FRIENDSHIP (USER_ID, FRIEND_ID, SINCE_DATE) " +
                     "VALUES (?, ?, SYSDATE)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, friendId);
            int rows = ps.executeUpdate();
            log.info("Added friendship: userId={} → friendId={}", userId, friendId);
            return rows > 0;
        } catch (SQLException e) {
            if (e.getErrorCode() == 1) {
                throw new DatabaseException(
                    "Friendship already exists between users " + userId + " and " + friendId, e);
            }
            log.error("addFriendship failed", e);
            throw new DatabaseException("Failed to add friendship", e);
        }
    }

    // ── Remove friendship ─────────────────────────────────────────────────────
    /** Removes both directions of the friendship. */
    public boolean removeFriendship(int userId, int friendId) {
        String sql =
            "DELETE FROM SYSTEM.FRIENDSHIP " +
            "WHERE (USER_ID = ? AND FRIEND_ID = ?) OR (USER_ID = ? AND FRIEND_ID = ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, friendId);
            ps.setInt(3, friendId);
            ps.setInt(4, userId);
            int rows = ps.executeUpdate();
            log.info("Removed friendship between {} and {}, rows={}", userId, friendId, rows);
            return rows > 0;
        } catch (SQLException e) {
            log.error("removeFriendship failed", e);
            throw new DatabaseException("Failed to remove friendship", e);
        }
    }

    // ── Friend count ──────────────────────────────────────────────────────────
    public int getFriendCount(int userId) {
        String sql =
            "SELECT COUNT(*) FROM SYSTEM.FRIENDSHIP " +
            "WHERE USER_ID = ? OR FRIEND_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to count friends", e);
        }
    }
}
