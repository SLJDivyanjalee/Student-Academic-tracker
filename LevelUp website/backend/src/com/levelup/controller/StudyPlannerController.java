package com.levelup.controller;

import com.levelup.model.PlannerSettings;
import com.levelup.model.StudySession;
import com.levelup.service.StudyPlannerService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class StudyPlannerController implements HttpHandler {

    public static final String BASE_PATH = "/api/planner";
    private final StudyPlannerService plannerService = new StudyPlannerService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) return;
        try {
            Integer userId = AuthUtil.requireUserId(exchange);
            if (userId == null) return;

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();
            String sub = path.substring(BASE_PATH.length()).replaceAll("^/+", "");

            if (sub.equals("settings")) {
                handleSettings(exchange, method, userId);
            } else if (sub.equals("generate")) {
                handleGenerate(exchange, method, userId);
            } else if (sub.startsWith("sessions")) {
                handleSessions(exchange, method, sub, userId);
            } else {
                HttpUtil.sendError(exchange, 404, "Unknown planner endpoint: " + path);
            }
        } catch (Exception e) {
            HttpUtil.sendException(exchange, e);
        }
    }

    private void handleSettings(HttpExchange exchange, String method, int userId) throws Exception {
        if ("GET".equals(method)) {
            HttpUtil.sendJson(exchange, 200, DtoMapper.plannerSettings(plannerService.getSettings(userId)));
        } else if ("PUT".equals(method) || "POST".equals(method)) {
            Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
            PlannerSettings saved = plannerService.saveSettings(userId, body);
            HttpUtil.sendJson(exchange, 200, DtoMapper.plannerSettings(saved));
        } else {
            HttpUtil.sendError(exchange, 405, "Method not allowed");
        }
    }

    private void handleGenerate(HttpExchange exchange, String method, int userId) throws Exception {
        if (!"POST".equals(method)) {
            HttpUtil.sendError(exchange, 405, "Method not allowed");
            return;
        }
        Map<String, String> query = HttpUtil.parseQuery(exchange.getRequestURI().getQuery());
        LocalDate from = query.get("from") != null ? LocalDate.parse(query.get("from")) : null;
        LocalDate to = query.get("to") != null ? LocalDate.parse(query.get("to")) : null;
        List<StudySession> generated = plannerService.generate(userId, from, to);
        HttpUtil.sendJson(exchange, 200, DtoMapper.studySessions(generated));
    }

    private void handleSessions(HttpExchange exchange, String method, String sub, int userId) throws Exception {

        String remainder = sub.length() > "sessions".length() ? sub.substring("sessions".length() + 1) : "";
        int id = -1;
        if (!remainder.isEmpty()) {
            try {
                id = Integer.parseInt(remainder);
            } catch (NumberFormatException e) {
                HttpUtil.sendError(exchange, 400, "Invalid session id");
                return;
            }
        }

        switch (method) {
            case "GET":
                if (id == -1) {
                    Map<String, String> query = HttpUtil.parseQuery(exchange.getRequestURI().getQuery());
                    LocalDate from = query.get("from") != null ? LocalDate.parse(query.get("from")) : null;
                    LocalDate to = query.get("to") != null ? LocalDate.parse(query.get("to")) : null;
                    List<StudySession> sessions = plannerService.listSessions(userId, from, to);
                    HttpUtil.sendJson(exchange, 200, DtoMapper.studySessions(sessions));
                } else {
                    HttpUtil.sendJson(exchange, 200, DtoMapper.studySession(plannerService.getSession(userId, id)));
                }
                break;
            case "POST": {
                Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                StudySession created = plannerService.createSession(userId, body);
                HttpUtil.sendJson(exchange, 201, DtoMapper.studySession(created));
                break;
            }
            case "PUT": {
                if (id == -1) { HttpUtil.sendError(exchange, 400, "Session id required in URL"); return; }
                Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                StudySession updated = plannerService.updateSession(userId, id, body);
                HttpUtil.sendJson(exchange, 200, DtoMapper.studySession(updated));
                break;
            }
            case "DELETE":
                if (id == -1) { HttpUtil.sendError(exchange, 400, "Session id required in URL"); return; }
                plannerService.deleteSession(userId, id);
                HttpUtil.sendJson(exchange, 200, Map.of("deleted", true));
                break;
            default:
                HttpUtil.sendError(exchange, 405, "Method not allowed");
        }
    }
}
