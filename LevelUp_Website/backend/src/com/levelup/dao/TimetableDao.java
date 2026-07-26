package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;
import com.levelup.interfaces.CrudDao;
import com.levelup.model.Subject;
import com.levelup.model.TimetableLecture;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/* timetable_lectures table */
public class TimetableDao implements CrudDao<TimetableLecture, Integer> {

    private static final String SELECT_BASE =
            "SELECT t.*, s.name AS subject_name, s.color_hex AS subject_color " +
            "FROM timetable_lectures t LEFT JOIN subjects s ON t.subject_id = s.id";

    @Override
    public TimetableLecture create(int userId, TimetableLecture lecture) throws DaoException {
        String sql = "INSERT INTO timetable_lectures (user_id, subject_id, day_of_week, start_time, end_time, location) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setInt(2, lecture.getSubject().getId());
            ps.setString(3, lecture.getDayOfWeek());
            ps.setTime(4, Time.valueOf(lecture.getStartTime()));
            ps.setTime(5, Time.valueOf(lecture.getEndTime()));
            ps.setString(6, lecture.getLocation());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) lecture.setId(keys.getInt(1));
            }
            return lecture;
        } catch (SQLException e) {
            throw new DaoException("Failed to create timetable lecture: " + e.getMessage(), e);
        }
    }

    @Override
    public TimetableLecture findById(int userId, Integer id) throws DaoException {
        String sql = SELECT_BASE + " WHERE t.id = ? AND t.user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to find timetable lecture " + id + ": " + e.getMessage(), e);
        }
    }

    @Override
    public List<TimetableLecture> findAll(int userId) throws DaoException {
        String sql = SELECT_BASE + " WHERE t.user_id = ? " +
                "ORDER BY FIELD(t.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun'), t.start_time";
        List<TimetableLecture> lectures = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lectures.add(mapRow(rs));
            }
            return lectures;
        } catch (SQLException e) {
            throw new DaoException("Failed to list timetable lectures: " + e.getMessage(), e);
        }
    }

    /* overlap checks. */
    public List<TimetableLecture> findByDay(int userId, String dayOfWeek) throws DaoException {
        String sql = SELECT_BASE + " WHERE t.user_id = ? AND t.day_of_week = ? ORDER BY t.start_time";
        List<TimetableLecture> lectures = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, dayOfWeek);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) lectures.add(mapRow(rs));
            }
            return lectures;
        } catch (SQLException e) {
            throw new DaoException("Failed to list lectures for day " + dayOfWeek + ": " + e.getMessage(), e);
        }
    }

    @Override
    public boolean update(int userId, TimetableLecture lecture) throws DaoException {
        String sql = "UPDATE timetable_lectures SET subject_id=?, day_of_week=?, start_time=?, end_time=?, location=? " +
                "WHERE id=? AND user_id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, lecture.getSubject().getId());
            ps.setString(2, lecture.getDayOfWeek());
            ps.setTime(3, Time.valueOf(lecture.getStartTime()));
            ps.setTime(4, Time.valueOf(lecture.getEndTime()));
            ps.setString(5, lecture.getLocation());
            ps.setInt(6, lecture.getId());
            ps.setInt(7, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to update timetable lecture " + lecture.getId() + ": " + e.getMessage(), e);
        }
    }

    @Override
    public boolean delete(int userId, Integer id) throws DaoException {
        String sql = "DELETE FROM timetable_lectures WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to delete timetable lecture " + id + ": " + e.getMessage(), e);
        }
    }

    /** Deletes every timetable lecture belonging to this user by clicking Reset button */
    public void deleteAllForUser(int userId) throws DaoException {
        String sql = "DELETE FROM timetable_lectures WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clear timetable lectures: " + e.getMessage(), e);
        }
    }

    private TimetableLecture mapRow(ResultSet rs) throws SQLException {
        Subject subject = new Subject(rs.getInt("subject_id"), rs.getString("subject_name"),
                rs.getString("subject_color"));
        return new TimetableLecture(rs.getInt("id"), subject, rs.getString("day_of_week"),
                rs.getTime("start_time").toLocalTime(), rs.getTime("end_time").toLocalTime(), rs.getString("location"));
    }
}
