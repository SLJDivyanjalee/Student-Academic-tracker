package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;
import com.levelup.interfaces.CrudDao;
import com.levelup.model.Subject;
import com.levelup.model.Task;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/* tasks table */
public class TaskDao implements CrudDao<Task, Integer> {

    private static final String SELECT_BASE =
            "SELECT t.*, s.name AS subject_name, s.color_hex AS subject_color " +
            "FROM tasks t LEFT JOIN subjects s ON t.subject_id = s.id";

    @Override
    public Task create(int userId, Task task) throws DaoException {
        String sql = "INSERT INTO tasks (user_id, title, description, due_date, subject_id, status, urgency, category, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setString(2, task.getTitle());
            ps.setString(3, task.getDescription());
            setNullableDate(ps, 4, task.getDueDate());
            setNullableInt(ps, 5, task.getSubject() != null ? task.getSubject().getId() : null);
            ps.setString(6, task.getStatus());
            ps.setString(7, task.getUrgency());
            ps.setString(8, task.getCategory());
            ps.setTimestamp(9, Timestamp.valueOf(task.getCreatedAt() != null ? task.getCreatedAt() : LocalDateTime.now()));
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) task.setId(keys.getInt(1));
            }
            return task;
        } catch (SQLException e) {
            throw new DaoException("Failed to create task: " + e.getMessage(), e);
        }
    }

    @Override
    public Task findById(int userId, Integer id) throws DaoException {
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
            throw new DaoException("Failed to find task " + id + ": " + e.getMessage(), e);
        }
    }

    @Override
    public List<Task> findAll(int userId) throws DaoException {
        String sql = SELECT_BASE + " WHERE t.user_id = ? ORDER BY t.due_date IS NULL, t.due_date ASC";
        List<Task> tasks = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) tasks.add(mapRow(rs));
            }
            return tasks;
        } catch (SQLException e) {
            throw new DaoException("Failed to list tasks: " + e.getMessage(), e);
        }
    }

    public List<Task> findByStatus(int userId, String status) throws DaoException {
        String sql = SELECT_BASE + " WHERE t.user_id = ? AND t.status = ? ORDER BY t.due_date IS NULL, t.due_date ASC";
        List<Task> tasks = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.setString(2, status);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) tasks.add(mapRow(rs));
            }
            return tasks;
        } catch (SQLException e) {
            throw new DaoException("Failed to list tasks by status: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean update(int userId, Task task) throws DaoException {
        String sql = "UPDATE tasks SET title=?, description=?, due_date=?, subject_id=?, status=?, urgency=?, category=? " +
                "WHERE id=? AND user_id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, task.getTitle());
            ps.setString(2, task.getDescription());
            setNullableDate(ps, 3, task.getDueDate());
            setNullableInt(ps, 4, task.getSubject() != null ? task.getSubject().getId() : null);
            ps.setString(5, task.getStatus());
            ps.setString(6, task.getUrgency());
            ps.setString(7, task.getCategory());
            ps.setInt(8, task.getId());
            ps.setInt(9, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to update task " + task.getId() + ": " + e.getMessage(), e);
        }
    }

    @Override
    public boolean delete(int userId, Integer id) throws DaoException {
        String sql = "DELETE FROM tasks WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to delete task " + id + ": " + e.getMessage(), e);
        }
    }

    /* Deletes every task belonging to this user by clicking Reset button */
    public void deleteAllForUser(int userId) throws DaoException {
        String sql = "DELETE FROM tasks WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clear tasks: " + e.getMessage(), e);
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

    private Task mapRow(ResultSet rs) throws SQLException {
        Subject subject = null;
        int subjectId = rs.getInt("subject_id");
        if (!rs.wasNull()) {
            subject = new Subject(subjectId, rs.getString("subject_name"), rs.getString("subject_color"));
        }
        Date dueDate = rs.getDate("due_date");
        Timestamp createdAt = rs.getTimestamp("created_at");
        return new Task(
                rs.getInt("id"),
                rs.getString("title"),
                rs.getString("description"),
                dueDate != null ? dueDate.toLocalDate() : null,
                subject,
                rs.getString("status"),
                rs.getString("urgency"),
                rs.getString("category"),
                createdAt != null ? createdAt.toLocalDateTime() : LocalDateTime.now()
        );
    }
}
