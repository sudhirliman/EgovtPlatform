package com.egov.platform.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// Fee-2 - internally generated. Multiple challans per application are supported
// (SRS FR-6.3): e.g. a senior authority raises an additional challan later.
@Entity
@Table(name = "challan")
@Getter
@Setter
@NoArgsConstructor
public class Challan {

    public enum Status { PENDING, PAID, CANCELLED }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "challan_no", nullable = false, unique = true, length = 40)
    private String challanNo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 200)
    private String purpose;

    @Column(name = "generated_by_user_id", nullable = false)
    private UUID generatedByUserId;

    @Column(name = "generated_at_stage_id")
    private UUID generatedAtStageId;

    // links a supplementary challan back to the original, purely informational
    @Column(name = "parent_challan_id")
    private UUID parentChallanId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
