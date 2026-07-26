package com.levelup.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;


public class Exam extends AcademicItem {

    private double weight;   
    private String venue;
    private String examType;  

    public Exam() {
        super();
    }

    public Exam(String title, String description, LocalDate dueDate, Subject subject,
                double weight, String venue, String examType) {
        super(title, description, dueDate, subject);
        setWeight(weight);
        this.venue = venue;
        this.examType = examType;
    }

    public Exam(int id, String title, String description, LocalDate dueDate, Subject subject,
                double weight, String venue, String examType, LocalDateTime createdAt) {
        super(id, title, description, dueDate, subject, createdAt);
        setWeight(weight);
        this.venue = venue;
        this.examType = examType;
    }

    @Override
    public String getType() {
        return "EXAM";
    }

    @Override
    public String getColorTag() {
        return "#ef4444";
    }

    // Polymorphism
    @Override
    public boolean isDueSoon() {
        if (dueDate == null) return false;
        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
        return daysLeft >= 0 && daysLeft <= 7;
    }

    @Override
    public String getNotificationMessage() {
        if (dueDate == null) return "Exam \"" + title + "\" has no date set.";
        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), dueDate);
        if (daysLeft < 0) return "Exam \"" + title + "\" has already passed.";
        if (daysLeft == 0) return "Exam \"" + title + "\" is today!";
        return (examType != null ? examType : "Exam") + " \"" + title + "\" in " + daysLeft + " day(s) at " +
                (venue != null ? venue : "TBA") + ".";
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        if (weight < 0 || weight > 100) {
            throw new IllegalArgumentException("Exam weight must be between 0 and 100");
        }
        this.weight = weight;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getExamType() {
        return examType;
    }

    public void setExamType(String examType) {
        this.examType = examType;
    }
}
