package com.egov.platform.sla;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkingDayConfigRepository extends JpaRepository<WorkingDayConfig, UUID> {
    Optional<WorkingDayConfig> findByBoardIdAndDepartmentId(UUID boardId, UUID departmentId);
    Optional<WorkingDayConfig> findByBoardIdIsNullAndDepartmentIdIsNull();
}
