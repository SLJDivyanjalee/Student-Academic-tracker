package com.levelup.model;

import com.levelup.interfaces.Notifiable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Objects;


public abstract class AcademicItem implements Notifiable, Comparable<AcademicItem> {

    protected int id;
    protected String title;
    protected String description;
    protected LocalDate dueDate;
    protected Subject subject;
    protected LocalDateTime createdAt;

    protected AcademicItem() {
        this.createdAt = LocalDateTime.now();
    }

    protected AcademicItem(String title, String description, LocalDate dueDate, Subject subject) {
        this();
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.subject = subject;
    }

    protected AcademicItem(int id, String title, String description, LocalDate dueDate,
                            Subject subject, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.subject = subject;
        this.createdAt = createdAt;
    }
 
    public abstract String getType();

    /* Hex colour used by the frontend calendar/badges to tag this kind of item. */
    public abstract String getColorTag();

    public final String getSummary() {
        String subjectName = subject != null ? subject.getName() : "General";
        return "[" + getType() + "] " + title + " (" + subjectName + ") - due " + dueDate;
    }

    /** Hook subclasses may override to add extra detail to getSummary(). Default: none. */
    protected String getSubtitle() {
        return "";
    }

    @Override
    public boolean isDueSoon() {
        if (dueDate == null) return false;
        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
        return daysLeft >= 0 && daysLeft <= 3;
    }

    @Override
    public String getNotificationMessage() {
        if (dueDate == null) return title + " has no due date set.";
        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
        if (daysLeft < 0) return title + " is overdue.";
        if (daysLeft == 0) return title + " is due today.";
        return title + " is due in " + daysLeft + " day(s).";
    }

    //encapsulation

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }
        this.title = title.trim();
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // polymorphism

    @Override
    public int compareTo(AcademicItem other) {
        if (this.dueDate == null && other.dueDate == null) return 0;
        if (this.dueDate == null) return 1;
        if (other.dueDate == null) return -1;
        return this.dueDate.compareTo(other.dueDate);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AcademicItem)) return false;
        AcademicItem that = (AcademicItem) o;
        return id == that.id && Objects.equals(getType(), that.getType());
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, getType());
    }

    @Override
    public String toString() {
        return getSummary();
    }
}
