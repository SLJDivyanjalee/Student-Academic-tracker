package com.levelup.util;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;


public final class PasswordUtil {

    private static final int ITERATIONS = 65536;
    private static final int KEY_LENGTH = 256;
    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordUtil() {
    }

    /* Generates a new random salt */
    public static String newSalt() {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    /* Hashes a plaintext password with the given base64 salt, returning a base64 hash */
    public static String hash(String password, String base64Salt) {
        try {
            byte[] salt = Base64.getDecoder().decode(base64Salt);
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = factory.generateSecret(spec).getEncoded();
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Password hashing failed: " + e.getMessage(), e);
        }
    }

    /* Constant-time-ish comparison of a password against a stored hash */
    public static boolean verify(String password, String base64Salt, String expectedBase64Hash) {
        String actual = hash(password, base64Salt);
        return java.util.Arrays.equals(
                Base64.getDecoder().decode(actual),
                Base64.getDecoder().decode(expectedBase64Hash));
    }

    /* Generates a random 48-byte, URL-safe bearer token for session cookies */
    public static String newSessionToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
