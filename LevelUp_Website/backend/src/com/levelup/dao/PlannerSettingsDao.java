package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;
import com.levelup.model.PlannerSettings;

import java.sql.*;

/* planner_settings */
public class PlannerSettingsDao {

    public PlannerSettings getSettings(int userId) throws DaoException {
        String sql = "SELECT * FROM planner_settings WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return new PlannerSettings(); // sensible defaults if nothing saved yet
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to load planner settings: " + e.getMessage(), e);
        }
    }

    public PlannerSettings saveSettings(int userId, PlannerSettings settings) throws DaoException {
        String sql = "INSERT INTO planner_settings (user_id, work_start, work_end, daily_cap_minutes, rest_on_holidays) " +
                "VALUES (?, ?, ?, ?, ?) " +
                "ON DUPLICATE KEY UPDATE work_start=VALUES(work_start), work_end=VALUES(work_end), " +
                "daily_cap_minutes=VALUES(daily_cap_minutes), rest_on_holidays=VALUES(rest_on_holidays)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setTime(2, Time.valueOf(settings.getWorkStart()));
            ps.setTime(3, Time.valueOf(settings.getWorkEnd()));
            ps.setInt(4, settings.getDailyCapMinutes());
            ps.setBoolean(5, settings.isRestOnHolidays());
            ps.executeUpdate();
            settings.setId(userId);
            return settings;
        } catch (SQLException e) {
            throw new DaoException("Failed to save planner settings: " + e.getMessage(), e);
        }
    }

    public void createDefaultIfMissing(int userId) throws DaoException {
        String sql = "INSERT IGNORE INTO planner_settings (user_id, work_start, work_end, daily_cap_minutes, rest_on_holidays) " +
                "VALUES (?, '07:00:00', '22:00:00', 120, FALSE)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to create default planner settings: " + e.getMessage(), e);
        }
    }

    /* Deletes this user's planner_settings row outright by clicking Reset Data*/
    public void deleteByUser(int userId) throws DaoException {
        String sql = "DELETE FROM planner_settings WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clear planner settings: " + e.getMessage(), e);
        }
    }

    private PlannerSettings mapRow(ResultSet rs) throws SQLException {
        PlannerSettings settings = new PlannerSettings(
                rs.getTime("work_start").toLocalTime(),
                rs.getTime("work_end").toLocalTime(),
                rs.getInt("daily_cap_minutes"),
                rs.getBoolean("rest_on_holidays")
        );
        settings.setId(rs.getInt("user_id"));
        return settings;
    }
}
