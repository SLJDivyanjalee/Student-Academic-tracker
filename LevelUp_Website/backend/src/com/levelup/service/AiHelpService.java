package com.levelup.service;

import com.levelup.dao.AssignmentExamDao;
import com.levelup.dao.StudySessionDao;
import com.levelup.dao.SubjectDao;
import com.levelup.dao.TaskDao;
import com.levelup.dao.UserDao;
import com.levelup.exception.DaoException;
import com.levelup.model.AcademicItem;
import com.levelup.model.StudySession;
import com.levelup.model.Subject;
import com.levelup.model.Task;
import com.levelup.model.User;
import com.levelup.util.AiClient;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class AiHelpService {

    private static final int UPCOMING_WINDOW_DAYS = 14;

    private final UserDao userDao = new UserDao();
    private final TaskDao taskDao = new TaskDao();
    private final SubjectDao subjectDao = new SubjectDao();
    private final AssignmentExamDao assignmentExamDao = new AssignmentExamDao();
    private final StudySessionDao studySessionDao = new StudySessionDao();
    private final AttendanceService attendanceService = new AttendanceService();
    private final ProgressService progressService = new ProgressService();

    private static final String APP_MANUAL =
            "LEVELUP APP MANUAL\n" +
            "LevelUp is a student academic planner with these pages:\n" +
            "- Dashboard: daily overview, quick stats, a study session countdown timer, a getting-started checklist, and a mini calendar.\n" +
            "- Calendar: month view of every task/assignment/exam/study session by date.\n" +
            "- Tasks: to-do items with a name, subject, due date and urgency (low/medium/high); has filters and search; mark complete via the checkbox.\n" +
            "- Assignments & Exams: same page, switched via tabs; add an entry with name, subject, type and date; has filters and search.\n" +
            "- Attendance: add recurring lectures to a weekly timetable; quick-mark Present/Absent for today's lectures; view per-subject attendance percentage and a full log.\n" +
            "- Study Planner: auto-generates a weekly study schedule around the user's set working hours and existing deadlines/lectures; can regenerate a week (with more or less rest) and move individual sessions.\n" +
            "- Progress: charts for study hours, attendance and productivity, plus a daily streak tracker.\n" +
            "- Settings: edit profile (name, email, faculty, semester, avatar), change password, toggle notifications and light/dark theme, reset all data, or delete the account.\n";

    public String ask(int userId, String question, String currentPage) throws DaoException, IOException {
        if (!AiClient.isConfigured()) {
            return "The AI assistant isn't set up yet — an administrator needs to add a Gemini API key to db.properties.";
        }
        if (question == null || question.isBlank()) {
            return "Ask me anything about how to use LevelUp, or about your tasks, deadlines and attendance.";
        }

        String systemPrompt = buildSystemPrompt(userId, currentPage);
        String reply = AiClient.generate(systemPrompt, question.trim());
        return (reply == null || reply.isBlank())
                ? "I couldn't come up with an answer for that — try rephrasing your question."
                : reply;
    }

    private String buildSystemPrompt(int userId, String currentPage) throws DaoException {
        StringBuilder sb = new StringBuilder();
        sb.append("You are the in-app help assistant for LevelUp, a student academic planner web app. ")
          .append("Answer the user's question using ONLY the manual and data below. ")
          .append("Keep answers short (2-6 sentences, or a short bullet list), friendly and specific. ")
          .append("If asked how to do something in the app, give the exact steps. ")
          .append("If asked for advice, base it on the real numbers provided below, and prioritize the most urgent items. ")
          .append("Never invent data (grades, dates, counts) that isn't given to you. ")
          .append("If a question is unrelated to the app or the user's academic workload, politely say you can only help with LevelUp and study planning.\n\n");

        sb.append(APP_MANUAL).append("\n");

        if (currentPage != null && !currentPage.isBlank()) {
            sb.append("The user is currently on the \"").append(currentPage).append("\" page.\n\n");
        }

        sb.append(buildUserDataSnapshot(userId));
        return sb.toString();
    }

    private String buildUserDataSnapshot(int userId) throws DaoException {
        StringBuilder sb = new StringBuilder();
        sb.append("CURRENT USER DATA (as of ").append(LocalDate.now()).append("):\n");

        User user = userDao.findById(userId);
        if (user != null) {
            sb.append("- Name: ").append(nullSafe(user.getName())).append("\n");
            if (user.getFaculty() != null && !user.getFaculty().isBlank()) {
                sb.append("- Faculty: ").append(user.getFaculty()).append("\n");
            }
        }

        List<Subject> subjects = subjectDao.findAll(userId);
        sb.append("- Subjects: ")
          .append(subjects.isEmpty() ? "none added yet" :
                  subjects.stream().map(Subject::getName).collect(Collectors.joining(", ")))
          .append("\n");

        List<Task> tasks = taskDao.findAll(userId);
        long pendingTasks = tasks.stream().filter(t -> !Task.STATUS_DONE.equals(t.getStatus())).count();
        long overdueTasks = tasks.stream()
                .filter(t -> !Task.STATUS_DONE.equals(t.getStatus()))
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()))
                .count();
        sb.append("- Tasks: ").append(pendingTasks).append(" pending (").append(overdueTasks).append(" overdue)\n");
        List<String> urgentTasks = tasks.stream()
                .filter(t -> !Task.STATUS_DONE.equals(t.getStatus()))
                .filter(t -> t.getDueDate() != null && !t.getDueDate().isAfter(LocalDate.now().plusDays(UPCOMING_WINDOW_DAYS)))
                .sorted((a, b) -> a.getDueDate().compareTo(b.getDueDate()))
                .limit(8)
                .map(t -> t.getTitle() + " (due " + t.getDueDate() + ", " + t.getUrgency() + " urgency)")
                .collect(Collectors.toList());
        if (!urgentTasks.isEmpty()) {
            sb.append("  Upcoming/overdue tasks: ").append(String.join("; ", urgentTasks)).append("\n");
        }

        List<AcademicItem> items = assignmentExamDao.findAll(userId);
        List<String> upcomingItems = items.stream()
                .filter(i -> i.getDueDate() != null && !i.getDueDate().isBefore(LocalDate.now()))
                .filter(i -> i.getDueDate().isBefore(LocalDate.now().plusDays(UPCOMING_WINDOW_DAYS)))
                .sorted((a, b) -> a.getDueDate().compareTo(b.getDueDate()))
                .limit(8)
                .map(i -> i.getType() + ": " + i.getTitle() + " (" + i.getDueDate() + ")")
                .collect(Collectors.toList());
        sb.append("- Upcoming assignments/exams (next ").append(UPCOMING_WINDOW_DAYS).append(" days): ")
          .append(upcomingItems.isEmpty() ? "none" : String.join("; ", upcomingItems))
          .append("\n");

        try {
            Map<String, Object> attendanceSummary = attendanceService.getSummary(userId);
            @SuppressWarnings("unchecked")
            List<Object> rows = (List<Object>) attendanceSummary.get("subjects");
            if (rows != null && !rows.isEmpty()) {
                List<String> parts = rows.stream().map(row -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> r = (Map<String, Object>) row;
                    return r.get("subjectName") + ": " + r.get("percentage") + "%";
                }).collect(Collectors.toList());
                sb.append("- Attendance by subject: ").append(String.join(", ", parts)).append("\n");
            }
        } catch (DaoException ignored) {
            
        }

        try {
            Map<String, Object> streak = progressService.getStreak(userId);
            sb.append("- Current activity streak: ").append(streak.get("currentStreak")).append(" day(s)\n");
        } catch (DaoException ignored) {
        }

        List<StudySession> sessions = studySessionDao.findAll(userId);
        long completedSessions = sessions.stream().filter(StudySession::isCompleted).count();
        sb.append("- Study sessions logged: ").append(sessions.size())
          .append(" total, ").append(completedSessions).append(" completed\n");

        return sb.toString();
    }

    private String nullSafe(String s) {
        return s == null ? "" : s;
    }
}
