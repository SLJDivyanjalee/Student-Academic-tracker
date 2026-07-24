package com.levelup.controller;

import com.levelup.model.AttendanceRecord;
import com.levelup.service.AttendanceService;
import com.levelup.util.AuthUtil;
import com.levelup.util.DtoMapper;
import com.levelup.util.HttpUtil;
import com.levelup.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class AttendanceController implements HttpHandler {

    public static final String BASE_PATH = "/api/attendance";
    private final AttendanceService attendanceService = new AttendanceService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (HttpUtil.handlePreflight(exchange)) return;
        try {
            Integer userId = AuthUtil.requireUserId(exchange);
            if (userId == null) return;

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if (path.endsWith("/summary")) {
                if (!"GET".equals(method)) { HttpUtil.sendError(exchange, 405, "Method not allowed"); return; }
                HttpUtil.sendJson(exchange, 200, attendanceService.getSummary(userId));
                return;
            }

            int id = HttpUtil.extractIdFromPath(path, BASE_PATH);

            switch (method) {
                case "GET":
                    if (id == -1) {
                        Map<String, String> query = HttpUtil.parseQuery(exchange.getRequestURI().getQuery());
                        Integer subjectId = query.get("subjectId") != null ? Integer.parseInt(query.get("subjectId")) : null;
                        List<AttendanceRecord> records = attendanceService.listAll(userId, subjectId);
                        HttpUtil.sendJson(exchange, 200, DtoMapper.attendanceList(records));
                    } else {
                        HttpUtil.sendJson(exchange, 200, DtoMapper.attendance(attendanceService.get(userId, id)));
                    }
                    break;
                case "POST": {
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    AttendanceRecord created = attendanceService.create(userId, body);
                    HttpUtil.sendJson(exchange, 201, DtoMapper.attendance(created));
                    break;
                }
                case "PUT": {
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "Attendance id required in URL"); return; }
                    Map<String, Object> body = JsonUtil.parseObject(HttpUtil.readBody(exchange));
                    AttendanceRecord updated = attendanceService.update(userId, id, body);
                    HttpUtil.sendJson(exchange, 200, DtoMapper.attendance(updated));
                    break;
                }
                case "DELETE":
                    if (id == -1) { HttpUtil.sendError(exchange, 400, "Attendance id required in URL"); return; }
                    attendanceService.delete(userId, id);
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
