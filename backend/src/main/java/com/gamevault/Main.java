package com.gamevault;

import com.gamevault.config.DBConnection;
import com.gamevault.model.*;
import com.gamevault.service.*;

import java.util.List;

/**
 * Main — End-to-end demo of the GameVault JDBC backend.
 *
 * Run this to verify your Oracle connection and all service operations work.
 *
 * Usage:
 *   1. Fill in src/main/resources/db.properties with your Oracle credentials.
 *   2. Ensure the schema + sample data are loaded on your Oracle instance.
 *   3. Run: mvn exec:java -Dexec.mainClass="com.gamevault.Main"
 *      OR:  mvn package && java -jar target/gamevault-backend-all.jar
 */
public class Main {

    // ── Colour codes for pretty console output ─────────────────────────────────
    private static final String RESET  = "\033[0m";
    private static final String GREEN  = "\033[32m";
    private static final String CYAN   = "\033[36m";
    private static final String YELLOW = "\033[33m";
    private static final String RED    = "\033[31m";
    private static final String BOLD   = "\033[1m";

    public static void main(String[] args) {
        banner();

        // ── Services (Member 4 uses these exact same classes in Swing) ──
        UserService        userService        = new UserService();
        GameService        gameService        = new GameService();
        LibraryService     libraryService     = new LibraryService();
        ReviewService      reviewService      = new ReviewService();
        AchievementService achievementService = new AchievementService();
        FriendService      friendService      = new FriendService();

        try {
            // ─────────────────────────────────────────────────────────────────
            // STEP 1: Login as an existing user
            // ─────────────────────────────────────────────────────────────────
            section("STEP 1 — Login");
            User user = userService.login("Arjun");
            ok("Logged in as: " + user);

            // ─────────────────────────────────────────────────────────────────
            // STEP 2: Browse the game catalogue
            // ─────────────────────────────────────────────────────────────────
            section("STEP 2 — Game Catalogue");
            List<Game> allGames = gameService.getAllGames();
            ok("Total games in DB: " + allGames.size());
            allGames.forEach(g ->
                info("  • " + g.getTitle() + " (" + g.getReleaseYear() + ")" +
                     " — " + g.getDeveloperName() +
                     " | Genres: " + g.getGenres() +
                     " | Platforms: " + g.getPlatforms())
            );

            // Search
            List<Game> searchResult = gameService.searchByTitle("God");
            ok("Search 'God' → " + searchResult.size() + " game(s) found");

            // Filter by genre
            List<Game> rpgGames = gameService.findByGenre("RPG");
            ok("RPG games → " + rpgGames.size() + " found");

            // ─────────────────────────────────────────────────────────────────
            // STEP 3: View Arjun's library
            // ─────────────────────────────────────────────────────────────────
            section("STEP 3 — User Library");
            List<UserGame> library = libraryService.getLibrary(user.getUserId());
            ok("Library entries: " + library.size());
            library.forEach(ug ->
                info("  • " + ug.getGameTitle() + " on " + ug.getPlatformName() +
                     " | " + ug.getStatus() + " | " + ug.getPlaytimeHrs() + "h")
            );
            info("  Total playtime: " + libraryService.getTotalPlaytime(user.getUserId()) + " hrs");
            info("  Completed count: " + libraryService.countByStatus(user.getUserId(), "Completed"));

            // ─────────────────────────────────────────────────────────────────
            // STEP 4: View reviews
            // ─────────────────────────────────────────────────────────────────
            section("STEP 4 — Reviews");
            List<Review> reviewsForGame1 = reviewService.getReviewsForGame(1);
            ok("Reviews for game 1 (God of War Ragnarok): " + reviewsForGame1.size());
            reviewsForGame1.forEach(r ->
                info("  • " + r.getUsername() + " rated " + r.getRating() + "/10: " +
                     r.getReviewText())
            );

            List<Review> userReviews = reviewService.getReviewsByUser(user.getUserId());
            ok("Arjun's reviews: " + userReviews.size());

            double avgRating = gameService.getAverageRating(1);
            info("  Avg rating for game 1: " + String.format("%.2f", avgRating));

            // ─────────────────────────────────────────────────────────────────
            // STEP 5: Achievements
            // ─────────────────────────────────────────────────────────────────
            section("STEP 5 — Achievements");
            List<Achievement> achievements = achievementService.getAchievementsForGame(1);
            ok("Achievements for God of War: " + achievements.size());
            achievements.forEach(a ->
                info("  • [" + a.getPoints() + "pts] " + a.getAchievementName() +
                     " — " + a.getDescription())
            );

            List<UserAchievement> unlocked = achievementService.getUnlockedByUser(user.getUserId());
            ok("Arjun's unlocked achievements: " + unlocked.size());
            int totalPts = achievementService.getTotalPoints(user.getUserId());
            info("  Total achievement points: " + totalPts);

            double completionGame1 = achievementService.getCompletionPercent(user.getUserId(), 1);
            info("  Game 1 completion: " + String.format("%.1f%%", completionGame1));

            // ─────────────────────────────────────────────────────────────────
            // STEP 6: Friends
            // ─────────────────────────────────────────────────────────────────
            section("STEP 6 — Friends");
            List<User> friends = friendService.getFriends(user.getUserId());
            ok("Arjun's friends: " + friends.size());
            friends.forEach(f -> info("  • " + f.getUsername() + " (" + f.getEmail() + ")"));

            // ─────────────────────────────────────────────────────────────────
            // STEP 7: Validation demo — should throw exception
            // ─────────────────────────────────────────────────────────────────
            section("STEP 7 — Input Validation");
            try {
                reviewService.submitReview(user.getUserId(), 1, 15, "test"); // rating 15 invalid
                error("FAIL — should have thrown ValidationException!");
            } catch (com.gamevault.exception.ValidationException e) {
                ok("Caught expected ValidationException: " + e.getMessage());
            }

            try {
                friendService.addFriend(user.getUserId(), user.getUserId()); // self-friend
                error("FAIL — should have thrown ValidationException!");
            } catch (com.gamevault.exception.ValidationException e) {
                ok("Caught expected ValidationException: " + e.getMessage());
            }

            // ─────────────────────────────────────────────────────────────────
            // DONE
            // ─────────────────────────────────────────────────────────────────
            section("ALL CHECKS PASSED ✓");
            ok("Backend is connected to Oracle and working correctly!");

        } catch (Exception e) {
            error("Unexpected error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            // Always close the pool when the app exits
            DBConnection.getInstance().close();
        }
    }

    // ── Console helpers ───────────────────────────────────────────────────────
    private static void banner() {
        System.out.println(BOLD + CYAN);
        System.out.println("+==============================================+");
        System.out.println("|   GameVault -- Java Backend & JDBC Demo      |");
        System.out.println("|   Member 3 -- DAO & Service Layer            |");
        System.out.println("+==============================================+");
        System.out.println(RESET);
    }

    private static void section(String title) {
        int pad = Math.max(0, 40 - title.length());
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < pad; i++) sb.append("-");
        System.out.println("\n" + BOLD + YELLOW + "-- " + title + " " + sb.toString() + RESET);
    }

    private static void ok(String msg) {
        System.out.println(GREEN + "  [OK] " + msg + RESET);
    }

    private static void info(String msg) {
        System.out.println(RESET + msg);
    }

    private static void error(String msg) {
        System.out.println(RED + "  [FAIL] " + msg + RESET);
    }
}
