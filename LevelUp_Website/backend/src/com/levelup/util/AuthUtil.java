package com.levelup.util;

import com.levelup.dao.SessionDao;
import com.levelup.exception.DaoException;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;

 
public final class AuthUtil {

    private static final SessionDao sessionDao = new SessionDao();

    private AuthUtil() {
    }

    public static String extractBearerToken(HttpExchange exchange) {
        String header = exchange.getRequestHeaders().getFirst("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring("Bearer ".length()).trim();
        return token.isEmpty() ? null : token;
    }

    public static Integer requireUserId(HttpExchange exchange) throws IOException {
        String token = extractBearerToken(exchange);
        if (token == null) {
            HttpUtil.sendError(exchange, 401, "Missing or malformed Authorization header. Please log in.");
            return null;
        }
        try {
            Integer userId = sessionDao.findUserIdByValidToken(token);
            if (userId == null) {
                HttpUtil.sendError(exchange, 401, "Session expired or invalid. Please log in again.");
                return null;
            }
            return userId;
        } catch (DaoException e) {
            HttpUtil.sendError(exchange, 500, "Failed to validate session: " + e.getMessage());
            return null;
        }
    }
}
