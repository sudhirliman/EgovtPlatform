package com.egov.platform.payment;

import com.egov.platform.payment.provider.CashfreeProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Cashfree calls this URL on payment completion. Per SRS FR-6.5, this is the
 * source of truth for payment status - not the browser return URL - and the
 * signature MUST be verified before any status is applied.
 */
@RestController
@RequestMapping("/api/payments/cashfree")
public class CashfreeWebhookController {

    private final CashfreeProvider cashfreeProvider;
    private final ChallanService challanService;
    private final PaymentGatewayConfigRepository configRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CashfreeWebhookController(CashfreeProvider cashfreeProvider, ChallanService challanService,
                                      PaymentGatewayConfigRepository configRepository) {
        this.cashfreeProvider = cashfreeProvider;
        this.challanService = challanService;
        this.configRepository = configRepository;
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String rawPayload,
            @RequestHeader("x-webhook-signature") String signature,
            @RequestHeader("x-webhook-timestamp") String timestamp) throws Exception {

        String webhookSecret = configRepository.findByGatewayCodeAndBoardIdIsNullAndActiveTrue("CASHFREE")
                .map(PaymentGatewayConfig::getWebhookSecret)
                .orElseThrow(() -> new IllegalStateException("No Cashfree config with webhook secret"));

        boolean valid = cashfreeProvider.verifyWebhookSignature(rawPayload, signature, timestamp, webhookSecret);
        if (!valid) {
            // Do NOT process an unverified payload - respond 400 and stop.
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("invalid signature");
        }

        // Minimal parse - this covers Cashfree's documented webhook shape, but
        // re-check field names/nesting against the live API version before go-live.
        Map<?, ?> payload = objectMapper.readValue(rawPayload, Map.class);
        Map<?, ?> data = (Map<?, ?>) payload.get("data");
        Map<?, ?> order = (Map<?, ?>) data.get("order");
        String gatewayOrderId = String.valueOf(order.get("order_id"));
        String eventType = String.valueOf(payload.get("type"));

        boolean success = eventType.contains("SUCCESS");
        challanService.applyOnlinePaymentResult(gatewayOrderId, success);

        return ResponseEntity.ok("ok");
    }
}
