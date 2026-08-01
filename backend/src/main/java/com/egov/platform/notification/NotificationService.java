package com.egov.platform.notification;

import com.egov.platform.notification.provider.NotificationSender;
import com.egov.platform.rbac.AppUserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The one call every other module makes: NotificationService.trigger(eventCode, ...).
 * Whether an SMS/Email actually goes out is entirely config-driven (service +
 * event + channel on/off, per SRS section 3.7) - no module needs its own
 * notification branching.
 */
@Service
public class NotificationService {

    private final NotificationEventRepository eventRepository;
    private final NotificationConfigRepository configRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationLogRepository logRepository;
    private final AppUserRepository appUserRepository;
    private final List<NotificationSender> senders;

    public NotificationService(NotificationEventRepository eventRepository,
                                NotificationConfigRepository configRepository,
                                NotificationTemplateRepository templateRepository,
                                NotificationLogRepository logRepository,
                                AppUserRepository appUserRepository,
                                List<NotificationSender> senders) {
        this.eventRepository = eventRepository;
        this.configRepository = configRepository;
        this.templateRepository = templateRepository;
        this.logRepository = logRepository;
        this.appUserRepository = appUserRepository;
        this.senders = senders;
    }

    /**
     * Convenience overload used by every caller that already has an
     * applicantUserId (which is nearly all of them) - resolves mobile/email
     * from AppUser so callers don't each re-implement that lookup. If the
     * user can't be found, this is a no-op rather than a thrown exception -
     * a missing/deleted user shouldn't block the calling business operation
     * (e.g. a workflow forward) from completing.
     */
    public void triggerForUser(String eventCode, UUID applicationId, UUID serviceId, UUID applicantUserId,
                               Map<String, String> placeholders) {
        appUserRepository.findById(applicantUserId).ifPresent(user ->
                trigger(eventCode, applicationId, serviceId, Recipient.of(user.getMobile(), user.getEmail()), placeholders));
    }

    /**
     * @param eventCode      e.g. "APPLICATION_SUBMITTED", "CHALLAN_GENERATED", "SLA_BREACHED"
     * @param applicationId  nullable (e.g. for non-application events)
     * @param serviceId      used to look up a service-specific config override; null falls back to global
     * @param recipient      carries both mobile and email - each enabled channel picks the one it needs
     * @param placeholders   values substituted into the template's {{placeholder}} tokens
     */
    public void trigger(String eventCode, UUID applicationId, UUID serviceId, Recipient recipient,
                         Map<String, String> placeholders) {
        if (recipient == null) {
            return; // nowhere to send - e.g. applicant lookup failed; caller already handled that
        }
        NotificationEvent event = eventRepository.findByEventCode(eventCode).orElse(null);
        if (event == null) {
            return; // unknown event code - nothing configured, nothing to do
        }

        List<NotificationConfig> configs = serviceId != null
                ? configRepository.findByServiceIdAndEventId(serviceId, event.getId())
                : configRepository.findByServiceIdIsNullAndEventId(event.getId());
        if (configs.isEmpty()) {
            configs = configRepository.findByServiceIdIsNullAndEventId(event.getId());
        }

        for (NotificationConfig config : configs) {
            if (!config.isEnabled()) {
                continue;
            }
            String target = recipient.forChannel(config.getChannel());
            if (target == null || target.isBlank()) {
                continue; // e.g. no email on file - skip the EMAIL copy, don't fail the whole trigger
            }
            sendOne(event, config.getChannel(), target, applicationId, placeholders);
        }
    }

    private void sendOne(NotificationEvent event, NotificationConfig.Channel channel, String recipient,
                          UUID applicationId, Map<String, String> placeholders) {
        NotificationTemplate template = templateRepository
                .findByEventIdAndChannel(event.getId(), channel)
                .orElse(null);
        if (template == null) {
            return;
        }
        String body = render(template.getBodyTemplate(), placeholders);
        String subject = template.getSubject() != null ? render(template.getSubject(), placeholders) : null;

        NotificationSender sender = senders.stream()
                .filter(s -> s.channel().equalsIgnoreCase(channel.name()))
                .findFirst()
                .orElse(null);

        NotificationLog log = new NotificationLog();
        log.setApplicationId(applicationId);
        log.setEventId(event.getId());
        log.setChannel(channel);
        log.setRecipient(recipient);

        try {
            if (sender == null) {
                throw new IllegalStateException("No sender registered for channel " + channel);
            }
            sender.send(recipient, subject, body);
            log.setStatus(NotificationLog.Status.SENT);
        } catch (Exception e) {
            log.setStatus(NotificationLog.Status.FAILED);
            log.setProviderResponse(e.getMessage());
        }
        logRepository.save(log);
    }

    private String render(String template, Map<String, String> placeholders) {
        String result = template;
        for (var entry : placeholders.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }
}
