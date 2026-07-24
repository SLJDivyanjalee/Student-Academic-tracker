package com.levelup.controller;

import com.levelup.model.User;
import com.levelup.service.AuthService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Map;

public class AuthController implements HttpHandler {

    public static final String BASE_PATH = "/api/auth";
    private final AuthService authService = new AuthService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) return;
        try {
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();
            String sub = path.substring(BASE_PATH.length()).replaceAll("^/+", "");

            if (sub.equals("register") && "POST".equals(method)) {
                Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                AuthService.AuthResult result = authService.register(body);
                HttpUtil.sendJson(exchange, 201, DtoMapper.authResult(result.token, result.user));
                return;
            }

            if (sub.equals("login") && "POST".equals(method)) {
                Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                AuthService.AuthResult result = authService.login(body);
                HttpUtil.sendJson(exchange, 200, DtoMapper.authResult(result.token, result.user));
                return;
            }

            if (sub.equals("forgot-password") && "POST".equals(method)) {
                Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                String token = authService.requestPasswordReset(body);
                if (token != null) {
                    HttpUtil.sendJson(exchange, 200, Map.of("requested", true, "resetToken", token));
                } else {
                    HttpUtil.sendJson(exchange, 200, Map.of("requested", true));
                }
                return;
            }

            if (sub.equals("reset-password") && "POST".equals(method)) {
                Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                authService.resetPassword(body);
                HttpUtil.sendJson(exchange, 200, Map.of("reset", true));
                return;
            }

            if (sub.equals("logout") && "POST".equals(method)) {
                authService.logout(AuthUtil.extractBearerToken(exchange));
                HttpUtil.sendJson(exchange, 200, Map.of("loggedOut", true));
                return;
            }

            if (sub.equals("me") && "GET".equals(method)) {
                Integer userId = AuthUtil.requireUserId(exchange);
                if (userId == null) return;
                User user = authService.getById(userId);
                HttpUtil.sendJson(exchange, 200, DtoMapper.user(user));
                return;
            }

            HttpUtil.sendError(exchange, 404, "Unknown auth endpoint: " + method + " " + path);
        } catch (Exception e) {
            HttpUtil.sendException(exchange, e);
        }
    }
}
