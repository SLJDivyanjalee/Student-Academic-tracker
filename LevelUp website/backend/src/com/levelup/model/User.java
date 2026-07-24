package com.levelup.model;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

 
public class User {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$");

    private int id;
    private String name;
    private String email;
    private String passwordHash;
    private String passwordSalt;
    private String faculty;
    private String semester;
    private String avatarUrl;
    private boolean notificationsEnabled = true;
    private LocalDateTime createdAt;

    // First-time onboarding wizard (see AuthService.register() / OnboardingService).
    private boolean onboardingComplete = true;
    private Integer onboardingSubjectsCount;
    private boolean notifyAssignmentReminders = true;
    private boolean notifyExamReminders = true;
    private boolean notifyStudyReminders = true;

    public User() {
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        this.name = name.trim();
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        if (email == null || email.trim().isEmpty() || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + email);
        }
        this.email = email.trim().toLowerCase();
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPasswordSalt() {
        return passwordSalt;
    }

    public void setPasswordSalt(String passwordSalt) {
        this.passwordSalt = passwordSalt;
    }

    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public boolean isNotificationsEnabled() {
        return notificationsEnabled;
    }

    public void setNotificationsEnabled(boolean notificationsEnabled) {
        this.notificationsEnabled = notificationsEnabled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isOnboardingComplete() {
        return onboardingComplete;
    }

    public void setOnboardingComplete(boolean onboardingComplete) {
        this.onboardingComplete = onboardingComplete;
    }

    public Integer getOnboardingSubjectsCount() {
        return onboardingSubjectsCount;
    }

    public void setOnboardingSubjectsCount(Integer onboardingSubjectsCount) {
        this.onboardingSubjectsCount = onboardingSubjectsCount;
    }

    public boolean isNotifyAssignmentReminders() {
        return notifyAssignmentReminders;
    }

    public void setNotifyAssignmentReminders(boolean notifyAssignmentReminders) {
        this.notifyAssignmentReminders = notifyAssignmentReminders;
    }

    public boolean isNotifyExamReminders() {
        return notifyExamReminders;
    }

    public void setNotifyExamReminders(boolean notifyExamReminders) {
        this.notifyExamReminders = notifyExamReminders;
    }

    public boolean isNotifyStudyReminders() {
        return notifyStudyReminders;
    }

    public void setNotifyStudyReminders(boolean notifyStudyReminders) {
        this.notifyStudyReminders = notifyStudyReminders;
    }
}
