package com.gamevault.model;

import java.time.LocalDate;
import java.util.Objects;

/**
 * Mirrors SYSTEM.REVIEW table.
 * Columns: USER_ID, GAME_ID, RATING, REVIEW_TEXT, REVIEW_DATE
 * Note: (USER_ID, GAME_ID) is the composite primary key — one review per user per game.
 */
public class Review {

    private int       userId;
    private int       gameId;
    private int       rating;       // 1–10, NUMBER(2,0)
    private String    reviewText;   // VARCHAR2(2000)
    private LocalDate reviewDate;

    // Joined display fields
    private String username;
    private String gameTitle;

    // ── Constructors ──────────────────────────────────────────────────────────
    public Review() {}

    public Review(int userId, int gameId, int rating,
                  String reviewText, LocalDate reviewDate) {
        this.userId     = userId;
        this.gameId     = gameId;
        this.rating     = rating;
        this.reviewText = reviewText;
        this.reviewDate = reviewDate;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public int       getUserId()                { return userId; }
    public void      setUserId(int userId)      { this.userId = userId; }
    public int       getGameId()                { return gameId; }
    public void      setGameId(int gameId)      { this.gameId = gameId; }
    public int       getRating()                { return rating; }
    public void      setRating(int rating)      { this.rating = rating; }
    public String    getReviewText()            { return reviewText; }
    public void      setReviewText(String t)    { this.reviewText = t; }
    public LocalDate getReviewDate()            { return reviewDate; }
    public void      setReviewDate(LocalDate d) { this.reviewDate = d; }
    public String    getUsername()              { return username; }
    public void      setUsername(String u)      { this.username = u; }
    public String    getGameTitle()             { return gameTitle; }
    public void      setGameTitle(String t)     { this.gameTitle = t; }

    // ── equals / hashCode / toString ──────────────────────────────────────────
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Review)) return false;
        Review r = (Review) o;
        return userId == r.userId && gameId == r.gameId;
    }

    @Override
    public int hashCode() { return Objects.hash(userId, gameId); }

    @Override
    public String toString() {
        return "Review{userId=" + userId + ", gameId=" + gameId +
               ", rating=" + rating + ", date=" + reviewDate + "}";
    }
}
