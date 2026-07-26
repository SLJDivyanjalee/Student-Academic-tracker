package com.levelup.service;

import com.levelup.dao.SubjectDao;
import com.levelup.dao.TaskDao;
import com.levelup.exception.DaoException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.model.Subject;
import com.levelup.model.Task;
import com.levelup.util.ValidationUtil;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class TaskService {

    private final TaskDao taskDao = new TaskDao();
    private final SubjectDao subjectDao = new SubjectDao();

    public List<Task> listAll(int userId, String statusFilter) throws DaoException {
        if (statusFilter != null && !statusFilter.isEmpty()) {
            return taskDao.findByStatus(userId, statusFilter);
        }
        return taskDao.findAll(userId);
    }

    public Task get(int userId, int id) throws DaoException {
        Task task = taskDao.findById(userId, id);
        if (task == null) throw new ResourceNotFoundException("Task " + id + " not found");
        return task;
    }

    public Task create(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String title = ValidationUtil.requireNonEmptyString(body, "title", errors);
        LocalDate dueDate = ValidationUtil.optionalDate(body, "dueDate", errors);
        String status = ValidationUtil.optionalString(body, "status");
        if (status == null) status = Task.STATUS_PENDING;
        String urgency = ValidationUtil.optionalString(body, "urgency");
        if (urgency == null) urgency = "medium";
        ValidationUtil.requireOneOf(status, "status", errors, "pending", "progress", "done");
        ValidationUtil.requireOneOf(urgency, "urgency", errors, "low", "medium", "high");
        ValidationUtil.throwIfErrors(errors);

        Subject subject = resolveSubject(userId, body);
        String description = ValidationUtil.optionalString(body, "description");
        String category = ValidationUtil.optionalString(body, "category");

        Task task = new Task(title, description, dueDate, subject, status, urgency, category);
        return taskDao.create(userId, task);
    }

    public Task update(int userId, int id, Map<String, Object> body) throws DaoException {
        Task existing = get(userId, id);
        List<String> errors = ValidationUtil.newErrorList();

        if (body.containsKey("title")) {
            existing.setTitle(ValidationUtil.requireNonEmptyString(body, "title", errors));
        }
        if (body.containsKey("dueDate")) {
            existing.setDueDate(ValidationUtil.optionalDate(body, "dueDate", errors));
        }
        if (body.containsKey("description")) {
            existing.setDescription(ValidationUtil.optionalString(body, "description"));
        }
        if (body.containsKey("category")) {
            existing.setCategory(ValidationUtil.optionalString(body, "category"));
        }
        if (body.containsKey("status")) {
            String status = ValidationUtil.optionalString(body, "status");
            ValidationUtil.requireOneOf(status, "status", errors, "pending", "progress", "done");
            if (errors.isEmpty()) existing.setStatus(status);
        }
        if (body.containsKey("urgency")) {
            String urgency = ValidationUtil.optionalString(body, "urgency");
            ValidationUtil.requireOneOf(urgency, "urgency", errors, "low", "medium", "high");
            if (errors.isEmpty()) existing.setUrgency(urgency);
        }
        if (body.containsKey("subjectId")) {
            existing.setSubject(resolveSubject(userId, body));
        }
        ValidationUtil.throwIfErrors(errors);

        taskDao.update(userId, existing);
        return existing;
    }

    public void delete(int userId, int id) throws DaoException {
        get(userId, id);
        taskDao.delete(userId, id);
    }

    private Subject resolveSubject(int userId, Map<String, Object> body) throws DaoException {
        Integer subjectId = ValidationUtil.optionalInt(body, "subjectId");
        if (subjectId == null) return null;
        Subject subject = subjectDao.findById(userId, subjectId);
        if (subject == null) throw new ResourceNotFoundException("Subject " + subjectId + " not found");
        return subject;
    }
}
