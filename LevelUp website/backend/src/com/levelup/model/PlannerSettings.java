package com.levelup.model;

import java.time.LocalTime;

/* Study Planner's auto-generation */
public class PlannerSettings {

    private int id;
    private LocalTime workStart = LocalTime.of(7, 0);
    private LocalTime workEnd = LocalTime.of(22, 0);
    private int dailyCapMinutes = 120;
    private boolean restOnHolidays = false;

    public PlannerSettings() {
    }

    public PlannerSettings(LocalTime workStart, LocalTime workEnd, int dailyCapMinutes, boolean restOnHolidays) {
        setWorkStart(workStart);
        setWorkEnd(workEnd);
        setDailyCapMinutes(dailyCapMinutes);
        this.restOnHolidays = restOnHolidays;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public LocalTime getWorkStart() {
        return workStart;
    }

    public void setWorkStart(LocalTime workStart) {
        if (workStart == null) throw new IllegalArgumentException("workStart cannot be null");
        this.workStart = workStart;
    }

    public LocalTime getWorkEnd() {
        return workEnd;
    }

    public void setWorkEnd(LocalTime workEnd) {
        if (workEnd == null) throw new IllegalArgumentException("workEnd cannot be null");
        this.workEnd = workEnd;
    }

    public int getDailyCapMinutes() {
        return dailyCapMinutes;
    }

    public void setDailyCapMinutes(int dailyCapMinutes) {
        if (dailyCapMinutes <= 0) throw new IllegalArgumentException("dailyCapMinutes must be positive");
        this.dailyCapMinutes = dailyCapMinutes;
    }

    public boolean isRestOnHolidays() {
        return restOnHolidays;
    }

    public void setRestOnHolidays(boolean restOnHolidays) {
        this.restOnHolidays = restOnHolidays;
    }
}
