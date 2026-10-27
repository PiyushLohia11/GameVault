package com.gamevault.model;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Mirrors SYSTEM.USER_GAME table.
 * Columns: USER_ID, GAME_ID, PLATFORM_ID, STATUS, PLAYTIME_HRS, LAST_PLAYED
 *
 * Also carries denormalised display fields (game title, platform name)
 * populated by join queries in the DAO.
 */
public class UserGame {

    private int       userId;
    private int       gameId;
    private int       platformId;
    private String    status;        // 'Playing','Completed','Backlog','Dropped','Wishlist'
    private double    playtimeHrs;
    private LocalDate lastPlayed;

    // Joined display fields (not DB columns)
    private String gameTitle;
    private String platformName;
    private String developerName;

    // ── Constructors ──────────────────────────────────────────────────────────
    public UserGame() {}

    public UserGame(int userId, int gameId, int platformId,
                    String status, double playtimeHrs, LocalDate lastPlayed) {
        this.userId      = userId;
        this.gameId      = gameId;
        this.platformId  = platformId;
        this.status      = status;
        this.playtimeHrs = playtimeHrs;
        this.lastPlayed  = lastPlayed;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public int       getUserId()                    { return userId; }
    public void      setUserId(int userId)          { this.userId = userId; }
    public int       getGameId()                    { return gameId; }
    public void      setGameId(int gameId)          { this.gameId = gameId; }
    public int       getPlatformId()                { return platformId; }
    public void      setPlatformId(int platformId)  { this.platformId = platformId; }
    public String    getStatus()                    { return status; }
    public void      setStatus(String status)       { this.status = status; }
    public double    getPlaytimeHrs()               { return playtimeHrs; }
    public void      setPlaytimeHrs(double h)       { this.playtimeHrs = h; }
    public LocalDate getLastPlayed()                { return lastPlayed; }
    public void      setLastPlayed(LocalDate d)     { this.lastPlayed = d; }

    public String    getGameTitle()                 { return gameTitle; }
    public void      setGameTitle(String gameTitle) { this.gameTitle = gameTitle; }
    public String    getPlatformName()              { return platformName; }
    public void      setPlatformName(String n)      { this.platformName = n; }
    public String    getDeveloperName()             { return developerName; }
    public void      setDeveloperName(String n)     { this.developerName = n; }

    // ── equals / hashCode / toString ──────────────────────────────────────────
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserGame)) return false;
        UserGame ug = (UserGame) o;
        return userId == ug.userId && gameId == ug.gameId && platformId == ug.platformId;
    }

    @Override
    public int hashCode() { return Objects.hash(userId, gameId, platformId); }

    @Override
    public String toString() {
        return "UserGame{userId=" + userId + ", gameId=" + gameId +
               ", platform=" + platformId + ", status='" + status +
               "', hours=" + playtimeHrs + "}";
    }
}
