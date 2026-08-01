package com.egov.platform.notification.provider;

import org.springframework.stereotype.Component;

/** Placeholder - replace with a real SMS vendor integration (e.g. MSG91) before go-live. */
@Component
public class NoOpSmsSender implements NotificationSender {
    @Override
    public String channel() { return "SMS"; }

    @Override
    public void send(String recipient, String subject, String body) {
        System.out.printf("[SMS stub] to=%s body=%s%n", recipient, body);
    }
}
