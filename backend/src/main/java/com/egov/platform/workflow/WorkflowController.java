package com.egov.platform.workflow;

import com.egov.platform.workflow.dto.ForwardRequest;
import com.egov.platform.workflow.dto.SendBackRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/applications/{applicationId}/workflow")
public class WorkflowController {

    private final WorkflowEngineService workflowEngineService;

    public WorkflowController(WorkflowEngineService workflowEngineService) {
        this.workflowEngineService = workflowEngineService;
    }

    @PostMapping("/submit")
    public ApplicationWorkflowInstanceView submit(@PathVariable UUID applicationId) {
        var instance = workflowEngineService.submit(applicationId);
        return new ApplicationWorkflowInstanceView(instance.getId(), instance.getCurrentStageId(), instance.getStatus().name());
    }

    @PostMapping("/forward")
    @PreAuthorize("hasPermission(null, 'WORKFLOW_ACT')")
    public void forward(@PathVariable UUID applicationId,
                        @Valid @RequestBody ForwardRequest request,
                        Authentication auth) {
        UUID actedBy = UUID.fromString(auth.getName());
        workflowEngineService.forward(applicationId, actedBy, request.chosenAssigneeUserId(), request.remarks());
    }

    @PostMapping("/send-back")
    @PreAuthorize("hasPermission(null, 'WORKFLOW_ACT')")
    public void sendBack(@PathVariable UUID applicationId,
                         @Valid @RequestBody SendBackRequest request,
                         Authentication auth) {
        UUID actedBy = UUID.fromString(auth.getName());
        workflowEngineService.sendBack(applicationId, actedBy, request.targetStageId(), request.remarks());
    }

    public record ApplicationWorkflowInstanceView(UUID instanceId, UUID currentStageId, String status) {}
}
