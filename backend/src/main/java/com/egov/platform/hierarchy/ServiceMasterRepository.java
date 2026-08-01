package com.egov.platform.hierarchy;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ServiceMasterRepository extends JpaRepository<ServiceMaster, UUID> {
    List<ServiceMaster> findByDepartmentId(UUID departmentId);

    @Query("SELECT s.department.id FROM ServiceMaster s WHERE s.id = :id")
    Optional<UUID> findDepartmentIdById(@Param("id") UUID id);

    @Query("SELECT s.department.board.id FROM ServiceMaster s WHERE s.id = :id")
    Optional<UUID> findBoardIdById(@Param("id") UUID id);
}
