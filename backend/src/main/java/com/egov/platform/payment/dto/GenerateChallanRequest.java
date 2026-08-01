package com.egov.platform.payment.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record GenerateChallanRequest(UUID applicationId, BigDecimal amount, String purpose,
                                      UUID generatedByUserId, UUID generatedAtStageId, UUID parentChallanId) {}
