package com.gamevault.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Properties;

/**
 * DBConnection — Singleton HikariCP connection pool for Oracle.
 *
 * Usage:
 *   Connection conn = DBConnection.getInstance().getConnection();
 *   // use conn ...
 *   conn.close();  // returns to pool, does NOT close physical connection
 *
 * Shutdown (call once at app exit):
 *   DBConnection.getInstance().close();
 */
public class DBConnection {

    private static final Logger log = LoggerFactory.getLogger(DBConnection.class);
    private static final String PROPS_FILE = "db.properties";

    // Volatile for double-checked locking
    private static volatile DBConnection instance;
    private final HikariDataSource dataSource;

    // ── Private constructor ───────────────────────────────────────────────────
    private DBConnection() {
        Properties props = loadProperties();
        HikariConfig config = new HikariConfig();

        String url = props.getProperty("db.url");
        config.setJdbcUrl(url);
        config.setUsername(props.getProperty("db.username"));
        config.setPassword(props.getProperty("db.password"));

        // Auto-detect driver and test query based on URL
        if (url != null && url.startsWith("jdbc:h2:")) {
            config.setDriverClassName(props.getProperty("db.driver", "org.h2.Driver"));
            config.setConnectionTestQuery("SELECT 1");
        } else {
            config.setDriverClassName(props.getProperty("db.driver", "oracle.jdbc.OracleDriver"));
            config.setConnectionTestQuery("SELECT 1 FROM DUAL");
        }

        // Pool tuning
        config.setMaximumPoolSize(Integer.parseInt(props.getProperty("db.pool.maxPoolSize", "10")));
        config.setMinimumIdle(Integer.parseInt(props.getProperty("db.pool.minIdle", "2")));
        config.setConnectionTimeout(Long.parseLong(props.getProperty("db.pool.connectionTimeout", "30000")));
        config.setIdleTimeout(Long.parseLong(props.getProperty("db.pool.idleTimeout", "600000")));
        config.setMaxLifetime(Long.parseLong(props.getProperty("db.pool.maxLifetime", "1800000")));
        config.setPoolName(props.getProperty("db.pool.poolName", "GameVaultPool"));

        this.dataSource = new HikariDataSource(config);
        log.info("HikariCP pool '{}' initialized. URL: {}",
                config.getPoolName(), config.getJdbcUrl());
    }

    // ── Singleton accessor ────────────────────────────────────────────────────
    public static DBConnection getInstance() {
        if (instance == null) {
            synchronized (DBConnection.class) {
                if (instance == null) {
                    instance = new DBConnection();
                }
            }
        }
        return instance;
    }

    /**
     * Borrows a connection from the pool.
     * Always call conn.close() in a finally block to return it.
     */
    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    /**
     * Gracefully shuts down the pool. Call once when the application exits.
     */
    public void close() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            log.info("HikariCP pool shut down.");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private Properties loadProperties() {
        Properties props = new Properties();
        try (InputStream is = getClass().getClassLoader()
                                        .getResourceAsStream(PROPS_FILE)) {
            if (is == null) {
                throw new RuntimeException(
                    "Cannot find '" + PROPS_FILE + "' on the classpath. " +
                    "Copy db.properties into src/main/resources/ and fill in your credentials.");
            }
            props.load(is);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load " + PROPS_FILE, e);
        }
        return props;
    }
}
