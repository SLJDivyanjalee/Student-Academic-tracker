package com.levelup.util;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves static frontend files (HTML/CSS/JS/images) from a folder on disk.
 * Used so the same server + port can host both the API and the website,
 * which avoids running two separate services and avoids cross-origin issues.
 */
public class StaticFileHandler implements HttpHandler {

    private final Path root;

    public StaticFileHandler(String rootDir) {
        this.root = Paths.get(rootDir).toAbsolutePath().normalize();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String requestPath = exchange.getRequestURI().getPath();
        if (requestPath.equals("/")) {
            requestPath = "/dashboard.html";
        }

        Path filePath = root.resolve(requestPath.substring(1)).normalize();

        // Prevent path traversal outside the frontend folder
        if (!filePath.startsWith(root)) {
            exchange.sendResponseHeaders(403, -1);
            exchange.close();
            return;
        }

        if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
            // Fallback so pages like "/tasks" (no .html) still resolve
            Path withHtml = Paths.get(filePath + ".html");
            if (Files.exists(withHtml)) {
                filePath = withHtml;
            } else {
                exchange.sendResponseHeaders(404, -1);
                exchange.close();
                return;
            }
        }

        String contentType = guessContentType(filePath.toString());
        byte[] bytes = Files.readAllBytes(filePath);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private String guessContentType(String path) {
        if (path.endsWith(".html")) return "text/html; charset=utf-8";
        if (path.endsWith(".css")) return "text/css; charset=utf-8";
        if (path.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (path.endsWith(".json")) return "application/json; charset=utf-8";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
        if (path.endsWith(".ico")) return "image/x-icon";
        if (path.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }
}
