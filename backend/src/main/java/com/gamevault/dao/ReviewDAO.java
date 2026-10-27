package com.gamevault.dao;

import com.gamevault.config.DBConnection;
import com.gamevault.exception.DatabaseException;
import com.gamevault.model.Review;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * ReviewDAO — JDBC operations for SYSTEM.REVIEW table.
 * PK is (USER_ID, GAME_ID) — one review per user per game.
 */
public class ReviewDAO {

    private static final Logger log = LoggerFactory.getLogger(ReviewDAO.class);

    private static final String BASE_SELECT =
        "SELECT r.USER_ID, r.GAME_ID, r.RATING, r.REVIEW_TEXT, r.REVIEW_DATE, " +
        "       u.USERNAME, g.TITLE AS GAME_TITLE " +
        "FROM SYSTEM.REVIEW r " +
        "JOIN SYSTEM.USERS u ON r.USER_ID = u.USER_ID " +
        "JOIN SYSTEM.GAME  g ON r.GAME_ID  = g.GAME_ID ";

    // ── Find all reviews for a game ───────────────────────────────────────────
    public List<Review> findByGame(int gameId) {
        String sql = BASE_SELECT + "WHERE r.GAME_ID = ? ORDER BY r.REVIEW_DATE DESC";
        List<Review> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, gameId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            log.error("findByGame({}) failed", gameId, e);
            throw new DatabaseException("Failed to fetch reviews for game " + gameId, e);
        }
        return list;
    }

    // ── Find all reviews by a user ────────────────────────────────────────────
    public List<Review> findByUser(int userId) {
        String sql = BASE_SELECT + "WHERE r.USER_ID = ? ORDER BY r.REVIEW_DATE DESC";
        List<Review> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapRow(rs));
            }
        } catch (SQLException e) {
            log.error("findByUser({}) failed", userId, e);
            throw new DatabaseException("Failed to fetch reviews for user " + userId, e);
        }
        return list;
    }

    // ── Find specific review ──────────────────────────────────────────────────
    public Optional<Review> findByUserAndGame(int userId, int gameId) {
        String sql = BASE_SELECT + "WHERE r.USER_ID = ? AND r.GAME_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, gameId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find review", e);
        }
        return Optional.empty();
    }

    // ── Check if user has already reviewed this game ──────────────────────────
    public boolean hasReviewed(int userId, int gameId) {
        String sql = "SELECT COUNT(*) FROM SYSTEM.REVIEW WHERE USER_ID = ? AND GAME_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, gameId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        } catch (SQLException e) {
            throw new DatabaseException("hasReviewed check failed", e);
        }
    }

    // ── Insert (transactional — uses provided Connection) ─────────────────────
    /**
     * Called from ReviewService inside a transaction.
     * Caller handles commit/rollback.
     */
    public boolean insert(Connection conn, Review review) throws SQLException {
        String sql = "INSERT INTO SYSTEM.REVIEW (USER_ID, GAME_ID, RATING, REVIEW_TEXT, REVIEW_DATE) " +
                     "VALUES (?, ?, ?, ?, SYSDATE)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, review.getUserId());
            ps.setInt(2, review.getGameId());
            ps.setInt(3, review.getRating());
            ps.setString(4, review.getReviewText());
            int rows = ps.executeUpdate();
            log.info("Inserted review: userId={}, gameId={}, rating={}",
                    review.getUserId(), review.getGameId(), review.getRating());
            return rows > 0;
        }
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public boolean update(Connection conn, int userId, int gameId,
                          int newRating, String newText) throws SQLException {
        String sql = "UPDATE SYSTEM.REVIEW SET RATING = ?, REVIEW_TEXT = ?, REVIEW_DATE = SYSDATE " +
                     "WHERE USER_ID = ? AND GAME_ID = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, newRating);
            ps.setString(2, newText);
            ps.setInt(3, userId);
            ps.setInt(4, gameId);
            int rows = ps.executeUpdate();
            log.info("Updated review: userId={}, gameId={}, newRating={}", userId, gameId, newRating);
            return rows > 0;
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    public boolean delete(int userId, int gameId) {
        String sql = "DELETE FROM SYSTEM.REVIEW WHERE USER_ID = ? AND GAME_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, gameId);
            int rows = ps.executeUpdate();
            log.info("Deleted review: userId={}, gameId={}, rows={}", userId, gameId, rows);
            return rows > 0;
        } catch (SQLException e) {
            log.error("delete review failed", e);
            throw new DatabaseException("Failed to delete review", e);
        }
    }

    // ── Recalculate avg rating and return it ──────────────────────────────────
    /** Used within a transaction; pass the active connection. */
    public double recalcAvgRating(Connection conn, int gameId) throws SQLException {
        String sql = "SELECT NVL(AVG(RATING), 0) FROM SYSTEM.REVIEW WHERE GAME_ID = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, gameId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getDouble(1) : 0.0;
            }
        }
    }

    // ── All reviews (for Reports page / Member 5) ─────────────────────────────
    public List<Review> findAll() {
        String sql = BASE_SELECT + "ORDER BY r.REVIEW_DATE DESC";
        List<Review> list = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) list.add(mapRow(rs));
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch all reviews", e);
        }
        return list;
    }

    // ── Row mapper ────────────────────────────────────────────────────────────
    private Review mapRow(ResultSet rs) throws SQLException {
        Review r = new Review(
            rs.getInt("USER_ID"),
            rs.getInt("GAME_ID"),
            rs.getInt("RATING"),
            rs.getString("REVIEW_TEXT"),
            rs.getDate("REVIEW_DATE").toLocalDate()
        );
        r.setUsername(rs.getString("USERNAME"));
        r.setGameTitle(rs.getString("GAME_TITLE"));
        return r;
    }
}
