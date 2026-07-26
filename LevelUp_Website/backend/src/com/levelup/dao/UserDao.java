package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;
import com.levelup.model.User;

import java.sql.*;
import java.time.LocalDateTime;

/* users table */
public class UserDao {

    public User create(User user) throws DaoException {
        String sql = "INSERT INTO users (name, email, password_hash, password_salt, faculty, semester, " +
                "avatar_url, notifications_enabled, onboarding_complete) VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPasswordHash());
            ps.setString(4, user.getPasswordSalt());
            ps.setString(5, user.getFaculty());
            ps.setString(6, user.getSemester());
            ps.setString(7, user.getAvatarUrl());
            ps.setBoolean(8, user.isNotificationsEnabled());
            ps.executeUpdate();
            user.setOnboardingComplete(false);
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) user.setId(keys.getInt(1));
            }
            return user;
        } catch (SQLIntegrityConstraintViolationException e) {
            throw new DaoException("An account with that email already exists", e);
        } catch (SQLException e) {
            throw new DaoException("Failed to create user: " + e.getMessage(), e);
        }
    }

    public User findByEmail(String email) throws DaoException {
        String sql = "SELECT * FROM users WHERE email = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email.trim().toLowerCase());
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to look up user by email: " + e.getMessage(), e);
        }
    }

    public User findById(int id) throws DaoException {
        String sql = "SELECT * FROM users WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to find user " + id + ": " + e.getMessage(), e);
        }
    }

    /* Updates profile fields (Settings page) */
    public boolean updateProfile(User user) throws DaoException {
        String sql = "UPDATE users SET name=?, email=?, faculty=?, semester=?, avatar_url=?, " +
                "notifications_enabled=? WHERE id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, user.getName());
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getFaculty());
            ps.setString(4, user.getSemester());
            ps.setString(5, user.getAvatarUrl());
            ps.setBoolean(6, user.isNotificationsEnabled());
            ps.setInt(7, user.getId());
            return ps.executeUpdate() > 0;
        } catch (SQLIntegrityConstraintViolationException e) {
            throw new DaoException("An account with that email already exists", e);
        } catch (SQLException e) {
            throw new DaoException("Failed to update user " + user.getId() + ": " + e.getMessage(), e);
        }
    }

    public boolean completeOnboarding(int userId, String semester, Integer subjectsCount,
                                       boolean notifyAssignments, boolean notifyExams, boolean notifyStudy) throws DaoException {
        String sql = "UPDATE users SET semester = COALESCE(?, semester), onboarding_subjects_count = ?, " +
                "notify_assignment_reminders = ?, notify_exam_reminders = ?, notify_study_reminders = ?, " +
                "notifications_enabled = ?, onboarding_complete = TRUE WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, semester);
            if (subjectsCount != null) ps.setInt(2, subjectsCount); else ps.setNull(2, Types.INTEGER);
            ps.setBoolean(3, notifyAssignments);
            ps.setBoolean(4, notifyExams);
            ps.setBoolean(5, notifyStudy);
            ps.setBoolean(6, notifyAssignments || notifyExams || notifyStudy);
            ps.setInt(7, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to save onboarding preferences for user " + userId + ": " + e.getMessage(), e);
        }
    }

    public boolean updatePassword(int userId, String newHash, String newSalt) throws DaoException {
        String sql = "UPDATE users SET password_hash=?, password_salt=? WHERE id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newHash);
            ps.setString(2, newSalt);
            ps.setInt(3, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to update password for user " + userId + ": " + e.getMessage(), e);
        }
    }

    /* Delete Account */
    public boolean deleteById(int userId) throws DaoException {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to delete user " + userId + ": " + e.getMessage(), e);
        }
    }

    private User mapRow(ResultSet rs) throws SQLException {
        User user = new User();
        user.setId(rs.getInt("id"));
        user.setPasswordHash(rs.getString("password_hash"));
        user.setPasswordSalt(rs.getString("password_salt"));
        user.setFaculty(rs.getString("faculty"));
        user.setSemester(rs.getString("semester"));
        user.setAvatarUrl(rs.getString("avatar_url"));
        user.setNotificationsEnabled(rs.getBoolean("notifications_enabled"));
        Timestamp createdAt = rs.getTimestamp("created_at");
        user.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : LocalDateTime.now());
        user.setOnboardingComplete(rs.getBoolean("onboarding_complete"));
        int subjectsCount = rs.getInt("onboarding_subjects_count");
        user.setOnboardingSubjectsCount(rs.wasNull() ? null : subjectsCount);
        user.setNotifyAssignmentReminders(rs.getBoolean("notify_assignment_reminders"));
        user.setNotifyExamReminders(rs.getBoolean("notify_exam_reminders"));
        user.setNotifyStudyReminders(rs.getBoolean("notify_study_reminders"));
        try {
            user.setName(rs.getString("name"));
        } catch (IllegalArgumentException ignored) {
            
        }
        try {
            user.setEmail(rs.getString("email"));
        } catch (IllegalArgumentException ignored) {

        }
        return user;
    }
}
