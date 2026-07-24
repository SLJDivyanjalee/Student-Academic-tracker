package com.levelup.service;

import com.levelup.dao.AssignmentExamDao;
import com.levelup.dao.AttendanceDao;
import com.levelup.dao.PlannerSettingsDao;
import com.levelup.dao.StudySessionDao;
import com.levelup.dao.SubjectDao;
import com.levelup.dao.TaskDao;
import com.levelup.dao.TimetableDao;
import com.levelup.dao.UserDao;
import com.levelup.exception.DaoException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.model.User;
import com.levelup.util.ValidationUtil;

import com.levelup.exception.ValidationException;
import com.levelup.util.PasswordUtil;

import java.util.List;
import java.util.Map;

public class ProfileService {

    private static final int MIN_PASSWORD_LENGTH = 8;
    private final UserDao userDao = new UserDao();
    private final TaskDao taskDao = new TaskDao();
    private final AssignmentExamDao assignmentExamDao = new AssignmentExamDao();
    private final TimetableDao timetableDao = new TimetableDao();
    private final AttendanceDao attendanceDao = new AttendanceDao();
    private final StudySessionDao studySessionDao = new StudySessionDao();
    private final PlannerSettingsDao plannerSettingsDao = new PlannerSettingsDao();
    private final SubjectDao subjectDao = new SubjectDao();

    public User get(int userId) throws DaoException {
        User user = userDao.findById(userId);
        if (user == null) throw new ResourceNotFoundException("User " + userId + " not found");
        return user;
    }

    public User save(int userId, Map<String, Object> body) throws DaoException {
        User existing = get(userId);
        List<String> errors = ValidationUtil.newErrorList();
        String name = ValidationUtil.requireNonEmptyString(body, "name", errors);
        ValidationUtil.throwIfErrors(errors);

        existing.setName(name);
        existing.setFaculty(ValidationUtil.optionalString(body, "faculty"));
        if (body.containsKey("email")) {
            existing.setEmail(ValidationUtil.optionalString(body, "email")); 
        }
        existing.setSemester(ValidationUtil.optionalString(body, "semester"));
        existing.setAvatarUrl(ValidationUtil.optionalString(body, "avatarUrl"));
        existing.setNotificationsEnabled(ValidationUtil.optionalBoolean(body, "notificationsEnabled", true));

        userDao.updateProfile(existing);
        return existing;
    }

    public void changePassword(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String currentPassword = ValidationUtil.requireNonEmptyString(body, "currentPassword", errors);
        String newPassword = ValidationUtil.requireNonEmptyString(body, "newPassword", errors);
        if (newPassword != null && newPassword.length() < MIN_PASSWORD_LENGTH) {
            errors.add("newPassword must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        ValidationUtil.throwIfErrors(errors);

        User existing = get(userId);
        if (!PasswordUtil.verify(currentPassword, existing.getPasswordSalt(), existing.getPasswordHash())) {
            throw new ValidationException(List.of("Current password is incorrect"));
        }

        String newSalt = PasswordUtil.newSalt();
        String newHash = PasswordUtil.hash(newPassword, newSalt);
        userDao.updatePassword(userId, newHash, newSalt);
    }

    public void resetData(int userId) throws DaoException {
        taskDao.deleteAllForUser(userId);
        assignmentExamDao.deleteAllForUser(userId);
        timetableDao.deleteAllForUser(userId);
        attendanceDao.deleteAllForUser(userId);
        studySessionDao.deleteAll(userId);
        plannerSettingsDao.deleteByUser(userId);
        subjectDao.deleteAllForUser(userId);
    }

    public void deleteAccount(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String password = ValidationUtil.requireNonEmptyString(body, "password", errors);
        ValidationUtil.throwIfErrors(errors);

        User existing = get(userId);
        if (!PasswordUtil.verify(password, existing.getPasswordSalt(), existing.getPasswordHash())) {
            throw new ValidationException(List.of("Password is incorrect"));
        }

        userDao.deleteById(userId);
    }
}
