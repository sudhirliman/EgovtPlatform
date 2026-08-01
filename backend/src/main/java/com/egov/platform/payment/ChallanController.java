package com.egov.platform.payment;

import com.egov.platform.payment.dto.GenerateChallanRequest;
import com.egov.platform.payment.dto.OfflinePaymentRequest;
import com.egov.platform.payment.dto.StartOnlinePaymentRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/challans")
public class ChallanController {

    private final ChallanService challanService;
    private final ChallanRepository challanRepository;

    public ChallanController(ChallanService challanService, ChallanRepository challanRepository) {
        this.challanService = challanService;
        this.challanRepository = challanRepository;
    }

    @GetMapping
    public List<Challan> list(@RequestParam UUID applicationId) {
        return challanRepository.findByApplicationId(applicationId);
    }

    @GetMapping("/application/{applicationId}/settled")
    public boolean allSettled(@PathVariable UUID applicationId) {
        return challanService.allChallansSettled(applicationId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'CHALLAN_GENERATE')")
    public Challan generate(@RequestBody GenerateChallanRequest request) {
        return challanService.generateChallan(request.applicationId(), request.amount(), request.purpose(),
                request.generatedByUserId(), request.generatedAtStageId(), request.parentChallanId());
    }

    @PostMapping("/{challanId}/pay/online")
    public ChallanService.PaymentGatewayProviderResult startOnline(@PathVariable UUID challanId,
                                                                    @RequestBody StartOnlinePaymentRequest request) {
        return challanService.startOnlinePayment(challanId, request.customerName(), request.customerPhone());
    }

    @PostMapping("/{challanId}/pay/offline")
    public PaymentTransaction recordOffline(@PathVariable UUID challanId, @RequestBody OfflinePaymentRequest request) {
        return challanService.recordOfflinePayment(challanId, request.bankName(), request.receiptNo(),
                request.depositDate(), request.proofDocumentPath());
    }

    @PostMapping("/payments/{transactionId}/verify")
    @PreAuthorize("hasPermission(null, 'PAYMENT_VERIFY_OFFLINE')")
    public void verifyOffline(@PathVariable UUID transactionId, @RequestParam UUID verifiedByUserId,
                              @RequestParam boolean approve) {
        challanService.verifyOfflinePayment(transactionId, verifiedByUserId, approve);
    }
}
