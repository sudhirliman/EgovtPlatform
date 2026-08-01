package com.egov.platform.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentVerificationRepository extends JpaRepository<DocumentVerification, UUID> {
    List<DocumentVerification> findByApplicationIdAndVerificationStage(UUID applicationId, DocumentVerification.Stage stage);
    List<DocumentVerification> findByApplicationId(UUID applicationId);
    void deleteByDocumentIdAndVerificationStage(UUID documentId, DocumentVerification.Stage stage);
}
