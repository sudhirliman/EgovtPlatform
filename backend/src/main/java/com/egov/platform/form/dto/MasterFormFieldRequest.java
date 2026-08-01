package com.egov.platform.form.dto;

import com.egov.platform.form.FormField;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MasterFormFieldRequest(
        @NotBlank String fieldKey,
        @NotBlank String label,
        @NotNull FormField.FieldType type,
        String validationRules,
        Boolean defaultRequired,
        Boolean active
) {}
