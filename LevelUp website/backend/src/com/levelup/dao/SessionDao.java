package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;

import java.sql.*;
import java.time.LocalDateTime;

/* sessions table */
public class SessionDao {

    public void create(String token, int userId, LocalDateTime expiresAt) throws DaoException {
        String sql = "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            ps.setInt(2, userId);
            ps.setTimestamp(3, Timestamp.valueOf(expiresAt));
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to create session: " + e.getMessage(), e);
        }
    }

    public Integer findUserIdByValidToken(String token) throws DaoException {
        String sql = "SELECT user_id, expires_at FROM sessions WHERE token = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                Timestamp expiresAt = rs.getTimestamp("expires_at");
                if (expiresAt != null && expiresAt.toLocalDateTime().isBefore(LocalDateTime.now())) {
                    return null; // expired
                }
                return rs.getInt("user_id");
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to validate session: " + e.getMessage(), e);
        }
    }

    public void delete(String token) throws DaoException {
        String sql = "DELETE FROM sessions WHERE token = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to delete session: " + e.getMessage(), e);
        }
    }

    /* Deletes this user's already-expired sessions */
    public void deleteExpiredForUser(int userId) throws DaoException {
        String sql = "DELETE FROM sessions WHERE user_id = ? AND expires_at < ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now()));
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clean up expired sessions: " + e.getMessage(), e);
        }
    }
}
