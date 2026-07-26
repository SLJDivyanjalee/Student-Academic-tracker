package com.levelup.util;

import com.levelup.exception.ValidationException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;


public final class ValidationUtil {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$");

    private ValidationUtil() {
    }

    public static String requireNonEmptyString(Map<String, Object> body, String field, List<String> errors) {
        Object value = body.get(field);
        if (!(value instanceof String) || ((String) value).trim().isEmpty()) {
            errors.add(field + " is required");
            return null;
        }
        return ((String) value).trim();
    }

    public static String requireEmail(Map<String, Object> body, String field, List<String> errors) {
        Object value = body.get(field);
        if (!(value instanceof String) || ((String) value).trim().isEmpty()) {
            errors.add("Email is required");
            return null;
        }
        String email = ((String) value).trim();

        if (!email.contains("@")) {
            errors.add("Email address is missing the '@' symbol");
            return null;
        }
        String[] parts = email.split("@", -1);
        if (parts.length != 2 || parts[0].isEmpty()) {
            errors.add("Email address is missing the part before '@'");
            return null;
        }
        if (parts[1].isEmpty()) {
            errors.add("Email address is missing the domain after '@' (e.g. gmail.com)");
            return null;
        }
        if (!parts[1].contains(".")) {
            errors.add("Email domain is missing a '.' (e.g. " + parts[1] + ".com)");
            return null;
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.add("Email address format looks invalid");
            return null;
        }
        return email.toLowerCase();
    }

    public static String optionalString(Map<String, Object> body, String field) {
        Object value = body.get(field);
        return value == null ? null : value.toString();
    }

    public static Integer optionalInt(Map<String, Object> body, String field) {
        Object value = body.get(field);
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static double optionalDouble(Map<String, Object> body, String field, double defaultValue) {
        Object value = body.get(field);
        if (value == null) return defaultValue;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public static boolean optionalBoolean(Map<String, Object> body, String field, boolean defaultValue) {
        Object value = body.get(field);
        if (value == null) return defaultValue;
        if (value instanceof Boolean) return (Boolean) value;
        return Boolean.parseBoolean(value.toString());
    }

    public static LocalDate requireDate(Map<String, Object> body, String field, List<String> errors) {
        Object value = body.get(field);
        if (value == null || value.toString().trim().isEmpty()) {
            errors.add(field + " is required (format YYYY-MM-DD)");
            return null;
        }
        try {
            return LocalDate.parse(value.toString().trim());
        } catch (DateTimeParseException e) {
            errors.add(field + " must be in YYYY-MM-DD format");
            return null;
        }
    }

    public static LocalDate optionalDate(Map<String, Object> body, String field, List<String> errors) {
        Object value = body.get(field);
        if (value == null || value.toString().trim().isEmpty()) return null;
        try {
            return LocalDate.parse(value.toString().trim());
        } catch (DateTimeParseException e) {
            errors.add(field + " must be in YYYY-MM-DD format");
            return null;
        }
    }

    public static LocalTime optionalTime(Map<String, Object> body, String field, List<String> errors) {
        Object value = body.get(field);
        if (value == null || value.toString().trim().isEmpty()) return null;
        try {
            return LocalTime.parse(value.toString().trim());
        } catch (DateTimeParseException e) {
            errors.add(field + " must be in HH:MM format");
            return null;
        }
    }

    public static void requireOneOf(String value, String field, List<String> errors, String... allowed) {
        if (value == null) return;
        for (String a : allowed) {
            if (a.equals(value)) return;
        }
        errors.add(field + " must be one of " + String.join(",", allowed));
    }

    public static void throwIfErrors(List<String> errors) {
        if (!errors.isEmpty()) {
            throw new ValidationException(errors);
        }
    }

    public static List<String> newErrorList() {
        return new ArrayList<>();
    }
}
