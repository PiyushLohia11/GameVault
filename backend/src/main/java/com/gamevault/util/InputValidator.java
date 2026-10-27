package com.gamevault.util;

import com.gamevault.exception.ValidationException;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * InputValidator — centralised input validation for all service methods.
 *
 * Every method throws {@link ValidationException} (field, message) on failure,
 * making it easy for the Swing UI to highlight the offending field.
 */
public class InputValidator {

    // ── Constants ─────────────────────────────────────────────────────────────
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private static final Set<String> VALID_STATUSES = Collections.unmodifiableSet(
            new HashSet<>(Arrays.asList("Playing", "Completed", "Backlog", "Dropped", "Wishlist")));

    private static final int MIN_RATING    = 1;
    private static final int MAX_RATING    = 10;
    private static final int MIN_USERNAME  = 3;
    private static final int MAX_USERNAME  = 50;
    private static final int MIN_TEXT      = 5;
    private static final int MAX_TEXT      = 2000;
    private static final double MAX_PLAYTIME = 99999.9;

    // Prevent instantiation — utility class
    private InputValidator() {}

    // ── Rating ────────────────────────────────────────────────────────────────
    /**
     * Validates a review rating. Must be an integer 1–10.
     * Schema: REVIEW.RATING is NUMBER(2,0).
     */
    public static void validateRating(int rating) {
        if (rating < MIN_RATING || rating > MAX_RATING) {
            throw new ValidationException("rating",
                "Rating must be between " + MIN_RATING + " and " + MAX_RATING +
                ". Got: " + rating);
        }
    }

    // ── Playtime ─────────────────────────────────────────────────────────────
    /**
     * Validates playtime hours. Must be >= 0 and < 99999.9.
     * Schema: USER_GAME.PLAYTIME_HRS is NUMBER(8,1).
     */
    public static void validatePlaytime(double playtime) {
        if (playtime < 0) {
            throw new ValidationException("playtime", "Playtime cannot be negative.");
        }
        if (playtime > MAX_PLAYTIME) {
            throw new ValidationException("playtime",
                "Playtime cannot exceed " + MAX_PLAYTIME + " hours.");
        }
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    /**
     * Validates email format and length.
     * Schema: USERS.EMAIL is VARCHAR2(254).
     */
    public static void validateEmail(String email) {
        requireNonBlank("email", email);
        if (email.length() > 254) {
            throw new ValidationException("email", "Email must be 254 characters or fewer.");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ValidationException("email", "Invalid email format: " + email);
        }
    }

    // ── Username ──────────────────────────────────────────────────────────────
    /**
     * Validates username length and characters.
     * Schema: USERS.USERNAME is VARCHAR2(50).
     */
    public static void validateUsername(String username) {
        requireNonBlank("username", username);
        int len = username.trim().length();
        if (len < MIN_USERNAME || len > MAX_USERNAME) {
            throw new ValidationException("username",
                "Username must be " + MIN_USERNAME + "–" + MAX_USERNAME +
                " characters. Got: " + len);
        }
    }

    // ── Status ────────────────────────────────────────────────────────────────
    /**
     * Validates that the game status is one of the accepted values.
     * Schema: USER_GAME.STATUS is VARCHAR2(20) DEFAULT 'Backlog'.
     */
    public static void validateStatus(String status) {
        requireNonBlank("status", status);
        if (!VALID_STATUSES.contains(status)) {
            throw new ValidationException("status",
                "Invalid status '" + status + "'. Must be one of: " + VALID_STATUSES);
        }
    }

    // ── Review text ───────────────────────────────────────────────────────────
    /**
     * Validates review text length.
     * Schema: REVIEW.REVIEW_TEXT is VARCHAR2(2000).
     */
    public static void validateReviewText(String text) {
        requireNonBlank("review_text", text);
        int len = text.trim().length();
        if (len < MIN_TEXT) {
            throw new ValidationException("review_text",
                "Review text must be at least " + MIN_TEXT + " characters.");
        }
        if (len > MAX_TEXT) {
            throw new ValidationException("review_text",
                "Review text cannot exceed " + MAX_TEXT + " characters.");
        }
    }

    // ── Positive ID ───────────────────────────────────────────────────────────
    /** Validates that an ID is positive. */
    public static void validateId(String fieldName, int id) {
        if (id <= 0) {
            throw new ValidationException(fieldName,
                fieldName + " must be a positive integer. Got: " + id);
        }
    }

    // ── Null / blank checks ───────────────────────────────────────────────────
    /** Throws ValidationException if value is null. */
    public static void requireNonNull(String fieldName, Object value) {
        if (value == null) {
            throw new ValidationException(fieldName, fieldName + " must not be null.");
        }
    }

    /** Throws ValidationException if string is null or blank. */
    public static void requireNonBlank(String fieldName, String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException(fieldName, fieldName + " must not be blank.");
        }
    }

    // ── Convenience ───────────────────────────────────────────────────────────
    /** Returns the trimmed value, or throws if blank. */
    public static String trimOrThrow(String fieldName, String value) {
        requireNonBlank(fieldName, value);
        return value.trim();
    }
}
