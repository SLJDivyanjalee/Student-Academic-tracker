package com.levelup.util;

import com.levelup.config.DatabaseConnection;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;


public final class AiClient {

    private static final String DEFAULT_MODEL = "gemini-2.5-flash";
    private static final Duration TIMEOUT = Duration.ofSeconds(25);

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .build();

    private AiClient() {
    }

    private static String apiKey() {
        String key = DatabaseConnection.getProperty("ai.gemini.apiKey");
        return key == null ? "" : key.trim();
    }

    private static String model() {
        String configured = DatabaseConnection.getProperty("ai.gemini.model");
        return (configured == null || configured.isBlank()) ? DEFAULT_MODEL : configured.trim();
    }

    /** True once ai.gemini.apiKey has been filled in db.properties. */
    public static boolean isConfigured() {
        return !apiKey().isEmpty();
    }

    /**
     * Sends a single-turn prompt (system instructions + user question) to
     * Gemini and returns the model's plain-text reply.
     *
     * @throws IllegalStateException if no API key is configured
     * @throws IOException           on any network/API failure
     */
    public static String generate(String systemPrompt, String userPrompt) throws IOException {
        if (!isConfigured()) {
            throw new IllegalStateException("AI assistant is not configured (ai.gemini.apiKey is empty in db.properties)");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model() + ":generateContent";

        Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemPrompt))
                ),
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.4,
                        "maxOutputTokens", 512
                )
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(TIMEOUT)
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey())
                .POST(HttpRequest.BodyPublishers.ofString(JsonUtil.toJson(requestBody)))
                .build();

        HttpResponse<String> response;
        try {
            response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("AI request was interrupted", e);
        }

        if (response.statusCode() != 200) {
            throw new IOException("Gemini API returned HTTP " + response.statusCode() + ": " + truncate(response.body()));
        }

        return extractText(response.body());
    }

    
    @SuppressWarnings("unchecked")
    private static String extractText(String responseJson) throws IOException {
        Object parsed = JsonUtil.parse(responseJson);
        try {
            Map<String, Object> root = (Map<String, Object>) parsed;
            List<Object> candidates = (List<Object>) root.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                throw new IOException("Gemini response had no candidates: " + truncate(responseJson));
            }
            Map<String, Object> firstCandidate = (Map<String, Object>) candidates.get(0);
            Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
            List<Object> parts = (List<Object>) content.get("parts");
            Map<String, Object> firstPart = (Map<String, Object>) parts.get(0);
            Object text = firstPart.get("text");
            return text == null ? "" : text.toString().trim();
        } catch (ClassCastException | NullPointerException | IndexOutOfBoundsException e) {
            throw new IOException("Could not parse Gemini response: " + truncate(responseJson), e);
        }
    }

    private static String truncate(String s) {
        if (s == null) return "";
        return s.length() > 300 ? s.substring(0, 300) + "..." : s;
    }
}
