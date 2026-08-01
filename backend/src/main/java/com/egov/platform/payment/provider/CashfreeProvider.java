package com.egov.platform.payment.provider;

import com.egov.platform.payment.PaymentGatewayConfig;
import com.egov.platform.payment.PaymentGatewayConfigRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Cashfree Order API integration (see SRS section 4.2).
 *
 * NOTE: this has NOT been exercised against a live Cashfree sandbox from this
 * environment (no network egress to api.cashfree.com here) - treat the HTTP
 * call shapes below as a correct-per-docs starting point to verify against
 * Cashfree's current API reference before go-live, not as pre-tested code.
 * The webhook signature verification logic (HMAC-SHA256 over timestamp+payload,
 * base64-compared) follows Cashfree's documented scheme and is the one piece
 * you should NOT skip testing thoroughly, since it's what stops a forged
 * "payment success" callback from being trusted (SRS FR-6.5).
 */
@Component
public class CashfreeProvider implements PaymentGatewayProvider {

    private static final String BASE_URL = "https://api.cashfree.com/pg";
    private static final String API_VERSION = "2023-08-01";

    private final PaymentGatewayConfigRepository configRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public CashfreeProvider(PaymentGatewayConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    @Override
    public String gatewayCode() {
        return "CASHFREE";
    }

    @Override
    public OrderCreateResult createOrder(UUID challanId, BigDecimal amount, String customerName, String customerPhone) {
        PaymentGatewayConfig config = resolveConfig(null);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-client-id", config.getClientId());
        headers.set("x-client-secret", config.getClientSecret());
        headers.set("x-api-version", API_VERSION);

        Map<String, Object> body = Map.of(
                "order_id", "CHLN-" + challanId,
                "order_amount", amount,
                "order_currency", "INR",
                "customer_details", Map.of(
                        "customer_id", "citizen-" + challanId,
                        "customer_name", customerName,
                        "customer_phone", customerPhone
                )
        );

        var response = restTemplate.exchange(
                BASE_URL + "/orders", HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);

        Map<?, ?> respBody = response.getBody();
        if (respBody == null) {
            throw new IllegalStateException("Empty response from Cashfree order create");
        }
        return new OrderCreateResult(
                String.valueOf(respBody.get("order_id")),
                String.valueOf(respBody.get("payment_session_id")));
    }

    @Override
    public boolean verifyWebhookSignature(String rawPayload, String signatureHeader, String timestampHeader, String webhookSecret) {
        try {
            String signedPayload = timestampHeader + rawPayload;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] computed = mac.doFinal(signedPayload.getBytes(StandardCharsets.UTF_8));
            String computedSignature = Base64.getEncoder().encodeToString(computed);
            return java.security.MessageDigest.isEqual(
                    computedSignature.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            // Fail closed: any error in verification means "not verified", never trust on exception.
            return false;
        }
    }

    @Override
    public String fetchOrderStatus(String gatewayOrderId) {
        PaymentGatewayConfig config = resolveConfig(null);

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-client-id", config.getClientId());
        headers.set("x-client-secret", config.getClientSecret());
        headers.set("x-api-version", API_VERSION);

        var response = restTemplate.exchange(
                BASE_URL + "/orders/" + gatewayOrderId, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
        Map<?, ?> body = response.getBody();
        return body == null ? "UNKNOWN" : String.valueOf(body.get("order_status"));
    }

    private PaymentGatewayConfig resolveConfig(UUID boardId) {
        if (boardId != null) {
            var boardConfig = configRepository.findByGatewayCodeAndBoardIdAndActiveTrue("CASHFREE", boardId);
            if (boardConfig.isPresent()) return boardConfig.get();
        }
        return configRepository.findByGatewayCodeAndBoardIdIsNullAndActiveTrue("CASHFREE")
                .orElseThrow(() -> new NoSuchElementException("No active Cashfree config found"));
    }
}
