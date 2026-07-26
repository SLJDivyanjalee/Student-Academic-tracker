package com.levelup.controller;

import com.levelup.model.User;
import com.levelup.service.OnboardingService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Map;

public class OnboardingController implements HttpHandler {

    public static final String BASE_PATH = "/api/onboarding";
    private final OnboardingService onboardingService = new OnboardingService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) return;
        try {
            Integer userId = AuthUtil.requireUserId(exchange);
            if (userId == null) return;

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();
            String sub = path.substring(BASE_PATH.length()).replaceAll("^/+", "");

            if (sub.equals("status") && "GET".equals(method)) {
                User user = onboardingService.getStatus(userId);
                HttpUtil.sendJson(exchange, 200, DtoMapper.user(user));
                return;
            }

            if (sub.equals("complete") && "POST".equals(method)) {
                Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                User user = onboardingService.complete(userId, body);
                HttpUtil.sendJson(exchange, 200, DtoMapper.user(user));
                return;
            }

            HttpUtil.sendError(exchange, 404, "Unknown onboarding endpoint: " + method + " " + path);
        } catch (Exception e) {
            HttpUtil.sendException(exchange, e);
        }
    }
}
