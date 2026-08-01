package com.egov.platform.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * Reads "Authorization: Bearer <token>", and if valid, sets an Authentication
 * whose principal (and therefore .getName()) is the user's UUID as a string -
 * this is exactly what AppPermissionEvaluator.currentUserId(...) expects.
 * An invalid/expired/missing token simply leaves the request unauthenticated
 * (SecurityConfig then decides whether that endpoint requires auth).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                UUID userId = jwtService.validateAndGetUserId(header.substring(7));
                var auth = new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                // Invalid/expired token - proceed unauthenticated; SecurityConfig's
                // authorizeHttpRequests rules decide whether that's acceptable for this path.
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
