package com.egov.platform.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_transaction")
@Getter
@Setter
@NoArgsConstructor
public class PaymentTransaction {

    public enum Mode { ONLINE, OFFLINE }
    public enum Status { PENDING, SUCCESS, FAILED }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "challan_id", nullable = false)
    private UUID challanId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false, length = 10)
    private Mode paymentMode;

    // ONLINE fields
    @Column(name = "gateway_code", length = 30)
    private String gatewayCode;

    @Column(name = "gateway_order_id")
    private String gatewayOrderId;

    @Column(name = "gateway_txn_id")
    private String gatewayTxnId;

    // OFFLINE fields
    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "offline_receipt_no")
    private String offlineReceiptNo;

    @Column(name = "deposit_date")
    private java.time.LocalDate depositDate;

    @Column(name = "proof_document_path")
    private String proofDocumentPath;

    @Column(name = "verified_by_user_id")
    private UUID verifiedByUserId;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
