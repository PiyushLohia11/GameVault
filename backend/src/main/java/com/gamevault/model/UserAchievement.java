package com.gamevault.model;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Mirrors SYSTEM.USER_ACHIEVEMENT table.
 * Columns: USER_ID, ACHIEVEMENT_ID, UNLOCK_DATE
 *
 * Carries denormalised fields from joins.
 */
public class UserAchievement {

    private int       userId;
    private int       achievementId;
    private LocalDate unlockDate;

    // Joined display fields
    private String achievementName;
    private String description;
    private int    points;
    private int    gameId;
    private String gameTitle;

    // ── Constructors ──────────────────────────────────────────────────────────
    public UserAchievement() {}

    public UserAchievement(int userId, int achievementId, LocalDate unlockDate) {
        this.userId        = userId;
        this.achievementId = achievementId;
        this.unlockDate    = unlockDate;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public int       getUserId()                    { return userId; }
    public void      setUserId(int userId)          { this.userId = userId; }
    public int       getAchievementId()             { return achievementId; }
    public void      setAchievementId(int id)       { this.achievementId = id; }
    public LocalDate getUnlockDate()                { return unlockDate; }
    public void      setUnlockDate(LocalDate d)     { this.unlockDate = d; }
    public String    getAchievementName()           { return achievementName; }
    public void      setAchievementName(String n)   { this.achievementName = n; }
    public String    getDescription()               { return description; }
    public void      setDescription(String d)       { this.description = d; }
    public int       getPoints()                    { return points; }
    public void      setPoints(int points)          { this.points = points; }
    public int       getGameId()                    { return gameId; }
    public void      setGameId(int gameId)          { this.gameId = gameId; }
    public String    getGameTitle()                 { return gameTitle; }
    public void      setGameTitle(String t)         { this.gameTitle = t; }

    // ── equals / hashCode / toString ──────────────────────────────────────────
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserAchievement)) return false;
        UserAchievement ua = (UserAchievement) o;
        return userId == ua.userId && achievementId == ua.achievementId;
    }

    @Override
    public int hashCode() { return Objects.hash(userId, achievementId); }

    @Override
    public String toString() {
        return "UserAchievement{userId=" + userId + ", achievementId=" + achievementId +
               ", unlocked=" + unlockDate + "}";
    }
}
