package com.egov.platform.hierarchy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceMasterRepository extends JpaRepository<ServiceMaster, UUID> {
    List<ServiceMaster> findByDepartmentId(UUID departmentId);
}
