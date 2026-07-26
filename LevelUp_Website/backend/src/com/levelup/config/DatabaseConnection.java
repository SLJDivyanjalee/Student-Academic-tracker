package com.levelup.config;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public final class DatabaseConnection {

    private static final Properties PROPERTIES = new Properties();
    private static boolean loaded = false;

    private DatabaseConnection() {
        // utility class - no instances
    }

    private static synchronized void loadProperties() {
        if (loaded) return;
        try (InputStream fileStream = tryOpenFile("db.properties")) {
            if (fileStream != null) {
                PROPERTIES.load(fileStream);
                loaded = true;
                System.out.println("[DatabaseConnection] Loaded db.properties from working directory.");
                return;
            }
        } catch (IOException e) {
            System.err.println("[DatabaseConnection] Failed reading db.properties from disk: " + e.getMessage());
        }

        // 2) fall back to a copy bundled on the classpath (src root)
        try (InputStream classpathStream = DatabaseConnection.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (classpathStream != null) {
                PROPERTIES.load(classpathStream);
                loaded = true;
                System.out.println("[DatabaseConnection] Loaded db.properties from classpath.");
                return;
            }
        } catch (IOException e) {
            System.err.println("[DatabaseConnection] Failed reading db.properties from classpath: " + e.getMessage());
        }

        // No file found — that's fine if everything needed is supplied via
        // environment variables (e.g. on Render). Only becomes a problem if a
        // property is requested that has neither an env var nor a file value.
        loaded = true;
        System.out.println("[DatabaseConnection] No db.properties found; relying on environment variables.");
    }

    private static InputStream tryOpenFile(String path) {
        try {
            return new FileInputStream(path);
        } catch (IOException e) {
            return null;
        }
    }

    public static Connection getConnection() throws SQLException {
        String url = getProperty("db.url");
        String user = getProperty("db.user");
        String password = getProperty("db.password");
        if (url == null) {
            throw new SQLException("db.url missing (set DB_URL env var or db.url in db.properties)");
        }
        return DriverManager.getConnection(url, user, password);
    }

    /**
     * Looks up a config value, preferring an environment variable over the
     * properties file. This lets hosts like Render supply secrets via their
     * dashboard instead of a committed file.
     *
     * "db.url" -> checks env var "DB_URL" first, then falls back to
     * db.properties. Same pattern for db.user, db.password, ai.gemini.apiKey, etc.
     */
    public static String getProperty(String key) {
        String envKey = key.toUpperCase().replace('.', '_');
        String envValue = System.getenv(envKey);
        if (envValue != null && !envValue.isEmpty()) {
            return envValue;
        }
        loadProperties();
        return PROPERTIES.getProperty(key);
    }
}
