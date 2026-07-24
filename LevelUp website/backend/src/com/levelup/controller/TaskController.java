package com.levelup.controller;

import com.levelup.model.Task;
import com.levelup.service.TaskService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class TaskController implements HttpHandler {

    public static final String BASE_PATH = "/api/tasks";
    private final TaskService taskService = new TaskService();

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
                        List<Task> tasks = taskService.listAll(userId, query.get("status"));
                        HttpUtil.sendJson(exchange, 200, DtoMapper.tasks(tasks));
                    } else {
                        HttpUtil.sendJson(exchange, 200, DtoMapper.task(taskService.get(userId, id)));
                    }
                    break;
                case "POST": {
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    Task created = taskService.create(userId, body);
                    HttpUtil.sendJson(exchange, 201, DtoMapper.task(created));
                    break;
                }
                case "PUT": {
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "Task id required in URL"); return; }
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    Task updated = taskService.update(userId, id, body);
                    HttpUtil.sendJson(exchange, 200, DtoMapper.task(updated));
                    break;
                }
                case "DELETE":
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "Task id required in URL"); return; }
                    taskService.delete(userId, id);
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
