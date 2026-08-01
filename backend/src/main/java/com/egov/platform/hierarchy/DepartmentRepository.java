package com.egov.platform.hierarchy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByBoardId(UUID boardId);
}
