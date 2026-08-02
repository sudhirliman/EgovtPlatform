package com.egov.platform.ticket.dto;

import java.util.UUID;

public record CreateTicketRequest(UUID applicationId, UUID raisedByUserId, UUID categoryId,
                                   String subject, String description, String priority) {}
