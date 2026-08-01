package com.egov.platform.config;

import com.egov.platform.rbac.PermissionEvaluatorService;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.UUID;

/**
 * Bridges Spring Security's @PreAuthorize("hasPermission(...)") expressions to
 * our own PermissionEvaluatorService, so every module uses the SAME scope-aware
 * check (board/department/service, or global scope for Helpdesk) rather than a
 * parallel Spring-Security-only permission model.
 *
 * Usage once real authentication is wired in (see SecurityConfig TODO):
 *   @PreAuthorize("hasPermission(#boardId, 'BOARD', 'BOARD_MANAGE')")
 *   public BoardResponse update(@PathVariable UUID boardId, ...) { ... }
 *
 * targetType is unused today (every module currently checks the same way) but
 * is kept so a future module can special-case if ever needed.
 */
@Component
public class AppPermissionEvaluator implements PermissionEvaluator {

    private final PermissionEvaluatorService permissionEvaluatorService;

    public AppPermissionEvaluator(PermissionEvaluatorService permissionEvaluatorService) {
        this.permissionEvaluatorService = permissionEvaluatorService;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        UUID userId = currentUserId(authentication);
        if (userId == null) return false;
        return permissionEvaluatorService.hasPermission(userId, String.valueOf(permission));
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        UUID userId = currentUserId(authentication);
        if (userId == null) return false;
        UUID scopeId = targetId != null ? UUID.fromString(targetId.toString()) : null;
        // targetType tells us which scope column the id refers to; extend this
        // switch as more modules need scope-specific checks.
        return switch (targetType) {
            case "BOARD" -> permissionEvaluatorService.hasPermission(userId, String.valueOf(permission), scopeId, null, null);
            case "DEPARTMENT" -> permissionEvaluatorService.hasPermission(userId, String.valueOf(permission), null, scopeId, null);
            case "SERVICE" -> permissionEvaluatorService.hasPermission(userId, String.valueOf(permission), null, null, scopeId);
            default -> permissionEvaluatorService.hasPermission(userId, String.valueOf(permission));
        };
    }

    private UUID currentUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return null;
        }
        // JwtAuthenticationFilter sets the principal to the authenticated user's
        // UUID (as a string), so this now reflects a real logged-in user.
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
