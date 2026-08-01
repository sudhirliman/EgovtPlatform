package com.egov.platform.rbac.dto;

import com.egov.platform.rbac.Permission;
import com.egov.platform.rbac.Role;

import java.util.List;
import java.util.UUID;

/**
 * DTO for Role - deliberately NOT returning the raw Role entity from
 * controllers. Role.permissions is a lazy @ManyToMany collection, and with
 * spring.jpa.open-in-view=false, the Hibernate session used by the repository
 * call is already closed by the time Jackson serializes the response, which
 * throws LazyInitializationException. Converting to this DTO inside a
 * @Transactional controller method (see RoleController) resolves the
 * permission codes while the session is still open, so nothing lazy is left
 * in the object graph handed to Jackson.
 */
public record RoleResponse(UUID id, String name, boolean hasGlobalScope, List<String> permissionCodes) {
    public static RoleResponse from(Role role) {
        List<String> codes = role.getPermissions().stream().map(Permission::getCode).toList();
        return new RoleResponse(role.getId(), role.getName(), role.isGlobalScope(), codes);
    }
}
