package com.levelup.controller;

import com.levelup.model.Subject;
import com.levelup.service.SubjectService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Map;

public class SubjectController implements HttpHandler {

    public static final String BASE_PATH = "/api/subjects";
    private final SubjectService subjectService = new SubjectService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) return;
        try {
            Integer userId = AuthUtil.requireUserId(exchange);
            if (userId == null) return;

            String method = exchange.getRequestMethod();
            int id = HttpUtil.extractIdFromPath(exchange.getRequestURI().getPath(), BASE_PATH);

            switch (method) {
                case "GET":
                    if (id == -1) {
                        HttpUtil.sendJson(exchange, 200, DtoMapper.subjects(subjectService.listAll(userId)));
                    } else {
                        HttpUtil.sendJson(exchange, 200, DtoMapper.subject(subjectService.get(userId, id)));
                    }
                    break;
                case "POST": {
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    Subject created = subjectService.create(userId, body);
                    HttpUtil.sendJson(exchange, 201, DtoMapper.subject(created));
                    break;
                }
                case "PUT": {
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "Subject id required in URL"); return; }
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    Subject updated = subjectService.update(userId, id, body);
                    HttpUtil.sendJson(exchange, 200, DtoMapper.subject(updated));
                    break;
                }
                case "DELETE":
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "Subject id required in URL"); return; }
                    subjectService.delete(userId, id);
                    HttpUtil.sendJson(exchange, 200, Map.of("deleted", true));
                    break;
                default:
                    HttpUtil.sendError(exchange, 405, "Method not allowed");
            }
        } catch (Exception e) {
            HttpUtil.sendException(exchange, e);
        }
    }
}
