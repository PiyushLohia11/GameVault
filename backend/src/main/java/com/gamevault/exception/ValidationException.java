package com.gamevault.exception;

/**
 * Thrown when user-supplied input fails validation rules.
 * Carries the field name so the Swing UI can highlight the correct field.
 */
public class ValidationException extends RuntimeException {

    private final String field;

    public ValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    /** The name of the form field that failed (e.g. "rating", "username"). */
    public String getField() {
        return field;
    }

    @Override
    public String toString() {
        return "ValidationException[field=" + field + "]: " + getMessage();
    }
}
