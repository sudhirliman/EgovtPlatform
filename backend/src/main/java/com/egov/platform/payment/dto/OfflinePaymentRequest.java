package com.egov.platform.payment.dto;

import java.time.LocalDate;

public record OfflinePaymentRequest(String bankName, String receiptNo, LocalDate depositDate, String proofDocumentPath) {}
