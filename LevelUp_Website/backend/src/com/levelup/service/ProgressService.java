package com.levelup.service;

import com.levelup.dao.AttendanceDao;
import com.levelup.dao.StudySessionDao;
import com.levelup.dao.TaskDao;
import com.levelup.exception.DaoException;
import com.levelup.model.AttendanceRecord;
import com.levelup.model.StudySession;
import com.levelup.model.Task;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class ProgressService {

    private static final int LOOKBACK_DAYS_FOR_STREAK = 400; 
    private static final int RECENT_DAYS_FOR_WIDGET = 7;

    private final TaskDao taskDao = new TaskDao();
    private final StudySessionDao studySessionDao = new StudySessionDao();
    private final AttendanceDao attendanceDao = new AttendanceDao();

    public Map<String, Object> getStreak(int userId) throws DaoException {
        Set<LocalDate> activeDays = collectActiveDays(userId);

        LocalDate today = LocalDate.now();
        int currentStreak = computeStreak(activeDays, today);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("currentStreak", currentStreak);
        result.put("last7Days", buildRecentDays(activeDays, today));
        return result;
    }

    private Set<LocalDate> collectActiveDays(int userId) throws DaoException {
        Set<LocalDate> days = new HashSet<>();

        List<Task> tasks = taskDao.findAll(userId);
        for (Task t : tasks) {
            if (Task.STATUS_DONE.equals(t.getStatus()) && t.getDueDate() != null) {
                days.add(t.getDueDate());
            }
        }

        List<StudySession> sessions = studySessionDao.findAll(userId);
        for (StudySession s : sessions) {
            if (s.isCompleted() && s.getDueDate() != null) {
                days.add(s.getDueDate());
            }
        }

        List<AttendanceRecord> records = attendanceDao.findAll(userId);
        for (AttendanceRecord r : records) {
            if (AttendanceRecord.PRESENT.equals(r.getStatus()) && r.getDate() != null) {
                days.add(r.getDate());
            }
        }

        return days;
    }

    private int computeStreak(Set<LocalDate> activeDays, LocalDate today) {
        LocalDate cursor = activeDays.contains(today) ? today : today.minusDays(1);
        int streak = 0;
        while (activeDays.contains(cursor) && streak < LOOKBACK_DAYS_FOR_STREAK) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private List<Object> buildRecentDays(Set<LocalDate> activeDays, LocalDate today) {
        List<Object> out = new java.util.ArrayList<>();
        LocalDate start = today.minusDays(RECENT_DAYS_FOR_WIDGET - 1);
        for (int i = 0; i < RECENT_DAYS_FOR_WIDGET; i++) {
            LocalDate day = start.plusDays(i);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", day.toString());
            entry.put("dayLabel", dayLetter(day.getDayOfWeek()));
            entry.put("active", activeDays.contains(day));
            entry.put("isToday", day.equals(today));
            out.add(entry);
        }
        return out;
    }

    private String dayLetter(DayOfWeek dow) {
        return dow.getDisplayName(TextStyle.NARROW, Locale.ENGLISH);
    }
}
