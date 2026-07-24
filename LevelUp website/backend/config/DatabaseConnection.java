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

        throw new IllegalStateException(
                "Could not find db.properties. Copy db.properties.example to db.properties " +
                "next to the compiled classes (or project root) and fill in your MySQL credentials.");
    }

    private static InputStream tryOpenFile(String path) {
        try {
            return new FileInputStream(path);
        } catch (IOException e) {
            return null;
        }
    }

   
    public static Connection getConnection() throws SQLException {
        loadProperties();
        String url = PROPERTIES.getProperty("db.url");
        String user = PROPERTIES.getProperty("db.user");
        String password = PROPERTIES.getProperty("db.password");
        if (url == null) {
            throw new SQLException("db.url missing from db.properties");
        }
        return DriverManager.getConnection(url, user, password);
    }

    
    public static String getProperty(String key) {
        loadProperties();
        return PROPERTIES.getProperty(key);
    }
}
