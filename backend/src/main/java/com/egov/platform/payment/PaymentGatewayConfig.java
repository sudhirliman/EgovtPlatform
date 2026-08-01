package com.egov.platform.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "payment_gateway_config")
@Getter
@Setter
@NoArgsConstructor
public class PaymentGatewayConfig {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "gateway_code", nullable = false, length = 30)
    private String gatewayCode; // e.g. CASHFREE

    @Column(nullable = false, length = 20)
    private String environment; // SANDBOX / PRODUCTION

    // TODO: encrypt at rest (e.g. via a JPA AttributeConverter backed by a KMS/vault)
    // before storing real credentials - plain columns here are placeholders only.
    @Column(name = "client_id")
    private String clientId;

    @Column(name = "client_secret")
    private String clientSecret;

    @Column(name = "webhook_secret")
    private String webhookSecret;

    @Column(name = "board_id")
    private UUID boardId;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
