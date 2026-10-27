package com.gamevault.service;

import com.gamevault.dao.ReviewDAO;
import com.gamevault.dao.UserGameDAO;
import com.gamevault.exception.DuplicateException;
import com.gamevault.exception.NotFoundException;
import com.gamevault.exception.ValidationException;
import com.gamevault.model.Review;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ReviewService using stub (fake) DAOs.
 * No database connection required — fast, pure logic tests.
 */
@DisplayName("ReviewService Tests")
class ReviewServiceTest {

    // ── Stub DAOs (no DB, controlled responses) ───────────────────────────────
    private static class StubReviewDAO extends ReviewDAO {
        boolean hasReview = false;
        boolean gameInLibrary = true;
        double insertedRating = 0;

        @Override public boolean hasReviewed(int userId, int gameId) { return hasReview; }
        @Override public List<Review> findByGame(int gameId) { return Collections.emptyList(); }
        @Override public List<Review> findByUser(int userId) { return Collections.emptyList(); }
        @Override public Optional<Review> findByUserAndGame(int u, int g) { return Optional.empty(); }
        @Override public List<Review> findAll() { return Collections.emptyList(); }
        @Override public boolean delete(int userId, int gameId) { return true; }
        // insert + recalcAvgRating are called inside a transaction — tested via integration
    }

    private static class StubUserGameDAO extends UserGameDAO {
        boolean inLibrary = true;
        @Override public boolean gameInLibrary(int userId, int gameId) { return inLibrary; }
    }

    private StubReviewDAO  reviewDAO;
    private StubUserGameDAO userGameDAO;
    private ReviewService  service;

    @BeforeEach
    void setUp() {
        reviewDAO   = new StubReviewDAO();
        userGameDAO = new StubUserGameDAO();
        service     = new ReviewService(reviewDAO, userGameDAO);
    }

    // ── Validation: rating ────────────────────────────────────────────────────
    @Test
    @DisplayName("Rating of 0 should throw ValidationException")
    void submitReview_ratingTooLow() {
        ValidationException ex = assertThrows(ValidationException.class,
            () -> service.submitReview(1, 1, 0, "Great game loved it!"));
        assertEquals("rating", ex.getField());
    }

    @Test
    @DisplayName("Rating of 11 should throw ValidationException")
    void submitReview_ratingTooHigh() {
        ValidationException ex = assertThrows(ValidationException.class,
            () -> service.submitReview(1, 1, 11, "Great game loved it!"));
        assertEquals("rating", ex.getField());
    }

    // ── Validation: review text ───────────────────────────────────────────────
    @Test
    @DisplayName("Blank review text should throw ValidationException")
    void submitReview_blankText() {
        assertThrows(ValidationException.class,
            () -> service.submitReview(1, 1, 8, ""));
    }

    @Test
    @DisplayName("Review text too short should throw ValidationException")
    void submitReview_textTooShort() {
        ValidationException ex = assertThrows(ValidationException.class,
            () -> service.submitReview(1, 1, 8, "Bad"));
        assertEquals("review_text", ex.getField());
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder(s.length() * n);
        for (int i = 0; i < n; i++) sb.append(s);
        return sb.toString();
    }

    @Test
    @DisplayName("Review text too long should throw ValidationException")
    void submitReview_textTooLong() {
        assertThrows(ValidationException.class,
            () -> service.submitReview(1, 1, 8, repeat("A", 2001)));
    }

    // ── Business rule: game not in library ────────────────────────────────────
    @Test
    @DisplayName("Review of unowned game should throw NotFoundException")
    void submitReview_gameNotInLibrary() {
        userGameDAO.inLibrary = false;
        assertThrows(NotFoundException.class,
            () -> service.submitReview(1, 1, 8, "Amazing game played it!"));
    }

    // ── Business rule: duplicate review ───────────────────────────────────────
    @Test
    @DisplayName("Duplicate review for same game should throw DuplicateException")
    void submitReview_alreadyReviewed() {
        reviewDAO.hasReview = true;
        assertThrows(DuplicateException.class,
            () -> service.submitReview(1, 1, 8, "Amazing game played it!"));
    }

    // ── Delete: not found ─────────────────────────────────────────────────────
    @Test
    @DisplayName("Deleting non-existent review should throw NotFoundException")
    void deleteReview_notFound() {
        reviewDAO.hasReview = false;
        assertThrows(NotFoundException.class,
            () -> service.deleteReview(1, 1));
    }

    // ── Delete: found ─────────────────────────────────────────────────────────
    @Test
    @DisplayName("Deleting own review should succeed")
    void deleteReview_success() {
        reviewDAO.hasReview = true;
        assertDoesNotThrow(() -> service.deleteReview(1, 1));
    }

    // ── Invalid IDs ──────────────────────────────────────────────────────────
    @Test
    @DisplayName("userId 0 should throw ValidationException")
    void submitReview_invalidUserId() {
        assertThrows(ValidationException.class,
            () -> service.submitReview(0, 1, 8, "Amazing game loved it!"));
    }

    @Test
    @DisplayName("gameId -1 should throw ValidationException")
    void submitReview_invalidGameId() {
        assertThrows(ValidationException.class,
            () -> service.submitReview(1, -1, 8, "Amazing game loved it!"));
    }
}
