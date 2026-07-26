package com.levelup.util;

import com.levelup.config.DatabaseConnection;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Base64;


public final class MailUtil {

    private MailUtil() {
    }

    /* True once host/username/password/from are all filled in db.properties */
    public static boolean isConfigured() {
        return notBlank(host()) && notBlank(username()) && notBlank(password()) && notBlank(from());
    }

    /* Sends a plain-text email. Throws IOException on any SMTP/network failure */
    public static void send(String toEmail, String subject, String bodyText) throws IOException {
        String host = host();
        int port = port();
        String username = username();
        String password = password();
        String from = from();
        String fromName = DatabaseConnection.getProperty("mail.smtp.fromName");
        boolean implicitTls = port == 465;

        Socket socket = implicitTls
                ? SSLSocketFactory.getDefault().createSocket(host, port)
                : new Socket(host, port);

        try {
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            OutputStream rawOut = socket.getOutputStream();

            readResponse(in, 220);
            String localHost = safeLocalHostName();
            command(rawOut, in, "EHLO " + localHost, 250);

            if (!implicitTls) {
                command(rawOut, in, "STARTTLS", 220);
                SSLSocket tlsSocket = (SSLSocket) ((SSLSocketFactory) SSLSocketFactory.getDefault())
                        .createSocket(socket, host, port, true);
                tlsSocket.startHandshake();
                socket = tlsSocket;
                in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                rawOut = socket.getOutputStream();
                command(rawOut, in, "EHLO " + localHost, 250);
            }

            command(rawOut, in, "AUTH LOGIN", 334);
            command(rawOut, in, Base64.getEncoder().encodeToString(username.getBytes(StandardCharsets.UTF_8)), 334);
            command(rawOut, in, Base64.getEncoder().encodeToString(password.getBytes(StandardCharsets.UTF_8)), 235);

            command(rawOut, in, "MAIL FROM:<" + from + ">", 250);
            command(rawOut, in, "RCPT TO:<" + toEmail + ">", 250);
            command(rawOut, in, "DATA", 354);

            String displayFrom = notBlank(fromName) ? (fromName + " <" + from + ">") : from;
            StringBuilder message = new StringBuilder();
            message.append("From: ").append(displayFrom).append("\r\n");
            message.append("To: ").append(toEmail).append("\r\n");
            message.append("Subject: ").append(subject).append("\r\n");
            message.append("MIME-Version: 1.0\r\n");
            message.append("Content-Type: text/plain; charset=UTF-8\r\n");
            message.append("\r\n");
            // Dot-stuff any line that starts with '.' per RFC 5321 before the terminator.
            for (String line : bodyText.split("\n", -1)) {
                if (line.startsWith(".")) message.append('.');
                message.append(line).append("\r\n");
            }
            message.append(".\r\n");

            rawOut.write(message.toString().getBytes(StandardCharsets.UTF_8));
            rawOut.flush();
            readResponse(in, 250);

            writeLine(rawOut, "QUIT");
        } finally {
            try { socket.close(); } catch (IOException ignored) { }
        }
    }

    private static void command(OutputStream out, BufferedReader in, String line, int expectedCode) throws IOException {
        writeLine(out, line);
        readResponse(in, expectedCode);
    }

    private static void writeLine(OutputStream out, String line) throws IOException {
        out.write((line + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.flush();
    }

    /** Reads one (possibly multi-line) SMTP response and throws if its status code doesn't match. */
    private static String readResponse(BufferedReader in, int expectedCode) throws IOException {
        String line;
        String last = null;
        do {
            line = in.readLine();
            if (line == null) throw new IOException("SMTP server closed the connection unexpectedly");
            last = line;
        } while (line.length() >= 4 && line.charAt(3) == '-'); // "250-..." continuation lines

        int code = Integer.parseInt(last.substring(0, 3));
        if (code != expectedCode) {
            throw new IOException("SMTP server responded " + last);
        }
        return last;
    }

    private static String safeLocalHostName() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "localhost";
        }
    }

    private static boolean notBlank(String s) {
        return s != null && !s.trim().isEmpty();
    }

    private static String host() {
        return DatabaseConnection.getProperty("mail.smtp.host");
    }

    private static int port() {
        String raw = DatabaseConnection.getProperty("mail.smtp.port");
        if (!notBlank(raw)) return 587;
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return 587;
        }
    }

    private static String username() {
        return DatabaseConnection.getProperty("mail.smtp.username");
    }

    private static String password() {
        return DatabaseConnection.getProperty("mail.smtp.password");
    }

    private static String from() {
        String explicit = DatabaseConnection.getProperty("mail.smtp.from");
        return notBlank(explicit) ? explicit : username();
    }
}
