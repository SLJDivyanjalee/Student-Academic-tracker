package com.levelup.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;


public class Task extends AcademicItem {

    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_PROGRESS = "progress";
    public static final String STATUS_DONE = "done";

    private String status;   // pending | progress | done
    private String urgency;  // low | medium | high
    private String category;

    public Task() {
        super();
        this.status = STATUS_PENDING;
        this.urgency = "medium";
    }

    public Task(String title, LocalDate dueDate) {
        this();
        setTitle(title);
        this.dueDate = dueDate;
    }

    public Task(String title, String description, LocalDate dueDate, Subject subject,
                String status, String urgency, String category) {
        super(title, description, dueDate, subject);
        setStatus(status);
        setUrgency(urgency);
        this.category = category;
    }

    public Task(int id, String title, String description, LocalDate dueDate, Subject subject,
                String status, String urgency, String category, LocalDateTime createdAt) {
        super(id, title, description, dueDate, subject, createdAt);
        setStatus(status);
        setUrgency(urgency);
        this.category = category;
    }

    @Override
    public String getType() {
        return "TASK";
    }

    @Override
    public String getColorTag() {
        switch (urgency) {
            case "high": return "#ef4444";
            case "low": return "#22c55e";
            default: return "#f59e0b";
        }
    }

    // Polymorphism
    @Override
    public boolean isDueSoon() {
        if (STATUS_DONE.equals(status)) return false;
        return super.isDueSoon();
    }

    @Override
    public String getNotificationMessage() {
        if (STATUS_DONE.equals(status)) {
            return title + " is already completed.";
        }
        if (dueDate == null) return title + " has no due date.";
        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
        if (daysLeft < 0) return "Task \"" + title + "\" is overdue!";
        if (daysLeft == 0) return "Task \"" + title + "\" is due today.";
        return "Task \"" + title + "\" (" + urgency + " priority) due in " + daysLeft + " day(s).";
    }

    public boolean markComplete() {
        this.status = STATUS_DONE;
        return true;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        if (status == null || !(status.equals(STATUS_PENDING) || status.equals(STATUS_PROGRESS) || status.equals(STATUS_DONE))) {
            throw new IllegalArgumentException("Invalid task status: " + status);
        }
        this.status = status;
    }

    public String getUrgency() {
        return urgency;
    }

    public void setUrgency(String urgency) {
        if (urgency == null || !(urgency.equals("low") || urgency.equals("medium") || urgency.equals("high"))) {
            throw new IllegalArgumentException("Invalid task urgency: " + urgency);
        }
        this.urgency = urgency;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
