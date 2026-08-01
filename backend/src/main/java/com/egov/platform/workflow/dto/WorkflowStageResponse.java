package com.egov.platform.workflow.dto;

import com.egov.platform.workflow.WorkflowStage;

import java.util.UUID;

// Deliberately flattens `workflow` down to workflowId - returning the nested
// Workflow entity would drag its lazy `stages` collection along for the ride.
public record WorkflowStageResponse(UUID id, UUID workflowId, int sequenceOrder, String stageName,
                                     WorkflowStage.StageType stageType, Integer slaHours, UUID escalationRoleId) {
    public static WorkflowStageResponse from(WorkflowStage s) {
        return new WorkflowStageResponse(s.getId(), s.getWorkflow().getId(), s.getSequenceOrder(), s.getStageName(),
                s.getStageType(), s.getSlaHours(), s.getEscalationRoleId());
    }
}
