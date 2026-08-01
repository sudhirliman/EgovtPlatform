package com.egov.platform.hierarchy.dto;

import com.egov.platform.hierarchy.ServiceMaster;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceResponse(
        UUID id, UUID departmentId, String nameEnglish, String nameMarathi, String code, String description,
        String serviceCategory, String serviceType, ServiceMaster.Applicability applicability, ServiceMaster.Mode mode,
        BigDecimal applicationFee, BigDecimal processingFee, BigDecimal securityDeposit, Integer slaDays,
        String applicationNumberFormat, String certificateNumberFormat, boolean active, boolean workingDaysOnly,
        boolean approvalRequired, boolean digitalSignatureRequired, boolean aaplesarkarIntegrationRequired,
        boolean digilockerIntegrationRequired, boolean challanRequired, boolean qrCodeRequired,
        boolean appealAllowed, boolean grievanceAllowed
) {
    public static ServiceResponse from(ServiceMaster s) {
        return new ServiceResponse(
                s.getId(), s.getDepartment().getId(), s.getNameEnglish(), s.getNameMarathi(), s.getCode(), s.getDescription(),
                s.getServiceCategory(), s.getServiceType(), s.getApplicability(), s.getMode(),
                s.getApplicationFee(), s.getProcessingFee(), s.getSecurityDeposit(), s.getSlaDays(),
                s.getApplicationNumberFormat(), s.getCertificateNumberFormat(), s.isActive(), s.isWorkingDaysOnly(),
                s.isApprovalRequired(), s.isDigitalSignatureRequired(), s.isAaplesarkarIntegrationRequired(),
                s.isDigilockerIntegrationRequired(), s.isChallanRequired(), s.isQrCodeRequired(),
                s.isAppealAllowed(), s.isGrievanceAllowed());
    }
}
