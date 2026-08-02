package com.egov.platform.ticket;

import com.egov.platform.notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class TicketService {

    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final TicketStatusHistoryRepository statusHistoryRepository;
    private final NotificationService notificationService;

    public TicketService(SupportTicketRepository ticketRepository, TicketMessageRepository messageRepository,
                          TicketStatusHistoryRepository statusHistoryRepository, NotificationService notificationService) {
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public SupportTicket create(UUID applicationId, UUID raisedByUserId, UUID categoryId, String subject,
                                 String description, String priority) {
        SupportTicket ticket = new SupportTicket();
        ticket.setTicketNo("TCK-" + System.currentTimeMillis());
        ticket.setApplicationId(applicationId);
        ticket.setRaisedByUserId(raisedByUserId);
        ticket.setCategoryId(categoryId);
        ticket.setSubject(subject);
        ticket.setDescription(description);
        if (priority != null) {
            try { ticket.setPriority(SupportTicket.Priority.valueOf(priority)); } catch (IllegalArgumentException ignored) {}
        }
        ticket = ticketRepository.save(ticket);
        recordStatus(ticket.getId(), SupportTicket.Status.OPEN, raisedByUserId);

        notificationService.triggerForUser("TICKET_CREATED", applicationId, null, raisedByUserId,
                Map.of("ticket_no", ticket.getTicketNo(), "subject", subject == null ? "" : subject));

        return ticket;
    }

    @Transactional
    public TicketMessage addMessage(UUID ticketId, UUID senderUserId, TicketMessage.SenderType senderType,
                                     String message, String attachmentPath) {
        TicketMessage msg = new TicketMessage();
        msg.setTicketId(ticketId);
        msg.setSenderUserId(senderUserId);
        msg.setSenderType(senderType);
        msg.setMessage(message);
        msg.setAttachmentPath(attachmentPath);
        msg = messageRepository.save(msg);

        // Only notify the citizen when an OFFICER replies - no need to notify
        // them about their own message.
        if (senderType == TicketMessage.SenderType.OFFICER) {
            SupportTicket ticket = ticketRepository.findById(ticketId).orElse(null);
            if (ticket != null) {
                notificationService.triggerForUser("TICKET_REPLIED", ticket.getApplicationId(), null,
                        ticket.getRaisedByUserId(), Map.of("ticket_no", ticket.getTicketNo()));
            }
        }
        return msg;
    }

    @Transactional
    public void changeStatus(UUID ticketId, SupportTicket.Status status, UUID changedBy) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Ticket not found: " + ticketId));
        ticket.setStatus(status);
        if (status == SupportTicket.Status.RESOLVED) {
            ticket.setResolvedAt(Instant.now());
        }
        ticketRepository.save(ticket);
        recordStatus(ticketId, status, changedBy);

        if (status == SupportTicket.Status.RESOLVED) {
            notificationService.triggerForUser("TICKET_RESOLVED", ticket.getApplicationId(), null,
                    ticket.getRaisedByUserId(), Map.of("ticket_no", ticket.getTicketNo()));
        }
    }

    private void recordStatus(UUID ticketId, SupportTicket.Status status, UUID changedBy) {
        TicketStatusHistory history = new TicketStatusHistory();
        history.setTicketId(ticketId);
        history.setStatus(status);
        history.setChangedBy(changedBy);
        statusHistoryRepository.save(history);
    }
}
