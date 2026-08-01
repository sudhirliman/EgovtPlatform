package com.egov.platform.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowStageRepository extends JpaRepository<WorkflowStage, UUID> {
    List<WorkflowStage> findByWorkflowIdOrderBySequenceOrderAsc(UUID workflowId);
}
