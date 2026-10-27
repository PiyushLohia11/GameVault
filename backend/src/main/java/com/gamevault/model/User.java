package com.gamevault.model;

import java.util.Objects;

/**
 * Mirrors SYSTEM.USERS table.
 * Columns: USER_ID, USERNAME, EMAIL
 */
public class User {

    private int    userId;
    private String username;
    private String email;

    // ── Constructors ──────────────────────────────────────────────────────────
    public User() {}

    public User(int userId, String username, String email) {
        this.userId   = userId;
        this.username = username;
        this.email    = email;
    }

    /** Constructor for insert (ID assigned by Oracle IDENTITY column). */
    public User(String username, String email) {
        this.username = username;
        this.email    = email;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public int    getUserId()               { return userId; }
    public void   setUserId(int userId)     { this.userId = userId; }
    public String getUsername()             { return username; }
    public void   setUsername(String u)     { this.username = u; }
    public String getEmail()                { return email; }
    public void   setEmail(String email)    { this.email = email; }

    // ── equals / hashCode / toString ──────────────────────────────────────────
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User u = (User) o;
        return userId == u.userId;
    }

    @Override
    public int hashCode() { return Objects.hash(userId); }

    @Override
    public String toString() {
        return "User{id=" + userId + ", username='" + username +
               "', email='" + email + "'}";
    }
}
