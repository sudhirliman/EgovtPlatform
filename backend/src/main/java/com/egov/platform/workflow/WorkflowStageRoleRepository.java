package com.egov.platform.workflow;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkflowStageRoleRepository extends JpaRepository<WorkflowStageRole, UUID> {
    List<WorkflowStageRole> findByStageId(UUID stageId);
    void deleteByStageId(UUID stageId);
}
