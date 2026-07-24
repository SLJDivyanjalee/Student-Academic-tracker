package com.levelup.util;

import com.levelup.exception.ValidationException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;


public final class ValidationUtil {

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
