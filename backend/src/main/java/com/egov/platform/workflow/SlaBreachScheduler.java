package com.egov.platform.workflow;

import com.egov.platform.application.Application;
import com.egov.platform.application.ApplicationRepository;
import com.egov.platform.application.ApplicationStageHistory;
import com.egov.platform.application.ApplicationStageHistoryRepository;
import com.egov.platform.notification.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Runs hourly, finds stage-entry rows whose due_at has passed and are not yet
 * marked breached, flags them, and notifies the applicant (SRS FR-4.4).
 *
 * Note: this notifies the applicant, not the assigned officer/escalation
 * role - WorkflowStage.escalationRoleId exists for that purpose but isn't
 * wired to a notification recipient yet (there's no single "this role's
 * contact list" concept built - it would need to resolve all users holding
 * that role, similar to eligibleOfficersFor(...), and notify each). Left as
 * a follow-up rather than guessed at, since a wrong recipient list is worse
 * than no escalation notification at all.
 */
@Component
public class SlaBreachScheduler {

    private final ApplicationStageHistoryRepository historyRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationService notificationService;

    public SlaBreachScheduler(ApplicationStageHistoryRepository historyRepository,
                               ApplicationRepository applicationRepository,
                               NotificationService notificationService) {
        this.historyRepository = historyRepository;
        this.applicationRepository = applicationRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(cron = "0 0 * * * *") // every hour, on the hour
    @Transactional
    public void checkBreaches() {
        List<ApplicationStageHistory> overdue = historyRepository.findByDueAtBeforeAndBreachedFalse(Instant.now());
        for (ApplicationStageHistory entry : overdue) {
            entry.setBreached(true);
            historyRepository.save(entry);

            applicationRepository.findById(entry.getApplicationId()).ifPresent((Application app) ->
                    notificationService.triggerForUser("SLA_BREACHED", entry.getApplicationId(), app.getServiceId(),
                            app.getApplicantUserId(), Map.of("application_no", app.getApplicationNo() == null ? "" : app.getApplicationNo())));
        }
    }
}
