package com.levelup.controller;

import com.levelup.service.ProgressService;
import com.levelup.util.AuthUtil;
import com.levelup.util.HttpUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;

public class ProgressController implements HttpHandler {

    public static final String BASE_PATH = "/api/progress";
    private final ProgressService progressService = new ProgressService();

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
            if (path.endsWith("/streak")) {
                HttpUtil.sendJson(exchange, 200, progressService.getStreak(userId));
            } else {
                HttpUtil.sendError(exchange, 404, "Unknown progress endpoint");
            }
        } catch (Exception e) {
            HttpUtil.sendException(exchange, e);
        }
    }
}
