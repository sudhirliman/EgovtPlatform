package com.egov.platform.certificate;

import com.egov.platform.application.ApplicationStageHistory;
import com.egov.platform.application.ApplicationStageHistoryRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Generates the notesheet at the DISPATCH workflow stage (SRS FR-9.2/9.3).
 *
 * NOTE: this produces a text rendering of the notesheet content and hashes it,
 * which is enough to prove the tamper-evidence design end-to-end. For a real
 * PDF (letterhead, formatting) swap the body-building step for an HTML
 * template + a PDF renderer (e.g. OpenPDF/Flying Saucer/wkhtmltopdf) - the
 * checksum and access-log mechanics below do not need to change.
 */
@Service
public class NotesheetService {

    private final NotesheetRepository notesheetRepository;
    private final NotesheetAccessLogRepository accessLogRepository;
    private final ApplicationStageHistoryRepository historyRepository;
    private final Path storageDir = Path.of("notesheet-storage");

    public NotesheetService(NotesheetRepository notesheetRepository,
                             NotesheetAccessLogRepository accessLogRepository,
                             ApplicationStageHistoryRepository historyRepository) {
        this.notesheetRepository = notesheetRepository;
        this.accessLogRepository = accessLogRepository;
        this.historyRepository = historyRepository;
    }

    public Notesheet generate(UUID applicationId) {
        try {
            Files.createDirectories(storageDir);
            String content = buildContent(applicationId);
            byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

            int nextVersion = notesheetRepository.findByApplicationIdOrderByVersionDesc(applicationId)
                    .stream().findFirst().map(n -> n.getVersion() + 1).orElse(1);

            Path file = storageDir.resolve("notesheet-" + applicationId + "-v" + nextVersion + ".txt");
            Files.write(file, bytes);

            Notesheet notesheet = new Notesheet();
            notesheet.setApplicationId(applicationId);
            notesheet.setFilePath(file.toString());
            notesheet.setChecksum(sha256(bytes));
            notesheet.setVersion(nextVersion);
            return notesheetRepository.save(notesheet);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate notesheet for " + applicationId, e);
        }
    }

    /** Every read must go through here so access is logged (SRS FR-9.4). */
    public Notesheet fetchForViewing(UUID notesheetId, UUID accessedByUserId) {
        Notesheet notesheet = notesheetRepository.findById(notesheetId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Notesheet not found: " + notesheetId));
        NotesheetAccessLog log = new NotesheetAccessLog();
        log.setNotesheetId(notesheetId);
        log.setAccessedBy(accessedByUserId);
        accessLogRepository.save(log);
        return notesheet;
    }

    private String buildContent(UUID applicationId) {
        List<ApplicationStageHistory> history = historyRepository.findByApplicationIdOrderByActedAtAsc(applicationId);
        StringBuilder sb = new StringBuilder();
        sb.append("NOTESHEET\n");
        sb.append("Application ID: ").append(applicationId).append("\n\n");
        sb.append("Stage-wise audit trail:\n");
        for (ApplicationStageHistory h : history) {
            sb.append(String.format("  [%s] stage=%s action=%s by=%s remarks=%s%n",
                    h.getActedAt(), h.getStageId(), h.getAction(), h.getActedBy(), h.getRemarks()));
        }
        // TODO: append submitted form_data snapshot, document list, and payment
        // history (ExternalPaymentReference + Challan + PaymentTransaction) once
        // those repositories are wired in here, per SRS FR-9.2.
        return sb.toString();
    }

    private String sha256(byte[] data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(data));
    }
}
