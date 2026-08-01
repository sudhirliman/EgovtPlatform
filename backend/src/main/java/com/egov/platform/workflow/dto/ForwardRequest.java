package com.egov.platform.workflow.dto;

import java.util.UUID;

// actedBy removed — extracted from the JWT principal in WorkflowController
public record ForwardRequest(UUID chosenAssigneeUserId, String remarks) {}
