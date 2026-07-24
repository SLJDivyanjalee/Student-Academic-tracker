package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;
import com.levelup.interfaces.CrudDao;
import com.levelup.model.StudySession;
import com.levelup.model.Subject;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/* study_sessions table */
public class StudySessionDao implements CrudDao<StudySession, Integer> {

    private static final String SELECT_BASE =
            "SELECT ss.*, s.name AS subject_name, s.color_hex AS subject_color " +
            "FROM study_sessions ss LEFT JOIN subjects s ON ss.subject_id = s.id";

    @Override
    public StudySession create(int userId, StudySession session) throws DaoException {
        String sql = "INSERT INTO study_sessions (user_id, title, subject_id, session_date, start_time, end_time, session_type, completed, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setString(2, session.getTitle());
            setNullableInt(ps, 3, session.getSubject() != null ? session.getSubject().getId() : null);
            ps.setDate(4, Date.valueOf(session.getDueDate()));
            ps.setTime(5, Time.valueOf(session.getStartTime()));
            ps.setTime(6, Time.valueOf(session.getEndTime()));
            ps.setString(7, session.getSessionType());
            ps.setBoolean(8, session.isCompleted());
            ps.setTimestamp(9, Timestamp.valueOf(session.getCreatedAt() != null ? session.getCreatedAt() : LocalDateTime.now()));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) session.setId(keys.getInt(1));
            }
            return session;
        } catch (SQLException e) {
            throw new DaoException("Failed to create study session: " + e.getMessage(), e);
        }
    }

    @Override
    public StudySession findById(int userId, Integer id) throws DaoException {
        String sql = SELECT_BASE + " WHERE ss.id = ? AND ss.user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to find study session " + id + ": " + e.getMessage(), e);
        }
    }

    @Override
    public List<StudySession> findAll(int userId) throws DaoException {
        String sql = SELECT_BASE + " WHERE ss.user_id = ? ORDER BY ss.session_date, ss.start_time";
        List<StudySession> sessions = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) sessions.add(mapRow(rs));
            }
            return sessions;
        } catch (SQLException e) {
            throw new DaoException("Failed to list study sessions: " + e.getMessage(), e);
        }
    }

    public List<StudySession> findByDateRange(int userId, java.time.LocalDate from, java.time.LocalDate to) throws DaoException {
        String sql = SELECT_BASE + " WHERE ss.user_id = ? AND ss.session_date BETWEEN ? AND ? ORDER BY ss.session_date, ss.start_time";
        List<StudySession> sessions = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setDate(2, Date.valueOf(from));
            ps.setDate(3, Date.valueOf(to));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) sessions.add(mapRow(rs));
            }
            return sessions;
        } catch (SQLException e) {
            throw new DaoException("Failed to list study sessions in range: " + e.getMessage(), e);
        }
    }

    /* Deletes every auto-generated session for this user so the planner can regenerate them from scratch. */
    public void deleteAll(int userId) throws DaoException {
        String sql = "DELETE FROM study_sessions WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clear study sessions: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean update(int userId, StudySession session) throws DaoException {
        String sql = "UPDATE study_sessions SET title=?, subject_id=?, session_date=?, start_time=?, end_time=?, session_type=?, completed=? " +
                "WHERE id=? AND user_id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, session.getTitle());
            setNullableInt(ps, 2, session.getSubject() != null ? session.getSubject().getId() : null);
            ps.setDate(3, Date.valueOf(session.getDueDate()));
            ps.setTime(4, Time.valueOf(session.getStartTime()));
            ps.setTime(5, Time.valueOf(session.getEndTime()));
            ps.setString(6, session.getSessionType());
            ps.setBoolean(7, session.isCompleted());
            ps.setInt(8, session.getId());
            ps.setInt(9, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to update study session " + session.getId() + ": " + e.getMessage(), e);
        }
    }

    @Override
    public boolean delete(int userId, Integer id) throws DaoException {
        String sql = "DELETE FROM study_sessions WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to delete study session " + id + ": " + e.getMessage(), e);
        }
    }

    private void setNullableInt(PreparedStatement ps, int idx, Integer value) throws SQLException {
        if (value == null) ps.setNull(idx, Types.INTEGER);
        else ps.setInt(idx, value);
    }

    private StudySession mapRow(ResultSet rs) throws SQLException {
        Subject subject = null;
        int subjectId = rs.getInt("subject_id");
        if (!rs.wasNull()) {
            subject = new Subject(subjectId, rs.getString("subject_name"), rs.getString("subject_color"));
        }
        Timestamp createdAtTs = rs.getTimestamp("created_at");
        return new StudySession(
                rs.getInt("id"),
                rs.getString("title"),
                rs.getDate("session_date").toLocalDate(),
                rs.getTime("start_time").toLocalTime(),
                rs.getTime("end_time").toLocalTime(),
                subject,
                rs.getString("session_type"),
                rs.getBoolean("completed"),
                createdAtTs != null ? createdAtTs.toLocalDateTime() : LocalDateTime.now()
        );
    }
}
