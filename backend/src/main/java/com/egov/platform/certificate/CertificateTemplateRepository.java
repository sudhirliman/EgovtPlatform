package com.egov.platform.certificate;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CertificateTemplateRepository extends JpaRepository<CertificateTemplate, UUID> {
    Optional<CertificateTemplate> findByServiceId(UUID serviceId);
}
