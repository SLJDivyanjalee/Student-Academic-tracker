package com.levelup.controller;

import com.levelup.model.AcademicItem;
import com.levelup.service.CalendarService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class CalendarController implements HttpHandler {

    public static final String BASE_PATH = "/api/calendar";
    private final CalendarService calendarService = new CalendarService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) return;
        try {
            Integer userId = AuthUtil.requireUserId(exchange);
            if (userId == null) return;

            if (!"GET".equals(exchange.getRequestMethod())) {
                HttpUtil.sendError(exchange, 405, "Method not allowed");
                return;
            }
            String path = exchange.getRequestURI().getPath();
            Map<String, String> query = HttpUtil.parseQuery(exchange.getRequestURI().getQuery());

            if (path.endsWith("/due-soon")) {
                int days = query.get("days") != null ? Integer.parseInt(query.get("days")) : 3;
                List<AcademicItem> items = calendarService.getDueSoon(userId, days);
                HttpUtil.sendJson(exchange, 200, DtoMapper.academicItems(items));
                return;
            }

            LocalDate from = query.get("from") != null ? LocalDate.parse(query.get("from")) : null;
            LocalDate to = query.get("to") != null ? LocalDate.parse(query.get("to")) : null;
            List<AcademicItem> items = calendarService.getItems(userId, from, to);
            HttpUtil.sendJson(exchange, 200, DtoMapper.academicItems(items));
        } catch (Exception e) {
            HttpUtil.sendException(exchange, e);
        }
    }
}
