package com.levelup.service;

import com.levelup.dao.AssignmentExamDao;
import com.levelup.dao.PlannerSettingsDao;
import com.levelup.dao.StudySessionDao;
import com.levelup.dao.SubjectDao;
import com.levelup.dao.TimetableDao;
import com.levelup.exception.DaoException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.model.AcademicItem;
import com.levelup.model.PlannerSettings;
import com.levelup.model.StudySession;
import com.levelup.model.Subject;
import com.levelup.model.TimetableLecture;
import com.levelup.util.ValidationUtil;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class StudyPlannerService {

    private static final int STUDY_BLOCK_MINUTES = 60;
    private static final int GAP_MINUTES = 30;
    private static final int WEEKLY_MINUTES_PER_SUBJECT = 120;
    private static final int EXAM_PREP_DAYS_WINDOW = 7;
    private static final int EXAM_PREP_DAILY_CAP_MINUTES = 180;

    private final PlannerSettingsDao settingsDao = new PlannerSettingsDao();
    private final StudySessionDao sessionDao = new StudySessionDao();
    private final TimetableDao timetableDao = new TimetableDao();
    private final SubjectDao subjectDao = new SubjectDao();
    private final AssignmentExamDao assignmentExamDao = new AssignmentExamDao();

    // ---- settings ----

    public PlannerSettings getSettings(int userId) throws DaoException {
        return settingsDao.getSettings(userId);
    }

    public PlannerSettings saveSettings(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        LocalTime workStart = ValidationUtil.optionalTime(body, "workStart", errors);
        LocalTime workEnd = ValidationUtil.optionalTime(body, "workEnd", errors);
        Integer dailyCap = ValidationUtil.optionalInt(body, "dailyCapMinutes");
        boolean restOnHolidays = ValidationUtil.optionalBoolean(body, "restOnHolidays", false);
        ValidationUtil.throwIfErrors(errors);

        PlannerSettings settings = new PlannerSettings(
                workStart != null ? workStart : LocalTime.of(7, 0),
                workEnd != null ? workEnd : LocalTime.of(22, 0),
                dailyCap != null ? dailyCap : 120,
                restOnHolidays
        );
        if (!settings.getWorkStart().isBefore(settings.getWorkEnd())) {
            throw new IllegalArgumentException("workStart must be before workEnd");
        }
        return settingsDao.saveSettings(userId, settings);
    }

    // ---- sessions CRUD ----

    public List<StudySession> listSessions(int userId, LocalDate from, LocalDate to) throws DaoException {
        if (from != null && to != null) return sessionDao.findByDateRange(userId, from, to);
        return sessionDao.findAll(userId);
    }

    public StudySession getSession(int userId, int id) throws DaoException {
        StudySession session = sessionDao.findById(userId, id);
        if (session == null) throw new ResourceNotFoundException("Study session " + id + " not found");
        return session;
    }

    public StudySession createSession(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String title = ValidationUtil.requireNonEmptyString(body, "title", errors);
        LocalDate date = ValidationUtil.requireDate(body, "date", errors);
        LocalTime start = ValidationUtil.optionalTime(body, "startTime", errors);
        LocalTime end = ValidationUtil.optionalTime(body, "endTime", errors);
        if (start == null) errors.add("startTime is required (HH:MM)");
        if (end == null) errors.add("endTime is required (HH:MM)");
        String sessionType = ValidationUtil.optionalString(body, "sessionType");
        if (sessionType == null) sessionType = "regular";
        ValidationUtil.requireOneOf(sessionType, "sessionType", errors, "regular", "exam_prep");
        ValidationUtil.throwIfErrors(errors);
        if (!start.isBefore(end)) throw new IllegalArgumentException("startTime must be before endTime");

        Subject subject = resolveSubject(userId, body);
        StudySession session = new StudySession(title, date, start, end, subject, sessionType);
        session.setCompleted(ValidationUtil.optionalBoolean(body, "completed", false));
        return sessionDao.create(userId, session);
    }

    public StudySession updateSession(int userId, int id, Map<String, Object> body) throws DaoException {
        StudySession existing = getSession(userId, id);
        List<String> errors = ValidationUtil.newErrorList();

        if (body.containsKey("title")) existing.setTitle(ValidationUtil.requireNonEmptyString(body, "title", errors));
        if (body.containsKey("date")) existing.setDueDate(ValidationUtil.requireDate(body, "date", errors));
        if (body.containsKey("startTime")) {
            LocalTime t = ValidationUtil.optionalTime(body, "startTime", errors);
            if (t != null) existing.setStartTime(t);
        }
        if (body.containsKey("endTime")) {
            LocalTime t = ValidationUtil.optionalTime(body, "endTime", errors);
            if (t != null) existing.setEndTime(t);
        }
        if (body.containsKey("completed")) existing.setCompleted(ValidationUtil.optionalBoolean(body, "completed", existing.isCompleted()));
        if (body.containsKey("subjectId")) existing.setSubject(resolveSubject(userId, body));
        ValidationUtil.throwIfErrors(errors);

        sessionDao.update(userId, existing);
        return existing;
    }

    public void deleteSession(int userId, int id) throws DaoException {
        getSession(userId, id);
        sessionDao.delete(userId, id);
    }

    // ---- auto-generation ----
    public List<StudySession> generate(int userId, LocalDate from, LocalDate to) throws DaoException {
        if (from == null) from = LocalDate.now();
        if (to == null) to = from.plusDays(6);
        if (to.isBefore(from)) throw new IllegalArgumentException("'to' date must not be before 'from' date");

        PlannerSettings settings = settingsDao.getSettings(userId);
        List<Subject> subjects = subjectDao.findAll(userId);
        List<TimetableLecture> lectures = timetableDao.findAll(userId);
        List<AcademicItem> exams = assignmentExamDao.findByType(userId, "exam");

        sessionDao.deleteAll(userId);
        List<StudySession> generated = new ArrayList<>();

        for (Subject subject : subjects) {
            int minutesRemaining = WEEKLY_MINUTES_PER_SUBJECT;
            boolean examSoon = hasExamWithin(exams, subject, from, EXAM_PREP_DAYS_WINDOW);
            String sessionType = examSoon ? "exam_prep" : "regular";

            LocalDate cursor = from;
            while (cursor.isBefore(to.plusDays(1)) && minutesRemaining > 0) {
                if (isRestDay(cursor, settings)) {
                    cursor = cursor.plusDays(1);
                    continue;
                }
                int dailyCap = examSoon ? EXAM_PREP_DAILY_CAP_MINUTES : settings.getDailyCapMinutes();
                int usedToday = minutesUsedOnDay(generated, cursor);

                LocalTime slotStart = findFreeSlot(cursor, settings, lectures, generated);
                if (slotStart != null && usedToday < dailyCap) {
                    LocalTime slotEnd = slotStart.plusMinutes(STUDY_BLOCK_MINUTES);
                    StudySession session = new StudySession(
                            subject.getName() + " study session", cursor, slotStart, slotEnd, subject, sessionType);
                    session = sessionDao.create(userId, session);
                    generated.add(session);
                    minutesRemaining -= STUDY_BLOCK_MINUTES;
                }
                cursor = cursor.plusDays(1);
            }
        }
        return generated;
    }

    private boolean hasExamWithin(List<AcademicItem> exams, Subject subject, LocalDate from, int days) {
        for (AcademicItem exam : exams) {
            if (exam.getSubject() != null && exam.getSubject().getId() == subject.getId() && exam.getDueDate() != null) {
                long daysAway = java.time.temporal.ChronoUnit.DAYS.between(from, exam.getDueDate());
                if (daysAway >= 0 && daysAway <= days) return true;
            }
        }
        return false;
    }

    private boolean isRestDay(LocalDate date, PlannerSettings settings) {
        if (!settings.isRestOnHolidays()) return false;
        DayOfWeek dow = date.getDayOfWeek();
        return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
    }

    private int minutesUsedOnDay(List<StudySession> generatedSoFar, LocalDate day) {
        int total = 0;
        for (StudySession s : generatedSoFar) {
            if (s.getDueDate().equals(day)) total += s.getDurationMinutes();
        }
        return total;
    }

    private LocalTime findFreeSlot(LocalDate day, PlannerSettings settings, List<TimetableLecture> lectures,
                                    List<StudySession> generatedSoFar) {
        String dayCode = day.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH).substring(0, 3);
        LocalTime cursor = settings.getWorkStart();
        while (!cursor.plusMinutes(STUDY_BLOCK_MINUTES).isAfter(settings.getWorkEnd())) {
            final LocalTime slotStart = cursor;
            final LocalTime slotEnd = cursor.plusMinutes(STUDY_BLOCK_MINUTES);
            boolean clashesLecture = lectures.stream().anyMatch(l ->
                    l.getDayOfWeek().equalsIgnoreCase(dayCode) && overlaps(slotStart, slotEnd, l.getStartTime(), l.getEndTime()));
            boolean clashesSession = generatedSoFar.stream().anyMatch(s ->
                    s.getDueDate().equals(day) && overlaps(slotStart, slotEnd, s.getStartTime(), s.getEndTime()));
            if (!clashesLecture && !clashesSession) {
                return slotStart;
            }
            cursor = cursor.plusMinutes(STUDY_BLOCK_MINUTES + GAP_MINUTES);
        }
        return null;
    }

    private boolean overlaps(LocalTime aStart, LocalTime aEnd, LocalTime bStart, LocalTime bEnd) {
        return aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
    }

    private Subject resolveSubject(int userId, Map<String, Object> body) throws DaoException {
        Integer subjectId = ValidationUtil.optionalInt(body, "subjectId");
        if (subjectId == null) return null;
        Subject subject = subjectDao.findById(userId, subjectId);
        if (subject == null) throw new ResourceNotFoundException("Subject " + subjectId + " not found");
        return subject;
    }
}
