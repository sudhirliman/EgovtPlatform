package com.egov.platform.workflow;

import com.egov.platform.rbac.AppUser;
import com.egov.platform.workflow.dto.CreateStageRequest;
import com.egov.platform.workflow.dto.CreateWorkflowRequest;
import com.egov.platform.workflow.dto.ReorderStagesRequest;
import com.egov.platform.workflow.dto.WorkflowResponse;
import com.egov.platform.workflow.dto.WorkflowStageResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Superadmin-facing workflow BUILDER endpoints (create workflow, add/edit/
 * delete/reorder stages, assign eligible roles per stage).
 */
@RestController
@RequestMapping("/api/workflows")
public class WorkflowConfigController {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStageRepository stageRepository;
    private final WorkflowStageRoleRepository stageRoleRepository;
    private final WorkflowEngineService workflowEngineService;

    public WorkflowConfigController(WorkflowRepository workflowRepository, WorkflowStageRepository stageRepository,
                                     WorkflowStageRoleRepository stageRoleRepository,
                                     WorkflowEngineService workflowEngineService) {
        this.workflowRepository = workflowRepository;
        this.stageRepository = stageRepository;
        this.stageRoleRepository = stageRoleRepository;
        this.workflowEngineService = workflowEngineService;
    }

    /** Safe projection — never exposes passwordHash or other sensitive AppUser fields. */
    public record OfficerView(UUID id, String name, String username) {
        static OfficerView from(AppUser u) {
            return new OfficerView(u.getId(), u.getName(), u.getUsername());
        }
    }

    @GetMapping
    public List<WorkflowResponse> list(@RequestParam(required = false) UUID serviceId) {
        List<Workflow> workflows = serviceId != null
                ? workflowRepository.findByServiceIdAndActiveTrue(serviceId).map(List::of).orElse(List.of())
                : workflowRepository.findAll();
        return workflows.stream().map(WorkflowResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'WORKFLOW_MANAGE')")
    public WorkflowResponse create(@Valid @RequestBody CreateWorkflowRequest request) {
        Workflow workflow = new Workflow();
        workflow.setServiceId(request.serviceId());
        return WorkflowResponse.from(workflowRepository.save(workflow));
    }

    @GetMapping("/{workflowId}/stages")
    public List<WorkflowStageResponse> stages(@PathVariable UUID workflowId) {
        return stageRepository.findByWorkflowIdOrderBySequenceOrderAsc(workflowId).stream()
                .map(WorkflowStageResponse::from).toList();
    }

    @PostMapping("/{workflowId}/stages")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'WORKFLOW_MANAGE')")
    public WorkflowStageResponse addStage(@PathVariable UUID workflowId,
                                           @Valid @RequestBody CreateStageRequest request) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new NoSuchElementException("Workflow not found: " + workflowId));

        WorkflowStage stage = new WorkflowStage();
        stage.setWorkflow(workflow);
        applyStage(stage, request);
        stage = stageRepository.save(stage);
        replaceEligibleRoles(stage.getId(), request.eligibleRoleIds());
        return WorkflowStageResponse.from(stage);
    }

    @PutMapping("/{workflowId}/stages/{stageId}")
    @PreAuthorize("hasPermission(null, 'WORKFLOW_MANAGE')")
    public WorkflowStageResponse updateStage(@PathVariable UUID workflowId, @PathVariable UUID stageId,
                                              @Valid @RequestBody CreateStageRequest request) {
        WorkflowStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new NoSuchElementException("Stage not found: " + stageId));
        applyStage(stage, request);
        stage = stageRepository.save(stage);
        replaceEligibleRoles(stage.getId(), request.eligibleRoleIds());
        return WorkflowStageResponse.from(stage);
    }

    @DeleteMapping("/{workflowId}/stages/{stageId}")
    @PreAuthorize("hasPermission(null, 'WORKFLOW_MANAGE')")
    public ResponseEntity<Void> deleteStage(@PathVariable UUID workflowId, @PathVariable UUID stageId) {
        stageRoleRepository.deleteByStageId(stageId);
        stageRepository.deleteById(stageId);
        return ResponseEntity.noContent().build();
    }

    /** Bulk reorder — pass the stage ids in the new desired sequence; sequenceOrder is reassigned 1..N. */
    @PatchMapping("/{workflowId}/stages/reorder")
    @PreAuthorize("hasPermission(null, 'WORKFLOW_MANAGE')")
    @Transactional
    public List<WorkflowStageResponse> reorderStages(@PathVariable UUID workflowId,
                                                      @RequestBody ReorderStagesRequest request) {
        List<WorkflowStage> updated = new ArrayList<>();
        int order = 1;
        for (UUID id : request.orderedStageIds()) {
            WorkflowStage stage = stageRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("Stage not found: " + id));
            stage.setSequenceOrder(order++);
            updated.add(stage);
        }
        return stageRepository.saveAll(updated).stream().map(WorkflowStageResponse::from).toList();
    }

    @GetMapping("/{workflowId}/stages/{stageId}/roles")
    public List<UUID> stageRoles(@PathVariable UUID workflowId, @PathVariable UUID stageId) {
        return stageRoleRepository.findByStageId(stageId).stream().map(WorkflowStageRole::getRoleId).toList();
    }

    @GetMapping("/{workflowId}/stages/{stageId}/eligible-officers")
    public List<OfficerView> eligibleOfficers(@PathVariable UUID workflowId, @PathVariable UUID stageId) {
        return workflowEngineService.eligibleOfficersFor(stageId).stream()
                .map(OfficerView::from)
                .toList();
    }

    private void applyStage(WorkflowStage stage, CreateStageRequest request) {
        stage.setSequenceOrder(request.sequenceOrder());
        stage.setStageName(request.stageName());
        stage.setStageType(request.stageType());
        stage.setSlaHours(request.slaHours());
        stage.setEscalationRoleId(request.escalationRoleId());
    }

    @Transactional
    private void replaceEligibleRoles(UUID stageId, List<UUID> roleIds) {
        stageRoleRepository.deleteByStageId(stageId);
        if (roleIds == null || roleIds.isEmpty()) return;
        List<WorkflowStageRole> roles = roleIds.stream().map(roleId -> {
            WorkflowStageRole r = new WorkflowStageRole();
            r.setStageId(stageId);
            r.setRoleId(roleId);
            return r;
        }).toList();
        stageRoleRepository.saveAll(roles);
    }
}
