package com.gamevault.service;

import com.gamevault.dao.UserDAO;
import com.gamevault.exception.DuplicateException;
import com.gamevault.exception.NotFoundException;
import com.gamevault.model.User;
import com.gamevault.util.InputValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

/**
 * UserService — Business logic for user registration and lookup.
 *
 * Note: The USERS table has no password column in the schema.
 * Authentication is name/email based only (as per the DDL from Member 1).
 */
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserDAO userDAO;

    public UserService() {
        this.userDAO = new UserDAO();
    }

    // For testing / dependency injection
    public UserService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    // ── Register ──────────────────────────────────────────────────────────────
    /**
     * Registers a new user after validating inputs and checking uniqueness.
     *
     * @param username  3–50 chars
     * @param email     valid email, max 254 chars
     * @return the newly created User with generated ID
     * @throws ValidationException if input is invalid
     * @throws DuplicateException  if username or email already taken
     */
    public User register(String username, String email) {
        // Validate
        String trimmedUser  = InputValidator.trimOrThrow("username", username);
        String trimmedEmail = InputValidator.trimOrThrow("email", email);
        InputValidator.validateUsername(trimmedUser);
        InputValidator.validateEmail(trimmedEmail);

        // Uniqueness checks
        if (userDAO.usernameExists(trimmedUser)) {
            throw new DuplicateException("Username '" + trimmedUser + "' is already taken.");
        }
        if (userDAO.emailExists(trimmedEmail)) {
            throw new DuplicateException("Email '" + trimmedEmail + "' is already registered.");
        }

        User user = new User(trimmedUser, trimmedEmail);
        int id = userDAO.insert(user);
        log.info("Registered new user: id={}, username={}", id, trimmedUser);
        return user;
    }

    // ── Login (simple — no password in schema) ────────────────────────────────
    /**
     * Finds a user by username or email.
     * Since the schema has no password, this is a simple lookup.
     *
     * @param usernameOrEmail  the identifier to search
     * @return the User if found
     * @throws NotFoundException if no user matches
     */
    public User login(String usernameOrEmail) {
        InputValidator.requireNonBlank("usernameOrEmail", usernameOrEmail);
        String trimmed = usernameOrEmail.trim();

        // Try username first, then email
        Optional<User> user = userDAO.findByUsername(trimmed);
        if (user.isEmpty()) {
            user = userDAO.findByEmail(trimmed);
        }
        return user.orElseThrow(() ->
            new NotFoundException("No user found with username or email: " + trimmed));
    }

    // ── Find by ID ────────────────────────────────────────────────────────────
    public User findById(int userId) {
        InputValidator.validateId("userId", userId);
        return userDAO.findById(userId).orElseThrow(() ->
            new NotFoundException("User", userId));
    }

    // ── Find by username ──────────────────────────────────────────────────────
    public Optional<User> findByUsername(String username) {
        InputValidator.requireNonBlank("username", username);
        return userDAO.findByUsername(username.trim());
    }

    // ── Get all users ─────────────────────────────────────────────────────────
    public List<User> getAllUsers() {
        return userDAO.findAll();
    }

    // ── Update username/email ─────────────────────────────────────────────────
    public User updateProfile(int userId, String newUsername, String newEmail) {
        InputValidator.validateId("userId", userId);
        String trimmedUser  = InputValidator.trimOrThrow("username", newUsername);
        String trimmedEmail = InputValidator.trimOrThrow("email", newEmail);
        InputValidator.validateUsername(trimmedUser);
        InputValidator.validateEmail(trimmedEmail);

        User existing = findById(userId);

        // Only check uniqueness if the value actually changed
        if (!existing.getUsername().equalsIgnoreCase(trimmedUser)
                && userDAO.usernameExists(trimmedUser)) {
            throw new DuplicateException("Username '" + trimmedUser + "' is already taken.");
        }
        if (!existing.getEmail().equalsIgnoreCase(trimmedEmail)
                && userDAO.emailExists(trimmedEmail)) {
            throw new DuplicateException("Email '" + trimmedEmail + "' is already registered.");
        }

        existing.setUsername(trimmedUser);
        existing.setEmail(trimmedEmail);
        userDAO.update(existing);
        log.info("Updated profile for userId={}", userId);
        return existing;
    }

    // ── Delete user ───────────────────────────────────────────────────────────
    public void deleteUser(int userId) {
        InputValidator.validateId("userId", userId);
        findById(userId); // throws NotFoundException if not found
        userDAO.delete(userId);
        log.info("Deleted userId={}", userId);
    }
}
