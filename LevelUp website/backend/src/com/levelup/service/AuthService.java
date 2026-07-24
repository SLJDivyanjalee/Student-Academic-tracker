package com.levelup.service;

import com.levelup.dao.PasswordResetDao;
import com.levelup.dao.PlannerSettingsDao;
import com.levelup.dao.SessionDao;
import com.levelup.dao.UserDao;
import com.levelup.exception.DaoException;
import com.levelup.exception.ValidationException;
import com.levelup.model.User;
import com.levelup.util.MailUtil;
import com.levelup.util.PasswordUtil;
import com.levelup.util.ValidationUtil;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AuthService {

    private static final int SESSION_LIFETIME_DAYS = 30;
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int RESET_TOKEN_LIFETIME_MINUTES = 30;

    private final UserDao userDao = new UserDao();
    private final SessionDao sessionDao = new SessionDao();
    private final PlannerSettingsDao plannerSettingsDao = new PlannerSettingsDao();
    private final PasswordResetDao passwordResetDao = new PasswordResetDao();

    public static class AuthResult {
        public final String token;
        public final User user;

        public AuthResult(String token, User user) {
            this.token = token;
            this.user = user;
        }
    }

    public AuthResult register(Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String name = ValidationUtil.requireNonEmptyString(body, "name", errors);
        String email = ValidationUtil.requireNonEmptyString(body, "email", errors);
        String password = ValidationUtil.requireNonEmptyString(body, "password", errors);
        if (password != null && password.length() < MIN_PASSWORD_LENGTH) {
            errors.add("password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        ValidationUtil.throwIfErrors(errors);

        if (userDao.findByEmail(email) != null) {
            throw new ValidationException(List.of("An account with that email already exists"));
        }

        String salt = PasswordUtil.newSalt();
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPasswordSalt(salt);
        user.setPasswordHash(PasswordUtil.hash(password, salt));
        user.setFaculty(ValidationUtil.optionalString(body, "faculty"));
        user.setSemester(ValidationUtil.optionalString(body, "semester"));
        user.setNotificationsEnabled(true);
        userDao.create(user);

        plannerSettingsDao.createDefaultIfMissing(user.getId());

        String token = issueSession(user.getId());
        return new AuthResult(token, user);
    }

    public AuthResult login(Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String email = ValidationUtil.requireNonEmptyString(body, "email", errors);
        String password = ValidationUtil.requireNonEmptyString(body, "password", errors);
        ValidationUtil.throwIfErrors(errors);

        User user = userDao.findByEmail(email);
        if (user == null || !PasswordUtil.verify(password, user.getPasswordSalt(), user.getPasswordHash())) {
            throw new ValidationException(List.of("Incorrect email or password"));
        }

        String token = issueSession(user.getId());
        return new AuthResult(token, user);
    }

    public void logout(String token) throws DaoException {
        if (token != null) sessionDao.delete(token);
    }

    public User getById(int userId) throws DaoException {
        return userDao.findById(userId);
    }

    private String issueSession(int userId) throws DaoException {
        sessionDao.deleteExpiredForUser(userId);
        String token = PasswordUtil.newSessionToken();
        sessionDao.create(token, userId, LocalDateTime.now().plusDays(SESSION_LIFETIME_DAYS));
        return token;
    }

    public String requestPasswordReset(Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String email = ValidationUtil.requireNonEmptyString(body, "email", errors);
        ValidationUtil.throwIfErrors(errors);

        User user = userDao.findByEmail(email);
        if (user == null) {
            return null; 
        }

        passwordResetDao.deleteForUser(user.getId());
        String token = PasswordUtil.newSessionToken();
        passwordResetDao.create(token, user.getId(), LocalDateTime.now().plusMinutes(RESET_TOKEN_LIFETIME_MINUTES));

        if (MailUtil.isConfigured()) {
            try {
                String subject = "Reset your LevelUp password";
                String body2 = "Hi " + user.getName() + ",\n\n"
                        + "We received a request to reset your LevelUp password.\n\n"
                        + "Your reset code is:\n\n    " + token + "\n\n"
                        + "Enter this code on the \"Set a new password\" screen. It expires in "
                        + RESET_TOKEN_LIFETIME_MINUTES + " minutes.\n\n"
                        + "If you didn't request this, you can safely ignore this email.\n\n"
                        + "- LevelUp";
                MailUtil.send(user.getEmail(), subject, body2);
                System.out.println("[AuthService] Password reset email sent to " + user.getEmail());
                return null;
            } catch (IOException e) {
                System.err.println("[AuthService] Failed to send password reset email: " + e.getMessage());
            }
        }

        System.out.println("=======================================================");
        System.out.println(" Password reset requested for " + user.getEmail());
        System.out.println(" Reset token (valid " + RESET_TOKEN_LIFETIME_MINUTES + " min): " + token);
        System.out.println(" mail.smtp.host is not set (or sending failed), so this token is");
        System.out.println(" only logged here and returned in the API response instead of emailed.");
        System.out.println("=======================================================");

        return token;
    }

    public void resetPassword(Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String token = ValidationUtil.requireNonEmptyString(body, "token", errors);
        String newPassword = ValidationUtil.requireNonEmptyString(body, "newPassword", errors);
        if (newPassword != null && newPassword.length() < MIN_PASSWORD_LENGTH) {
            errors.add("newPassword must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        ValidationUtil.throwIfErrors(errors);

        Integer userId = passwordResetDao.findValidUserId(token);
        if (userId == null) {
            throw new ValidationException(List.of("This reset link is invalid or has expired. Please request a new one."));
        }

        String newSalt = PasswordUtil.newSalt();
        String newHash = PasswordUtil.hash(newPassword, newSalt);
        userDao.updatePassword(userId, newHash, newSalt);
        passwordResetDao.markUsed(token);
    }
}
