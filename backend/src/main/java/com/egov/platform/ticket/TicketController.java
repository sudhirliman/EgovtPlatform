package com.egov.platform.ticket;

import com.egov.platform.ticket.dto.AddMessageRequest;
import com.egov.platform.ticket.dto.CreateTicketRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;
    private final SupportTicketRepository ticketRepository;
    private final TicketMessageRepository messageRepository;
    private final TicketCategoryRepository categoryRepository;

    public TicketController(TicketService ticketService, SupportTicketRepository ticketRepository,
                             TicketMessageRepository messageRepository,
                             TicketCategoryRepository categoryRepository) {
        this.ticketService = ticketService;
        this.ticketRepository = ticketRepository;
        this.messageRepository = messageRepository;
        this.categoryRepository = categoryRepository;
    }

    /** Admin: list all tickets. User: filter by raisedByUserId. */
    @GetMapping
    public List<SupportTicket> list(@RequestParam(required = false) UUID raisedByUserId) {
        if (raisedByUserId != null) return ticketRepository.findByRaisedByUserId(raisedByUserId);
        return ticketRepository.findAll();
    }

    @GetMapping("/categories")
    public List<TicketCategory> categories() {
        return categoryRepository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupportTicket create(@RequestBody CreateTicketRequest request) {
        return ticketService.create(request.applicationId(), request.raisedByUserId(), request.categoryId(),
                request.subject(), request.description());
    }

    @GetMapping("/{ticketId}/messages")
    public List<TicketMessage> messages(@PathVariable UUID ticketId) {
        return messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @PostMapping("/{ticketId}/messages")
    public TicketMessage addMessage(@PathVariable UUID ticketId, @RequestBody AddMessageRequest request) {
        return ticketService.addMessage(ticketId, request.senderUserId(), request.senderType(),
                request.message(), request.attachmentPath());
    }

    @PatchMapping("/{ticketId}/status")
    @PreAuthorize("hasPermission(null, 'TICKET_MANAGE')")
    public void changeStatus(@PathVariable UUID ticketId, @RequestParam SupportTicket.Status status,
                              @RequestParam UUID changedBy) {
        ticketService.changeStatus(ticketId, status, changedBy);
    }
}
