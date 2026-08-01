package com.egov.platform.application;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_verification")
@Getter @Setter @NoArgsConstructor
public class DocumentVerification {

    public enum Action { ACCEPTED, REJECTED }
    public enum Stage  { CLERK, EM }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_stage", nullable = false, length = 20)
    private Stage verificationStage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Action action;

    @Column(name = "verified_by", nullable = false)
    private UUID verifiedBy;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String remark;

    @Column(name = "verified_at", nullable = false, updatable = false)
    private Instant verifiedAt = Instant.now();

    public DocumentVerification(UUID applicationId, UUID documentId, Stage stage,
                                Action action, UUID verifiedBy, String remark) {
        this.applicationId     = applicationId;
        this.documentId        = documentId;
        this.verificationStage = stage;
        this.action            = action;
        this.verifiedBy        = verifiedBy;
        this.remark            = remark;
    }
}
