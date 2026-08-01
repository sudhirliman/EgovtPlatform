package com.egov.platform.workflow;

import com.egov.platform.application.*;
import com.egov.platform.certificate.NotesheetService;
import com.egov.platform.notification.NotificationService;
import com.egov.platform.rbac.AppUser;
import com.egov.platform.rbac.UserRole;
import com.egov.platform.rbac.UserRoleRepository;
import com.egov.platform.sla.BusinessDateCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Generic workflow engine. Contains NO service-specific branching - every
 * service's workflow is just a configured sequence of WorkflowStage rows, so
 * this same code drives a 2-stage workflow, a 5-stage workflow, or one with
 * extra scrutiny rounds inserted via send-back, without modification.
 */
@Service
public class WorkflowEngineService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStageRepository stageRepository;
    private final WorkflowStageRoleRepository stageRoleRepository;
    private final UserRoleRepository userRoleRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationWorkflowInstanceRepository instanceRepository;
    private final ApplicationStageHistoryRepository historyRepository;
    private final ApplicationAssignmentRepository assignmentRepository;
    private final BusinessDateCalculator businessDateCalculator;
    private final NotificationService notificationService;
    private final NotesheetService notesheetService;

    public WorkflowEngineService(WorkflowRepository workflowRepository,
                                  WorkflowStageRepository stageRepository,
                                  WorkflowStageRoleRepository stageRoleRepository,
                                  UserRoleRepository userRoleRepository,
                                  ApplicationRepository applicationRepository,
                                  ApplicationWorkflowInstanceRepository instanceRepository,
                                  ApplicationStageHistoryRepository historyRepository,
                                  ApplicationAssignmentRepository assignmentRepository,
                                  BusinessDateCalculator businessDateCalculator,
                                  NotificationService notificationService,
                                  NotesheetService notesheetService) {
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.stageRoleRepository = stageRoleRepository;
        this.userRoleRepository = userRoleRepository;
        this.applicationRepository = applicationRepository;
        this.instanceRepository = instanceRepository;
        this.historyRepository = historyRepository;
        this.assignmentRepository = assignmentRepository;
        this.businessDateCalculator = businessDateCalculator;
        this.notificationService = notificationService;
        this.notesheetService = notesheetService;
    }

    /** Called when a citizen formally submits (not drafts) an application. */
    @Transactional
    public ApplicationWorkflowInstance submit(UUID applicationId) {
        // Guard against double-submission creating a second workflow instance
        if (instanceRepository.findByApplicationId(applicationId).isPresent()) {
            throw new IllegalStateException("Application " + applicationId + " has already been submitted");
        }

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + applicationId));

        Workflow workflow = workflowRepository.findByServiceIdAndActiveTrue(application.getServiceId())
                .orElseThrow(() -> new IllegalStateException(
                        "No active workflow configured for service " + application.getServiceId()));

        List<WorkflowStage> stages = stageRepository.findByWorkflowIdOrderBySequenceOrderAsc(workflow.getId());
        if (stages.isEmpty()) {
            throw new IllegalStateException("Workflow " + workflow.getId() + " has no stages configured");
        }
        WorkflowStage firstStage = stages.get(0);

        application.setStatus(Application.Status.SUBMITTED);
        application.setSubmittedAt(java.time.Instant.now());
        applicationRepository.save(application);

        ApplicationWorkflowInstance instance = new ApplicationWorkflowInstance();
        instance.setApplicationId(applicationId);
        instance.setCurrentStageId(firstStage.getId());
        instance = instanceRepository.save(instance);

        recordEntry(applicationId, firstStage, null);

        notificationService.triggerForUser("APPLICATION_SUBMITTED", applicationId, application.getServiceId(),
                application.getApplicantUserId(), Map.of(
                        "application_no", nullToEmpty(application.getApplicationNo()),
                        "stage_name", firstStage.getStageName()));

        return instance;
    }

    /** The dropdown of eligible officers for a stage — all users holding any role marked eligible for it. */
    public List<AppUser> eligibleOfficersFor(UUID stageId) {
        List<UUID> roleIds = stageRoleRepository.findByStageId(stageId).stream()
                .map(WorkflowStageRole::getRoleId).toList();
        return roleIds.stream()
                .flatMap(roleId -> userRoleRepository.findByRoleId(roleId).stream())
                .map(UserRole::getUser)
                .distinct()
                .toList();
    }

    /** Officer forwards the application: to a specific chosen person, at the next configured stage. */
    @Transactional
    public void forward(UUID applicationId, UUID actedBy, UUID chosenAssigneeUserId, String remarks) {
        ApplicationWorkflowInstance instance = instanceRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new NoSuchElementException("No workflow instance for application " + applicationId));
        WorkflowStage currentStage = stageRepository.findById(instance.getCurrentStageId())
                .orElseThrow(() -> new NoSuchElementException("Stage not found"));
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + applicationId));

        closeCurrentHistory(applicationId, currentStage.getId(), ApplicationStageHistory.Action.FORWARDED, actedBy, remarks);

        List<WorkflowStage> stages = stageRepository.findByWorkflowIdOrderBySequenceOrderAsc(currentStage.getWorkflow().getId());

        // Find the current stage by id (not by sequenceOrder offset, which was fragile).
        UUID currentStageId = currentStage.getId();
        int currentIdx = -1;
        for (int i = 0; i < stages.size(); i++) {
            if (stages.get(i).getId().equals(currentStageId)) {
                currentIdx = i;
                break;
            }
        }
        if (currentIdx == -1) {
            throw new IllegalStateException("Current stage " + currentStageId + " not found in workflow stage list");
        }

        if (currentIdx + 1 >= stages.size()) {
            // No next stage — application is complete
            instance.setStatus(ApplicationWorkflowInstance.Status.COMPLETED);
            instanceRepository.save(instance);
            application.setStatus(Application.Status.APPROVED);
            applicationRepository.save(application);
            notificationService.triggerForUser("DISPATCHED", applicationId, application.getServiceId(),
                    application.getApplicantUserId(), Map.of("application_no", nullToEmpty(application.getApplicationNo())));
            return;
        }

        WorkflowStage nextStage = stages.get(currentIdx + 1);
        instance.setCurrentStageId(nextStage.getId());
        instanceRepository.save(instance);

        if (nextStage.getStageType() == WorkflowStage.StageType.DISPATCH) {
            application.setStatus(Application.Status.DISPATCHED);
        } else {
            application.setStatus(Application.Status.IN_PROGRESS);
        }
        applicationRepository.save(application);

        if (chosenAssigneeUserId != null) {
            ApplicationAssignment assignment = new ApplicationAssignment();
            assignment.setApplicationId(applicationId);
            assignment.setStageId(nextStage.getId());
            assignment.setAssignedToUserId(chosenAssigneeUserId);
            assignment.setAssignedBy(actedBy);
            assignmentRepository.save(assignment);
        }

        recordEntry(applicationId, nextStage, null);

        // Trigger stage-type-specific side effects and choose the notification event.
        String eventCode = switch (nextStage.getStageType()) {
            case CERTIFICATE_GENERATION -> "CERTIFICATE_READY";
            case DISPATCH -> "DISPATCHED";
            case NOTESHEET_GENERATION -> {
                notesheetService.generate(applicationId);
                yield "NOTESHEET_GENERATED";
            }
            default -> "SCRUTINY_STAGE_CHANGED";
        };

        notificationService.triggerForUser(eventCode, applicationId, application.getServiceId(),
                application.getApplicantUserId(), Map.of(
                        "application_no", nullToEmpty(application.getApplicationNo()),
                        "stage_name", nextStage.getStageName()));
    }

    /** Officer sends the application back to a previous stage for re-scrutiny (handles 2nd/3rd rounds). */
    @Transactional
    public void sendBack(UUID applicationId, UUID actedBy, UUID targetStageId, String remarks) {
        ApplicationWorkflowInstance instance = instanceRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new NoSuchElementException("No workflow instance for application " + applicationId));
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + applicationId));

        // Load current stage to obtain the workflow context for cross-workflow validation below.
        WorkflowStage currentStage = stageRepository.findById(instance.getCurrentStageId())
                .orElseThrow(() -> new NoSuchElementException("Current stage not found: " + instance.getCurrentStageId()));

        WorkflowStage targetStage = stageRepository.findById(targetStageId)
                .orElseThrow(() -> new NoSuchElementException("Stage not found: " + targetStageId));

        // Prevent moving an application into a stage that belongs to a different workflow.
        if (!targetStage.getWorkflow().getId().equals(currentStage.getWorkflow().getId())) {
            throw new IllegalArgumentException(
                    "Target stage " + targetStageId + " does not belong to this application's workflow");
        }

        closeCurrentHistory(applicationId, instance.getCurrentStageId(), ApplicationStageHistory.Action.SENT_BACK, actedBy, remarks);

        instance.setCurrentStageId(targetStage.getId());
        instanceRepository.save(instance);

        recordEntry(applicationId, targetStage, null);

        notificationService.triggerForUser("SEND_BACK", applicationId, application.getServiceId(),
                application.getApplicantUserId(), Map.of(
                        "application_no", nullToEmpty(application.getApplicationNo()),
                        "stage_name", targetStage.getStageName(),
                        "remarks", nullToEmpty(remarks)));
    }

    private void closeCurrentHistory(UUID applicationId, UUID stageId, ApplicationStageHistory.Action action,
                                      UUID actedBy, String remarks) {
        ApplicationStageHistory entry = new ApplicationStageHistory();
        entry.setApplicationId(applicationId);
        entry.setStageId(stageId);
        entry.setAction(action);
        entry.setActedBy(actedBy);
        entry.setRemarks(remarks);
        historyRepository.save(entry);
    }

    private void recordEntry(UUID applicationId, WorkflowStage stage, UUID boardIdForSlaCalc) {
        ApplicationStageHistory entry = new ApplicationStageHistory();
        entry.setApplicationId(applicationId);
        entry.setStageId(stage.getId());
        entry.setAction(ApplicationStageHistory.Action.ENTERED);
        if (stage.getSlaHours() != null) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime due = businessDateCalculator.addWorkingHours(now, stage.getSlaHours(), boardIdForSlaCalc, null);
            entry.setDueAt(due.atZone(ZoneId.systemDefault()).toInstant());
        }
        historyRepository.save(entry);
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
