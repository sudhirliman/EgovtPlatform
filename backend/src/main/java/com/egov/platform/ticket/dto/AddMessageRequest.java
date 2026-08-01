package com.egov.platform.ticket.dto;

import com.egov.platform.ticket.TicketMessage;
import java.util.UUID;

public record AddMessageRequest(UUID senderUserId, TicketMessage.SenderType senderType,
                                 String message, String attachmentPath) {}
