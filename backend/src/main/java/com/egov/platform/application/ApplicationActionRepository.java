package com.egov.platform.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationActionRepository extends JpaRepository<ApplicationAction, UUID> {
    List<ApplicationAction> findByApplicationIdOrderByActedAtAsc(UUID applicationId);
}
