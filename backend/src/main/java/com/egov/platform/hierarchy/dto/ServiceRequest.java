package com.egov.platform.hierarchy.dto;

import com.egov.platform.hierarchy.ServiceMaster;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceRequest(
        @NotNull UUID departmentId,
        @NotBlank String nameEnglish,
        String nameMarathi,
        @NotBlank String code,
        String description,
        String serviceCategory,
        String serviceType,
        ServiceMaster.Applicability applicability,
        ServiceMaster.Mode mode,
        BigDecimal applicationFee,
        BigDecimal processingFee,
        BigDecimal securityDeposit,
        Integer slaDays,
        String applicationNumberFormat,
        String certificateNumberFormat,
        Boolean active,
        Boolean workingDaysOnly,
        Boolean approvalRequired,
        Boolean digitalSignatureRequired,
        Boolean aaplesarkarIntegrationRequired,
        Boolean digilockerIntegrationRequired,
        Boolean challanRequired,
        Boolean qrCodeRequired,
        Boolean appealAllowed,
        Boolean grievanceAllowed
) {}
