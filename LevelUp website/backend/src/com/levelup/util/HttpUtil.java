package com.levelup.util;

import com.levelup.exception.ConflictException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.exception.ValidationException;
import com.sun.net.httpserver.HttpExchange;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;


public final class HttpUtil {

    private HttpUtil() {
    }

    public static String readBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[4096];
        int read;
        while ((read = is.read(data)) != -1) {
            buffer.write(data, 0, read);
        }
        return buffer.toString(StandardCharsets.UTF_8.name());
    }

    public static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    /** Handles a CORS preflight request. Returns true if the exchange was fully handled (OPTIONS). */
    public static boolean handlePreflight(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return true;
        }
        return false;
    }

    public static void sendJson(HttpExchange exchange, int statusCode, Object payload) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        byte[] bytes = JsonUtil.toJson(payload).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    public static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", message);
        sendJson(exchange, statusCode, body);
    }

    
    public static void sendException(HttpExchange exchange, Exception e) throws IOException {
        if (e instanceof ValidationException) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("error", "Validation failed");
            body.put("details", ((ValidationException) e).getErrors());
            sendJson(exchange, 400, body);
        } else if (e instanceof ConflictException) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("error", e.getMessage());
            Map<String, Object> details = ((ConflictException) e).getDetails();
            if (details != null) body.putAll(details);
            sendJson(exchange, 409, body);
        } else if (e instanceof ResourceNotFoundException) {
            sendError(exchange, 404, e.getMessage());
        } else if (e instanceof IllegalArgumentException) {
            sendError(exchange, 400, e.getMessage());
        } else {
            e.printStackTrace();
            sendError(exchange, 500, "Internal server error: " + e.getMessage());
        }
    }

    /*  Extracts the trailing numeric id from a path like /api/tasks/12, or -1 if none. */
    public static int extractIdFromPath(String path, String basePath) {
        String remainder = path.substring(basePath.length());
        remainder = remainder.replaceAll("^/+", "").replaceAll("/+$", "");
        if (remainder.isEmpty()) return -1;
        try {
            return Integer.parseInt(remainder);
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    public static Map<String, String> parseQuery(String query) {
        Map<String, String> result = new LinkedHashMap<>();
        if (query == null || query.isEmpty()) return result;
        for (String pair : query.split("&")) {
            int idx = pair.indexOf('=');
            if (idx < 0) continue;
            String key = java.net.URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
            String value = java.net.URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
            result.put(key, value);
        }
        return result;
    }
}
