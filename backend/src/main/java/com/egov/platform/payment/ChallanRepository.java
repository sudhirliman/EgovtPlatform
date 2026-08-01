package com.egov.platform.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChallanRepository extends JpaRepository<Challan, UUID> {
    List<Challan> findByApplicationId(UUID applicationId);
}
