package com.egov.platform.hierarchy;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "service_master", uniqueConstraints = @UniqueConstraint(columnNames = {"department_id", "code"}))
@Getter
@Setter
@NoArgsConstructor
public class ServiceMaster {

    public enum Applicability { CITIZEN, GOVERNMENT, BOTH }
    public enum Mode { ONLINE, OFFLINE, BOTH }

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "name_english", nullable = false, length = 200)
    private String nameEnglish;

    @Column(name = "name_marathi", length = 200)
    private String nameMarathi;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "service_category", length = 100)
    private String serviceCategory;

    @Column(name = "service_type", length = 100)
    private String serviceType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Applicability applicability = Applicability.BOTH;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Mode mode = Mode.ONLINE;

    @Column(name = "application_fee", precision = 12, scale = 2)
    private BigDecimal applicationFee = BigDecimal.ZERO;

    @Column(name = "processing_fee", precision = 12, scale = 2)
    private BigDecimal processingFee = BigDecimal.ZERO;

    @Column(name = "security_deposit", precision = 12, scale = 2)
    private BigDecimal securityDeposit = BigDecimal.ZERO;

    @Column(name = "sla_days")
    private Integer slaDays;

    @Column(name = "application_number_format", length = 100)
    private String applicationNumberFormat;

    @Column(name = "certificate_number_format", length = 100)
    private String certificateNumberFormat;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "working_days_only", nullable = false)
    private boolean workingDaysOnly = false;

    @Column(name = "approval_required", nullable = false)
    private boolean approvalRequired = true;

    @Column(name = "digital_signature_required", nullable = false)
    private boolean digitalSignatureRequired = false;

    @Column(name = "aaplesarkar_integration_required", nullable = false)
    private boolean aaplesarkarIntegrationRequired = false;

    @Column(name = "digilocker_integration_required", nullable = false)
    private boolean digilockerIntegrationRequired = false;

    @Column(name = "challan_required", nullable = false)
    private boolean challanRequired = true;

    @Column(name = "qr_code_required", nullable = false)
    private boolean qrCodeRequired = false;

    @Column(name = "appeal_allowed", nullable = false)
    private boolean appealAllowed = true;

    @Column(name = "grievance_allowed", nullable = false)
    private boolean grievanceAllowed = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
