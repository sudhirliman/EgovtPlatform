package com.egov.platform.workflow.dto;

import com.egov.platform.workflow.Workflow;

import java.util.UUID;

// Avoids returning the raw Workflow entity, whose `stages` is a lazy
// @OneToMany collection - see RoleResponse's javadoc for the underlying reason.
public record WorkflowResponse(UUID id, UUID serviceId, boolean active) {
    public static WorkflowResponse from(Workflow w) {
        return new WorkflowResponse(w.getId(), w.getServiceId(), w.isActive());
    }
}
