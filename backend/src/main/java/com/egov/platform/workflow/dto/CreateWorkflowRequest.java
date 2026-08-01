package com.egov.platform.workflow.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateWorkflowRequest(@NotNull UUID serviceId) {}
