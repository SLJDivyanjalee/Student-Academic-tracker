package com.levelup;

import com.levelup.controller.*;
import com.levelup.util.HttpUtil;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.Map;
import java.util.concurrent.Executors;


public class Main {

    private static final int PORT = getPort();

    private static int getPort() {
        String envPort = System.getenv("PORT");
        if (envPort != null && !envPort.isEmpty()) {
            try {
                return Integer.parseInt(envPort);
            } catch (NumberFormatException ignored) {
                // fall through to default
            }
        }
        return 8080;
    }

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Simple health check 
        server.createContext("/api/health", exchange -> {
            if (HttpUtil.handlePreflight(exchange)) return;
            HttpUtil.sendJson(exchange, 200, Map.of("status", "ok", "service", "LevelUp backend"));
        });

        server.createContext(AuthController.BASE_PATH, new AuthController());
        server.createContext(OnboardingController.BASE_PATH, new OnboardingController());
        server.createContext(TaskController.BASE_PATH, new TaskController());
        server.createContext(SubjectController.BASE_PATH, new SubjectController());
        server.createContext(AssignmentExamController.BASE_PATH, new AssignmentExamController());
        server.createContext(AttendanceController.BASE_PATH, new AttendanceController());
        server.createContext(TimetableController.BASE_PATH, new TimetableController());
        server.createContext(StudyPlannerController.BASE_PATH, new StudyPlannerController());
        server.createContext(ProfileController.BASE_PATH, new ProfileController());
        server.createContext(CalendarController.BASE_PATH, new CalendarController());
        server.createContext(ProgressController.BASE_PATH, new ProgressController());
        server.createContext(AiHelpController.BASE_PATH, new AiHelpController());

        // Serve the frontend (HTML/CSS/JS) from the same server + port.
        // FRONTEND_DIR env var lets this point wherever the deploy copies the
        // frontend folder to; defaults to a "public" folder next to the jar/classes.
        String frontendDir = System.getenv().getOrDefault("FRONTEND_DIR", "public");
        server.createContext("/", new com.levelup.util.StaticFileHandler(frontendDir));

        // Thread pool so multiple requests can be served concurrently
        server.setExecutor(Executors.newFixedThreadPool(16));
        server.start();

        System.out.println("=======================================================");
        System.out.println(" LevelUp backend running on http://localhost:" + PORT);
        System.out.println(" Try: curl http://localhost:" + PORT + "/api/health");
        System.out.println(" Register: POST /api/auth/register  {name, email, password}");
        System.out.println(" Login:    POST /api/auth/login     {email, password}");
        System.out.println("=======================================================");
    }
}
