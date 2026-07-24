package com.levelup.controller;

import com.levelup.service.AiHelpService;
import com.levelup.util.AuthUtil;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Map;


public class AiHelpController implements HttpHandler {

    public static final String BASE_PATH = "/api/ai";
    private final AiHelpService aiHelpService = new AiHelpService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) return;
        try {
            Integer userId = AuthUtil.requireUserId(exchange);
            if (userId == null) return;

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if (!"POST".equals(method) || !path.endsWith("/ask")) {
                HttpUtil.sendError(exchange, 404, "Unknown AI endpoint");
                return;
            }

            Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
            String question = body.get("question") == null ? null : body.get("question").toString();
            String page = body.get("page") == null ? null : body.get("page").toString();

            String answer = aiHelpService.ask(userId, question, page);
            HttpUtil.sendJson(exchange, 200, Map.of("answer", answer));
        } catch (IllegalStateException e) {
            HttpUtil.sendJson(exchange, 200, Map.of("answer", e.getMessage()));
        } catch (IOException e) {
            HttpUtil.sendError(exchange, 502, "AI assistant is temporarily unavailable: " + e.getMessage());
        } catch (Exception e) {
            HttpUtil.sendException(exchange, e);
        }
    }
}
