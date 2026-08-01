package com.egov.platform.form;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FormTemplateRepository extends JpaRepository<FormTemplate, UUID> {
    Optional<FormTemplate> findByServiceIdAndActiveTrue(UUID serviceId);
}
