package com.egov.platform.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates JWTs carrying the user's id as the subject. Kept
 * deliberately simple (no roles/authorities in the token itself) because
 * every permission check goes through PermissionEvaluatorService against the
 * database at request time (see AppPermissionEvaluator) - the token's only
 * job is to prove "this request is authenticated as user X", not to carry
 * stale authorization data that could drift from the DB.
 */
@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt.secret:}") String secret,
                       @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        String effective = secret.isBlank() ? randomSecret() : secret;
        this.key = Keys.hmacShaKeyFor(effective.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    private static String randomSecret() {
        byte[] bytes = new byte[64];
        new SecureRandom().nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    public String generateToken(UUID userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    /** @throws io.jsonwebtoken.JwtException if the token is missing, expired, or has an invalid signature */
    public UUID validateAndGetUserId(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return UUID.fromString(claims.getSubject());
    }
}
