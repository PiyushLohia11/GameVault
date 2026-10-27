package com.gamevault;

import com.gamevault.model.*;
import com.gamevault.service.*;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * GameVaultServer — Built-in REST API Server for the React.js Frontend.
 *
 * Implemented using pure standard Java networking (java.net.ServerSocket).
 * Has ZERO access restrictions and runs on ANY Java version (Java 8 to 21+).
 *
 * Exposes JSON REST endpoints with CORS enabled for the React Vite frontend (localhost:3000).
 */
public class GameVaultServer {

    private static final int PORT =
        Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));

    private static final UserService userService = new UserService();
    private static final GameService gameService = new GameService();
    private static final LibraryService libraryService = new LibraryService();
    private static final ReviewService reviewService = new ReviewService();
    private static final AchievementService achievementService = new AchievementService();
    private static final FriendService friendService = new FriendService();

    private static final ExecutorService pool = Executors.newFixedThreadPool(10);

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println(" Starting GameVault REST API Server on port " + PORT + "...");
        System.out.println("=================================================");

        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println(" GameVault REST API Server is LIVE at: http://localhost:" + PORT);
            System.out.println(" Test in browser: http://localhost:" + PORT + "/api/games");
            System.out.println(" Or open test-client.html to view live dashboard.");
            System.out.println("=================================================");

            while (true) {
                Socket clientSocket = serverSocket.accept();
                pool.submit(() -> handleClient(clientSocket));
            }
        } catch (IOException e) {
            System.err.println("Server error: " + e.getMessage());
        }
    }

    private static void handleClient(Socket socket) {
        try {
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            String requestLine = in.readLine();
            if (requestLine == null || requestLine.trim().isEmpty()) {
                socket.close();
                return;
            }

            String[] parts = requestLine.split(" ");
            if (parts.length < 2) {
                socket.close();
                return;
            }

            String method = parts[0].toUpperCase();
            String fullPath = parts[1];

            // Read HTTP headers
            int contentLength = 0;
            String headerLine;
            while ((headerLine = in.readLine()) != null && !headerLine.isEmpty()) {
                if (headerLine.toLowerCase().startsWith("content-length:")) {
                    contentLength = Integer.parseInt(headerLine.substring(15).trim());
                }
            }

            // Read HTTP body
            String body = "";
            if (contentLength > 0) {
                char[] buf = new char[contentLength];
                int read = 0;
                while (read < contentLength) {
                    int r = in.read(buf, read, contentLength - read);
                    if (r == -1) break;
                    read += r;
                }
                body = new String(buf, 0, read);
            }

            // Handle CORS preflight OPTIONS
            if ("OPTIONS".equals(method)) {
                sendResponse(socket, 204, "");
                return;
            }

            // Parse URL path and query parameters
            String path = fullPath;
            String query = "";
            int qIdx = fullPath.indexOf('?');
            if (qIdx != -1) {
                path = fullPath.substring(0, qIdx);
                query = fullPath.substring(qIdx + 1);
            }
            Map<String, String> params = queryToMap(query);

            // Route endpoints
            if (path.startsWith("/api/games")) {
                handleGames(socket, params);
            } else if (path.startsWith("/api/library")) {
                handleLibrary(socket, method, params, body);
            } else if (path.startsWith("/api/reviews")) {
                handleReviews(socket, method, params, body);
            } else if (path.startsWith("/api/achievements")) {
                handleAchievements(socket, params);
            } else if (path.startsWith("/api/friends")) {
                handleFriends(socket, params);
            } else if (path.startsWith("/api/dashboard")) {
                handleDashboard(socket, params);
            } else if (path.startsWith("/api/health")) {
                sendResponse(socket, 200, "{\"status\":\"UP\",\"message\":\"GameVault Backend is live\"}");
            } else {
                sendResponse(socket, 404, "{\"error\":\"Endpoint not found\"}");
            }

        } catch (Exception e) {
            try {
                sendResponse(socket, 500, String.format("{\"error\":\"%s\"}", escape(e.getMessage())));
            } catch (IOException ignored) {}
        } finally {
            try { socket.close(); } catch (IOException ignored) {}
        }
    }

    // ── Route Handlers ────────────────────────────────────────────────────────

    private static void handleGames(Socket socket, Map<String, String> params) throws IOException {
        String idParam = params.get("id");
        String genreParam = params.get("genre");
        String searchParam = params.get("q");

        if (idParam != null) {
            int id = Integer.parseInt(idParam);
            Game g = gameService.getGameById(id);
            System.out.printf("  [DATABASE QUERY] Fetched single game ID: %d (%s)%n", id, g != null ? g.getTitle() : "Not Found");
            sendResponse(socket, 200, gameToJson(g));
        } else if (genreParam != null) {
            List<Game> list = gameService.findByGenre(genreParam);
            System.out.printf("  [DATABASE QUERY] Fetched %d games for genre: '%s'%n", list.size(), genreParam);
            sendResponse(socket, 200, gamesListToJson(list));
        } else if (searchParam != null) {
            List<Game> list = gameService.searchByTitle(searchParam);
            System.out.printf("  [DATABASE QUERY] Search '%s' matched %d games%n", searchParam, list.size());
            sendResponse(socket, 200, gamesListToJson(list));
        } else {
            List<Game> list = gameService.getAllGames();
            System.out.printf("  [DATABASE QUERY] Fetched all %d games from catalogue%n", list.size());
            sendResponse(socket, 200, gamesListToJson(list));
        }
    }

    private static void handleLibrary(Socket socket, String method, Map<String, String> params, String body) throws IOException {
        if ("GET".equals(method)) {
            int userId = Integer.parseInt(params.getOrDefault("userId", "1"));
            List<UserGame> library = libraryService.getLibrary(userId);

            System.out.printf("  [DATABASE QUERY] Fetched %d vault games for User %d%n", library.size(), userId);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < library.size(); i++) {
                UserGame ug = library.get(i);
                if (i > 0) sb.append(",");
                sb.append(String.format("{\"userId\":%d,\"gameId\":%d,\"platformId\":%d,\"title\":\"%s\",\"platform\":\"%s\",\"status\":\"%s\",\"playtimeHours\":%.1f}",
                        ug.getUserId(), ug.getGameId(), ug.getPlatformId(),
                        escape(ug.getGameTitle()), escape(ug.getPlatformName()), escape(ug.getStatus()), ug.getPlaytimeHrs()));
            }
            sb.append("]");
            sendResponse(socket, 200, sb.toString());
        } else if ("POST".equals(method)) {
            Map<String, String> map = parseJsonBody(body);
            int userId = Integer.parseInt(map.getOrDefault("userId", "1"));
            int gameId = Integer.parseInt(map.getOrDefault("gameId", "1"));
            int platformId = Integer.parseInt(map.getOrDefault("platformId", "1"));
            String status = map.getOrDefault("status", "Backlog");

            libraryService.addGame(userId, gameId, platformId, status);
            System.out.printf("  >>> [DATABASE INSERT] Added Game ID %d to User %d's Vault! (Platform: %d, Status: '%s')%n",
                    gameId, userId, platformId, status);
            sendResponse(socket, 201, "{\"message\":\"Game added to library successfully\"}");
        } else if ("PUT".equals(method)) {
            Map<String, String> map = parseJsonBody(body);
            int userId = Integer.parseInt(map.getOrDefault("userId", "1"));
            int gameId = Integer.parseInt(map.getOrDefault("gameId", "1"));
            String status = map.get("status");
            String platform = map.getOrDefault("platform", "PC");
            String playtimeStr = map.get("playtimeHours");

            if (status != null && !status.isEmpty()) {
                libraryService.updateStatus(userId, gameId, platform, status);
            }
            if (playtimeStr != null && !playtimeStr.isEmpty()) {
                try {
                    double hrs = Double.parseDouble(playtimeStr);
                    libraryService.setPlaytime(userId, gameId, platform, hrs);
                } catch (NumberFormatException ignored) {}
            }
            System.out.printf("  >>> [DATABASE UPDATE] Updated Vault entry: Game %d for User %d (Platform: '%s', Status: '%s', Playtime: %sh)%n",
                    gameId, userId, platform, status, playtimeStr);
            sendResponse(socket, 200, "{\"message\":\"Library entry updated successfully\"}");
        }
    }

    private static void handleReviews(Socket socket, String method, Map<String, String> params, String body) throws IOException {
        if ("GET".equals(method)) {
            String gameId = params.get("gameId");
            String userId = params.get("userId");

            List<Review> reviews;
            if (gameId != null) {
                reviews = reviewService.getReviewsForGame(Integer.parseInt(gameId));
                System.out.printf("  [DATABASE QUERY] Fetched %d reviews for Game ID: %s%n", reviews.size(), gameId);
            } else if (userId != null) {
                reviews = reviewService.getReviewsByUser(Integer.parseInt(userId));
                System.out.printf("  [DATABASE QUERY] Fetched %d reviews by User ID: %s%n", reviews.size(), userId);
            } else {
                reviews = reviewService.getAllReviews();
                System.out.printf("  [DATABASE QUERY] Fetched all %d reviews in database%n", reviews.size());
            }

            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < reviews.size(); i++) {
                Review r = reviews.get(i);
                if (i > 0) sb.append(",");
                sb.append(String.format("{\"userId\":%d,\"gameId\":%d,\"username\":\"%s\",\"gameTitle\":\"%s\",\"rating\":%d,\"reviewText\":\"%s\",\"reviewDate\":\"%s\"}",
                        r.getUserId(), r.getGameId(), escape(r.getUsername()), escape(r.getGameTitle()),
                        r.getRating(), escape(r.getReviewText()), r.getReviewDate() != null ? r.getReviewDate().toString() : ""));
            }
            sb.append("]");
            sendResponse(socket, 200, sb.toString());
        } else if ("POST".equals(method)) {
            Map<String, String> map = parseJsonBody(body);
            int userId = Integer.parseInt(map.getOrDefault("userId", "1"));
            int gameId = Integer.parseInt(map.getOrDefault("gameId", "1"));
            int rating = Integer.parseInt(map.getOrDefault("rating", "10"));
            String text = map.getOrDefault("reviewText", "");

            double newAvg = reviewService.submitReview(userId, gameId, rating, text);
            System.out.printf("  >>> [DATABASE INSERT] Review submitted by User %d for Game %d! Rating: %d/10. New Avg Score: %.2f%n",
                    userId, gameId, rating, newAvg);
            sendResponse(socket, 201, String.format("{\"message\":\"Review submitted\",\"newAverageRating\":%.2f}", newAvg));
        }
    }

    private static void handleAchievements(Socket socket, Map<String, String> params) throws IOException {
        String gameIdParam = params.get("gameId");
        int gameId = gameIdParam != null ? Integer.parseInt(gameIdParam) : 1;

        List<Achievement> list = achievementService.getAchievementsForGame(gameId);
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            Achievement a = list.get(i);
            if (i > 0) sb.append(",");
            sb.append(String.format("{\"achievementId\":%d,\"gameId\":%d,\"name\":\"%s\",\"description\":\"%s\",\"points\":%d}",
                    a.getAchievementId(), a.getGameId(), escape(a.getAchievementName()), escape(a.getDescription()), a.getPoints()));
        }
        sb.append("]");
        sendResponse(socket, 200, sb.toString());
    }

    private static void handleFriends(Socket socket, Map<String, String> params) throws IOException {
        int userId = Integer.parseInt(params.getOrDefault("userId", "1"));
        List<User> friends = friendService.getFriends(userId);

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < friends.size(); i++) {
            User u = friends.get(i);
            if (i > 0) sb.append(",");
            sb.append(String.format("{\"userId\":%d,\"username\":\"%s\",\"email\":\"%s\"}",
                    u.getUserId(), escape(u.getUsername()), escape(u.getEmail())));
        }
        sb.append("]");
        sendResponse(socket, 200, sb.toString());
    }

    private static void handleDashboard(Socket socket, Map<String, String> params) throws IOException {
        int userId = Integer.parseInt(params.getOrDefault("userId", "1"));

        List<UserGame> library = libraryService.getLibrary(userId);
        double totalPlaytime = libraryService.getTotalPlaytime(userId);
        int totalPoints = achievementService.getTotalPoints(userId);
        int reviewsCount = reviewService.getReviewsByUser(userId).size();

        String json = String.format("{\"userId\":%d,\"vaultTotal\":%d,\"totalPlaytimeHours\":%.1f,\"achievementPoints\":%d,\"reviewsPenned\":%d}",
                userId, library.size(), totalPlaytime, totalPoints, reviewsCount);
        System.out.printf("  [DATABASE QUERY] Dashboard KPIs sent for User %d (Total Games: %d, Playtime: %.1fh, Points: %d)%n",
                userId, library.size(), totalPlaytime, totalPoints);
        sendResponse(socket, 200, json);
    }

    // ── HTTP Response Helper ──────────────────────────────────────────────────

    private static void sendResponse(Socket socket, int statusCode, String json) throws IOException {
        byte[] content = json.getBytes(StandardCharsets.UTF_8);
        String statusText = (statusCode == 200) ? "OK" : (statusCode == 201) ? "Created" : (statusCode == 204) ? "No Content" : "Error";

        OutputStream out = socket.getOutputStream();
        String header = "HTTP/1.1 " + statusCode + " " + statusText + "\r\n" +
                "Content-Type: application/json; charset=UTF-8\r\n" +
                "Content-Length: " + content.length + "\r\n" +
                "Access-Control-Allow-Origin: *\r\n" +
                "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n" +
                "Access-Control-Allow-Headers: Content-Type, Authorization\r\n" +
                "Connection: close\r\n\r\n";

        out.write(header.getBytes(StandardCharsets.UTF_8));
        if (content.length > 0) {
            out.write(content);
        }
        out.flush();
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }

    private static String gameToJson(Game g) {
        if (g == null) return "{}";
        double rating = g.getAvgRating() > 0 ? g.getAvgRating() : gameService.getAverageRating(g.getGameId());
        return String.format("{\"gameId\":%d,\"title\":\"%s\",\"developerName\":\"%s\",\"releaseYear\":%d,\"genres\":%s,\"platforms\":%s,\"avgRating\":%.2f}",
                g.getGameId(), escape(g.getTitle()), escape(g.getDeveloperName()), g.getReleaseYear(),
                listToStringArray(g.getGenres()), listToStringArray(g.getPlatforms()), rating);
    }

    private static String gamesListToJson(List<Game> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(gameToJson(list.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    private static String listToStringArray(List<String> list) {
        if (list == null) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escape(list.get(i))).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    private static Map<String, String> queryToMap(String query) {
        Map<String, String> result = new HashMap<>();
        if (query == null || query.isEmpty()) return result;
        for (String param : query.split("&")) {
            String[] entry = param.split("=");
            if (entry.length > 1) {
                result.put(entry[0], entry[1]);
            } else if (entry.length == 1) {
                result.put(entry[0], "");
            }
        }
        return result;
    }

    private static Map<String, String> parseJsonBody(String body) {
        Map<String, String> map = new HashMap<>();
        if (body == null) return map;
        String trimmed = body.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            String inner = trimmed.substring(1, trimmed.length() - 1);
            String[] pairs = inner.split(",");
            for (String pair : pairs) {
                String[] kv = pair.split(":", 2);
                if (kv.length == 2) {
                    String key = kv[0].trim().replace("\"", "");
                    String val = kv[1].trim().replace("\"", "");
                    map.put(key, val);
                }
            }
        }
        return map;
    }
}
