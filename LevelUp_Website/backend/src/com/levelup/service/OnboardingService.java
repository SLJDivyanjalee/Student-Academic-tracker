package com.levelup.service;

import com.levelup.dao.PlannerSettingsDao;
import com.levelup.dao.UserDao;
import com.levelup.exception.DaoException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.model.PlannerSettings;
import com.levelup.model.User;
import com.levelup.util.ValidationUtil;

import java.util.List;
import java.util.Map;

public class OnboardingService {

    private static final int MIN_SUBJECTS = 1;
    private static final int MAX_SUBJECTS = 30;
    private static final int MIN_DAILY_GOAL_HOURS = 1;
    private static final int MAX_DAILY_GOAL_HOURS = 10;
    private static final int DEFAULT_DAILY_GOAL_HOURS = 2;

    private final UserDao userDao = new UserDao();
    private final PlannerSettingsDao plannerSettingsDao = new PlannerSettingsDao();

    public User getStatus(int userId) throws DaoException {
        User user = userDao.findById(userId);
        if (user == null) throw new ResourceNotFoundException("User " + userId + " not found");
        return user;
    }

    public User complete(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();

        String semester = ValidationUtil.optionalString(body, "semester");
        if (semester != null && semester.trim().isEmpty()) semester = null;

        Integer subjectsCount = ValidationUtil.optionalInt(body, "subjectsCount");
        if (subjectsCount != null) {
            if (subjectsCount < MIN_SUBJECTS || subjectsCount > MAX_SUBJECTS) {
                errors.add("subjectsCount must be between " + MIN_SUBJECTS + " and " + MAX_SUBJECTS);
            }
        }

        Integer dailyGoalHours = ValidationUtil.optionalInt(body, "dailyGoalHours");
        if (dailyGoalHours == null) {
            dailyGoalHours = DEFAULT_DAILY_GOAL_HOURS;
        } else if (dailyGoalHours < MIN_DAILY_GOAL_HOURS || dailyGoalHours > MAX_DAILY_GOAL_HOURS) {
            errors.add("dailyGoalHours must be between " + MIN_DAILY_GOAL_HOURS + " and " + MAX_DAILY_GOAL_HOURS);
        }

        boolean notifyAssignments = ValidationUtil.optionalBoolean(body, "notifyAssignmentReminders", true);
        boolean notifyExams = ValidationUtil.optionalBoolean(body, "notifyExamReminders", true);
        boolean notifyStudy = ValidationUtil.optionalBoolean(body, "notifyStudyReminders", true);

        ValidationUtil.throwIfErrors(errors);

        userDao.completeOnboarding(userId, semester, subjectsCount, notifyAssignments, notifyExams, notifyStudy);

        PlannerSettings settings = plannerSettingsDao.getSettings(userId);
        settings.setDailyCapMinutes(dailyGoalHours * 60);
        plannerSettingsDao.saveSettings(userId, settings);

        return getStatus(userId);
    }
}
