package com.egov.platform.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ApplicationWorkflowInstanceRepository extends JpaRepository<ApplicationWorkflowInstance, UUID> {
    Optional<ApplicationWorkflowInstance> findByApplicationId(UUID applicationId);
}
