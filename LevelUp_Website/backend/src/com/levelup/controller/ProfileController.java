package com.levelup.controller;

import com.levelup.model.User;
import com.levelup.service.ProfileService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Map;

public class ProfileController implements HttpHandler {

    public static final String BASE_PATH = "/api/profile";
    private final ProfileService profileService = new ProfileService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) return;
        try {
            Integer userId = AuthUtil.requireUserId(exchange);
            if (userId == null) return;

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if (path.endsWith("/password") && "POST".equals(method)) {
                Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                profileService.changePassword(userId, body);
                HttpUtil.sendJson(exchange, 200, Map.of("passwordChanged", true));
                return;
            }

            if (path.endsWith("/reset") && "POST".equals(method)) {
                profileService.resetData(userId);
                HttpUtil.sendJson(exchange, 200, Map.of("reset", true));
                return;
            }

            switch (method) {
                case "GET":
                    HttpUtil.sendJson(exchange, 200, DtoMapper.user(profileService.get(userId)));
                    break;
                case "PUT":
                case "POST": {
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    User saved = profileService.save(userId, body);
                    HttpUtil.sendJson(exchange, 200, DtoMapper.user(saved));
                    break;
                }
                case "DELETE": {
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    profileService.deleteAccount(userId, body);
                    HttpUtil.sendJson(exchange, 200, Map.of("accountDeleted", true));
                    break;
                }
                default:
                    HttpUtil.sendError(exchange, 405, "Method not allowed");
            }
        } catch (Exception e) {
            HttpUtil.sendException(exchange, e);
        }
    }
}
