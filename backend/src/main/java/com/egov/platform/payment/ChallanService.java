package com.egov.platform.payment;

import com.egov.platform.application.Application;
import com.egov.platform.application.ApplicationRepository;
import com.egov.platform.notification.NotificationService;
import com.egov.platform.payment.provider.CashfreeProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Implements SRS FR-6.3 / FR-6.4 / FR-6.6: an application can accumulate
 * multiple challans over its lifetime, and cannot proceed past a
 * PAYMENT_CHECK workflow stage until every one of them is PAID or CANCELLED -
 * regardless of how many there are or when they were generated.
 */
@Service
public class ChallanService {

    private final ChallanRepository challanRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final ApplicationRepository applicationRepository;
    private final CashfreeProvider cashfreeProvider;
    private final NotificationService notificationService;

    public ChallanService(ChallanRepository challanRepository,
                           PaymentTransactionRepository transactionRepository,
                           ApplicationRepository applicationRepository,
                           CashfreeProvider cashfreeProvider,
                           NotificationService notificationService) {
        this.challanRepository = challanRepository;
        this.transactionRepository = transactionRepository;
        this.applicationRepository = applicationRepository;
        this.cashfreeProvider = cashfreeProvider;
        this.notificationService = notificationService;
    }

    /** The gate used by the workflow engine's PAYMENT_CHECK stage type. */
    public boolean allChallansSettled(UUID applicationId) {
        List<Challan> challans = challanRepository.findByApplicationId(applicationId);
        return challans.stream().allMatch(c ->
                c.getStatus() == Challan.Status.PAID || c.getStatus() == Challan.Status.CANCELLED);
    }

    @Transactional
    public Challan generateChallan(UUID applicationId, java.math.BigDecimal amount, String purpose,
                                    UUID generatedByUserId, UUID generatedAtStageId, UUID parentChallanId) {
        Challan challan = new Challan();
        challan.setApplicationId(applicationId);
        challan.setChallanNo("CH-" + System.currentTimeMillis());
        challan.setAmount(amount);
        challan.setPurpose(purpose);
        challan.setGeneratedByUserId(generatedByUserId);
        challan.setGeneratedAtStageId(generatedAtStageId);
        challan.setParentChallanId(parentChallanId);
        challan = challanRepository.save(challan);

        notifyApplicant("CHALLAN_GENERATED", applicationId, Map.of(
                "challan_no", challan.getChallanNo(),
                "amount", String.valueOf(amount),
                "purpose", purpose == null ? "" : purpose));

        return challan;
    }

    /** Citizen initiates online payment for a challan. */
    @Transactional
    public PaymentGatewayProviderResult startOnlinePayment(UUID challanId, String customerName, String customerPhone) {
        Challan challan = challanRepository.findById(challanId)
                .orElseThrow(() -> new NoSuchElementException("Challan not found: " + challanId));

        var order = cashfreeProvider.createOrder(challan.getId(), challan.getAmount(), customerName, customerPhone);

        PaymentTransaction txn = new PaymentTransaction();
        txn.setChallanId(challanId);
        txn.setPaymentMode(PaymentTransaction.Mode.ONLINE);
        txn.setGatewayCode(cashfreeProvider.gatewayCode());
        txn.setGatewayOrderId(order.gatewayOrderId());
        txn.setStatus(PaymentTransaction.Status.PENDING);
        transactionRepository.save(txn);

        return new PaymentGatewayProviderResult(order.gatewayOrderId(), order.paymentSessionId());
    }

    /**
     * Webhook entry point. MUST be called only after the caller (a
     * @RestController) has already verified the signature via
     * cashfreeProvider.verifyWebhookSignature(...) - this method assumes that
     * has already happened and only applies the resulting status. Also
     * idempotent: re-processing the same SUCCESS webhook twice is a no-op.
     */
    @Transactional
    public void applyOnlinePaymentResult(String gatewayOrderId, boolean success) {
        PaymentTransaction txn = transactionRepository.findByGatewayOrderId(gatewayOrderId)
                .orElseThrow(() -> new NoSuchElementException("No transaction for order " + gatewayOrderId));
        if (txn.getStatus() == PaymentTransaction.Status.SUCCESS) {
            return; // idempotent - already processed
        }
        txn.setStatus(success ? PaymentTransaction.Status.SUCCESS : PaymentTransaction.Status.FAILED);
        transactionRepository.save(txn);

        if (success) {
            Challan challan = challanRepository.findById(txn.getChallanId()).orElseThrow();
            challan.setStatus(Challan.Status.PAID);
            challanRepository.save(challan);
            notifyApplicant("PAYMENT_RECEIVED", challan.getApplicationId(), Map.of(
                    "challan_no", challan.getChallanNo(), "amount", String.valueOf(challan.getAmount())));
        }
    }

    /** Citizen records an offline (bank/treasury) payment - stays PENDING until an officer verifies it. */
    @Transactional
    public PaymentTransaction recordOfflinePayment(UUID challanId, String bankName, String receiptNo,
                                                    java.time.LocalDate depositDate, String proofDocumentPath) {
        PaymentTransaction txn = new PaymentTransaction();
        txn.setChallanId(challanId);
        txn.setPaymentMode(PaymentTransaction.Mode.OFFLINE);
        txn.setBankName(bankName);
        txn.setOfflineReceiptNo(receiptNo);
        txn.setDepositDate(depositDate);
        txn.setProofDocumentPath(proofDocumentPath);
        txn.setStatus(PaymentTransaction.Status.PENDING);
        return transactionRepository.save(txn);
    }

    /** Accountant/verifier approves (or rejects) an offline payment - see SRS FR-6.6. */
    @Transactional
    public void verifyOfflinePayment(UUID transactionId, UUID verifiedByUserId, boolean approve) {
        PaymentTransaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new NoSuchElementException("Transaction not found: " + transactionId));
        txn.setVerifiedByUserId(verifiedByUserId);
        txn.setVerifiedAt(Instant.now());
        txn.setStatus(approve ? PaymentTransaction.Status.SUCCESS : PaymentTransaction.Status.FAILED);
        transactionRepository.save(txn);

        if (approve) {
            Challan challan = challanRepository.findById(txn.getChallanId()).orElseThrow();
            challan.setStatus(Challan.Status.PAID);
            challanRepository.save(challan);
            notifyApplicant("PAYMENT_RECEIVED", challan.getApplicationId(), Map.of(
                    "challan_no", challan.getChallanNo(), "amount", String.valueOf(challan.getAmount())));
        }
    }

    private void notifyApplicant(String eventCode, UUID applicationId, Map<String, String> placeholders) {
        applicationRepository.findById(applicationId).ifPresent((Application app) ->
                notificationService.triggerForUser(eventCode, applicationId, app.getServiceId(),
                        app.getApplicantUserId(), placeholders));
    }

    public record PaymentGatewayProviderResult(String gatewayOrderId, String paymentSessionId) {}
}
