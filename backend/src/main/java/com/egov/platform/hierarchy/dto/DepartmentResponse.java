package com.egov.platform.hierarchy.dto;

import com.egov.platform.hierarchy.Department;

import java.util.UUID;

public record DepartmentResponse(UUID id, UUID boardId, String nameEnglish, String nameMarathi, String code, boolean active) {
    public static DepartmentResponse from(Department d) {
        return new DepartmentResponse(d.getId(), d.getBoard().getId(), d.getNameEnglish(), d.getNameMarathi(), d.getCode(), d.isActive());
    }
}
