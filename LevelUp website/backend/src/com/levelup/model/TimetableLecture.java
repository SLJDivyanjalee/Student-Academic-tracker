package com.levelup.model;

import java.time.LocalTime;

 
public class TimetableLecture {

    private int id;
    private Subject subject;
    private String dayOfWeek; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;

    public TimetableLecture() {
    }

    public TimetableLecture(Subject subject, String dayOfWeek, LocalTime startTime, LocalTime endTime, String location) {
        this.subject = subject;
        setDayOfWeek(dayOfWeek);
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
    }

    public TimetableLecture(int id, Subject subject, String dayOfWeek, LocalTime startTime, LocalTime endTime, String location) {
        this.id = id;
        this.subject = subject;
        setDayOfWeek(dayOfWeek);
        this.startTime = startTime;
        this.endTime = endTime;
        this.location = location;
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

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
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

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
