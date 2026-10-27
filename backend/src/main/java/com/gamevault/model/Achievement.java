package com.gamevault.model;

import java.util.Objects;

/**
 * Mirrors SYSTEM.ACHIEVEMENT table.
 * Columns: ACHIEVEMENT_ID, GAME_ID, ACHIEVEMENT_NAME, DESCRIPTION, POINTS
 */
public class Achievement {

    private int    achievementId;
    private int    gameId;
    private String achievementName;
    private String description;
    private int    points;

    // Joined display field
    private String gameTitle;

    // ── Constructors ──────────────────────────────────────────────────────────
    public Achievement() {}

    public Achievement(int achievementId, int gameId, String achievementName,
                       String description, int points) {
        this.achievementId   = achievementId;
        this.gameId          = gameId;
        this.achievementName = achievementName;
        this.description     = description;
        this.points          = points;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public int    getAchievementId()                        { return achievementId; }
    public void   setAchievementId(int achievementId)      { this.achievementId = achievementId; }
    public int    getGameId()                               { return gameId; }
    public void   setGameId(int gameId)                    { this.gameId = gameId; }
    public String getAchievementName()                     { return achievementName; }
    public void   setAchievementName(String name)          { this.achievementName = name; }
    public String getDescription()                         { return description; }
    public void   setDescription(String description)       { this.description = description; }
    public int    getPoints()                              { return points; }
    public void   setPoints(int points)                    { this.points = points; }
    public String getGameTitle()                           { return gameTitle; }
    public void   setGameTitle(String gameTitle)           { this.gameTitle = gameTitle; }

    // ── equals / hashCode / toString ──────────────────────────────────────────
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Achievement)) return false;
        Achievement a = (Achievement) o;
        return achievementId == a.achievementId;
    }

    @Override
    public int hashCode() { return Objects.hash(achievementId); }

    @Override
    public String toString() {
        return "Achievement{id=" + achievementId + ", game=" + gameId +
               ", name='" + achievementName + "', pts=" + points + "}";
    }
}
