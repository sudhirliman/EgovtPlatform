package com.egov.platform.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentGatewayConfigRepository extends JpaRepository<PaymentGatewayConfig, UUID> {
    Optional<PaymentGatewayConfig> findByGatewayCodeAndBoardIdAndActiveTrue(String gatewayCode, UUID boardId);
    Optional<PaymentGatewayConfig> findByGatewayCodeAndBoardIdIsNullAndActiveTrue(String gatewayCode);
}
