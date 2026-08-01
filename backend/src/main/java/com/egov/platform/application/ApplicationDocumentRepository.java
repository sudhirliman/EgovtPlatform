package com.egov.platform.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, UUID> {
    List<ApplicationDocument> findByApplicationId(UUID applicationId);
}
