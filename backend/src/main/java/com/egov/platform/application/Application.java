package com.egov.platform.application;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application")
@Getter
@Setter
@NoArgsConstructor
public class Application {

    public enum Status {
        DRAFT, SUBMITTED, IN_PROGRESS, APPROVED, REJECTED, DISPATCHED,
        // CFC multi-role statuses
        FORWARDED_TO_EM,
        REVERTEDBYIO,
        FORWARDED_TO_CLERK,
        REVERTEDBYEM,
        REVERTED_BY_ASSISTANT_SENIOR_CLERK,
        APPROVED_BY_ASSISTANT_SENIOR_CLERK,
        APPROVED_BY_EM,
        CHALLAN_GENERATED,
        DEPTCHALLANRECIEPT,
        CERTIFICATECREATED,
        CERTIFICATE_UPLOADED,
        CFCCERTIFICATE
    }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_no", unique = true, length = 40)
    private String applicationNo;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(name = "applicant_user_id", nullable = false)
    private UUID applicantUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private Status status = Status.DRAFT;

    // CFC assignment tracking
    @Column(name = "assigned_io_id")
    private UUID assignedIoId;

    @Column(name = "assigned_em_id")
    private UUID assignedEmId;

    @Column(name = "assigned_clerk_id")
    private UUID assignedClerkId;

    @Column(name = "current_assignee_id")
    private UUID currentAssigneeId;

    @Column(name = "certificate_path", length = 500)
    private String certificatePath;

    @Column(name = "certificate_uploaded_at")
    private Instant certificateUploadedAt;

    // Dynamic form submission stored as a snapshot - later FormTemplate changes
    // do not alter data already submitted (see SRS FR-3.4).
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "form_data", columnDefinition = "jsonb")
    private String formData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "last_saved_at")
    private Instant lastSavedAt = Instant.now();
}
