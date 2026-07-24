package com.levelup.model;

import java.time.LocalDate;

public class AttendanceRecord {

    public static final String PRESENT = "present";
    public static final String ABSENT = "absent";
    public static final String LATE = "late";

    private int id;
    private Subject subject;
    private Integer lectureId;
    private LocalDate date;
    private String status;

    public AttendanceRecord() {
    }

    public AttendanceRecord(Subject subject, LocalDate date, String status) {
        this.subject = subject;
        this.date = date;
        setStatus(status);
    }

    public AttendanceRecord(int id, Subject subject, LocalDate date, String status) {
        this.id = id;
        this.subject = subject;
        this.date = date;
        setStatus(status);
    }

    public AttendanceRecord(Subject subject, Integer lectureId, LocalDate date, String status) {
        this.subject = subject;
        this.lectureId = lectureId;
        this.date = date;
        setStatus(status);
    }

    public AttendanceRecord(int id, Subject subject, Integer lectureId, LocalDate date, String status) {
        this.id = id;
        this.subject = subject;
        this.lectureId = lectureId;
        this.date = date;
        setStatus(status);
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Integer getLectureId() {
        return lectureId;
    }

    public void setLectureId(Integer lectureId) {
        this.lectureId = lectureId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        if (status == null || !(status.equals(PRESENT) || status.equals(ABSENT) || status.equals(LATE))) {
            throw new IllegalArgumentException("Invalid attendance status: " + status);
        }
        this.status = status;
    }

    @Override
    public String toString() {
        return "AttendanceRecord{subject=" + (subject != null ? subject.getName() : null) +
                ", date=" + date + ", status='" + status + "'}";
    }
}
