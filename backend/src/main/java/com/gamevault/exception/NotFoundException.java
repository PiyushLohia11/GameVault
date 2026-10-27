package com.gamevault.exception;

/**
 * Thrown when a requested entity does not exist in the database.
 * e.g., game with ID 999 not found.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public NotFoundException(String entityType, int id) {
        super(entityType + " with ID " + id + " was not found.");
    }
}
