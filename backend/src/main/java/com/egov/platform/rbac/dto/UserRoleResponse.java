package com.egov.platform.rbac.dto;

import com.egov.platform.rbac.UserRole;

import java.util.UUID;

// Same reasoning as RoleResponse - avoids serializing the nested Role entity
// (and its lazy permissions collection) directly.
public record UserRoleResponse(UUID id, UUID userId, UUID roleId, String roleName,
                                UUID boardId, UUID departmentId, UUID serviceId) {
    public static UserRoleResponse from(UserRole ur) {
        return new UserRoleResponse(ur.getId(), ur.getUser().getId(), ur.getRole().getId(), ur.getRole().getName(),
                ur.getBoardId(), ur.getDepartmentId(), ur.getServiceId());
    }
}
