package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;
import com.levelup.model.AcademicItem;
import com.levelup.model.Assignment;
import com.levelup.model.Exam;
import com.levelup.model.Subject;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AssignmentExamDao {

    private static final String SELECT_BASE =
            "SELECT a.*, s.name AS subject_name, s.color_hex AS subject_color " +
            "FROM assignments_exams a LEFT JOIN subjects s ON a.subject_id = s.id";

    public AcademicItem create(int userId, AcademicItem item) throws DaoException {
        String sql = "INSERT INTO assignments_exams " +
                "(user_id, title, description, due_date, subject_id, item_type, weight, submission_status, venue, exam_type, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setString(2, item.getTitle());
            ps.setString(3, item.getDescription());
            setNullableDate(ps, 4, item.getDueDate());
            setNullableInt(ps, 5, item.getSubject() != null ? item.getSubject().getId() : null);

            if (item instanceof Assignment) {
                Assignment a = (Assignment) item;
                ps.setString(6, "assignment");
                ps.setDouble(7, a.getWeight());
                ps.setString(8, a.getSubmissionStatus());
                ps.setNull(9, Types.VARCHAR);
                ps.setNull(10, Types.VARCHAR);
            } else if (item instanceof Exam) {
                Exam ex = (Exam) item;
                ps.setString(6, "exam");
                ps.setDouble(7, ex.getWeight());
                ps.setNull(8, Types.VARCHAR);
                ps.setString(9, ex.getVenue());
                ps.setString(10, ex.getExamType());
            } else {
                throw new DaoException("Unsupported academic item type: " + item.getClass());
            }
            ps.setTimestamp(11, Timestamp.valueOf(item.getCreatedAt() != null ? item.getCreatedAt() : LocalDateTime.now()));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) item.setId(keys.getInt(1));
            }
            return item;
        } catch (SQLException e) {
            throw new DaoException("Failed to create assignment/exam: " + e.getMessage(), e);
        }
    }

    public AcademicItem findById(int userId, int id) throws DaoException {
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
            throw new DaoException("Failed to find assignment/exam " + id + ": " + e.getMessage(), e);
        }
    }

    public List<AcademicItem> findAll(int userId) throws DaoException {
        return findAllInternal(SELECT_BASE + " WHERE a.user_id = ? ORDER BY a.due_date IS NULL, a.due_date ASC", userId, null);
    }

    public List<AcademicItem> findByType(int userId, String itemType) throws DaoException {
        return findAllInternal(SELECT_BASE + " WHERE a.user_id = ? AND a.item_type = ? ORDER BY a.due_date IS NULL, a.due_date ASC",
                userId, itemType);
    }

    private List<AcademicItem> findAllInternal(String sql, int userId, String itemType) throws DaoException {
        List<AcademicItem> items = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            if (itemType != null) ps.setString(2, itemType);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) items.add(mapRow(rs));
            }
            return items;
        } catch (SQLException e) {
            throw new DaoException("Failed to list assignments/exams: " + e.getMessage(), e);
        }
    }

    public boolean update(int userId, AcademicItem item) throws DaoException {
        String sql = "UPDATE assignments_exams SET title=?, description=?, due_date=?, subject_id=?, " +
                "weight=?, submission_status=?, venue=?, exam_type=? WHERE id=? AND user_id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, item.getTitle());
            ps.setString(2, item.getDescription());
            setNullableDate(ps, 3, item.getDueDate());
            setNullableInt(ps, 4, item.getSubject() != null ? item.getSubject().getId() : null);
            if (item instanceof Assignment) {
                Assignment a = (Assignment) item;
                ps.setDouble(5, a.getWeight());
                ps.setString(6, a.getSubmissionStatus());
                ps.setNull(7, Types.VARCHAR);
                ps.setNull(8, Types.VARCHAR);
            } else if (item instanceof Exam) {
                Exam ex = (Exam) item;
                ps.setDouble(5, ex.getWeight());
                ps.setNull(6, Types.VARCHAR);
                ps.setString(7, ex.getVenue());
                ps.setString(8, ex.getExamType());
            } else {
                throw new DaoException("Unsupported academic item type: " + item.getClass());
            }
            ps.setInt(9, item.getId());
            ps.setInt(10, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to update assignment/exam " + item.getId() + ": " + e.getMessage(), e);
        }
    }

    public boolean delete(int userId, int id) throws DaoException {
        String sql = "DELETE FROM assignments_exams WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to delete assignment/exam " + id + ": " + e.getMessage(), e);
        }
    }

    /** Deletes every assignment and exam belonging to this user when clicked reset button*/
    public void deleteAllForUser(int userId) throws DaoException {
        String sql = "DELETE FROM assignments_exams WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clear assignments/exams: " + e.getMessage(), e);
        }
    }

    private void setNullableDate(PreparedStatement ps, int idx, LocalDate date) throws SQLException {
        if (date == null) ps.setNull(idx, Types.DATE);
        else ps.setDate(idx, Date.valueOf(date));
    }

    private void setNullableInt(PreparedStatement ps, int idx, Integer value) throws SQLException {
        if (value == null) ps.setNull(idx, Types.INTEGER);
        else ps.setInt(idx, value);
    }

    private AcademicItem mapRow(ResultSet rs) throws SQLException {
        Subject subject = null;
        int subjectId = rs.getInt("subject_id");
        if (!rs.wasNull()) {
            subject = new Subject(subjectId, rs.getString("subject_name"), rs.getString("subject_color"));
        }
        Date dueDate = rs.getDate("due_date");
        LocalDate localDueDate = dueDate != null ? dueDate.toLocalDate() : null;
        Timestamp createdAtTs = rs.getTimestamp("created_at");
        LocalDateTime createdAt = createdAtTs != null ? createdAtTs.toLocalDateTime() : LocalDateTime.now();
        String itemType = rs.getString("item_type");

        if ("exam".equals(itemType)) {
            return new Exam(rs.getInt("id"), rs.getString("title"), rs.getString("description"), localDueDate,
                    subject, rs.getDouble("weight"), rs.getString("venue"), rs.getString("exam_type"), createdAt);
        } else {
            return new Assignment(rs.getInt("id"), rs.getString("title"), rs.getString("description"), localDueDate,
                    subject, rs.getDouble("weight"), rs.getString("submission_status"), createdAt);
        }
    }
}
