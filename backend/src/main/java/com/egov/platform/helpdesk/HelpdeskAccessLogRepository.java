package com.egov.platform.helpdesk;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HelpdeskAccessLogRepository extends JpaRepository<HelpdeskAccessLog, UUID> {
}
