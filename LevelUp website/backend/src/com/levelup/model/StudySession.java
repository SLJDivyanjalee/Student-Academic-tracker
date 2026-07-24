package com.levelup.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;


public class StudySession extends AcademicItem {

    private LocalTime startTime;
    private LocalTime endTime;
    private String sessionType; // regular | exam_prep
    private boolean completed;

    public StudySession() {
        super();
        this.sessionType = "regular";
    }

    public StudySession(String title, LocalDate date, LocalTime startTime, LocalTime endTime,
                         Subject subject, String sessionType) {
        super(title, null, date, subject);
        this.startTime = startTime;
        this.endTime = endTime;
        setSessionType(sessionType);
    }

    public StudySession(int id, String title, LocalDate date, LocalTime startTime, LocalTime endTime,
                         Subject subject, String sessionType, boolean completed, LocalDateTime createdAt) {
        super(id, title, null, date, subject, createdAt);
        this.startTime = startTime;
        this.endTime = endTime;
        setSessionType(sessionType);
        this.completed = completed;
    }

    @Override
    public String getType() {
        return "STUDY_SESSION";
    }

    @Override
    public String getColorTag() {
        return "exam_prep".equals(sessionType) ? "#f97316" : "#7c3aed";
    }

    @Override
    public String getNotificationMessage() {
        if (completed) return "Study session \"" + title + "\" already completed.";
        return "Study session \"" + title + "\" scheduled " + dueDate +
                (startTime != null ? " at " + startTime : "") + ".";
    }

    public int getDurationMinutes() {
        if (startTime == null || endTime == null) return 0;
        return (int) java.time.Duration.between(startTime, endTime).toMinutes();
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getSessionType() {
        return sessionType;
    }

    public void setSessionType(String sessionType) {
        if (sessionType == null || !(sessionType.equals("regular") || sessionType.equals("exam_prep"))) {
            throw new IllegalArgumentException("Invalid session type: " + sessionType);
        }
        this.sessionType = sessionType;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
