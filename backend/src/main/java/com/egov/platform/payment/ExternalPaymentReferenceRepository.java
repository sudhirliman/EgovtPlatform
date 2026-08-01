package com.egov.platform.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExternalPaymentReferenceRepository extends JpaRepository<ExternalPaymentReference, UUID> {
    List<ExternalPaymentReference> findByApplicationId(UUID applicationId);
}
