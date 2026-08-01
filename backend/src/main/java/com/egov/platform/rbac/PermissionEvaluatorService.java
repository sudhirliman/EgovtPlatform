package com.egov.platform.rbac;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Generic, reusable permission check used by every module (workflow, payments,
 * notesheet, helpdesk, etc.) instead of hard-coding "if role == X" anywhere.
 *
 * A user is granted a permission if any of their UserRole assignments:
 *   - carries a role with the requested permission code, AND
 *   - either the role has global scope (bypasses board/department/service scoping,
 *     used for the Helpdesk module), or the assignment's scope matches the
 *     board/department/service being acted on (nulls in UserRole act as wildcards
 *     at that level).
 */
@Service
public class PermissionEvaluatorService {

    private final UserRoleRepository userRoleRepository;

    public PermissionEvaluatorService(UserRoleRepository userRoleRepository) {
        this.userRoleRepository = userRoleRepository;
    }

    /**
     * @Transactional is required here: Role.permissions is a lazy @ManyToMany
     * collection, and application.yml sets spring.jpa.open-in-view=false, so
     * without an active transaction the session from userRoleRepository.findByUserId(...)
     * is already closed by the time role.getPermissions() is accessed below,
     * which throws LazyInitializationException - this method is called from
     * the @PreAuthorize security interceptor, which does NOT run inside a
     * request-scoped transaction on its own.
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(UUID userId, String permissionCode,
                                  UUID boardId, UUID departmentId, UUID serviceId) {
        List<UserRole> assignments = userRoleRepository.findByUserId(userId);

        for (UserRole assignment : assignments) {
            Role role = assignment.getRole();
            boolean hasCode = role.getPermissions().stream()
                    .anyMatch(p -> p.getCode().equals(permissionCode));
            if (!hasCode) {
                continue;
            }
            if (role.isGlobalScope()) {
                return true;
            }
            boolean boardMatches = assignment.getBoardId() == null || assignment.getBoardId().equals(boardId);
            boolean deptMatches = assignment.getDepartmentId() == null || assignment.getDepartmentId().equals(departmentId);
            boolean serviceMatches = assignment.getServiceId() == null || assignment.getServiceId().equals(serviceId);
            if (boardMatches && deptMatches && serviceMatches) {
                return true;
            }
        }
        return false;
    }

    /**
     * Convenience overload for platform-wide permissions (e.g. BOARD_MANAGE) with no scope.
     *
     * @Transactional here too (not just on the 5-arg method): AppPermissionEvaluator
     * always calls this 2-arg method from outside this class, which then calls
     * hasPermission(..., null, null, null) via SELF-INVOCATION. Spring's proxy-based
     * @Transactional does NOT apply to self-invoked calls within the same class -
     * only the externally-called entry point gets a transaction from the proxy, and
     * everything it calls on `this` afterward just participates in that same
     * thread-bound transaction. Without @Transactional on THIS method specifically,
     * the 5-arg method's own @Transactional was silently skipped entirely, causing
     * LazyInitializationException on role.getPermissions() - this was the actual
     * bug (confirmed via a real stack trace), not just a theoretical risk.
     */
    @Transactional(readOnly = true)
    public boolean hasPermission(UUID userId, String permissionCode) {
        return hasPermission(userId, permissionCode, null, null, null);
    }
}
