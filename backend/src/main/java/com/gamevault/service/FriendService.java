package com.gamevault.service;

import com.gamevault.dao.FriendshipDAO;
import com.gamevault.dao.UserDAO;
import com.gamevault.exception.DuplicateException;
import com.gamevault.exception.NotFoundException;
import com.gamevault.exception.ValidationException;
import com.gamevault.model.Friendship;
import com.gamevault.model.User;
import com.gamevault.util.InputValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * FriendService — Business logic for friendship management.
 *
 * Schema note: FRIENDSHIP table has no status column, so all stored rows
 * are accepted friendships. "Sending a request" is simply inserting a row.
 */
public class FriendService {

    private static final Logger log = LoggerFactory.getLogger(FriendService.class);

    private final FriendshipDAO friendshipDAO;
    private final UserDAO       userDAO;

    public FriendService() {
        this.friendshipDAO = new FriendshipDAO();
        this.userDAO       = new UserDAO();
    }

    public FriendService(FriendshipDAO friendshipDAO, UserDAO userDAO) {
        this.friendshipDAO = friendshipDAO;
        this.userDAO       = userDAO;
    }

    // ── Add friend ────────────────────────────────────────────────────────────
    /**
     * Adds a friendship between two users.
     *
     * Business rules:
     *  - Cannot friend yourself
     *  - Both users must exist
     *  - Cannot add the same friend twice
     */
    public Friendship addFriend(int userId, int friendId) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("friendId", friendId);

        // Self-friendship guard
        if (userId == friendId) {
            throw new ValidationException("friendId", "You cannot add yourself as a friend.");
        }

        // Both users must exist
        userDAO.findById(userId)
               .orElseThrow(() -> new NotFoundException("User", userId));
        userDAO.findById(friendId)
               .orElseThrow(() -> new NotFoundException("Friend user", friendId));

        // Already friends?
        if (friendshipDAO.areFriends(userId, friendId)) {
            throw new DuplicateException(
                "Users " + userId + " and " + friendId + " are already friends.");
        }

        friendshipDAO.addFriendship(userId, friendId);
        log.info("Friendship added: {} ↔ {}", userId, friendId);

        // Return the friendship record
        return friendshipDAO.getFriendships(userId).stream()
                .filter(f -> f.getFriendId() == friendId)
                .findFirst()
                .orElse(new Friendship(userId, friendId, java.time.LocalDate.now()));
    }

    // ── Remove friend ─────────────────────────────────────────────────────────
    public void removeFriend(int userId, int friendId) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("friendId", friendId);

        if (!friendshipDAO.areFriends(userId, friendId)) {
            throw new NotFoundException(
                "No friendship exists between users " + userId + " and " + friendId);
        }
        friendshipDAO.removeFriendship(userId, friendId);
        log.info("Friendship removed: {} ↔ {}", userId, friendId);
    }

    // ── Get friends list ──────────────────────────────────────────────────────
    public List<User> getFriends(int userId) {
        InputValidator.validateId("userId", userId);
        return friendshipDAO.getFriends(userId);
    }

    // ── Get friendships with since-date ───────────────────────────────────────
    public List<Friendship> getFriendships(int userId) {
        InputValidator.validateId("userId", userId);
        return friendshipDAO.getFriendships(userId);
    }

    // ── Check friendship ──────────────────────────────────────────────────────
    public boolean areFriends(int userId, int friendId) {
        InputValidator.validateId("userId", userId);
        InputValidator.validateId("friendId", friendId);
        return friendshipDAO.areFriends(userId, friendId);
    }

    // ── Friend count ──────────────────────────────────────────────────────────
    public int getFriendCount(int userId) {
        InputValidator.validateId("userId", userId);
        return friendshipDAO.getFriendCount(userId);
    }
}
