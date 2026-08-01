package com.egov.platform.rbac.dto;

import java.util.UUID;

public record AssignRoleRequest(UUID userId, UUID roleId, UUID boardId, UUID departmentId, UUID serviceId) {}
