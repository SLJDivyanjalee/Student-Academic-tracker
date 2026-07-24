package com.levelup.service;

import com.levelup.dao.SubjectDao;
import com.levelup.dao.TimetableDao;
import com.levelup.exception.ConflictException;
import com.levelup.exception.DaoException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.model.Subject;
import com.levelup.model.TimetableLecture;
import com.levelup.util.DtoMapper;
import com.levelup.util.ValidationUtil;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

public class TimetableService {

    private final TimetableDao timetableDao = new TimetableDao();
    private final SubjectDao subjectDao = new SubjectDao();

    public List<TimetableLecture> listAll(int userId) throws DaoException {
        return timetableDao.findAll(userId);
    }

    public TimetableLecture get(int userId, int id) throws DaoException {
        TimetableLecture lecture = timetableDao.findById(userId, id);
        if (lecture == null) throw new ResourceNotFoundException("Timetable lecture " + id + " not found");
        return lecture;
    }

    public TimetableLecture create(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String day = ValidationUtil.requireNonEmptyString(body, "dayOfWeek", errors);
        ValidationUtil.requireOneOf(day, "dayOfWeek", errors, "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
        LocalTime start = ValidationUtil.optionalTime(body, "startTime", errors);
        LocalTime end = ValidationUtil.optionalTime(body, "endTime", errors);
        if (start == null) errors.add("startTime is required (HH:MM)");
        if (end == null) errors.add("endTime is required (HH:MM)");
        Integer subjectId = ValidationUtil.optionalInt(body, "subjectId");
        if (subjectId == null) errors.add("subjectId is required");
        ValidationUtil.throwIfErrors(errors);
        if (!start.isBefore(end)) throw new IllegalArgumentException("startTime must be before endTime");

        Subject subject = subjectDao.findById(userId, subjectId);
        if (subject == null) throw new ResourceNotFoundException("Subject " + subjectId + " not found");

        checkNoOverlap(userId, day, start, end, null);

        String location = ValidationUtil.optionalString(body, "location");
        return timetableDao.create(userId, new TimetableLecture(subject, day, start, end, location));
    }

    public TimetableLecture update(int userId, int id, Map<String, Object> body) throws DaoException {
        TimetableLecture existing = get(userId, id);
        List<String> errors = ValidationUtil.newErrorList();

        if (body.containsKey("dayOfWeek")) {
            String day = ValidationUtil.requireNonEmptyString(body, "dayOfWeek", errors);
            ValidationUtil.requireOneOf(day, "dayOfWeek", errors, "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun");
            if (errors.isEmpty()) existing.setDayOfWeek(day);
        }
        if (body.containsKey("startTime")) {
            LocalTime t = ValidationUtil.optionalTime(body, "startTime", errors);
            if (t != null) existing.setStartTime(t);
        }
        if (body.containsKey("endTime")) {
            LocalTime t = ValidationUtil.optionalTime(body, "endTime", errors);
            if (t != null) existing.setEndTime(t);
        }
        if (body.containsKey("location")) existing.setLocation(ValidationUtil.optionalString(body, "location"));
        if (body.containsKey("subjectId")) {
            Integer subjectId = ValidationUtil.optionalInt(body, "subjectId");
            Subject subject = subjectId != null ? subjectDao.findById(userId, subjectId) : null;
            if (subject == null) throw new ResourceNotFoundException("Subject " + subjectId + " not found");
            existing.setSubject(subject);
        }
        ValidationUtil.throwIfErrors(errors);
        if (!existing.getStartTime().isBefore(existing.getEndTime())) {
            throw new IllegalArgumentException("startTime must be before endTime");
        }

        checkNoOverlap(userId, existing.getDayOfWeek(), existing.getStartTime(), existing.getEndTime(), existing.getId());

        timetableDao.update(userId, existing);
        return existing;
    }

    public void delete(int userId, int id) throws DaoException {
        get(userId, id);
        timetableDao.delete(userId, id);
    }

    private void checkNoOverlap(int userId, String dayOfWeek, LocalTime start, LocalTime end, Integer excludeId) throws DaoException {
        for (TimetableLecture other : timetableDao.findByDay(userId, dayOfWeek)) {
            if (excludeId != null && other.getId() == excludeId) continue;
            boolean overlaps = start.isBefore(other.getEndTime()) && end.isAfter(other.getStartTime());
            if (overlaps) {
                Map<String, Object> details = Map.of("conflict", DtoMapper.lecture(other));
                throw new ConflictException(
                        "This lecture overlaps with " + other.getSubject().getName() + " on " + dayOfWeek +
                                " (" + other.getStartTime() + "-" + other.getEndTime() + "). Which one would you like to keep?",
                        details);
            }
        }
    }
}
