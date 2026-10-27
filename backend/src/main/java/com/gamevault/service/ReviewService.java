package com.gamevault.service;

import com.gamevault.config.DBConnection;
import com.gamevault.dao.ReviewDAO;
import com.gamevault.dao.UserGameDAO;
import com.gamevault.exception.DatabaseException;
import com.gamevault.exception.DuplicateException;
import com.gamevault.exception.NotFoundException;
import com.gamevault.model.Review;
import com.gamevault.util.InputValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

/**
 * ReviewService — Business logic for submitting, editing, and deleting reviews.
 *
 * TRANSACTION BOUNDARY:
 *   submitReview and editReview both:
 *     1. INSERT/UPDATE the REVIEW row
 *     2. Recalculate and return the new avg rating
 *   Both operations happen inside a single transaction for consistency.
 */
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewDAO   reviewDAO;
    private final UserGameDAO userGameDAO;

    public ReviewService() {
        this.reviewDAO   = new ReviewDAO();
        this.userGameDAO = new UserGameDAO();
    }

    public ReviewService(ReviewDAO reviewDAO, UserGameDAO userGameDAO) {
        this.reviewDAO   = reviewDAO;
        this.userGameDAO = userGameDAO;
    }

    // ── Submit review ─────────────────────────────────────────────────────────
    /**
     * Submits a new review. Enforces:
     *  - Rating must be 1–10
     *  - Review text 5–2000 chars
     *  - User must have the game in their library
     *  - Only one review per user per game
     *
     * The INSERT and avg rating recalculation run in ONE transaction.
     *
     * @return the new average rating for the game (rounded to 2 dp)
     */
    public double submitReview(int userId, int gameId, int rating, String reviewText) {
        // ── Validate inputs ──
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);
        InputValidator.validateRating(rating);
        String trimmedText = InputValidator.trimOrThrow("review_text", reviewText);
        InputValidator.validateReviewText(trimmedText);

        // ── Business rules ──
        if (!userGameDAO.gameInLibrary(userId, gameId)) {
            throw new NotFoundException(
                "You must own game " + gameId + " before reviewing it.");
        }
        if (reviewDAO.hasReviewed(userId, gameId)) {
            throw new DuplicateException(
                "You have already submitted a review for this game. Use editReview instead.");
        }

        // ── Transaction: INSERT review → recalculate avg ──
        double newAvg = 0.0;
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            conn.setAutoCommit(false);
            try {
                Review review = new Review(userId, gameId, rating, trimmedText, null);
                reviewDAO.insert(conn, review);
                newAvg = reviewDAO.recalcAvgRating(conn, gameId);
                conn.commit();
                log.info("Review submitted: userId={}, gameId={}, rating={}, newAvg={}",
                         userId, gameId, rating, newAvg);
            } catch (Exception e) {
                conn.rollback();
                log.error("submitReview transaction rolled back", e);
                throw new DatabaseException("Failed to submit review", e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Connection error during submitReview", e);
        }
        return Math.round(newAvg * 100.0) / 100.0;
    }

    // ── Edit existing review ──────────────────────────────────────────────────
    /**
     * Updates an existing review. Only the review owner can edit.
     * @return updated average rating for the game
     */
    public double editReview(int userId, int gameId, int newRating, String newText) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);
        InputValidator.validateRating(newRating);
        String trimmedText = InputValidator.trimOrThrow("review_text", newText);
        InputValidator.validateReviewText(trimmedText);

        // Ownership check
        if (!reviewDAO.hasReviewed(userId, gameId)) {
            throw new NotFoundException(
                "No review found for userId=" + userId + ", gameId=" + gameId);
        }

        double newAvg = 0.0;
        try (Connection conn = DBConnection.getInstance().getConnection()) {
            conn.setAutoCommit(false);
            try {
                reviewDAO.update(conn, userId, gameId, newRating, trimmedText);
                newAvg = reviewDAO.recalcAvgRating(conn, gameId);
                conn.commit();
                log.info("Review updated: userId={}, gameId={}", userId, gameId);
            } catch (Exception e) {
                conn.rollback();
                throw new DatabaseException("Failed to update review", e);
            } finally {
                conn.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new DatabaseException("Connection error during editReview", e);
        }
        return Math.round(newAvg * 100.0) / 100.0;
    }

    // ── Delete review ─────────────────────────────────────────────────────────
    /**
     * Deletes a review. Only the review owner can delete.
     */
    public void deleteReview(int userId, int gameId) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);

        // Ownership check
        if (!reviewDAO.hasReviewed(userId, gameId)) {
            throw new NotFoundException(
                "No review to delete for userId=" + userId + ", gameId=" + gameId);
        }
        reviewDAO.delete(userId, gameId);
        log.info("Deleted review: userId={}, gameId={}", userId, gameId);
    }

    // ── Read reviews ──────────────────────────────────────────────────────────
    public List<Review> getReviewsForGame(int gameId) {
        InputValidator.validateId("gameId", gameId);
        return reviewDAO.findByGame(gameId);
    }

    public List<Review> getReviewsByUser(int userId) {
        InputValidator.validateId("userId", userId);
        return reviewDAO.findByUser(userId);
    }

    public Optional<Review> getReview(int userId, int gameId) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);
        return reviewDAO.findByUserAndGame(userId, gameId);
    }

    public List<Review> getAllReviews() {
        return reviewDAO.findAll();
    }
}
