package com.egov.platform.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationAssignmentRepository extends JpaRepository<ApplicationAssignment, UUID> {
    List<ApplicationAssignment> findByApplicationIdOrderByAssignedAtDesc(UUID applicationId);
}
