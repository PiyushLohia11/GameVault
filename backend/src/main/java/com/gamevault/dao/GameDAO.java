package com.gamevault.dao;

import com.gamevault.config.DBConnection;
import com.gamevault.exception.DatabaseException;
import com.gamevault.model.Game;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * GameDAO — Queries for SYSTEM.GAME table, joined with DEVELOPER, GENRE, PLATFORM.
 */
public class GameDAO {

    private static final Logger log = LoggerFactory.getLogger(GameDAO.class);

    // SQL that returns full game info joined with developer
    private static final String BASE_SELECT =
        "SELECT g.GAME_ID, g.TITLE, g.DEVELOPER_ID, d.DEVELOPER_NAME, g.RELEASE_YEAR " +
        "FROM SYSTEM.GAME g " +
        "JOIN SYSTEM.DEVELOPER d ON g.DEVELOPER_ID = d.DEVELOPER_ID ";

    // ── Find by ID (with genres + platforms) ──────────────────────────────────
    public Optional<Game> findById(int gameId) {
        String sql = BASE_SELECT + "WHERE g.GAME_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, gameId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Game game = mapRow(rs);
                    loadGenres(conn, game);
                    loadPlatforms(conn, game);
                    return Optional.of(game);
                }
            }
        } catch (SQLException e) {
            log.error("findById({}) failed", gameId, e);
            throw new DatabaseException("Failed to find game by ID: " + gameId, e);
        }
        return Optional.empty();
    }

    // ── Find all ──────────────────────────────────────────────────────────────
    public List<Game> findAll() {
        String sql = BASE_SELECT + "ORDER BY g.GAME_ID";
        List<Game> games = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Game g = mapRow(rs);
                loadGenres(conn, g);
                loadPlatforms(conn, g);
                games.add(g);
            }
        } catch (SQLException e) {
            log.error("findAll() failed", e);
            throw new DatabaseException("Failed to fetch all games", e);
        }
        return games;
    }

    // ── Search by title (partial, case-insensitive) ───────────────────────────
    public List<Game> searchByTitle(String titleQuery) {
        String sql = BASE_SELECT +
                     "WHERE UPPER(g.TITLE) LIKE UPPER(?) ORDER BY g.TITLE";
        List<Game> games = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "%" + titleQuery + "%");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Game g = mapRow(rs);
                    loadGenres(conn, g);
                    loadPlatforms(conn, g);
                    games.add(g);
                }
            }
        } catch (SQLException e) {
            log.error("searchByTitle({}) failed", titleQuery, e);
            throw new DatabaseException("Failed to search games by title", e);
        }
        return games;
    }

    // ── Find by genre name ────────────────────────────────────────────────────
    public List<Game> findByGenre(String genreName) {
        String sql = BASE_SELECT +
                     "JOIN SYSTEM.GAME_GENRE gg ON g.GAME_ID = gg.GAME_ID " +
                     "JOIN SYSTEM.GENRE ge ON gg.GENRE_ID = ge.GENRE_ID " +
                     "WHERE UPPER(ge.GENRE_NAME) = UPPER(?) ORDER BY g.TITLE";
        List<Game> games = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, genreName);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Game g = mapRow(rs);
                    loadGenres(conn, g);
                    loadPlatforms(conn, g);
                    games.add(g);
                }
            }
        } catch (SQLException e) {
            log.error("findByGenre({}) failed", genreName, e);
            throw new DatabaseException("Failed to find games by genre", e);
        }
        return games;
    }

    // ── Find by developer name ────────────────────────────────────────────────
    public List<Game> findByDeveloper(String developerName) {
        String sql = BASE_SELECT +
                     "WHERE UPPER(d.DEVELOPER_NAME) LIKE UPPER(?) ORDER BY g.TITLE";
        List<Game> games = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "%" + developerName + "%");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Game g = mapRow(rs);
                    loadGenres(conn, g);
                    loadPlatforms(conn, g);
                    games.add(g);
                }
            }
        } catch (SQLException e) {
            log.error("findByDeveloper({}) failed", developerName, e);
            throw new DatabaseException("Failed to find games by developer", e);
        }
        return games;
    }

    // ── Find by release year ──────────────────────────────────────────────────
    public List<Game> findByYear(int year) {
        String sql = BASE_SELECT + "WHERE g.RELEASE_YEAR = ? ORDER BY g.TITLE";
        List<Game> games = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, year);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Game g = mapRow(rs);
                    loadGenres(conn, g);
                    loadPlatforms(conn, g);
                    games.add(g);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find games by year", e);
        }
        return games;
    }

    // ── Get average rating for a game (from REVIEW table) ────────────────────
    public double getAverageRating(int gameId) {
        String sql = "SELECT AVG(RATING) FROM SYSTEM.REVIEW WHERE GAME_ID = ?";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, gameId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    double avg = rs.getDouble(1);
                    return rs.wasNull() ? 0.0 : avg;
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to compute average rating for game " + gameId, e);
        }
        return 0.0;
    }

    // ── Get all genre names ───────────────────────────────────────────────────
    public List<String> getAllGenreNames() {
        String sql = "SELECT GENRE_NAME FROM SYSTEM.GENRE ORDER BY GENRE_NAME";
        List<String> genres = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) genres.add(rs.getString("GENRE_NAME"));
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch genres", e);
        }
        return genres;
    }

    // ── Get all platform names ────────────────────────────────────────────────
    public List<String> getAllPlatformNames() {
        String sql = "SELECT PLATFORM_NAME FROM SYSTEM.PLATFORM ORDER BY PLATFORM_NAME";
        List<String> platforms = new ArrayList<>();
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) platforms.add(rs.getString("PLATFORM_NAME"));
        } catch (SQLException e) {
            throw new DatabaseException("Failed to fetch platforms", e);
        }
        return platforms;
    }

    // ── Find platform ID by name ──────────────────────────────────────────────
    public Optional<Integer> findPlatformIdByName(String platformName) {
        String sql = "SELECT PLATFORM_ID FROM SYSTEM.PLATFORM WHERE UPPER(PLATFORM_NAME) = UPPER(?)";
        try (Connection conn = DBConnection.getInstance().getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, platformName);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return Optional.of(rs.getInt("PLATFORM_ID"));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Failed to find platform ID by name", e);
        }
        return Optional.empty();
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private Game mapRow(ResultSet rs) throws SQLException {
        return new Game(
            rs.getInt("GAME_ID"),
            rs.getString("TITLE"),
            rs.getInt("DEVELOPER_ID"),
            rs.getString("DEVELOPER_NAME"),
            rs.getInt("RELEASE_YEAR")
        );
    }

    private void loadGenres(Connection conn, Game game) throws SQLException {
        String sql = "SELECT ge.GENRE_NAME " +
                     "FROM SYSTEM.GENRE ge " +
                     "JOIN SYSTEM.GAME_GENRE gg ON ge.GENRE_ID = gg.GENRE_ID " +
                     "WHERE gg.GAME_ID = ? ORDER BY ge.GENRE_NAME";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, game.getGameId());
            try (ResultSet rs = ps.executeQuery()) {
                List<String> genres = new ArrayList<>();
                while (rs.next()) genres.add(rs.getString("GENRE_NAME"));
                game.setGenres(genres);
            }
        }
    }

    private void loadPlatforms(Connection conn, Game game) throws SQLException {
        String sql = "SELECT p.PLATFORM_NAME " +
                     "FROM SYSTEM.PLATFORM p " +
                     "JOIN SYSTEM.GAME_PLATFORM gp ON p.PLATFORM_ID = gp.PLATFORM_ID " +
                     "WHERE gp.GAME_ID = ? ORDER BY p.PLATFORM_NAME";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, game.getGameId());
            try (ResultSet rs = ps.executeQuery()) {
                List<String> platforms = new ArrayList<>();
                while (rs.next()) platforms.add(rs.getString("PLATFORM_NAME"));
                game.setPlatforms(platforms);
            }
        }
    }
}
