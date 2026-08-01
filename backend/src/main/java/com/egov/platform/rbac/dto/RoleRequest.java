package com.egov.platform.rbac.dto;

import java.util.List;
import java.util.UUID;

public record RoleRequest(String name, boolean hasGlobalScope, List<UUID> permissionIds,
                          Integer level, String displayName, String description) {}
