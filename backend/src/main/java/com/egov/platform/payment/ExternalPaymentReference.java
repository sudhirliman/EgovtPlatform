package com.egov.platform.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

// Fee-1 - paid on the external Aaplesarkar portal; this system stores only the reference.
@Entity
@Table(name = "external_payment_reference")
@Getter
@Setter
@NoArgsConstructor
public class ExternalPaymentReference {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(nullable = false, length = 40)
    private String source = "APLESARKAR";

    @Column(name = "transaction_id", nullable = false, length = 100)
    private String transactionId;

    private BigDecimal amount;

    @Column(nullable = false, length = 20)
    private String status;
}
