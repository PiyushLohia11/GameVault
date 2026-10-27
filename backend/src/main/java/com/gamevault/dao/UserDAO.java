package com.gamevault.dao;

import com.gamevault.config.DBConnection;
import com.gamevault.exception.DatabaseException;
import com.gamevault.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * UserDAO — All JDBC operations for the SYSTEM.USERS table.
 *
 * Every query uses PreparedStatement — no string concatenation, no SQL injection risk.
 */
public class UserDAO {

    private static final Logger log = LoggerFactory.getLogger(UserDAO.class);

    // ── Find by ID ────────────────────────────────────────────────────────────
    public Optional<User> findById(int userId) {
        String sql = "SELECT USER_ID, USERNAME, EMAIL FROM SYSTEM.USERS WHERE USER_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            log.error("findById({}) failed", userId, e);
            throw new DatabaseException("Failed to find user by ID: " + userId, e);
        }
        return Optional.empty();
    }

    // ── Find by username ──────────────────────────────────────────────────────
    public Optional<User> findByUsername(String username) {
        String sql = "SELECT USER_ID, USERNAME, EMAIL FROM SYSTEM.USERS WHERE USERNAME = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            log.error("findByUsername({}) failed", username, e);
            throw new DatabaseException("Failed to find user by username", e);
        }
        return Optional.empty();
    }

    // ── Find by email ─────────────────────────────────────────────────────────
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT USER_ID, USERNAME, EMAIL FROM SYSTEM.USERS WHERE EMAIL = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            log.error("findByEmail failed", e);
            throw new DatabaseException("Failed to find user by email", e);
        }
        return Optional.empty();
    }

    // ── Find all ──────────────────────────────────────────────────────────────
    public List<User> findAll() {
        String sql = "SELECT USER_ID, USERNAME, EMAIL FROM SYSTEM.USERS ORDER BY USER_ID";
        List<User> users = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) users.add(mapRow(rs));
        } catch (SQLException e) {
            log.error("findAll() failed", e);
            throw new DatabaseException("Failed to fetch all users", e);
        }
        return users;
    }

    // ── Insert ────────────────────────────────────────────────────────────────
    /**
     * Inserts a new user. Returns the generated USER_ID.
     * Note: No password field in the schema.
     */
    public int insert(User user) {
        String sql = "INSERT INTO SYSTEM.USERS (USERNAME, EMAIL) VALUES (?, ?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql,
                     new String[]{"USER_ID"})) {
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getEmail());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    int id = keys.getInt(1);
                    user.setUserId(id);
                    log.info("Inserted User: id={}, username={}", id, user.getUsername());
                    return id;
                }
            }
        } catch (SQLException e) {
            // ORA-00001: unique constraint violated
            if (e.getErrorCode() == 1) {
                throw new DatabaseException(
                    "Username or email already exists: " + user.getUsername(), e);
            }
            log.error("insert(User) failed", e);
            throw new DatabaseException("Failed to insert user", e);
        }
        throw new DatabaseException("Insert succeeded but no generated key returned.");
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public boolean update(User user) {
        String sql = "UPDATE SYSTEM.USERS SET USERNAME = ?, EMAIL = ? WHERE USER_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, user.getUsername());
            ps.setString(2, user.getEmail());
            ps.setInt(3, user.getUserId());
            int rows = ps.executeUpdate();
            log.info("Updated user id={}, rows affected={}", user.getUserId(), rows);
            return rows > 0;
        } catch (SQLException e) {
            if (e.getErrorCode() == 1) {
                throw new DatabaseException(
                    "Username or email already taken: " + user.getUsername(), e);
            }
            log.error("update(User) failed", e);
            throw new DatabaseException("Failed to update user", e);
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public boolean delete(int userId) {
        String sql = "DELETE FROM SYSTEM.USERS WHERE USER_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            int rows = ps.executeUpdate();
            log.info("Deleted user id={}, rows={}", userId, rows);
            return rows > 0;
        } catch (SQLException e) {
            log.error("delete({}) failed", userId, e);
            throw new DatabaseException("Failed to delete user " + userId, e);
        }
    }

    // ── Exists checks ─────────────────────────────────────────────────────────
    public boolean usernameExists(String username) {
        String sql = "SELECT COUNT(*) FROM SYSTEM.USERS WHERE USERNAME = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("usernameExists check failed", e);
        }
    }

    public boolean emailExists(String email) {
        String sql = "SELECT COUNT(*) FROM SYSTEM.USERS WHERE EMAIL = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("emailExists check failed", e);
        }
    }

    // ── Row mapper ────────────────────────────────────────────────────────────
    private User mapRow(ResultSet rs) throws SQLException {
        return new User(
            rs.getInt("USER_ID"),
            rs.getString("USERNAME"),
            rs.getString("EMAIL")
        );
    }
}
