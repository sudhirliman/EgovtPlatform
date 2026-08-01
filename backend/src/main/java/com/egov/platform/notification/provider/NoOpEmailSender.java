package com.egov.platform.notification.provider;

import org.springframework.stereotype.Component;

/** Placeholder - replace with a real SMTP/SendGrid integration before go-live. */
@Component
public class NoOpEmailSender implements NotificationSender {
    @Override
    public String channel() { return "EMAIL"; }

    @Override
    public void send(String recipient, String subject, String body) {
        System.out.printf("[Email stub] to=%s subject=%s body=%s%n", recipient, subject, body);
    }
}
