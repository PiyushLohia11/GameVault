package com.gamevault.exception;

/**
 * Wraps a low-level SQLException into a runtime exception.
 * Always logs the original cause; presents a clean message to callers.
 */
public class DatabaseException extends RuntimeException {

    public DatabaseException(String message) {
        super(message);
    }

    public DatabaseException(String message, Throwable cause) {
        super(message, cause);
    }
}
