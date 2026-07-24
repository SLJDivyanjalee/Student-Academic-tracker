package com.levelup.controller;

import com.levelup.model.TimetableLecture;
import com.levelup.service.TimetableService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.Map;

public class TimetableController implements HttpHandler {

    public static final String BASE_PATH = "/api/timetable";
    private final TimetableService timetableService = new TimetableService();

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
                        HttpUtil.sendJson(exchange, 200, DtoMapper.lectures(timetableService.listAll(userId)));
                    } else {
                        HttpUtil.sendJson(exchange, 200, DtoMapper.lecture(timetableService.get(userId, id)));
                    }
                    break;
                case "POST": {
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    TimetableLecture created = timetableService.create(userId, body);
                    HttpUtil.sendJson(exchange, 201, DtoMapper.lecture(created));
                    break;
                }
                case "PUT": {
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "Lecture id required in URL"); return; }
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    TimetableLecture updated = timetableService.update(userId, id, body);
                    HttpUtil.sendJson(exchange, 200, DtoMapper.lecture(updated));
                    break;
                }
                case "DELETE":
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "Lecture id required in URL"); return; }
                    timetableService.delete(userId, id);
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
