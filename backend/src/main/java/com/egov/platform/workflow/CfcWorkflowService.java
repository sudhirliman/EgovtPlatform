package com.egov.platform.workflow;

import com.egov.platform.application.*;
import com.egov.platform.hierarchy.ServiceMasterRepository;
import com.egov.platform.payment.Challan;
import com.egov.platform.payment.ChallanRepository;
import com.egov.platform.rbac.AppUser;
import com.egov.platform.rbac.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class CfcWorkflowService {

    private final ApplicationRepository          appRepo;
    private final ApplicationActionRepository    actionRepo;
    private final DocumentVerificationRepository docVerifRepo;
    private final ApplicationDocumentRepository  docRepo;
    private final UserRoleRepository             userRoleRepo;
    private final ServiceMasterRepository        serviceRepo;
    private final ChallanRepository              challanRepo;

    // ─────────────────────────────────────────────────────────────────
    //  IO ACTIONS
    // ─────────────────────────────────────────────────────────────────

    /** IO outwards a SUBMITTED application to the selected EM. */
    public void outwardToEM(UUID applicationId, UUID actedBy, UUID selectedEmId, String remarks) {
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.SUBMITTED);
        assertRoleAtBoard(actedBy, "IO", getBoardId(app));

        app.setAssignedIoId(actedBy);
        app.setAssignedEmId(selectedEmId);
        app.setCurrentAssigneeId(selectedEmId);
        transition(app, Application.Status.FORWARDED_TO_EM);
        record(applicationId, Application.Status.SUBMITTED, Application.Status.FORWARDED_TO_EM,
                "OUTWARD_TO_EM", actedBy, selectedEmId, remarks);
    }

    /** IO reverts a SUBMITTED application to the citizen (remarks mandatory). */
    public void revertByIO(UUID applicationId, UUID actedBy, String remarks) {
        requireRemarks(remarks);
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.SUBMITTED);
        assertRoleAtBoard(actedBy, "IO", getBoardId(app));

        app.setCurrentAssigneeId(app.getApplicantUserId());
        transition(app, Application.Status.REVERTEDBYIO);
        record(applicationId, Application.Status.SUBMITTED, Application.Status.REVERTEDBYIO,
                "REVERT_BY_IO", actedBy, null, remarks);
    }

    // ─────────────────────────────────────────────────────────────────
    //  EM ACTIONS
    // ─────────────────────────────────────────────────────────────────

    /** EM forwards a FORWARDED_TO_EM application to the selected Clerk. */
    public void forwardToClerk(UUID applicationId, UUID actedBy, UUID selectedClerkId) {
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.FORWARDED_TO_EM);
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));

        app.setAssignedClerkId(selectedClerkId);
        app.setCurrentAssigneeId(selectedClerkId);
        transition(app, Application.Status.FORWARDED_TO_CLERK);
        record(applicationId, Application.Status.FORWARDED_TO_EM, Application.Status.FORWARDED_TO_CLERK,
                "FORWARD_TO_CLERK", actedBy, selectedClerkId, null);
    }

    /**
     * EM reverts to citizen — valid from three statuses:
     * FORWARDED_TO_EM, REVERTED_BY_ASSISTANT_SENIOR_CLERK, APPROVED_BY_ASSISTANT_SENIOR_CLERK.
     */
    public void revertByEM(UUID applicationId, UUID actedBy, String remarks) {
        requireRemarks(remarks);
        Application app = getApp(applicationId);
        assertStatusIn(app, Set.of(
                Application.Status.FORWARDED_TO_EM,
                Application.Status.REVERTED_BY_ASSISTANT_SENIOR_CLERK,
                Application.Status.APPROVED_BY_ASSISTANT_SENIOR_CLERK));
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));

        Application.Status from = app.getStatus();
        app.setCurrentAssigneeId(app.getApplicantUserId());
        transition(app, Application.Status.REVERTEDBYEM);
        record(applicationId, from, Application.Status.REVERTEDBYEM,
                "REVERT_BY_EM", actedBy, null, remarks);
    }

    // ─────────────────────────────────────────────────────────────────
    //  CLERK ACTIONS
    // ─────────────────────────────────────────────────────────────────

    /** Clerk records per-document verification (upserts — re-verification is allowed). */
    public void verifyDocumentByClerk(UUID applicationId, UUID actedBy, UUID documentId,
                                      DocumentVerification.Action action, String remark) {
        requireRemarks(remark);
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.FORWARDED_TO_CLERK);
        assertAssignedClerk(app, actedBy);

        docVerifRepo.deleteByDocumentIdAndVerificationStage(documentId, DocumentVerification.Stage.CLERK);
        docVerifRepo.save(new DocumentVerification(applicationId, documentId,
                DocumentVerification.Stage.CLERK, action, actedBy, remark));
    }

    /** Clerk approves — all documents must be individually verified first. */
    public void approveByClerk(UUID applicationId, UUID actedBy, String remarks) {
        requireRemarks(remarks);
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.FORWARDED_TO_CLERK);
        assertAssignedClerk(app, actedBy);
        assertAllDocsVerified(applicationId, DocumentVerification.Stage.CLERK);

        app.setCurrentAssigneeId(app.getAssignedEmId());
        transition(app, Application.Status.APPROVED_BY_ASSISTANT_SENIOR_CLERK);
        record(applicationId, Application.Status.FORWARDED_TO_CLERK,
                Application.Status.APPROVED_BY_ASSISTANT_SENIOR_CLERK,
                "APPROVE_BY_CLERK", actedBy, null, remarks);
    }

    /** Clerk reverts — all documents must be individually verified first. */
    public void revertByClerk(UUID applicationId, UUID actedBy, String remarks) {
        requireRemarks(remarks);
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.FORWARDED_TO_CLERK);
        assertAssignedClerk(app, actedBy);
        assertAllDocsVerified(applicationId, DocumentVerification.Stage.CLERK);

        app.setCurrentAssigneeId(app.getAssignedEmId());
        transition(app, Application.Status.REVERTED_BY_ASSISTANT_SENIOR_CLERK);
        record(applicationId, Application.Status.FORWARDED_TO_CLERK,
                Application.Status.REVERTED_BY_ASSISTANT_SENIOR_CLERK,
                "REVERT_BY_CLERK", actedBy, null, remarks);
    }

    // ─────────────────────────────────────────────────────────────────
    //  EM VERIFICATION (step 6)
    // ─────────────────────────────────────────────────────────────────

    /** EM re-verifies each document after clerk approval. */
    public void verifyDocumentByEM(UUID applicationId, UUID actedBy, UUID documentId,
                                   DocumentVerification.Action action, String remark) {
        requireRemarks(remark);
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.APPROVED_BY_ASSISTANT_SENIOR_CLERK);
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));

        docVerifRepo.deleteByDocumentIdAndVerificationStage(documentId, DocumentVerification.Stage.EM);
        docVerifRepo.save(new DocumentVerification(applicationId, documentId,
                DocumentVerification.Stage.EM, action, actedBy, remark));
    }

    /** EM approves after verifying all documents. */
    public void approveByEM(UUID applicationId, UUID actedBy, String remarks) {
        requireRemarks(remarks);
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.APPROVED_BY_ASSISTANT_SENIOR_CLERK);
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));
        assertAllDocsVerified(applicationId, DocumentVerification.Stage.EM);

        transition(app, Application.Status.APPROVED_BY_EM);
        record(applicationId, Application.Status.APPROVED_BY_ASSISTANT_SENIOR_CLERK,
                Application.Status.APPROVED_BY_EM, "APPROVE_BY_EM", actedBy, null, remarks);
    }

    // ─────────────────────────────────────────────────────────────────
    //  CHALLAN
    // ─────────────────────────────────────────────────────────────────

    /** EM generates challan (APPROVED_BY_EM → CHALLAN_GENERATED). */
    public Challan generateChallan(UUID applicationId, UUID actedBy,
                                   BigDecimal amount, String purpose) {
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.APPROVED_BY_EM);
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));

        Challan challan = new Challan();
        challan.setApplicationId(applicationId);
        challan.setChallanNo("CHL-" + System.currentTimeMillis());
        challan.setAmount(amount);
        challan.setPurpose(purpose != null ? purpose : "Application fee");
        challan.setGeneratedByUserId(actedBy);
        challan.setStatus(Challan.Status.PENDING);
        challanRepo.save(challan);

        transition(app, Application.Status.CHALLAN_GENERATED);
        record(applicationId, Application.Status.APPROVED_BY_EM, Application.Status.CHALLAN_GENERATED,
                "GENERATE_CHALLAN", actedBy, null, "Challan: " + challan.getChallanNo());
        return challan;
    }

    // ─────────────────────────────────────────────────────────────────
    //  CITIZEN PAYMENT  (dummy)
    // ─────────────────────────────────────────────────────────────────

    /** Citizen pays the challan (CHALLAN_GENERATED → DEPTCHALLANRECIEPT). */
    public void recordPayment(UUID applicationId, UUID actedBy) {
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.CHALLAN_GENERATED);

        challanRepo.findFirstByApplicationIdAndStatusOrderByCreatedAtDesc(
                applicationId, Challan.Status.PENDING)
                .ifPresent(c -> {
                    c.setStatus(Challan.Status.PAID);
                    challanRepo.save(c);
                });

        app.setCurrentAssigneeId(app.getAssignedEmId());
        transition(app, Application.Status.DEPTCHALLANRECIEPT);
        record(applicationId, Application.Status.CHALLAN_GENERATED, Application.Status.DEPTCHALLANRECIEPT,
                "PAYMENT_RECORDED", actedBy, null, "Citizen payment completed");
    }

    // ─────────────────────────────────────────────────────────────────
    //  EM FINALIZATION FLOW
    // ─────────────────────────────────────────────────────────────────

    /** EM finalizes (DEPTCHALLANRECIEPT → CERTIFICATECREATED). */
    public void finalize(UUID applicationId, UUID actedBy, String remarks) {
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.DEPTCHALLANRECIEPT);
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));

        transition(app, Application.Status.CERTIFICATECREATED);
        record(applicationId, Application.Status.DEPTCHALLANRECIEPT, Application.Status.CERTIFICATECREATED,
                "FINALIZE", actedBy, null, remarks);
    }

    /** EM uploads the signed certificate file (CERTIFICATECREATED → CERTIFICATE_UPLOADED). */
    public void uploadCertificate(UUID applicationId, UUID actedBy, String filePath) {
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.CERTIFICATECREATED);
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));

        app.setCertificatePath(filePath);
        app.setCertificateUploadedAt(Instant.now());
        transition(app, Application.Status.CERTIFICATE_UPLOADED);
        record(applicationId, Application.Status.CERTIFICATECREATED, Application.Status.CERTIFICATE_UPLOADED,
                "UPLOAD_CERTIFICATE", actedBy, null, "File: " + filePath);
    }

    /** EM outwards the certificate (CERTIFICATE_UPLOADED → CFCCERTIFICATE). */
    public void outwardCertificate(UUID applicationId, UUID actedBy, String remarks) {
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.CERTIFICATE_UPLOADED);
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));

        transition(app, Application.Status.CFCCERTIFICATE);
        record(applicationId, Application.Status.CERTIFICATE_UPLOADED, Application.Status.CFCCERTIFICATE,
                "OUTWARD_CERTIFICATE", actedBy, null, remarks);
    }

    /** EM dispatches (CFCCERTIFICATE → DISPATCHED). */
    public void dispatch(UUID applicationId, UUID actedBy, String remarks) {
        Application app = getApp(applicationId);
        assertStatus(app, Application.Status.CFCCERTIFICATE);
        assertRoleAtDept(actedBy, "EM", getBoardId(app), getDeptId(app));

        transition(app, Application.Status.DISPATCHED);
        record(applicationId, Application.Status.CFCCERTIFICATE, Application.Status.DISPATCHED,
                "DISPATCH", actedBy, null, remarks);
    }

    // ─────────────────────────────────────────────────────────────────
    //  READ QUERIES
    // ─────────────────────────────────────────────────────────────────

    /**
     * Returns the acting user's work queue based on their CFC role(s).
     * SUPERADMIN sees everything (except DRAFT).
     */
    @Transactional(readOnly = true)
    public List<Application> getQueue(UUID userId) {
        if (userRoleRepo.existsByUserIdAndRoleName(userId, "SUPERADMIN")) {
            return appRepo.findAll().stream()
                    .filter(a -> a.getStatus() != Application.Status.DRAFT)
                    .sorted(Comparator.comparing(Application::getCreatedAt).reversed())
                    .collect(Collectors.toList());
        }

        List<Application> queue = new ArrayList<>();

        // IO: see SUBMITTED apps for their assigned board(s)
        List<UUID> ioBoardIds = userRoleRepo.findBoardIdsByUserIdAndRoleName(userId, "IO");
        if (!ioBoardIds.isEmpty()) {
            appRepo.findByStatus(Application.Status.SUBMITTED).stream()
                    .filter(a -> ioBoardIds.contains(getBoardIdSafe(a)))
                    .forEach(queue::add);
        }

        // EM: see apps in their statuses where they are the assigned EM
        List<Application.Status> emStatuses = List.of(
                Application.Status.FORWARDED_TO_EM,
                Application.Status.REVERTED_BY_ASSISTANT_SENIOR_CLERK,
                Application.Status.APPROVED_BY_ASSISTANT_SENIOR_CLERK,
                Application.Status.DEPTCHALLANRECIEPT,
                Application.Status.CERTIFICATECREATED,
                Application.Status.CERTIFICATE_UPLOADED,
                Application.Status.CFCCERTIFICATE);
        queue.addAll(appRepo.findByAssignedEmIdAndStatusIn(userId, emStatuses));

        // CLERK: see apps forwarded to them
        queue.addAll(appRepo.findByAssignedClerkIdAndStatus(userId, Application.Status.FORWARDED_TO_CLERK));

        return queue.stream()
                .distinct()
                .sorted(Comparator.comparing(Application::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppUser> getAvailableEMs(UUID boardId, UUID deptId) {
        return userRoleRepo.findUsersByRoleAndScope("EM", boardId, deptId);
    }

    @Transactional(readOnly = true)
    public List<AppUser> getAvailableClerks(UUID boardId, UUID deptId) {
        return userRoleRepo.findUsersByRoleAndScope("CLERK", boardId, deptId);
    }

    @Transactional(readOnly = true)
    public List<ApplicationAction> getActions(UUID applicationId) {
        return actionRepo.findByApplicationIdOrderByActedAtAsc(applicationId);
    }

    @Transactional(readOnly = true)
    public List<DocumentVerification> getDocumentVerifications(UUID applicationId) {
        return docVerifRepo.findByApplicationId(applicationId);
    }

    // ─────────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────

    private Application getApp(UUID id) {
        return appRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + id));
    }

    private void transition(Application app, Application.Status to) {
        app.setStatus(to);
        appRepo.save(app);
    }

    private void record(UUID appId, Application.Status from, Application.Status to,
                        String actionType, UUID actedBy, UUID assigneeId, String remarks) {
        actionRepo.save(new ApplicationAction(
                appId,
                from == null ? null : from.name(),
                to.name(),
                actionType, actedBy, assigneeId, remarks));
    }

    private void assertStatus(Application app, Application.Status expected) {
        if (app.getStatus() != expected) {
            throw new IllegalStateException(
                    "Expected status " + expected + " but application is " + app.getStatus());
        }
    }

    private void assertStatusIn(Application app, Set<Application.Status> allowed) {
        if (!allowed.contains(app.getStatus())) {
            throw new IllegalStateException(
                    "Status " + app.getStatus() + " is not valid for this action");
        }
    }

    private void assertRoleAtBoard(UUID userId, String roleName, UUID boardId) {
        if (userRoleRepo.existsByUserIdAndRoleName(userId, "SUPERADMIN")) return;
        if (!userRoleRepo.existsByUserIdAndRoleNameAndBoardId(userId, roleName, boardId)) {
            throw new IllegalStateException("User does not have role " + roleName + " for this board");
        }
    }

    private void assertRoleAtDept(UUID userId, String roleName, UUID boardId, UUID deptId) {
        if (userRoleRepo.existsByUserIdAndRoleName(userId, "SUPERADMIN")) return;
        if (!userRoleRepo.existsByUserIdAndRoleNameAndBoardIdAndDeptId(userId, roleName, boardId, deptId)) {
            throw new IllegalStateException("User does not have role " + roleName + " for this board/department");
        }
    }

    private void assertAssignedClerk(Application app, UUID userId) {
        if (userRoleRepo.existsByUserIdAndRoleName(userId, "SUPERADMIN")) return;
        if (!userId.equals(app.getAssignedClerkId())) {
            throw new IllegalStateException("You are not the assigned clerk for this application");
        }
    }

    private void assertAllDocsVerified(UUID applicationId, DocumentVerification.Stage stage) {
        List<ApplicationDocument> docs = docRepo.findByApplicationId(applicationId);
        if (docs.isEmpty()) return;
        Set<UUID> verifiedIds = docVerifRepo
                .findByApplicationIdAndVerificationStage(applicationId, stage)
                .stream().map(DocumentVerification::getDocumentId)
                .collect(Collectors.toSet());
        boolean allVerified = docs.stream().allMatch(d -> verifiedIds.contains(d.getId()));
        if (!allVerified) {
            throw new IllegalStateException("All documents must be individually verified before this action");
        }
    }

    private void requireRemarks(String remarks) {
        if (remarks == null || remarks.isBlank()) {
            throw new IllegalArgumentException("Remarks are mandatory for this action");
        }
    }

    private UUID getBoardId(Application app) {
        return serviceRepo.findBoardIdById(app.getServiceId())
                .orElseThrow(() -> new NoSuchElementException("Board not resolved for service " + app.getServiceId()));
    }

    private UUID getBoardIdSafe(Application app) {
        return serviceRepo.findBoardIdById(app.getServiceId()).orElse(null);
    }

    private UUID getDeptId(Application app) {
        return serviceRepo.findDepartmentIdById(app.getServiceId())
                .orElseThrow(() -> new NoSuchElementException("Department not resolved for service " + app.getServiceId()));
    }
}
