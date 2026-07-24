package com.levelup.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;


public class Assignment extends AcademicItem {

    private double weight;              
    private String submissionStatus;    

    public Assignment() {
        super();
        this.submissionStatus = "not_started";
    }

    public Assignment(String title, String description, LocalDate dueDate, Subject subject,
                       double weight, String submissionStatus) {
        super(title, description, dueDate, subject);
        setWeight(weight);
        setSubmissionStatus(submissionStatus);
    }

    public Assignment(int id, String title, String description, LocalDate dueDate, Subject subject,
                       double weight, String submissionStatus, LocalDateTime createdAt) {
        super(id, title, description, dueDate, subject, createdAt);
        setWeight(weight);
        setSubmissionStatus(submissionStatus);
    }

    @Override
    public String getType() {
        return "ASSIGNMENT";
    }

    @Override
    public String getColorTag() {
        return "#2563eb";
    }

    @Override
    public String getNotificationMessage() {
        if ("submitted".equals(submissionStatus)) {
            return "Assignment \"" + title + "\" already submitted.";
        }
        if (dueDate == null) return "Assignment \"" + title + "\" has no due date.";
        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
        if (daysLeft < 0) return "Assignment \"" + title + "\" is overdue!";
        return "Assignment \"" + title + "\" worth " + weight + "% due in " + daysLeft + " day(s).";
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        if (weight < 0 || weight > 100) {
            throw new IllegalArgumentException("Assignment weight must be between 0 and 100");
        }
        this.weight = weight;
    }

    public String getSubmissionStatus() {
        return submissionStatus;
    }

    public void setSubmissionStatus(String submissionStatus) {
        this.submissionStatus = submissionStatus == null ? "not_started" : submissionStatus;
    }
}
