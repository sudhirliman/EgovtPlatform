package com.egov.platform.workflow;

import com.egov.platform.application.ApplicationAction;
import com.egov.platform.application.DocumentVerification;
import com.egov.platform.payment.Challan;
import com.egov.platform.rbac.AppUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cfc")
@RequiredArgsConstructor
public class CfcWorkflowController {

    private final CfcWorkflowService svc;

    // ── Request record types ──────────────────────────────────────────

    record OutwardToEMRequest(
        @NotNull UUID selectedEmId,
        String remarks
    ) {}

    record RevertRequest(
        @NotBlank String remarks
    ) {}

    record ForwardToClerkRequest(
        @NotNull UUID selectedClerkId
    ) {}

    record VerifyDocumentRequest(
        @NotNull UUID documentId,
        @NotNull DocumentVerification.Action action,
        @NotBlank String remark
    ) {}

    record ApproveRequest(
        @NotBlank String remarks
    ) {}

    record GenerateChallanRequest(
        @NotNull @Positive BigDecimal amount,
        String purpose
    ) {}

    record UploadCertificateRequest(
        @NotBlank String filePath
    ) {}

    record RemarksRequest(
        String remarks
    ) {}

    // ── Queue ─────────────────────────────────────────────────────────

    /** Returns the application queue for the acting user based on their CFC role. */
    @GetMapping("/queue")
    public ResponseEntity<?> getQueue(Authentication auth) {
        UUID userId = uuid(auth);
        return ResponseEntity.ok(svc.getQueue(userId));
    }

    // ── IO endpoints ──────────────────────────────────────────────────

    @PostMapping("/applications/{id}/outward-to-em")
    public ResponseEntity<?> outwardToEM(@PathVariable UUID id,
                                         @Valid @RequestBody OutwardToEMRequest req,
                                         Authentication auth) {
        svc.outwardToEM(id, uuid(auth), req.selectedEmId(), req.remarks());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/revert-io")
    public ResponseEntity<?> revertByIO(@PathVariable UUID id,
                                        @Valid @RequestBody RevertRequest req,
                                        Authentication auth) {
        svc.revertByIO(id, uuid(auth), req.remarks());
        return ResponseEntity.ok().build();
    }

    // ── EM endpoints ──────────────────────────────────────────────────

    @PostMapping("/applications/{id}/forward-to-clerk")
    public ResponseEntity<?> forwardToClerk(@PathVariable UUID id,
                                            @Valid @RequestBody ForwardToClerkRequest req,
                                            Authentication auth) {
        svc.forwardToClerk(id, uuid(auth), req.selectedClerkId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/revert-em")
    public ResponseEntity<?> revertByEM(@PathVariable UUID id,
                                        @Valid @RequestBody RevertRequest req,
                                        Authentication auth) {
        svc.revertByEM(id, uuid(auth), req.remarks());
        return ResponseEntity.ok().build();
    }

    // ── Clerk endpoints ───────────────────────────────────────────────

    @PostMapping("/applications/{id}/verify-doc/clerk")
    public ResponseEntity<?> verifyDocByClerk(@PathVariable UUID id,
                                              @Valid @RequestBody VerifyDocumentRequest req,
                                              Authentication auth) {
        svc.verifyDocumentByClerk(id, uuid(auth), req.documentId(), req.action(), req.remark());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/approve-clerk")
    public ResponseEntity<?> approveByClerk(@PathVariable UUID id,
                                            @Valid @RequestBody ApproveRequest req,
                                            Authentication auth) {
        svc.approveByClerk(id, uuid(auth), req.remarks());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/revert-clerk")
    public ResponseEntity<?> revertByClerk(@PathVariable UUID id,
                                           @Valid @RequestBody RevertRequest req,
                                           Authentication auth) {
        svc.revertByClerk(id, uuid(auth), req.remarks());
        return ResponseEntity.ok().build();
    }

    // ── EM verification (step 6) ──────────────────────────────────────

    @PostMapping("/applications/{id}/verify-doc/em")
    public ResponseEntity<?> verifyDocByEM(@PathVariable UUID id,
                                           @Valid @RequestBody VerifyDocumentRequest req,
                                           Authentication auth) {
        svc.verifyDocumentByEM(id, uuid(auth), req.documentId(), req.action(), req.remark());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/approve-em")
    public ResponseEntity<?> approveByEM(@PathVariable UUID id,
                                         @Valid @RequestBody ApproveRequest req,
                                         Authentication auth) {
        svc.approveByEM(id, uuid(auth), req.remarks());
        return ResponseEntity.ok().build();
    }

    // ── Challan ───────────────────────────────────────────────────────

    @PostMapping("/applications/{id}/generate-challan")
    public ResponseEntity<Challan> generateChallan(@PathVariable UUID id,
                                                   @Valid @RequestBody GenerateChallanRequest req,
                                                   Authentication auth) {
        Challan challan = svc.generateChallan(id, uuid(auth), req.amount(), req.purpose());
        return ResponseEntity.ok(challan);
    }

    // ── Citizen payment (dummy) ───────────────────────────────────────

    @PostMapping("/applications/{id}/payment")
    public ResponseEntity<?> recordPayment(@PathVariable UUID id, Authentication auth) {
        svc.recordPayment(id, uuid(auth));
        return ResponseEntity.ok().build();
    }

    // ── EM finalization flow ──────────────────────────────────────────

    @PostMapping("/applications/{id}/finalize")
    public ResponseEntity<?> finalize(@PathVariable UUID id,
                                      @RequestBody(required = false) RemarksRequest req,
                                      Authentication auth) {
        svc.finalize(id, uuid(auth), req != null ? req.remarks() : null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/upload-certificate")
    public ResponseEntity<?> uploadCertificate(@PathVariable UUID id,
                                               @Valid @RequestBody UploadCertificateRequest req,
                                               Authentication auth) {
        svc.uploadCertificate(id, uuid(auth), req.filePath());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/outward-certificate")
    public ResponseEntity<?> outwardCertificate(@PathVariable UUID id,
                                                @RequestBody(required = false) RemarksRequest req,
                                                Authentication auth) {
        svc.outwardCertificate(id, uuid(auth), req != null ? req.remarks() : null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/applications/{id}/dispatch")
    public ResponseEntity<?> dispatch(@PathVariable UUID id,
                                      @RequestBody(required = false) RemarksRequest req,
                                      Authentication auth) {
        svc.dispatch(id, uuid(auth), req != null ? req.remarks() : null);
        return ResponseEntity.ok().build();
    }

    // ── Audit / info ──────────────────────────────────────────────────

    @GetMapping("/applications/{id}/actions")
    public ResponseEntity<List<ApplicationAction>> getActions(@PathVariable UUID id) {
        return ResponseEntity.ok(svc.getActions(id));
    }

    @GetMapping("/applications/{id}/doc-verifications")
    public ResponseEntity<List<DocumentVerification>> getDocVerifications(@PathVariable UUID id) {
        return ResponseEntity.ok(svc.getDocumentVerifications(id));
    }

    // ── Officer lookup ────────────────────────────────────────────────

    /** Returns available Estate Managers for a given board + department. */
    @GetMapping("/officers/ems")
    public ResponseEntity<List<AppUser>> availableEMs(@RequestParam UUID boardId,
                                                      @RequestParam UUID deptId) {
        return ResponseEntity.ok(svc.getAvailableEMs(boardId, deptId));
    }

    /** Returns available Clerks for a given board + department. */
    @GetMapping("/officers/clerks")
    public ResponseEntity<List<AppUser>> availableClerks(@RequestParam UUID boardId,
                                                         @RequestParam UUID deptId) {
        return ResponseEntity.ok(svc.getAvailableClerks(boardId, deptId));
    }

    // ─────────────────────────────────────────────────────────────────

    private static UUID uuid(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
