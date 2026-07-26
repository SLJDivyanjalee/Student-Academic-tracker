package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;

import java.sql.*;
import java.time.LocalDateTime;

/* password_resets table */
public class PasswordResetDao {

    public void create(String token, int userId, LocalDateTime expiresAt) throws DaoException {
        String sql = "INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            ps.setInt(2, userId);
            ps.setTimestamp(3, Timestamp.valueOf(expiresAt));
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to create password reset token: " + e.getMessage(), e);
        }
    }

    public Integer findValidUserId(String token) throws DaoException {
        String sql = "SELECT user_id, expires_at, used FROM password_resets WHERE token = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                if (rs.getBoolean("used")) return null;
                Timestamp expiresAt = rs.getTimestamp("expires_at");
                if (expiresAt != null && expiresAt.toLocalDateTime().isBefore(LocalDateTime.now())) {
                    return null; // expired
                }
                return rs.getInt("user_id");
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to validate password reset token: " + e.getMessage(), e);
        }
    }

    public void markUsed(String token) throws DaoException {
        String sql = "UPDATE password_resets SET used = TRUE WHERE token = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, token);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to mark password reset token used: " + e.getMessage(), e);
        }
    }

    public void deleteForUser(int userId) throws DaoException {
        String sql = "DELETE FROM password_resets WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clear old password reset tokens: " + e.getMessage(), e);
        }
    }
}
