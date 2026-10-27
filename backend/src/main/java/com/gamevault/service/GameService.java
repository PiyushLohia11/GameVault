package com.gamevault.service;

import com.gamevault.dao.GameDAO;
import com.gamevault.exception.NotFoundException;
import com.gamevault.model.Game;
import com.gamevault.util.InputValidator;

import java.util.List;
import java.util.Optional;

/**
 * GameService — Game catalogue browsing and search.
 */
public class GameService {

    private final GameDAO gameDAO;

    public GameService() {
        this.gameDAO = new GameDAO();
    }

    public GameService(GameDAO gameDAO) {
        this.gameDAO = gameDAO;
    }

    public Game getById(int gameId) {
        InputValidator.validateId("gameId", gameId);
        return gameDAO.findById(gameId)
                .orElseThrow(() -> new NotFoundException("Game", gameId));
    }

    public Game getGameById(int gameId) {
        return getById(gameId);
    }

    public List<Game> getAllGames() {
        return gameDAO.findAll();
    }

    public List<Game> searchByTitle(String query) {
        InputValidator.requireNonBlank("query", query);
        return gameDAO.searchByTitle(query.trim());
    }

    public List<Game> findByGenre(String genreName) {
        InputValidator.requireNonBlank("genreName", genreName);
        return gameDAO.findByGenre(genreName.trim());
    }

    public List<Game> findByDeveloper(String developer) {
        InputValidator.requireNonBlank("developer", developer);
        return gameDAO.findByDeveloper(developer.trim());
    }

    public List<Game> findByYear(int year) {
        if (year < 1970 || year > 2100) {
            throw new com.gamevault.exception.ValidationException("year",
                "Release year must be between 1970 and 2100. Got: " + year);
        }
        return gameDAO.findByYear(year);
    }

    public double getAverageRating(int gameId) {
        InputValidator.validateId("gameId", gameId);
        return gameDAO.getAverageRating(gameId);
    }

    public List<String> getAllGenres() {
        return gameDAO.getAllGenreNames();
    }

    public List<String> getAllPlatforms() {
        return gameDAO.getAllPlatformNames();
    }
}
