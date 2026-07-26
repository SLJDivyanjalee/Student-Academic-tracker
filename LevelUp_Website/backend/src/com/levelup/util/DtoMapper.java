package com.levelup.util;

import com.levelup.model.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class DtoMapper {

    private DtoMapper() {
    }

    public static Map<String, Object> subject(Subject s) {
        if (s == null) return null;
        Map<String, Object> m = JsonUtil.newObject();
        m.put("id", s.getId());
        m.put("name", s.getName());
        m.put("colorHex", s.getColorHex());
        return m;
    }

    public static List<Object> subjects(List<Subject> list) {
        List<Object> out = new ArrayList<>();
        for (Subject s : list) out.add(subject(s));
        return out;
    }

    /** Common fields shared by every AcademicItem subclass, plus polymorphic type/color/notification info. */
    private static Map<String, Object> academicItemBase(AcademicItem item) {
        Map<String, Object> m = JsonUtil.newObject();
        m.put("id", item.getId());
        m.put("type", item.getType());               // polymorphic
        m.put("title", item.getTitle());
        m.put("description", item.getDescription());
        m.put("dueDate", item.getDueDate() != null ? item.getDueDate().toString() : null);
        m.put("subject", subject(item.getSubject()));
        m.put("colorTag", item.getColorTag());        // polymorphic
        m.put("dueSoon", item.isDueSoon());            // polymorphic
        m.put("notification", item.getNotificationMessage()); // polymorphic
        m.put("createdAt", item.getCreatedAt() != null ? item.getCreatedAt().toString() : null);
        return m;
    }

    public static Map<String, Object> task(Task t) {
        Map<String, Object> m = academicItemBase(t);
        m.put("status", t.getStatus());
        m.put("urgency", t.getUrgency());
        m.put("category", t.getCategory());
        return m;
    }

    public static List<Object> tasks(List<Task> list) {
        List<Object> out = new ArrayList<>();
        for (Task t : list) out.add(task(t));
        return out;
    }

    /* Works for Assignment, Exam, StudySession, or any other AcademicItem, dispatching polymorphically */
    public static Map<String, Object> academicItem(AcademicItem item) {
        Map<String, Object> m = academicItemBase(item);
        if (item instanceof Assignment) {
            Assignment a = (Assignment) item;
            m.put("itemType", "assignment");
            m.put("weight", a.getWeight());
            m.put("submissionStatus", a.getSubmissionStatus());
        } else if (item instanceof Exam) {
            Exam e = (Exam) item;
            m.put("itemType", "exam");
            m.put("weight", e.getWeight());
            m.put("venue", e.getVenue());
            m.put("examType", e.getExamType());
        } else if (item instanceof StudySession) {
            StudySession s = (StudySession) item;
            m.put("startTime", s.getStartTime() != null ? s.getStartTime().toString() : null);
            m.put("endTime", s.getEndTime() != null ? s.getEndTime().toString() : null);
            m.put("sessionType", s.getSessionType());
            m.put("completed", s.isCompleted());
            m.put("durationMinutes", s.getDurationMinutes());
        } else if (item instanceof Task) {
            Task t = (Task) item;
            m.put("status", t.getStatus());
            m.put("urgency", t.getUrgency());
            m.put("category", t.getCategory());
        }
        return m;
    }

    public static List<Object> academicItems(List<AcademicItem> list) {
        List<Object> out = new ArrayList<>();
        for (AcademicItem item : list) out.add(academicItem(item));
        return out;
    }

    public static Map<String, Object> studySession(StudySession s) {
        return academicItem(s);
    }

    public static List<Object> studySessions(List<StudySession> list) {
        List<Object> out = new ArrayList<>();
        for (StudySession s : list) out.add(studySession(s));
        return out;
    }

    public static Map<String, Object> attendance(AttendanceRecord r) {
        Map<String, Object> m = JsonUtil.newObject();
        m.put("id", r.getId());
        m.put("subject", subject(r.getSubject()));
        m.put("lectureId", r.getLectureId());
        m.put("date", r.getDate() != null ? r.getDate().toString() : null);
        m.put("status", r.getStatus());
        return m;
    }

    public static List<Object> attendanceList(List<AttendanceRecord> list) {
        List<Object> out = new ArrayList<>();
        for (AttendanceRecord r : list) out.add(attendance(r));
        return out;
    }

    public static Map<String, Object> lecture(TimetableLecture l) {
        Map<String, Object> m = JsonUtil.newObject();
        m.put("id", l.getId());
        m.put("subject", subject(l.getSubject()));
        m.put("dayOfWeek", l.getDayOfWeek());
        m.put("startTime", l.getStartTime() != null ? l.getStartTime().toString() : null);
        m.put("endTime", l.getEndTime() != null ? l.getEndTime().toString() : null);
        m.put("location", l.getLocation());
        return m;
    }

    public static List<Object> lectures(List<TimetableLecture> list) {
        List<Object> out = new ArrayList<>();
        for (TimetableLecture l : list) out.add(lecture(l));
        return out;
    }

    /** Public-facing view of an account - never includes passwordHash/passwordSalt. */
    public static Map<String, Object> user(User u) {
        if (u == null) return null;
        Map<String, Object> m = JsonUtil.newObject();
        m.put("id", u.getId());
        m.put("name", u.getName());
        m.put("email", u.getEmail());
        m.put("faculty", u.getFaculty());
        m.put("semester", u.getSemester());
        m.put("avatarUrl", u.getAvatarUrl());
        m.put("notificationsEnabled", u.isNotificationsEnabled());
        m.put("onboardingComplete", u.isOnboardingComplete());
        m.put("onboardingSubjectsCount", u.getOnboardingSubjectsCount());
        m.put("notifyAssignmentReminders", u.isNotifyAssignmentReminders());
        m.put("notifyExamReminders", u.isNotifyExamReminders());
        m.put("notifyStudyReminders", u.isNotifyStudyReminders());
        return m;
    }

    public static Map<String, Object> authResult(String token, User u) {
        Map<String, Object> m = JsonUtil.newObject();
        m.put("token", token);
        m.put("user", user(u));
        return m;
    }

    public static Map<String, Object> plannerSettings(PlannerSettings s) {
        Map<String, Object> m = JsonUtil.newObject();
        m.put("id", s.getId());
        m.put("workStart", s.getWorkStart().toString());
        m.put("workEnd", s.getWorkEnd().toString());
        m.put("dailyCapMinutes", s.getDailyCapMinutes());
        m.put("restOnHolidays", s.isRestOnHolidays());
        return m;
    }
}
