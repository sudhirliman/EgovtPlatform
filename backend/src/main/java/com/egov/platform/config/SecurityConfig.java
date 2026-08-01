package com.egov.platform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * @PreAuthorize("hasPermission(...)") is wired to AppPermissionEvaluator, which
 * in turn calls PermissionEvaluatorService - the same scope-aware check used
 * everywhere else in the codebase (see SRS 3.2, 7.3). Identity now comes from
 * a real JWT (see JwtAuthenticationFilter + AuthController), not a placeholder.
 *
 * Current access rule (intentionally simple - revisit before production):
 *  - /api/auth/**                         : public (login/session-check)
 *  - /api/payments/cashfree/webhook       : public (Cashfree calls this with no user session,
 *                                            signature verification inside the controller is
 *                                            what actually protects it - see CashfreeWebhookController)
 *  - GET  /api/**                         : public (citizen-facing read access - form schema,
 *                                            theme, board/service listing, etc. don't require login)
 *  - everything else (POST/PUT/PATCH/DELETE) : requires a valid JWT
 *  - fine-grained per-action checks       : @PreAuthorize("hasPermission(...)") on top of that
 *
 * TODO before any real deployment:
 *  - Reconsider which GETs should actually be public vs officer-only (e.g. application
 *    detail/list probably should NOT be a public GET once citizen accounts exist).
 *  - Move app.jwt.secret out of application.yml into an environment variable / secret manager.
 *  - Restrict allowed CORS origins to your real deployed frontend URL(s), not just localhost.
 */
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(AppPermissionEvaluator evaluator) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(evaluator);
        return handler;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/payments/cashfree/webhook").permitAll()
                // truly public read endpoints — citizen-visible catalogue & theming only
                .requestMatchers(HttpMethod.GET,
                        "/api/boards/**",
                        "/api/departments/**",
                        "/api/services/**",
                        "/api/theme/**").permitAll()
                // everything else (including all application/user/helpdesk GETs) requires a JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
