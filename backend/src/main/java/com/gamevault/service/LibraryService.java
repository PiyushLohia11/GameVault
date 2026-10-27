package com.gamevault.service;

import com.gamevault.dao.UserGameDAO;
import com.gamevault.dao.GameDAO;
import com.gamevault.exception.DuplicateException;
import com.gamevault.exception.NotFoundException;
import com.gamevault.model.Game;
import com.gamevault.model.UserGame;
import com.gamevault.util.InputValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

/**
 * LibraryService — Business logic for managing a user's game library.
 *
 * Handles add, remove, status update, and playtime tracking.
 */
public class LibraryService {

    private static final Logger log = LoggerFactory.getLogger(LibraryService.class);

    private final UserGameDAO userGameDAO;
    private final GameDAO     gameDAO;

    public LibraryService() {
        this.userGameDAO = new UserGameDAO();
        this.gameDAO     = new GameDAO();
    }

    public LibraryService(UserGameDAO userGameDAO, GameDAO gameDAO) {
        this.userGameDAO = userGameDAO;
        this.gameDAO     = gameDAO;
    }

    // ── Add game to library ───────────────────────────────────────────────────
    /**
     * Adds a game to a user's library.
     *
     * @param userId      the user
     * @param gameId      must exist in GAME table
     * @param platformName  e.g. "PC", "PlayStation 5", "Xbox Series X"
     * @param status      one of: Playing, Completed, Backlog, Dropped, Wishlist
     */
    public UserGame addGame(int userId, int gameId,
                             String platformName, String status) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);
        InputValidator.requireNonBlank("platformName", platformName);
        InputValidator.validateStatus(status);

        // Validate game exists
        gameDAO.findById(gameId).orElseThrow(() -> new NotFoundException("Game", gameId));

        // Resolve platform name → ID
        int platformId = gameDAO.findPlatformIdByName(platformName)
                .orElseThrow(() -> new NotFoundException(
                    "Platform '" + platformName + "' not found."));

        // Check for duplicate
        if (userGameDAO.findEntry(userId, gameId, platformId).isPresent()) {
            throw new DuplicateException(
                "Game is already in your library on " + platformName);
        }

        UserGame entry = new UserGame(userId, gameId, platformId, status, 0.0, null);
        userGameDAO.insert(entry);
        log.info("Added game {} to library for user {}, platform={}, status={}",
                gameId, userId, platformName, status);

        // Return enriched entry (with game title etc.)
        return userGameDAO.findEntry(userId, gameId, platformId).orElse(entry);
    }

    /**
     * Overload: Adds a game by platformId directly.
     */
    public UserGame addGame(int userId, int gameId, int platformId, String status) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);
        InputValidator.validateId("platformId", platformId);
        InputValidator.validateStatus(status);

        gameDAO.findById(gameId).orElseThrow(() -> new NotFoundException("Game", gameId));

        if (userGameDAO.findEntry(userId, gameId, platformId).isPresent()) {
            throw new DuplicateException("Game is already in your library.");
        }

        UserGame entry = new UserGame(userId, gameId, platformId, status, 0.0, null);
        userGameDAO.insert(entry);
        return userGameDAO.findEntry(userId, gameId, platformId).orElse(entry);
    }

    // ── Remove game from library ──────────────────────────────────────────────
    /**
     * Removes a game from the library. Ownership check: only the library owner can remove.
     */
    public void removeGame(int userId, int gameId, String platformName) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);
        InputValidator.requireNonBlank("platformName", platformName);

        int platformId = gameDAO.findPlatformIdByName(platformName)
                .orElseThrow(() -> new NotFoundException("Platform '" + platformName + "' not found."));

        // Ownership check
        userGameDAO.findEntry(userId, gameId, platformId)
                .orElseThrow(() -> new NotFoundException(
                    "Game not found in your library."));

        userGameDAO.delete(userId, gameId, platformId);
        log.info("Removed game {} from library of user {}", gameId, userId);
    }

    // ── Update status ─────────────────────────────────────────────────────────
    public void updateStatus(int userId, int gameId, String platformName, String newStatus) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);
        InputValidator.validateStatus(newStatus);

        int platformId = gameDAO.findPlatformIdByName(platformName)
                .orElseThrow(() -> new NotFoundException("Platform '" + platformName + "' not found."));

        // Ownership check
        userGameDAO.findEntry(userId, gameId, platformId)
                .orElseThrow(() -> new NotFoundException("Game not found in your library."));

        userGameDAO.updateStatus(userId, gameId, platformId, newStatus);
        log.info("Status updated to '{}' for userId={}, gameId={}", newStatus, userId, gameId);
    }

    // ── Log playtime ──────────────────────────────────────────────────────────
    /**
     * Sets the total playtime for a game (replaces old value, does NOT add).
     * Also updates LAST_PLAYED to today.
     */
    public void setPlaytime(int userId, int gameId, String platformName, double totalHours) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("gameId", gameId);
        InputValidator.validatePlaytime(totalHours);

        int platformId = gameDAO.findPlatformIdByName(platformName)
                .orElseThrow(() -> new NotFoundException("Platform '" + platformName + "' not found."));

        userGameDAO.findEntry(userId, gameId, platformId)
                .orElseThrow(() -> new NotFoundException("Game not found in your library."));

        userGameDAO.updatePlaytime(userId, gameId, platformId, totalHours);
        log.info("Playtime set to {} hrs for userId={}, gameId={}", totalHours, userId, gameId);
    }

    // ── Read library ──────────────────────────────────────────────────────────
    public List<UserGame> getLibrary(int userId) {
        InputValidator.validateId("userId", userId);
        return userGameDAO.findByUserId(userId);
    }

    public List<UserGame> getByStatus(int userId, String status) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateStatus(status);
        return userGameDAO.findByStatus(userId, status);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    public double getTotalPlaytime(int userId) {
        InputValidator.validateId("userId", userId);
        return userGameDAO.getTotalPlaytime(userId);
    }

    public int countByStatus(int userId, String status) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateStatus(status);
        return userGameDAO.countByStatus(userId, status);
    }
}
