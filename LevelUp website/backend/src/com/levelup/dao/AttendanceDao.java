package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;
import com.levelup.interfaces.CrudDao;
import com.levelup.model.AttendanceRecord;
import com.levelup.model.Subject;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/* CRUD for the attendance table*/
public class AttendanceDao implements CrudDao<AttendanceRecord, Integer> {

    private static final String SELECT_BASE =
            "SELECT a.*, s.name AS subject_name, s.color_hex AS subject_color " +
            "FROM attendance a LEFT JOIN subjects s ON a.subject_id = s.id";

    @Override
    public AttendanceRecord create(int userId, AttendanceRecord record) throws DaoException {
        String sql = "INSERT INTO attendance (user_id, subject_id, lecture_id, date, status) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setInt(2, record.getSubject().getId());
            if (record.getLectureId() != null) ps.setInt(3, record.getLectureId());
            else ps.setNull(3, Types.INTEGER);
            ps.setDate(4, Date.valueOf(record.getDate()));
            ps.setString(5, record.getStatus());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) record.setId(keys.getInt(1));
            }
            return record;
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) {
                throw new DaoException("This lecture has already been marked for today.", e);
            }
            throw new DaoException("Failed to create attendance record: " + e.getMessage(), e);
        }
    }

    public AttendanceRecord findByLectureAndDate(int userId, int lectureId, java.time.LocalDate date) throws DaoException {
        String sql = SELECT_BASE + " WHERE a.user_id = ? AND a.lecture_id = ? AND a.date = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, lectureId);
            ps.setDate(3, Date.valueOf(date));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to look up attendance for lecture " + lectureId + ": " + e.getMessage(), e);
        }
    }

    @Override
    public AttendanceRecord findById(int userId, Integer id) throws DaoException {
        String sql = SELECT_BASE + " WHERE a.id = ? AND a.user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to find attendance record " + id + ": " + e.getMessage(), e);
        }
    }

    @Override
    public List<AttendanceRecord> findAll(int userId) throws DaoException {
        String sql = SELECT_BASE + " WHERE a.user_id = ? ORDER BY a.date DESC";
        List<AttendanceRecord> records = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) records.add(mapRow(rs));
            }
            return records;
        } catch (SQLException e) {
            throw new DaoException("Failed to list attendance records: " + e.getMessage(), e);
        }
    }

    public List<AttendanceRecord> findBySubject(int userId, int subjectId) throws DaoException {
        String sql = SELECT_BASE + " WHERE a.user_id = ? AND a.subject_id = ? ORDER BY a.date DESC";
        List<AttendanceRecord> records = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setInt(2, subjectId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) records.add(mapRow(rs));
            }
            return records;
        } catch (SQLException e) {
            throw new DaoException("Failed to list attendance for subject " + subjectId + ": " + e.getMessage(), e);
        }
    }

    @Override
    public boolean update(int userId, AttendanceRecord record) throws DaoException {
        String sql = "UPDATE attendance SET subject_id=?, lecture_id=?, date=?, status=? WHERE id=? AND user_id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, record.getSubject().getId());
            if (record.getLectureId() != null) ps.setInt(2, record.getLectureId());
            else ps.setNull(2, Types.INTEGER);
            ps.setDate(3, Date.valueOf(record.getDate()));
            ps.setString(4, record.getStatus());
            ps.setInt(5, record.getId());
            ps.setInt(6, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            if (e.getErrorCode() == 1062) {
                throw new DaoException("This lecture has already been marked for today.", e);
            }
            throw new DaoException("Failed to update attendance record " + record.getId() + ": " + e.getMessage(), e);
        }
    }

    @Override
    public boolean delete(int userId, Integer id) throws DaoException {
        String sql = "DELETE FROM attendance WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to delete attendance record " + id + ": " + e.getMessage(), e);
        }
    }

    /* Deletes every attendance record belonging to this user when clicked reset button*/
    public void deleteAllForUser(int userId) throws DaoException {
        String sql = "DELETE FROM attendance WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clear attendance: " + e.getMessage(), e);
        }
    }

    private AttendanceRecord mapRow(ResultSet rs) throws SQLException {
        Subject subject = new Subject(rs.getInt("subject_id"), rs.getString("subject_name"),
                rs.getString("subject_color"));
        int lectureIdRaw = rs.getInt("lecture_id");
        Integer lectureId = rs.wasNull() ? null : lectureIdRaw;
        return new AttendanceRecord(rs.getInt("id"), subject, lectureId, rs.getDate("date").toLocalDate(), rs.getString("status"));
    }
}
