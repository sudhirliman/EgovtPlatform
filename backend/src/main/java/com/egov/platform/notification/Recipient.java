package com.egov.platform.notification;

/**
 * A single "who to notify" carrying both contact points - NotificationService
 * picks mobile for SMS and email for EMAIL automatically. Either can be null
 * (e.g. a user with no email on file just won't get the EMAIL-channel copy).
 */
public record Recipient(String mobile, String email) {

    public static Recipient of(String mobile, String email) {
        return new Recipient(mobile, email);
    }

    public String forChannel(NotificationConfig.Channel channel) {
        return channel == NotificationConfig.Channel.SMS ? mobile : email;
    }
}
