package com.egov.platform.workflow.dto;

import com.egov.platform.workflow.WorkflowStage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record CreateStageRequest(
        int sequenceOrder,
        @NotBlank String stageName,
        @NotNull WorkflowStage.StageType stageType,
        Integer slaHours,
        UUID escalationRoleId,
        List<UUID> eligibleRoleIds) {}
