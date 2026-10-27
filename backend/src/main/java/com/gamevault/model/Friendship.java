package com.gamevault.model;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Mirrors SYSTEM.FRIENDSHIP table.
 * Columns: USER_ID, FRIEND_ID, SINCE_DATE
 * Note: (USER_ID, FRIEND_ID) is the composite PK. All stored friendships are accepted.
 */
public class Friendship {

    private int       userId;
    private int       friendId;
    private LocalDate sinceDate;

    // Joined display field
    private String friendUsername;
    private String friendEmail;

    // ── Constructors ──────────────────────────────────────────────────────────
    public Friendship() {}

    public Friendship(int userId, int friendId, LocalDate sinceDate) {
        this.userId    = userId;
        this.friendId  = friendId;
        this.sinceDate = sinceDate;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public int       getUserId()                    { return userId; }
    public void      setUserId(int userId)          { this.userId = userId; }
    public int       getFriendId()                  { return friendId; }
    public void      setFriendId(int friendId)      { this.friendId = friendId; }
    public LocalDate getSinceDate()                 { return sinceDate; }
    public void      setSinceDate(LocalDate d)      { this.sinceDate = d; }
    public String    getFriendUsername()            { return friendUsername; }
    public void      setFriendUsername(String u)    { this.friendUsername = u; }
    public String    getFriendEmail()               { return friendEmail; }
    public void      setFriendEmail(String e)       { this.friendEmail = e; }

    // ── equals / hashCode / toString ──────────────────────────────────────────
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Friendship)) return false;
        Friendship f = (Friendship) o;
        return userId == f.userId && friendId == f.friendId;
    }

    @Override
    public int hashCode() { return Objects.hash(userId, friendId); }

    @Override
    public String toString() {
        return "Friendship{userId=" + userId + ", friendId=" + friendId +
               ", since=" + sinceDate + "}";
    }
}
