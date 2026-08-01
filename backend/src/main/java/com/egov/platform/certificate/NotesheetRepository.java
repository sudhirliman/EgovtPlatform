package com.egov.platform.certificate;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotesheetRepository extends JpaRepository<Notesheet, UUID> {
    List<Notesheet> findByApplicationIdOrderByVersionDesc(UUID applicationId);
}
