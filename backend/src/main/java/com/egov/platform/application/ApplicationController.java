package com.egov.platform.application;

import com.egov.platform.application.dto.CreateApplicationRequest;
import com.egov.platform.application.dto.UpdateDraftRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Covers the application lifecycle described in SRS section 3.5: a citizen
 * can save a partial application as DRAFT (no strict validation), resume it,
 * and only formally SUBMIT it when ready.
 *
 * Submission is handled exclusively by WorkflowController POST /workflow/submit
 * to avoid duplicate WorkflowInstance creation from a second call path.
 */
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationRepository applicationRepository;
    private final ApplicationDocumentRepository documentRepository;
    private final ApplicationStageHistoryRepository historyRepository;
    private final ApplicationWorkflowInstanceRepository instanceRepository;

    public ApplicationController(ApplicationRepository applicationRepository,
                                  ApplicationDocumentRepository documentRepository,
                                  ApplicationStageHistoryRepository historyRepository,
                                  ApplicationWorkflowInstanceRepository instanceRepository) {
        this.applicationRepository = applicationRepository;
        this.documentRepository = documentRepository;
        this.historyRepository = historyRepository;
        this.instanceRepository = instanceRepository;
    }

    @GetMapping
    public List<Application> list(@RequestParam(required = false) UUID serviceId,
                                   @RequestParam(required = false) UUID applicantUserId) {
        if (serviceId != null) return applicationRepository.findByServiceId(serviceId);
        if (applicantUserId != null) return applicationRepository.findByApplicantUserId(applicantUserId);
        return applicationRepository.findAll();
    }

    @GetMapping("/{id}")
    public Application get(@PathVariable UUID id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + id));
    }

    @GetMapping("/{id}/documents")
    public List<ApplicationDocument> documents(@PathVariable UUID id) {
        return documentRepository.findByApplicationId(id);
    }

    /** Full stage-wise audit trail — the same data the notesheet is built from (SRS 3.9). */
    @GetMapping("/{id}/history")
    public List<ApplicationStageHistory> history(@PathVariable UUID id) {
        return historyRepository.findByApplicationIdOrderByActedAtAsc(id);
    }

    @GetMapping("/{id}/workflow-instance")
    public ApplicationWorkflowInstance workflowInstance(@PathVariable UUID id) {
        return instanceRepository.findByApplicationId(id)
                .orElseThrow(() -> new NoSuchElementException("No workflow instance for application " + id));
    }

    /** Citizen starts a new application — saved as DRAFT immediately (SRS FR-5.1). */
    @PostMapping("/draft")
    @ResponseStatus(HttpStatus.CREATED)
    public Application createDraft(@Valid @RequestBody CreateApplicationRequest request) {
        Application application = new Application();
        application.setServiceId(request.serviceId());
        application.setApplicantUserId(request.applicantUserId());
        application.setFormData(request.formData());
        application.setStatus(Application.Status.DRAFT);
        return applicationRepository.save(application);
    }

    /** Citizen updates their draft as they keep filling the form (SRS FR-5.2). */
    @PutMapping("/{id}/draft")
    public Application updateDraft(@PathVariable UUID id, @RequestBody UpdateDraftRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Application not found: " + id));
        if (application.getStatus() != Application.Status.DRAFT) {
            throw new IllegalStateException("Application " + id + " is no longer a draft");
        }
        application.setFormData(request.formData());
        application.setLastSavedAt(Instant.now());
        return applicationRepository.save(application);
    }

    // NOTE: Formal submission is at POST /api/applications/{id}/workflow/submit (WorkflowController).
    // That single endpoint is the only submit path, preventing duplicate WorkflowInstance creation.
}
