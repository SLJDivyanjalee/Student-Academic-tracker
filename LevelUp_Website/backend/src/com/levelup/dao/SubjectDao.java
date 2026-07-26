package com.levelup.dao;

import com.levelup.config.DatabaseConnection;
import com.levelup.exception.DaoException;
import com.levelup.interfaces.CrudDao;
import com.levelup.model.Subject;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/* subjects table */
public class SubjectDao implements CrudDao<Subject, Integer> {

    @Override
    public Subject create(int userId, Subject subject) throws DaoException {
        String sql = "INSERT INTO subjects (user_id, name, color_hex) VALUES (?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setInt(1, userId);
            ps.setString(2, subject.getName());
            ps.setString(3, subject.getColorHex());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) subject.setId(keys.getInt(1));
            }
            return subject;
        } catch (SQLException e) {
            throw new DaoException("Failed to create subject: " + e.getMessage(), e);
        }
    }

    @Override
    public Subject findById(int userId, Integer id) throws DaoException {
        String sql = "SELECT * FROM subjects WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
                return null;
            }
        } catch (SQLException e) {
            throw new DaoException("Failed to find subject " + id + ": " + e.getMessage(), e);
        }
    }

    @Override
    public List<Subject> findAll(int userId) throws DaoException {
        String sql = "SELECT * FROM subjects WHERE user_id = ? ORDER BY name";
        List<Subject> subjects = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) subjects.add(mapRow(rs));
            }
            return subjects;
        } catch (SQLException e) {
            throw new DaoException("Failed to list subjects: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean update(int userId, Subject subject) throws DaoException {
        String sql = "UPDATE subjects SET name = ?, color_hex = ? WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, subject.getName());
            ps.setString(2, subject.getColorHex());
            ps.setInt(3, subject.getId());
            ps.setInt(4, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to update subject " + subject.getId() + ": " + e.getMessage(), e);
        }
    }

    @Override
    public boolean delete(int userId, Integer id) throws DaoException {
        String sql = "DELETE FROM subjects WHERE id = ? AND user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.setInt(2, userId);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DaoException("Failed to delete subject " + id + ": " + e.getMessage(), e);
        }
    }

    /** Deletes every subject belonging to this user by clicking Reset button */
    public void deleteAllForUser(int userId) throws DaoException {
        String sql = "DELETE FROM subjects WHERE user_id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new DaoException("Failed to clear subjects: " + e.getMessage(), e);
        }
    }

    private Subject mapRow(ResultSet rs) throws SQLException {
        return new Subject(rs.getInt("id"), rs.getString("name"), rs.getString("color_hex"));
    }
}
