package com.gamevault.service;

import com.gamevault.dao.UserDAO;
import com.gamevault.exception.DuplicateException;
import com.gamevault.exception.NotFoundException;
import com.gamevault.exception.ValidationException;
import com.gamevault.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for UserService using stub DAO.
 * No database connection required.
 */
@DisplayName("UserService Tests")
class UserServiceTest {

    // ── Stub UserDAO ──────────────────────────────────────────────────────────
    private static class StubUserDAO extends UserDAO {
        boolean usernameExists = false;
        boolean emailExists    = false;
        int nextId             = 99;

        @Override public boolean usernameExists(String u) { return usernameExists; }
        @Override public boolean emailExists(String e)    { return emailExists; }
        @Override public int insert(User user)            { user.setUserId(nextId); return nextId; }

        @Override
        public Optional<User> findByUsername(String name) {
            if ("Arjun".equals(name)) return Optional.of(new User(1, "Arjun", "arjun@example.com"));
            return Optional.empty();
        }

        @Override
        public Optional<User> findByEmail(String email) {
            if ("arjun@example.com".equals(email))
                return Optional.of(new User(1, "Arjun", "arjun@example.com"));
            return Optional.empty();
        }

        @Override
        public Optional<User> findById(int id) {
            if (id == 1) return Optional.of(new User(1, "Arjun", "arjun@example.com"));
            return Optional.empty();
        }

        @Override public List<User> findAll() { return new java.util.ArrayList<User>(java.util.Arrays.asList(new User(1, "Arjun", "arjun@example.com"))); }
        @Override public boolean update(User user) { return true; }
        @Override public boolean delete(int userId) { return true; }
    }

    private StubUserDAO userDAO;
    private UserService service;

    @BeforeEach
    void setUp() {
        userDAO = new StubUserDAO();
        service = new UserService(userDAO);
    }

    // ── Register ──────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Valid registration should succeed and return user with ID")
    void register_success() {
        User user = service.register("NewUser", "newuser@example.com");
        assertNotNull(user);
        assertEquals(99, user.getUserId());
        assertEquals("NewUser", user.getUsername());
    }

    @Test
    @DisplayName("Duplicate username should throw DuplicateException")
    void register_duplicateUsername() {
        userDAO.usernameExists = true;
        assertThrows(DuplicateException.class,
            () -> service.register("TakenUser", "unique@example.com"));
    }

    @Test
    @DisplayName("Duplicate email should throw DuplicateException")
    void register_duplicateEmail() {
        userDAO.emailExists = true;
        assertThrows(DuplicateException.class,
            () -> service.register("UniqueUser", "taken@example.com"));
    }

    @Test
    @DisplayName("Invalid email format should throw ValidationException")
    void register_invalidEmail() {
        ValidationException ex = assertThrows(ValidationException.class,
            () -> service.register("ValidName", "not-an-email"));
        assertEquals("email", ex.getField());
    }

    @Test
    @DisplayName("Username too short should throw ValidationException")
    void register_usernameTooShort() {
        ValidationException ex = assertThrows(ValidationException.class,
            () -> service.register("ab", "valid@example.com"));
        assertEquals("username", ex.getField());
    }

    @Test
    @DisplayName("Blank username should throw ValidationException")
    void register_blankUsername() {
        assertThrows(ValidationException.class,
            () -> service.register("", "valid@example.com"));
    }

    @Test
    @DisplayName("Register trims whitespace from inputs")
    void register_trimsWhitespace() {
        User user = service.register("  TestUser  ", "  test@example.com  ");
        assertEquals("TestUser", user.getUsername());
        assertEquals("test@example.com", user.getEmail());
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Login by username should return correct user")
    void login_byUsername() {
        User user = service.login("Arjun");
        assertEquals(1, user.getUserId());
        assertEquals("Arjun", user.getUsername());
    }

    @Test
    @DisplayName("Login by email should return correct user")
    void login_byEmail() {
        User user = service.login("arjun@example.com");
        assertEquals(1, user.getUserId());
    }

    @Test
    @DisplayName("Login with unknown user should throw NotFoundException")
    void login_unknownUser() {
        assertThrows(NotFoundException.class,
            () -> service.login("ghostuser"));
    }

    @Test
    @DisplayName("Blank login identifier should throw ValidationException")
    void login_blank() {
        assertThrows(ValidationException.class,
            () -> service.login("   "));
    }

    // ── findById ──────────────────────────────────────────────────────────────
    @Test
    @DisplayName("findById with valid ID should return user")
    void findById_success() {
        User user = service.findById(1);
        assertEquals("Arjun", user.getUsername());
    }

    @Test
    @DisplayName("findById with non-existent ID should throw NotFoundException")
    void findById_notFound() {
        assertThrows(NotFoundException.class,
            () -> service.findById(999));
    }

    @Test
    @DisplayName("findById with ID 0 should throw ValidationException")
    void findById_zeroId() {
        assertThrows(ValidationException.class,
            () -> service.findById(0));
    }

    // ── getAllUsers ───────────────────────────────────────────────────────────
    @Test
    @DisplayName("getAllUsers should return list")
    void getAllUsers_returnsList() {
        List<User> users = service.getAllUsers();
        assertFalse(users.isEmpty());
    }
}
