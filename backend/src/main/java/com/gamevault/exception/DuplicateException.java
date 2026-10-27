package com.gamevault.exception;

/**
 * Thrown when a unique constraint would be violated.
 * e.g., duplicate username, duplicate review for same game.
 */
public class DuplicateException extends RuntimeException {

    public DuplicateException(String message) {
        super(message);
    }
}
