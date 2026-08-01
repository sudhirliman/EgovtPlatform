package com.egov.platform.workflow.dto;

import java.util.List;
import java.util.UUID;

public record ReorderStagesRequest(List<UUID> orderedStageIds) {}
