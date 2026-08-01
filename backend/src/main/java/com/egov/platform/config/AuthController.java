package com.egov.platform.config;

import com.egov.platform.rbac.AppUser;
import com.egov.platform.rbac.AppUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** identifier can be either the username OR the mobile number - whichever the user types. */
    public record LoginRequest(String identifier, String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.identifier() == null || request.identifier().isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username/mobile number or password"));
        }

        var userOpt = appUserRepository.findByUsernameOrMobile(request.identifier(), request.identifier());
        boolean valid = userOpt.isPresent()
                && userOpt.get().getPasswordHash() != null
                && passwordEncoder.matches(request.password(), userOpt.get().getPasswordHash())
                && userOpt.get().isActive();

        if (!valid) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username/mobile number or password"));
        }

        AppUser user = userOpt.get();
        String token = jwtService.generateToken(user.getId());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "userId", user.getId(),
                "name", user.getName(),
                "username", user.getUsername() == null ? "" : user.getUsername()
        ));
    }

    /**
     * Session check — frontend sends the stored JWT via Authorization: Bearer header
     * (not in the body, to avoid token appearing in server access logs).
     * The JwtAuthenticationFilter validates it; we just read the resulting principal.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "No token provided"));
        }
        try {
            UUID userId = jwtService.validateAndGetUserId(header.substring(7));
            AppUser user = appUserRepository.findById(userId).orElseThrow();
            return ResponseEntity.ok(Map.of("userId", user.getId(), "name", user.getName()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired session"));
        }
    }
}
