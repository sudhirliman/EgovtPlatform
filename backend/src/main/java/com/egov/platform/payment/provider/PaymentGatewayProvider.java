package com.egov.platform.payment.provider;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Abstraction over any online payment gateway. Add a new implementation
 * (RazorpayProvider, PayUProvider, ...) to support another gateway without
 * touching ChallanPaymentService or any calling code - see SRS section 4.2.
 */
public interface PaymentGatewayProvider {

    String gatewayCode();

    OrderCreateResult createOrder(UUID challanId, BigDecimal amount, String customerName, String customerPhone);

    /** Must verify the signature before returning true - never trust the payload alone. */
    boolean verifyWebhookSignature(String rawPayload, String signatureHeader, String timestampHeader, String webhookSecret);

    String fetchOrderStatus(String gatewayOrderId);

    record OrderCreateResult(String gatewayOrderId, String paymentSessionId) {}
}
