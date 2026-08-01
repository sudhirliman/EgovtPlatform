package com.egov.platform.workflow.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

// actedBy removed — extracted from the JWT principal in WorkflowController
public record SendBackRequest(@NotNull UUID targetStageId, String remarks) {}
