package com.egov.platform.form;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServiceDocumentConfigRepository extends JpaRepository<ServiceDocumentConfig, UUID> {
    List<ServiceDocumentConfig> findByServiceIdAndActiveTrueOrderByDisplayOrderAsc(UUID serviceId);
}
