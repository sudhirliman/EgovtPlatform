package com.egov.platform.form.dto;

public record CreateDocumentConfigRequest(String documentName, String documentCode, boolean mandatory,
                                           String allowedFileTypes, Integer maxFileSizeMb, Integer maxCount,
                                           int displayOrder) {}
