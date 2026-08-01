package com.egov.platform.helpdesk;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Every call here requires a reason and is checked against a global-scope
 * permission via HelpdeskService. The acting user id is extracted from the
 * JWT principal — never trusted from the request body.
 */
@RestController
@RequestMapping("/api/helpdesk/applications/{applicationId}")
public class HelpdeskController {

    private final HelpdeskService helpdeskService;

    public HelpdeskController(HelpdeskService helpdeskService) {
        this.helpdeskService = helpdeskService;
    }

    @PostMapping("/view")
    public Map<String, String> view(@PathVariable UUID applicationId,
                                    @Valid @RequestBody HelpdeskAccessRequest request,
                                    Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        helpdeskService.assertAccessAndLog(userId, "HELPDESK_VIEW_APPLICATION", applicationId,
                request.reason(), HelpdeskAccessLog.ActionTaken.VIEW);
        return Map.of("status", "access granted and logged");
    }

    @PostMapping("/reassign")
    public void reassign(@PathVariable UUID applicationId,
                         @Valid @RequestBody HelpdeskAccessRequest request,
                         Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        helpdeskService.assertAccessAndLog(userId, "HELPDESK_REASSIGN", applicationId,
                request.reason(), HelpdeskAccessLog.ActionTaken.REASSIGN);
        // TODO: call WorkflowEngineService / ApplicationAssignmentRepository to actually reassign
    }

    @PostMapping("/force-advance")
    public void forceAdvance(@PathVariable UUID applicationId,
                              @Valid @RequestBody HelpdeskAccessRequest request,
                              Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        helpdeskService.assertAccessAndLog(userId, "HELPDESK_FORCE_ADVANCE", applicationId,
                request.reason(), HelpdeskAccessLog.ActionTaken.FORCE_ADVANCE);
        // TODO: call WorkflowEngineService.forward(...) here
    }
}
