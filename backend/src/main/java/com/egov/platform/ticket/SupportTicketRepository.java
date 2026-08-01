package com.egov.platform.ticket;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    List<SupportTicket> findByRaisedByUserId(UUID userId);
    List<SupportTicket> findByApplicationId(UUID applicationId);
}
