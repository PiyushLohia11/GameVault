package com.gamevault.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Composite view of a game — joins GAME + DEVELOPER + GENRE + PLATFORM.
 * Used throughout the Service and Swing layers.
 */
public class Game {

    private int    gameId;
    private String title;
    private int    developerId;
    private String developerName;   // joined from DEVELOPER
    private int    releaseYear;
    private double avgRating;
    private List<String> genres    = new ArrayList<>();  // joined from GENRE via GAME_GENRE
    private List<String> platforms = new ArrayList<>();  // joined from PLATFORM via GAME_PLATFORM

    // ── Constructors ──────────────────────────────────────────────────────────
    public Game() {}

    public Game(int gameId, String title, int developerId,
                String developerName, int releaseYear) {
        this.gameId        = gameId;
        this.title         = title;
        this.developerId   = developerId;
        this.developerName = developerName;
        this.releaseYear   = releaseYear;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public int    getGameId()                       { return gameId; }
    public void   setGameId(int gameId)             { this.gameId = gameId; }
    public String getTitle()                        { return title; }
    public void   setTitle(String title)            { this.title = title; }
    public int    getDeveloperId()                  { return developerId; }
    public void   setDeveloperId(int developerId)   { this.developerId = developerId; }
    public String getDeveloperName()                { return developerName; }
    public void   setDeveloperName(String n)        { this.developerName = n; }
    public int    getReleaseYear()                  { return releaseYear; }
    public void   setReleaseYear(int releaseYear)   { this.releaseYear = releaseYear; }
    public double getAvgRating()                    { return avgRating; }
    public void   setAvgRating(double avgRating)    { this.avgRating = avgRating; }
    public List<String> getGenres()                 { return genres; }
    public void   setGenres(List<String> genres)    { this.genres = genres; }
    public List<String> getPlatforms()              { return platforms; }
    public void   setPlatforms(List<String> p)      { this.platforms = p; }

    // ── equals / hashCode / toString ──────────────────────────────────────────
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Game)) return false;
        Game g = (Game) o;
        return gameId == g.gameId;
    }

    @Override
    public int hashCode() { return Objects.hash(gameId); }

    @Override
    public String toString() {
        return "Game{id=" + gameId + ", title='" + title +
               "', developer='" + developerName + "', year=" + releaseYear + "}";
    }
}
