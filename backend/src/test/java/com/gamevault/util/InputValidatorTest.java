package com.gamevault.util;

import com.gamevault.exception.ValidationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for InputValidator.
 * These tests run WITHOUT a database connection — pure logic tests.
 * Run: mvn test
 */
@DisplayName("InputValidator Tests")
class InputValidatorTest {

    // ── Rating ────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Valid ratings (1–10) should not throw")
    void testRating_validValues() {
        assertDoesNotThrow(() -> InputValidator.validateRating(1));
        assertDoesNotThrow(() -> InputValidator.validateRating(5));
        assertDoesNotThrow(() -> InputValidator.validateRating(10));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 11, -1, 100})
    @DisplayName("Invalid ratings should throw ValidationException")
    void testRating_invalidValues(int rating) {
        ValidationException ex = assertThrows(
            ValidationException.class,
            () -> InputValidator.validateRating(rating)
        );
        assertEquals("rating", ex.getField());
    }

    // ── Playtime ─────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Valid playtime values should not throw")
    void testPlaytime_validValues() {
        assertDoesNotThrow(() -> InputValidator.validatePlaytime(0.0));
        assertDoesNotThrow(() -> InputValidator.validatePlaytime(50.5));
        assertDoesNotThrow(() -> InputValidator.validatePlaytime(99999.9));
    }

    @Test
    @DisplayName("Negative playtime should throw ValidationException")
    void testPlaytime_negative() {
        ValidationException ex = assertThrows(
            ValidationException.class,
            () -> InputValidator.validatePlaytime(-1.0)
        );
        assertEquals("playtime", ex.getField());
    }

    @Test
    @DisplayName("Playtime exceeding max should throw ValidationException")
    void testPlaytime_tooHigh() {
        assertThrows(ValidationException.class,
            () -> InputValidator.validatePlaytime(100000.0));
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Valid emails should not throw")
    void testEmail_validValues() {
        assertDoesNotThrow(() -> InputValidator.validateEmail("arjun@example.com"));
        assertDoesNotThrow(() -> InputValidator.validateEmail("user.name+tag@domain.co.uk"));
        assertDoesNotThrow(() -> InputValidator.validateEmail("user@college.edu.in"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"notanemail", "@domain.com", "user@", "user@ .com", ""})
    @DisplayName("Invalid emails should throw ValidationException")
    void testEmail_invalidValues(String email) {
        assertThrows(ValidationException.class,
            () -> InputValidator.validateEmail(email));
    }

    @Test
    @DisplayName("Null email should throw ValidationException")
    void testEmail_null() {
        assertThrows(ValidationException.class,
            () -> InputValidator.validateEmail(null));
    }

    // ── Username ──────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Valid usernames should not throw")
    void testUsername_validValues() {
        assertDoesNotThrow(() -> InputValidator.validateUsername("Arjun"));
        assertDoesNotThrow(() -> InputValidator.validateUsername("user123"));
        assertDoesNotThrow(() -> InputValidator.validateUsername("abc")); // min length
    }

    @Test
    @DisplayName("Username too short should throw")
    void testUsername_tooShort() {
        ValidationException ex = assertThrows(
            ValidationException.class,
            () -> InputValidator.validateUsername("ab")
        );
        assertEquals("username", ex.getField());
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder(s.length() * n);
        for (int i = 0; i < n; i++) sb.append(s);
        return sb.toString();
    }

    @Test
    @DisplayName("Username too long should throw")
    void testUsername_tooLong() {
        String longName = repeat("a", 51);
        assertThrows(ValidationException.class,
            () -> InputValidator.validateUsername(longName));
    }

    @Test
    @DisplayName("Blank username should throw")
    void testUsername_blank() {
        assertThrows(ValidationException.class,
            () -> InputValidator.validateUsername("   "));
    }

    // ── Status ────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Valid statuses should not throw")
    void testStatus_validValues() {
        assertDoesNotThrow(() -> InputValidator.validateStatus("Playing"));
        assertDoesNotThrow(() -> InputValidator.validateStatus("Completed"));
        assertDoesNotThrow(() -> InputValidator.validateStatus("Backlog"));
        assertDoesNotThrow(() -> InputValidator.validateStatus("Dropped"));
        assertDoesNotThrow(() -> InputValidator.validateStatus("Wishlist"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"playing", "PLAYING", "Done", "InProgress", ""})
    @DisplayName("Invalid status strings should throw ValidationException")
    void testStatus_invalidValues(String status) {
        assertThrows(ValidationException.class,
            () -> InputValidator.validateStatus(status));
    }

    // ── Review text ───────────────────────────────────────────────────────────
    @Test
    @DisplayName("Valid review text should not throw")
    void testReviewText_valid() {
        assertDoesNotThrow(() -> InputValidator.validateReviewText("Great game, loved it!"));
        assertDoesNotThrow(() -> InputValidator.validateReviewText(repeat("A", 2000)));
    }

    @Test
    @DisplayName("Review text too short should throw")
    void testReviewText_tooShort() {
        ValidationException ex = assertThrows(
            ValidationException.class,
            () -> InputValidator.validateReviewText("Hi")  // 2 chars, min is 5
        );
        assertEquals("review_text", ex.getField());
    }

    @Test
    @DisplayName("Review text too long should throw")
    void testReviewText_tooLong() {
        assertThrows(ValidationException.class,
            () -> InputValidator.validateReviewText(repeat("A", 2001)));
    }

    @Test
    @DisplayName("Blank review text should throw")
    void testReviewText_blank() {
        assertThrows(ValidationException.class,
            () -> InputValidator.validateReviewText("   "));
    }

    // ── ID validation ─────────────────────────────────────────────────────────
    @Test
    @DisplayName("Positive IDs should not throw")
    void testId_valid() {
        assertDoesNotThrow(() -> InputValidator.validateId("userId", 1));
        assertDoesNotThrow(() -> InputValidator.validateId("userId", 999));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, -999})
    @DisplayName("Non-positive IDs should throw ValidationException")
    void testId_invalid(int id) {
        assertThrows(ValidationException.class,
            () -> InputValidator.validateId("userId", id));
    }

    // ── requireNonNull ────────────────────────────────────────────────────────
    @Test
    @DisplayName("requireNonNull should throw for null")
    void testRequireNonNull_null() {
        ValidationException ex = assertThrows(
            ValidationException.class,
            () -> InputValidator.requireNonNull("field", null)
        );
        assertEquals("field", ex.getField());
    }

    @Test
    @DisplayName("requireNonNull should not throw for non-null")
    void testRequireNonNull_valid() {
        assertDoesNotThrow(() -> InputValidator.requireNonNull("field", "value"));
        assertDoesNotThrow(() -> InputValidator.requireNonNull("field", 42));
    }

    // ── trimOrThrow ───────────────────────────────────────────────────────────
    @Test
    @DisplayName("trimOrThrow should return trimmed string")
    void testTrimOrThrow_trims() {
        assertEquals("hello", InputValidator.trimOrThrow("field", "  hello  "));
    }

    @Test
    @DisplayName("trimOrThrow should throw for blank input")
    void testTrimOrThrow_blank() {
        assertThrows(ValidationException.class,
            () -> InputValidator.trimOrThrow("field", "   "));
    }
}
