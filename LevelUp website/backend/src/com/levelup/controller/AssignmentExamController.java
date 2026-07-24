package com.levelup.controller;

import com.levelup.model.AcademicItem;
import com.levelup.service.AssignmentExamService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;


public class AssignmentExamController implements HttpHandler {

    public static final String BASE_PATH = "/api/assignments-exams";
    private final AssignmentExamService service = new AssignmentExamService();

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
                        Map<String, String> query = HttpUtil.parseQuery(exchange.getRequestURI().getQuery());
                        List<AcademicItem> items = service.listAll(userId, query.get("itemType"));
                        HttpUtil.sendJson(exchange, 200, DtoMapper.academicItems(items));
                    } else {
                        HttpUtil.sendJson(exchange, 200, DtoMapper.academicItem(service.get(userId, id)));
                    }
                    break;
                case "POST": {
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    AcademicItem created = service.create(userId, body);
                    HttpUtil.sendJson(exchange, 201, DtoMapper.academicItem(created));
                    break;
                }
                case "PUT": {
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "id required in URL"); return; }
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    AcademicItem updated = service.update(userId, id, body);
                    HttpUtil.sendJson(exchange, 200, DtoMapper.academicItem(updated));
                    break;
                }
                case "DELETE":
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "id required in URL"); return; }
                    service.delete(userId, id);
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
