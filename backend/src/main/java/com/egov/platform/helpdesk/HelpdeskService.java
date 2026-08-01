package com.egov.platform.helpdesk;

import com.egov.platform.rbac.PermissionEvaluatorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Cross-boundary "stuck application" access (SRS section 3.12). Reuses the
 * same PermissionEvaluatorService as every other module - a user gets access
 * here only via a role with hasGlobalScope=true and the relevant permission
 * (HELPDESK_VIEW_APPLICATION / HELPDESK_REASSIGN / HELPDESK_FORCE_ADVANCE /
 * HELPDESK_ADD_REMARK), not via any special-cased check.
 *
 * Every call requires a reason and is logged - this is the one module where
 * that should never be made optional, given how sensitive the access is.
 */
@Service
public class HelpdeskService {

    private final PermissionEvaluatorService permissionEvaluator;
    private final HelpdeskAccessLogRepository accessLogRepository;

    public HelpdeskService(PermissionEvaluatorService permissionEvaluator,
                            HelpdeskAccessLogRepository accessLogRepository) {
        this.permissionEvaluator = permissionEvaluator;
        this.accessLogRepository = accessLogRepository;
    }

    @Transactional
    public void assertAccessAndLog(UUID userId, String permissionCode, UUID applicationId,
                                    String reasonText, HelpdeskAccessLog.ActionTaken action) {
        if (reasonText == null || reasonText.isBlank()) {
            throw new IllegalArgumentException("A reason is required before accessing this application");
        }
        boolean allowed = permissionEvaluator.hasPermission(userId, permissionCode);
        if (!allowed) {
            throw new SecurityException("User " + userId + " lacks permission " + permissionCode);
        }

        HelpdeskAccessLog log = new HelpdeskAccessLog();
        log.setAccessedByUserId(userId);
        log.setApplicationId(applicationId);
        log.setReasonText(reasonText);
        log.setActionTaken(action);
        accessLogRepository.save(log);
    }
}
