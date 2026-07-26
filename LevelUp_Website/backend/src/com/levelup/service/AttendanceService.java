package com.levelup.service;

import com.levelup.dao.AttendanceDao;
import com.levelup.dao.SubjectDao;
import com.levelup.dao.TimetableDao;
import com.levelup.exception.ConflictException;
import com.levelup.exception.DaoException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.interfaces.ProgressObserver;
import com.levelup.model.AttendanceRecord;
import com.levelup.model.Subject;
import com.levelup.model.TimetableLecture;
import com.levelup.util.ValidationUtil;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AttendanceService {

    private static final double LOW_ATTENDANCE_THRESHOLD = 75.0;

    private final AttendanceDao attendanceDao = new AttendanceDao();
    private final SubjectDao subjectDao = new SubjectDao();
    private final TimetableDao timetableDao = new TimetableDao();
    private final List<ProgressObserver> observers = new ArrayList<>();

    public AttendanceService() {
       
        addObserver((subjectName, percentage) -> {
            if (percentage < LOW_ATTENDANCE_THRESHOLD) {
                System.out.printf("[ALERT] Attendance for %s dropped to %.1f%% (below %.0f%% threshold)%n",
                        subjectName, percentage, LOW_ATTENDANCE_THRESHOLD);
            }
        });
    }

    public void addObserver(ProgressObserver observer) {
        observers.add(observer);
    }

    private void notifyObservers(String subjectName, double percentage) {
        for (ProgressObserver o : observers) {
            o.onProgressChanged(subjectName, percentage);
        }
    }

    public List<AttendanceRecord> listAll(int userId, Integer subjectId) throws DaoException {
        if (subjectId != null) return attendanceDao.findBySubject(userId, subjectId);
        return attendanceDao.findAll(userId);
    }

    public AttendanceRecord get(int userId, int id) throws DaoException {
        AttendanceRecord record = attendanceDao.findById(userId, id);
        if (record == null) throw new ResourceNotFoundException("Attendance record " + id + " not found");
        return record;
    }

    public AttendanceRecord create(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        java.time.LocalDate date = ValidationUtil.requireDate(body, "date", errors);
        String status = ValidationUtil.optionalString(body, "status");
        ValidationUtil.requireOneOf(status, "status", errors, "present", "absent", "late");
        Integer subjectId = ValidationUtil.optionalInt(body, "subjectId");
        if (subjectId == null) errors.add("subjectId is required");
        Integer lectureId = ValidationUtil.optionalInt(body, "lectureId");
        ValidationUtil.throwIfErrors(errors);

        Subject subject = subjectDao.findById(userId, subjectId);
        if (subject == null) throw new ResourceNotFoundException("Subject " + subjectId + " not found");

        if (lectureId != null) {
            TimetableLecture lecture = timetableDao.findById(userId, lectureId);
            if (lecture == null) throw new ResourceNotFoundException("Lecture " + lectureId + " not found");

            AttendanceRecord existing = attendanceDao.findByLectureAndDate(userId, lectureId, date);
            if (existing != null) {
                throw new ConflictException("This lecture has already been marked for today.",
                        Map.of("existingRecordId", existing.getId(), "status", existing.getStatus()));
            }
        }

        AttendanceRecord record = attendanceDao.create(userId, new AttendanceRecord(subject, lectureId, date, status));
        notifyObservers(subject.getName(), calculatePercentage(userId, subjectId));
        return record;
    }

    public AttendanceRecord update(int userId, int id, Map<String, Object> body) throws DaoException {
        AttendanceRecord existing = get(userId, id);
        List<String> errors = ValidationUtil.newErrorList();

        if (body.containsKey("date")) existing.setDate(ValidationUtil.requireDate(body, "date", errors));
        if (body.containsKey("status")) {
            String status = ValidationUtil.optionalString(body, "status");
            ValidationUtil.requireOneOf(status, "status", errors, "present", "absent", "late");
            if (errors.isEmpty()) existing.setStatus(status);
        }
        if (body.containsKey("subjectId")) {
            Integer subjectId = ValidationUtil.optionalInt(body, "subjectId");
            Subject subject = subjectId != null ? subjectDao.findById(userId, subjectId) : null;
            if (subject == null) throw new ResourceNotFoundException("Subject " + subjectId + " not found");
            existing.setSubject(subject);
        }
        if (body.containsKey("lectureId")) {
            Integer lectureId = ValidationUtil.optionalInt(body, "lectureId");
            if (lectureId != null && timetableDao.findById(userId, lectureId) == null) {
                throw new ResourceNotFoundException("Lecture " + lectureId + " not found");
            }
            existing.setLectureId(lectureId);
        }
        ValidationUtil.throwIfErrors(errors);

        attendanceDao.update(userId, existing);
        notifyObservers(existing.getSubject().getName(), calculatePercentage(userId, existing.getSubject().getId()));
        return existing;
    }

    public void delete(int userId, int id) throws DaoException {
        AttendanceRecord existing = get(userId, id);
        attendanceDao.delete(userId, id);
        notifyObservers(existing.getSubject().getName(), calculatePercentage(userId, existing.getSubject().getId()));
    }

    public double calculatePercentage(int userId, int subjectId) throws DaoException {
        List<AttendanceRecord> records = attendanceDao.findBySubject(userId, subjectId);
        if (records.isEmpty()) return 0.0;
        long attended = records.stream().filter(r -> !AttendanceRecord.ABSENT.equals(r.getStatus())).count();
        return (attended * 100.0) / records.size();
    }

    public Map<String, Object> getSummary(int userId) throws DaoException {
        Map<String, Object> summary = new LinkedHashMap<>();
        List<Subject> subjects = subjectDao.findAll(userId);
        List<Object> rows = new ArrayList<>();
        for (Subject subject : subjects) {
            List<AttendanceRecord> records = attendanceDao.findBySubject(userId, subject.getId());
            double percentage = calculatePercentage(userId, subject.getId());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("subjectId", subject.getId());
            row.put("subjectName", subject.getName());
            row.put("colorHex", subject.getColorHex());
            row.put("totalSessions", records.size());
            row.put("percentage", Math.round(percentage * 10.0) / 10.0);
            row.put("belowThreshold", percentage < LOW_ATTENDANCE_THRESHOLD);
            rows.add(row);
        }
        summary.put("subjects", rows);
        return summary;
    }
}
