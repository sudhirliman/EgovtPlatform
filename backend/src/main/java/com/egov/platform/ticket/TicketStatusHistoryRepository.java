package com.egov.platform.ticket;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketStatusHistoryRepository extends JpaRepository<TicketStatusHistory, UUID> {
}
