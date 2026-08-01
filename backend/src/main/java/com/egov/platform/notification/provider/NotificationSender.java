package com.egov.platform.notification.provider;

/**
 * Abstraction over an SMS or Email vendor. Swap MSG91/Twilio/SendGrid/SMTP in
 * via a new implementation without touching NotificationService - SRS 4.3.
 */
public interface NotificationSender {
    String channel(); // "SMS" or "EMAIL"
    void send(String recipient, String subject, String body) throws Exception;
}
