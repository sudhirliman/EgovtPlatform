package com.egov.platform.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChallanRepository extends JpaRepository<Challan, UUID> {
    List<Challan> findByApplicationId(UUID applicationId);
    Optional<Challan> findFirstByApplicationIdAndStatusOrderByCreatedAtDesc(UUID applicationId, Challan.Status status);
}
